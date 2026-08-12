import express from "express";
import multer from "multer";
import { parseCompanyFollowsCsv, summarizeImport } from "../utils/csvImport.js";
import { CONTACT_STATUSES, IMPORTANT_STATUS_CHANGES, nextActionForStatus } from "../utils/status.js";
import { researchCompany } from "../services/ai/companyResearch.js";
import { analyzeContact } from "../services/ai/contactAnalysis.js";
import { generateConnectionNote, generateFollowUp } from "../services/ai/outreach.js";
import { analyzeRecruiterResponse } from "../services/ai/responseAnalysis.js";
import { recommendNextAction } from "../services/ai/nextAction.js";

const upload = multer({ storage: multer.memoryStorage() });

function asyncRoute(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

function requireConfirmed(status, body) {
  if (IMPORTANT_STATUS_CHANGES.has(status) && body.confirm !== true) {
    const error = new Error(`Changing status to ${status} requires confirm: true`);
    error.status = 400;
    throw error;
  }
}

async function applyStatusTransition(store, contact, status, body = {}) {
  const timestamp = new Date().toISOString();
  const update = {
    status,
    nextAction: nextActionForStatus(status),
    nextActionDate: body.nextActionDate || timestamp
  };

  if (status === "CONNECTION_REQUESTED") {
    update.connectionRequestedAt = timestamp;
    update.lastInteractionAt = timestamp;
  }

  if (status === "CONNECTED" || status === "FOLLOW_UP_READY") {
    update.status = "FOLLOW_UP_READY";
    update.connectedAt = timestamp;
    update.lastInteractionAt = timestamp;
    update.nextAction = nextActionForStatus("FOLLOW_UP_READY");
  }

  if (status === "MESSAGE_SENT") {
    update.lastInteractionAt = timestamp;
  }

  const updated = await store.updateContact(contact.id, update);

  if (status === "CONNECTION_REQUESTED") {
    await store.createInteraction(contact.id, {
      type: "CONNECTION_REQUEST",
      content: contact.connectionNote || "Connection request sent manually on LinkedIn."
    });
  }

  if (status === "CONNECTED" || status === "FOLLOW_UP_READY") {
    await store.createInteraction(contact.id, {
      type: "CONNECTION_ACCEPTED",
      content: "Connection accepted on LinkedIn."
    });
  }

  if (status === "MESSAGE_SENT") {
    await store.createInteraction(contact.id, {
      type: "MESSAGE_SENT",
      content: contact.followUpMessage || body.content || "Follow-up sent manually on LinkedIn."
    });
  }

  return store.getContact(updated.id);
}

export function createApiRouter(store) {
  const router = express.Router();

  router.get("/health", (req, res) => {
    res.json({ ok: true, name: "CareerLink AI API" });
  });

  router.get(
    "/profile",
    asyncRoute(async (req, res) => {
      res.json(await store.getProfile());
    })
  );

  router.put(
    "/profile",
    asyncRoute(async (req, res) => {
      res.json(await store.updateProfile(req.body));
    })
  );

  router.get(
    "/companies",
    asyncRoute(async (req, res) => {
      res.json(await store.listCompanies(req.query));
    })
  );

  router.post(
    "/companies",
    asyncRoute(async (req, res) => {
      if (!req.body.name) {
        return res.status(400).json({ message: "Company name is required" });
      }
      res.status(201).json(await store.createCompany(req.body));
    })
  );

  router.get(
    "/companies/:id",
    asyncRoute(async (req, res) => {
      const company = await store.getCompany(req.params.id);
      if (!company) return res.status(404).json({ message: "Company not found" });
      res.json(company);
    })
  );

  router.patch(
    "/companies/:id",
    asyncRoute(async (req, res) => {
      const company = await store.updateCompany(req.params.id, req.body);
      if (!company) return res.status(404).json({ message: "Company not found" });
      res.json(company);
    })
  );

  router.post(
    "/companies/import",
    upload.single("file"),
    asyncRoute(async (req, res) => {
      if (!req.file) {
        return res.status(400).json({ message: "Upload Company Follows.csv" });
      }

      const rows = parseCompanyFollowsCsv(req.file.buffer);
      const existingCompanies = await store.listCompanies();
      const summary = summarizeImport(rows, existingCompanies);
      const dryRun = req.body.dryRun !== "false";

      if (dryRun) {
        return res.json(summary);
      }

      const created = await store.importCompanies(summary.valid);
      res.status(201).json({ ...summary, importedCount: created.length, imported: created });
    })
  );

  router.post(
    "/companies/:id/research",
    asyncRoute(async (req, res) => {
      const company = await store.getCompany(req.params.id);
      if (!company) return res.status(404).json({ message: "Company not found" });

      const profile = await store.getProfile();
      const result = await researchCompany(company, profile);
      const updated = await store.updateCompany(company.id, {
        description: result.description || company.description,
        industry: result.industry,
        technologies: result.technologies || [],
        hiringSignals: result.hiringSignals || [],
        relevanceScore: result.relevanceScore,
        matchReason: result.matchReason,
        researchSummary: result.summary || result.researchSummary,
        recommendedRoles: result.recommendedRoles || []
      });

      res.json({ company: updated, research: result });
    })
  );

  router.get(
    "/contacts",
    asyncRoute(async (req, res) => {
      res.json(await store.listContacts(req.query));
    })
  );

  router.post(
    "/contacts",
    asyncRoute(async (req, res) => {
      if (!req.body.companyId || !req.body.name || !req.body.role) {
        return res.status(400).json({ message: "companyId, name, and role are required" });
      }
      res.status(201).json(await store.createContact(req.body));
    })
  );

  router.get(
    "/contacts/:id",
    asyncRoute(async (req, res) => {
      const contact = await store.getContact(req.params.id);
      if (!contact) return res.status(404).json({ message: "Contact not found" });
      res.json(contact);
    })
  );

  router.patch(
    "/contacts/:id",
    asyncRoute(async (req, res) => {
      const contact = await store.updateContact(req.params.id, req.body);
      if (!contact) return res.status(404).json({ message: "Contact not found" });
      res.json(contact);
    })
  );

  router.patch(
    "/contacts/:id/status",
    asyncRoute(async (req, res) => {
      const { status } = req.body;
      if (!CONTACT_STATUSES.includes(status)) {
        return res.status(400).json({ message: "Invalid contact status" });
      }

      requireConfirmed(status, req.body);
      const contact = await store.getContact(req.params.id);
      if (!contact) return res.status(404).json({ message: "Contact not found" });

      res.json(await applyStatusTransition(store, contact, status, req.body));
    })
  );

  router.post(
    "/contacts/:id/analyze",
    asyncRoute(async (req, res) => {
      const contact = await store.getContact(req.params.id);
      if (!contact) return res.status(404).json({ message: "Contact not found" });
      const profile = await store.getProfile();
      const result = await analyzeContact(contact, contact.company, profile);
      const updated = await store.updateContact(contact.id, {
        relevanceScore: result.relevanceScore,
        relevanceReason: result.relevanceReason,
        whyContact: result.whyContact,
        recommendedOutreachAngle: result.recommendedOutreachAngle,
        priority: result.priority || result.relevanceScore || contact.priority
      });

      res.json({ contact: updated, analysis: result });
    })
  );

  router.post(
    "/contacts/:id/generate-connection",
    asyncRoute(async (req, res) => {
      const contact = await store.getContact(req.params.id);
      if (!contact) return res.status(404).json({ message: "Contact not found" });
      const profile = await store.getProfile();
      const result = await generateConnectionNote(contact, contact.company, profile);
      const updated = await store.updateContact(contact.id, { connectionNote: result.message || result.connectionNote || "" });

      res.json({ contact: updated, message: updated.connectionNote });
    })
  );

  router.post(
    "/contacts/:id/generate-followup",
    asyncRoute(async (req, res) => {
      const contact = await store.getContact(req.params.id);
      if (!contact) return res.status(404).json({ message: "Contact not found" });
      const profile = await store.getProfile();
      const interactions = await store.listInteractions(contact.id);
      const result = await generateFollowUp(contact, contact.company, profile, interactions);
      const updated = await store.updateContact(contact.id, { followUpMessage: result.message || result.followUpMessage || "" });

      res.json({ contact: updated, message: updated.followUpMessage });
    })
  );

  router.post(
    "/contacts/:id/analyze-response",
    asyncRoute(async (req, res) => {
      if (req.body.confirm !== true) {
        return res.status(400).json({ message: "Recording a response requires confirm: true" });
      }

      const contact = await store.getContact(req.params.id);
      if (!contact) return res.status(404).json({ message: "Contact not found" });

      const result = await analyzeRecruiterResponse(contact, req.body.content || "");
      await store.createInteraction(contact.id, {
        type: "MESSAGE_RECEIVED",
        content: req.body.content || "",
        aiAnalysis: JSON.stringify(result, null, 2),
        intent: result.intent,
        sentiment: result.sentiment
      });

      const status =
        result.recommendedAction === "SEND_CV"
          ? "CV_REQUESTED"
          : result.opportunityLevel === "HIGH"
            ? "INTERESTED"
            : "RESPONDED";

      const updated = await store.updateContact(contact.id, {
        status,
        nextAction: result.recommendedAction,
        nextActionDate: new Date().toISOString(),
        priority: result.opportunityLevel === "HIGH" ? 95 : contact.priority
      });

      res.json({ contact: updated, analysis: result });
    })
  );

  router.get(
    "/contacts/:id/interactions",
    asyncRoute(async (req, res) => {
      res.json(await store.listInteractions(req.params.id));
    })
  );

  router.post(
    "/contacts/:id/interactions",
    asyncRoute(async (req, res) => {
      if (!req.body.content) {
        return res.status(400).json({ message: "Interaction content is required" });
      }
      res.status(201).json(await store.createInteraction(req.params.id, req.body));
    })
  );

  router.get(
    "/contacts/:id/next-action",
    asyncRoute(async (req, res) => {
      const contact = await store.getContact(req.params.id);
      if (!contact) return res.status(404).json({ message: "Contact not found" });
      const profile = await store.getProfile();
      const interactions = await store.listInteractions(contact.id);
      const recommendation = await recommendNextAction(contact, contact.company, profile, interactions);
      res.json(recommendation);
    })
  );

  router.get(
    "/dashboard",
    asyncRoute(async (req, res) => {
      res.json(await store.dashboard());
    })
  );

  return router;
}
