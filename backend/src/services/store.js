import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { normalizeCompanyName, parseDate, splitList } from "../utils/normalize.js";
import { PIPELINE_STATUSES } from "../utils/status.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataFile = path.resolve(__dirname, "../../data/dev-store.json");

function now() {
  return new Date().toISOString();
}

function createDefaultData() {
  const createdAt = now();
  const userId = randomUUID();
  const companyA = randomUUID();
  const companyB = randomUUID();
  const companyC = randomUUID();
  const contactA = randomUUID();
  const contactB = randomUUID();

  return {
    users: [
      {
        id: userId,
        name: "",
        email: "",
        bio: "",
        experience: "",
        skills: ["React", "Node.js", "JavaScript", "SQL", "AI"],
        targetRoles: ["Full Stack Developer", "Software Engineer", "Frontend Developer"],
        targetLocations: ["Pakistan", "Remote"],
        projects: [],
        preferredIndustries: ["Software", "AI", "SaaS"],
        createdAt,
        updatedAt: createdAt
      }
    ],
    companies: [
      {
        id: companyA,
        name: "10Pearls",
        normalizedName: normalizeCompanyName("10Pearls"),
        website: "https://10pearls.com",
        linkedinUrl: "",
        industry: "Software",
        description: "Digital product engineering and software services company.",
        location: "Pakistan",
        companySize: "",
        followedOn: null,
        relevanceScore: 87,
        matchReason: "Strong match for full-stack and product engineering experience.",
        researchSummary: "A strong candidate for targeted recruiter outreach around engineering roles.",
        technologies: ["React", "Node.js", "Cloud"],
        hiringSignals: ["Engineering hiring likely", "Recruiter contact useful"],
        recommendedRoles: ["Full Stack Developer", "Software Engineer"],
        source: "MANUAL",
        createdAt,
        updatedAt: createdAt
      },
      {
        id: companyB,
        name: "Systems Limited",
        normalizedName: normalizeCompanyName("Systems Limited"),
        website: "https://www.systemsltd.com",
        linkedinUrl: "",
        industry: "IT Services",
        description: "Enterprise technology and consulting company.",
        location: "Pakistan",
        companySize: "",
        followedOn: null,
        relevanceScore: 91,
        matchReason: "Large technology organization with broad software hiring potential.",
        researchSummary: "Good target for software engineering and consulting-aligned roles.",
        technologies: ["JavaScript", "SQL", "Cloud"],
        hiringSignals: ["Large hiring footprint", "Multiple engineering tracks"],
        recommendedRoles: ["Software Engineer", "Frontend Developer"],
        source: "MANUAL",
        createdAt,
        updatedAt: createdAt
      },
      {
        id: companyC,
        name: "Arbisoft",
        normalizedName: normalizeCompanyName("Arbisoft"),
        website: "https://arbisoft.com",
        linkedinUrl: "",
        industry: "Software",
        description: "Software development company with product and platform engineering work.",
        location: "Pakistan",
        companySize: "",
        followedOn: null,
        relevanceScore: 78,
        matchReason: "Relevant engineering company, but needs contact and job context.",
        researchSummary: "Worth reviewing after higher-priority companies.",
        technologies: ["Python", "JavaScript", "AI"],
        hiringSignals: ["Engineering roles worth monitoring"],
        recommendedRoles: ["Software Engineer"],
        source: "MANUAL",
        createdAt,
        updatedAt: createdAt
      }
    ],
    contacts: [
      {
        id: contactA,
        companyId: companyA,
        name: "Sarah Khan",
        role: "Talent Acquisition Manager",
        linkedinUrl: "",
        relevanceScore: 96,
        relevanceReason: "Directly aligned with engineering recruiting.",
        whyContact: "Can guide current hiring needs and route your profile.",
        recommendedOutreachAngle: "Mention full-stack and AI product engineering alignment.",
        status: "FOLLOW_UP_READY",
        connectionNote: "Hi Sarah, I noticed your talent work at 10Pearls. I am exploring full-stack engineering roles and would value connecting around React, Node.js, and product engineering opportunities.",
        followUpMessage: "",
        connectionRequestedAt: createdAt,
        connectedAt: createdAt,
        lastInteractionAt: createdAt,
        nextAction: "Review and manually send follow-up",
        nextActionDate: createdAt,
        priority: 92,
        createdAt,
        updatedAt: createdAt
      },
      {
        id: contactB,
        companyId: companyB,
        name: "Ahmed Raza",
        role: "Technical Recruiter",
        linkedinUrl: "",
        relevanceScore: 91,
        relevanceReason: "Recruiting role at a high-match company.",
        whyContact: "Likely aware of current engineering roles.",
        recommendedOutreachAngle: "Ask about full-stack or frontend hiring tracks.",
        status: "HR_APPROVED",
        connectionNote: "",
        followUpMessage: "",
        connectionRequestedAt: null,
        connectedAt: null,
        lastInteractionAt: null,
        nextAction: "Generate a personalized connection note",
        nextActionDate: createdAt,
        priority: 84,
        createdAt,
        updatedAt: createdAt
      }
    ],
    interactions: [
      {
        id: randomUUID(),
        contactId: contactA,
        type: "CONNECTION_REQUEST",
        content: "Connection request sent manually on LinkedIn.",
        aiAnalysis: "",
        intent: "",
        sentiment: "",
        createdAt
      },
      {
        id: randomUUID(),
        contactId: contactA,
        type: "CONNECTION_ACCEPTED",
        content: "Connection accepted.",
        aiAnalysis: "",
        intent: "",
        sentiment: "",
        createdAt
      }
    ],
    jobOpportunities: []
  };
}

function sanitizeProfile(input) {
  return {
    name: input.name ?? "",
    email: input.email ?? "",
    bio: input.bio ?? input.about ?? "",
    experience: input.experience ?? "",
    skills: splitList(input.skills),
    targetRoles: splitList(input.targetRoles),
    targetLocations: splitList(input.targetLocations),
    projects: splitList(input.projects),
    preferredIndustries: splitList(input.preferredIndustries)
  };
}

function decorateContact(contact, companies, interactions) {
  const company = companies.find((item) => item.id === contact.companyId) || null;
  const contactInteractions = interactions
    .filter((item) => item.contactId === contact.id)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  return {
    ...contact,
    company,
    interactions: contactInteractions
  };
}

class FileStore {
  constructor() {
    fs.mkdirSync(path.dirname(dataFile), { recursive: true });
    if (!fs.existsSync(dataFile)) {
      fs.writeFileSync(dataFile, JSON.stringify(createDefaultData(), null, 2));
    }
    this.data = JSON.parse(fs.readFileSync(dataFile, "utf8"));
  }

  save() {
    fs.writeFileSync(dataFile, JSON.stringify(this.data, null, 2));
  }

  async getProfile() {
    if (!this.data.users.length) {
      this.data.users.push({ id: randomUUID(), ...sanitizeProfile({}), createdAt: now(), updatedAt: now() });
      this.save();
    }

    return this.data.users[0];
  }

  async updateProfile(input) {
    const existing = await this.getProfile();
    const updated = { ...existing, ...sanitizeProfile(input), updatedAt: now() };
    this.data.users[0] = updated;
    this.save();
    return updated;
  }

  async listCompanies(query = {}) {
    const search = String(query.search || "").toLowerCase();
    let companies = [...this.data.companies];

    if (search) {
      companies = companies.filter((company) =>
        [company.name, company.industry, company.location].some((value) => String(value || "").toLowerCase().includes(search))
      );
    }

    if (query.filter === "high-match") {
      companies = companies.filter((company) => Number(company.relevanceScore || 0) >= 80);
    }

    if (query.filter === "hiring") {
      companies = companies.filter((company) => company.hiringSignals?.length);
    }

    if (query.filter === "recent") {
      companies = companies
        .filter((company) => company.followedOn)
        .sort((a, b) => new Date(b.followedOn) - new Date(a.followedOn));
    } else {
      companies.sort((a, b) => Number(b.relevanceScore || 0) - Number(a.relevanceScore || 0) || a.name.localeCompare(b.name));
    }

    return companies;
  }

  async getCompany(id) {
    const company = this.data.companies.find((item) => item.id === id);
    if (!company) return null;

    return {
      ...company,
      contacts: this.data.contacts.filter((contact) => contact.companyId === id),
      jobOpportunities: this.data.jobOpportunities.filter((job) => job.companyId === id)
    };
  }

  async createCompany(input) {
    const createdAt = now();
    const company = {
      id: randomUUID(),
      name: input.name,
      normalizedName: normalizeCompanyName(input.name),
      website: input.website || "",
      linkedinUrl: input.linkedinUrl || "",
      industry: input.industry || "",
      description: input.description || "",
      location: input.location || "",
      companySize: input.companySize || "",
      followedOn: parseDate(input.followedOn),
      relevanceScore: input.relevanceScore ?? null,
      matchReason: input.matchReason || "",
      researchSummary: input.researchSummary || "",
      technologies: splitList(input.technologies),
      hiringSignals: splitList(input.hiringSignals),
      recommendedRoles: splitList(input.recommendedRoles),
      source: input.source || "MANUAL",
      createdAt,
      updatedAt: createdAt
    };

    if (this.data.companies.some((item) => item.normalizedName === company.normalizedName)) {
      const error = new Error("Company already exists");
      error.status = 409;
      throw error;
    }

    this.data.companies.push(company);
    this.save();
    return company;
  }

  async updateCompany(id, input) {
    const index = this.data.companies.findIndex((item) => item.id === id);
    if (index === -1) return null;

    const updated = {
      ...this.data.companies[index],
      ...input,
      technologies: input.technologies !== undefined ? splitList(input.technologies) : this.data.companies[index].technologies,
      hiringSignals: input.hiringSignals !== undefined ? splitList(input.hiringSignals) : this.data.companies[index].hiringSignals,
      recommendedRoles:
        input.recommendedRoles !== undefined ? splitList(input.recommendedRoles) : this.data.companies[index].recommendedRoles,
      followedOn: input.followedOn !== undefined ? parseDate(input.followedOn) : this.data.companies[index].followedOn,
      updatedAt: now()
    };

    if (input.name) {
      updated.normalizedName = normalizeCompanyName(input.name);
    }

    this.data.companies[index] = updated;
    this.save();
    return updated;
  }

  async importCompanies(rows) {
    const created = [];
    for (const row of rows) {
      created.push(
        await this.createCompany({
          name: row.name,
          followedOn: row.followedOn,
          source: "LINKEDIN_EXPORT"
        })
      );
    }

    return created;
  }

  async listContacts(query = {}) {
    const search = String(query.search || "").toLowerCase();
    let contacts = this.data.contacts.map((contact) => decorateContact(contact, this.data.companies, this.data.interactions));

    if (query.status && query.status !== "ALL") {
      contacts = contacts.filter((contact) => contact.status === query.status);
    }

    if (search) {
      contacts = contacts.filter((contact) =>
        [contact.name, contact.role, contact.company?.name].some((value) => String(value || "").toLowerCase().includes(search))
      );
    }

    contacts.sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0) || a.name.localeCompare(b.name));
    return contacts;
  }

  async getContact(id) {
    const contact = this.data.contacts.find((item) => item.id === id);
    return contact ? decorateContact(contact, this.data.companies, this.data.interactions) : null;
  }

  async createContact(input) {
    const createdAt = now();
    const contact = {
      id: randomUUID(),
      companyId: input.companyId,
      name: input.name,
      role: input.role,
      linkedinUrl: input.linkedinUrl || "",
      relevanceScore: input.relevanceScore ?? null,
      relevanceReason: input.relevanceReason || "",
      whyContact: input.whyContact || "",
      recommendedOutreachAngle: input.recommendedOutreachAngle || "",
      status: input.status || "HR_IDENTIFIED",
      connectionNote: input.connectionNote || "",
      followUpMessage: input.followUpMessage || "",
      connectionRequestedAt: input.connectionRequestedAt || null,
      connectedAt: input.connectedAt || null,
      lastInteractionAt: input.lastInteractionAt || null,
      nextAction: input.nextAction || "Review and approve this contact",
      nextActionDate: input.nextActionDate || createdAt,
      priority: input.priority ?? 50,
      createdAt,
      updatedAt: createdAt
    };

    this.data.contacts.push(contact);
    this.save();
    return this.getContact(contact.id);
  }

  async updateContact(id, input) {
    const index = this.data.contacts.findIndex((item) => item.id === id);
    if (index === -1) return null;

    this.data.contacts[index] = {
      ...this.data.contacts[index],
      ...input,
      updatedAt: now()
    };

    this.save();
    return this.getContact(id);
  }

  async listInteractions(contactId) {
    return this.data.interactions
      .filter((item) => item.contactId === contactId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }

  async createInteraction(contactId, input) {
    const interaction = {
      id: randomUUID(),
      contactId,
      type: input.type || "NOTE",
      content: input.content || "",
      aiAnalysis: input.aiAnalysis || "",
      intent: input.intent || "",
      sentiment: input.sentiment || "",
      createdAt: input.createdAt || now()
    };

    this.data.interactions.push(interaction);
    const contact = this.data.contacts.find((item) => item.id === contactId);
    if (contact) {
      contact.lastInteractionAt = interaction.createdAt;
      contact.updatedAt = now();
    }
    this.save();
    return interaction;
  }

  async dashboard() {
    const companies = this.data.companies;
    const contacts = this.data.contacts;
    const activeOpportunities = contacts.filter((contact) =>
      ["INTERESTED", "CV_REQUESTED", "CV_SENT", "INTERVIEW", "OFFER"].includes(contact.status)
    ).length;

    return {
      metrics: {
        companies: companies.length,
        highPriority: companies.filter((company) => Number(company.relevanceScore || 0) >= 80).length,
        contacts: contacts.length,
        connected: contacts.filter((contact) => ["CONNECTED", "FOLLOW_UP_READY", "MESSAGE_SENT", "RESPONDED", "INTERESTED"].includes(contact.status)).length,
        opportunities: activeOpportunities,
        pendingRequests: contacts.filter((contact) => contact.status === "CONNECTION_REQUESTED").length
      },
      todaysActions: contacts
        .filter((contact) =>
          ["HR_IDENTIFIED", "CONNECTION_READY", "FOLLOW_UP_READY", "RESPONDED", "INTERESTED", "CV_REQUESTED"].includes(contact.status)
        )
        .sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0))
        .slice(0, 8)
        .map((contact) => ({
          id: contact.id,
          label: `${contact.name} - ${contact.nextAction || "Review next step"}`,
          status: contact.status,
          priority: contact.priority
        })),
      pipeline: PIPELINE_STATUSES.map((status) => ({
        status,
        count: contacts.filter((contact) => contact.status === status).length
      }))
    };
  }
}

class PrismaStore {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async getProfile() {
    const existing = await this.prisma.user.findFirst();
    if (existing) return existing;
    return this.prisma.user.create({ data: sanitizeProfile({}) });
  }

  async updateProfile(input) {
    const existing = await this.getProfile();
    return this.prisma.user.update({ where: { id: existing.id }, data: sanitizeProfile(input) });
  }

  async listCompanies(query = {}) {
    const companies = await this.prisma.company.findMany({
      orderBy: [{ relevanceScore: "desc" }, { name: "asc" }]
    });
    const fileStore = { data: { companies } };
    return FileStore.prototype.listCompanies.call(fileStore, query);
  }

  async getCompany(id) {
    return this.prisma.company.findUnique({
      where: { id },
      include: {
        contacts: { orderBy: { priority: "desc" } },
        jobOpportunities: { orderBy: { matchScore: "desc" } }
      }
    });
  }

  async createCompany(input) {
    return this.prisma.company.create({
      data: {
        name: input.name,
        normalizedName: normalizeCompanyName(input.name),
        website: input.website || null,
        linkedinUrl: input.linkedinUrl || null,
        industry: input.industry || null,
        description: input.description || null,
        location: input.location || null,
        companySize: input.companySize || null,
        followedOn: input.followedOn ? new Date(input.followedOn) : null,
        relevanceScore: input.relevanceScore ?? null,
        matchReason: input.matchReason || null,
        researchSummary: input.researchSummary || null,
        technologies: splitList(input.technologies),
        hiringSignals: splitList(input.hiringSignals),
        recommendedRoles: splitList(input.recommendedRoles),
        source: input.source || "MANUAL"
      }
    });
  }

  async updateCompany(id, input) {
    const data = { ...input };
    if (input.name) data.normalizedName = normalizeCompanyName(input.name);
    if (input.followedOn !== undefined) data.followedOn = input.followedOn ? new Date(input.followedOn) : null;
    if (input.technologies !== undefined) data.technologies = splitList(input.technologies);
    if (input.hiringSignals !== undefined) data.hiringSignals = splitList(input.hiringSignals);
    if (input.recommendedRoles !== undefined) data.recommendedRoles = splitList(input.recommendedRoles);
    return this.prisma.company.update({ where: { id }, data });
  }

  async importCompanies(rows) {
    const data = rows.map((row) => ({
      name: row.name,
      normalizedName: row.normalizedName,
      followedOn: row.followedOn ? new Date(row.followedOn) : null,
      source: "LINKEDIN_EXPORT"
    }));

    await this.prisma.company.createMany({ data, skipDuplicates: true });
    return this.prisma.company.findMany({
      where: { normalizedName: { in: rows.map((row) => row.normalizedName) } }
    });
  }

  async listContacts(query = {}) {
    const contacts = await this.prisma.contact.findMany({
      include: {
        company: true,
        interactions: { orderBy: { createdAt: "asc" } }
      },
      orderBy: [{ priority: "desc" }, { name: "asc" }]
    });
    let filtered = contacts;
    if (query.status && query.status !== "ALL") filtered = filtered.filter((contact) => contact.status === query.status);
    if (query.search) {
      const search = String(query.search).toLowerCase();
      filtered = filtered.filter((contact) =>
        [contact.name, contact.role, contact.company?.name].some((value) => String(value || "").toLowerCase().includes(search))
      );
    }
    return filtered;
  }

  async getContact(id) {
    return this.prisma.contact.findUnique({
      where: { id },
      include: {
        company: true,
        interactions: { orderBy: { createdAt: "asc" } }
      }
    });
  }

  async createContact(input) {
    return this.prisma.contact.create({
      data: {
        companyId: input.companyId,
        name: input.name,
        role: input.role,
        linkedinUrl: input.linkedinUrl || null,
        relevanceScore: input.relevanceScore ?? null,
        relevanceReason: input.relevanceReason || null,
        whyContact: input.whyContact || null,
        recommendedOutreachAngle: input.recommendedOutreachAngle || null,
        status: input.status || "HR_IDENTIFIED",
        connectionNote: input.connectionNote || null,
        followUpMessage: input.followUpMessage || null,
        connectionRequestedAt: input.connectionRequestedAt ? new Date(input.connectionRequestedAt) : null,
        connectedAt: input.connectedAt ? new Date(input.connectedAt) : null,
        lastInteractionAt: input.lastInteractionAt ? new Date(input.lastInteractionAt) : null,
        nextAction: input.nextAction || "Review and approve this contact",
        nextActionDate: input.nextActionDate ? new Date(input.nextActionDate) : new Date(),
        priority: input.priority ?? 50
      },
      include: { company: true, interactions: true }
    });
  }

  async updateContact(id, input) {
    const data = { ...input };
    for (const field of ["connectionRequestedAt", "connectedAt", "lastInteractionAt", "nextActionDate"]) {
      if (data[field] !== undefined) data[field] = data[field] ? new Date(data[field]) : null;
    }

    return this.prisma.contact.update({
      where: { id },
      data,
      include: {
        company: true,
        interactions: { orderBy: { createdAt: "asc" } }
      }
    });
  }

  async listInteractions(contactId) {
    return this.prisma.interaction.findMany({ where: { contactId }, orderBy: { createdAt: "asc" } });
  }

  async createInteraction(contactId, input) {
    const interaction = await this.prisma.interaction.create({
      data: {
        contactId,
        type: input.type || "NOTE",
        content: input.content || "",
        aiAnalysis: input.aiAnalysis || null,
        intent: input.intent || null,
        sentiment: input.sentiment || null
      }
    });

    await this.prisma.contact.update({
      where: { id: contactId },
      data: { lastInteractionAt: interaction.createdAt }
    });

    return interaction;
  }

  async dashboard() {
    const companies = await this.listCompanies();
    const contacts = await this.listContacts();
    const fileStore = { data: { companies, contacts } };
    return FileStore.prototype.dashboard.call(fileStore);
  }
}

export async function createStore() {
  if (process.env.DATABASE_URL && process.env.DATA_STORE !== "file") {
    try {
      const { PrismaClient } = await import("@prisma/client");
      const prisma = new PrismaClient();
      await prisma.$connect();
      console.log("Using Prisma/PostgreSQL data store");
      return new PrismaStore(prisma);
    } catch (error) {
      console.warn(`Prisma unavailable, falling back to local file data store: ${error.message}`);
    }
  }

  console.log("Using local file data store");
  return new FileStore();
}
