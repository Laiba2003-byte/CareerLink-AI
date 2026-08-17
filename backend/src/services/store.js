import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { normalizeCompanyName, parseDate, splitList } from "../utils/normalize.js";
import { PIPELINE_STATUSES } from "../utils/status.js";
import { logger } from "../utils/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataFile = path.resolve(__dirname, "../../data/dev-store.json");

function now() {
  return new Date().toISOString();
}

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 200;

function positiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getPagination(query = {}) {
  const hasPagination = query.page !== undefined || query.pageSize !== undefined || query.limit !== undefined;
  if (!hasPagination) return null;

  const page = positiveInteger(query.page, 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, positiveInteger(query.pageSize || query.limit, DEFAULT_PAGE_SIZE));

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize
  };
}

function makePage(items, total, pagination) {
  const totalPages = Math.max(1, Math.ceil(total / pagination.pageSize));

  return {
    items,
    pagination: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      total,
      totalPages,
      hasNextPage: pagination.page < totalPages,
      hasPreviousPage: pagination.page > 1
    }
  };
}

function paginateArray(items, pagination) {
  return makePage(items.slice(pagination.skip, pagination.skip + pagination.take), items.length, pagination);
}

function addCompanyContactCounts(companies, contacts) {
  const counts = contacts.reduce((acc, contact) => {
    if (contact.companyId) acc[contact.companyId] = (acc[contact.companyId] || 0) + 1;
    return acc;
  }, {});

  return companies.map((company) => ({
    ...company,
    contactsCount: counts[company.id] || 0
  }));
}

function normalizeCompanyCount(company) {
  if (!company?._count) return company;
  const { _count, ...rest } = company;
  return {
    ...rest,
    contactsCount: _count.contacts || 0
  };
}

function createDefaultData() {
  const createdAt = now();
  const userId = randomUUID();

  return {
    users: [
      {
        id: userId,
        name: "",
        email: "",
        bio: "",
        experience: "",
        skills: [],
        targetRoles: [],
        targetLocations: [],
        projects: [],
        preferredIndustries: [],
        createdAt,
        updatedAt: createdAt
      }
    ],
    companies: [],
    contacts: [],
    contactCandidates: [],
    interactions: [],
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

function ensureDataShape(data) {
  data.users ||= [];
  data.companies ||= [];
  data.contacts ||= [];
  data.contactCandidates ||= [];
  data.interactions ||= [];
  data.jobOpportunities ||= [];

  data.companies = data.companies.map((company) => ({
    email: "",
    careersEmail: "",
    careersUrl: "",
    notes: "",
    discoveryStatus: company.relevanceScore ? "READY" : "NEEDS_RESEARCH",
    lastHrSearchAt: null,
    ...company
  }));

  data.contacts = data.contacts.map((contact) => ({
    email: "",
    source: "MANUAL",
    notes: "",
    ...contact
  }));

  data.contactCandidates = data.contactCandidates.map((candidate) => ({
    email: "",
    linkedinUrl: "",
    sourceUrl: "",
    confidenceScore: 50,
    reason: "",
    source: "AI_DISCOVERY",
    status: "PENDING",
    createdAt: now(),
    updatedAt: now(),
    ...candidate
  }));

  return data;
}

class FileStore {
  constructor() {
    fs.mkdirSync(path.dirname(dataFile), { recursive: true });
    if (!fs.existsSync(dataFile)) {
      fs.writeFileSync(dataFile, JSON.stringify(createDefaultData(), null, 2));
    }
    this.data = ensureDataShape(JSON.parse(fs.readFileSync(dataFile, "utf8")));
    this.save();
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
    const pagination = getPagination(query);
    let companies = [...this.data.companies];

    if (search) {
      companies = companies.filter((company) =>
        [company.name, company.industry, company.location, company.website, company.email, company.careersEmail, company.linkedinUrl, company.notes].some((value) =>
          String(value || "").toLowerCase().includes(search)
        )
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

    if (query.sort === "name") companies.sort((a, b) => a.name.localeCompare(b.name));
    if (query.sort === "followed") companies.sort((a, b) => new Date(b.followedOn || 0) - new Date(a.followedOn || 0));
    if (query.sort === "match") companies.sort((a, b) => Number(b.relevanceScore || 0) - Number(a.relevanceScore || 0) || a.name.localeCompare(b.name));

    companies = addCompanyContactCounts(companies, this.data.contacts);

    if (pagination) return paginateArray(companies, pagination);

    return companies;
  }

  async getCompany(id) {
    const company = this.data.companies.find((item) => item.id === id);
    if (!company) return null;

    return {
      ...company,
      contacts: this.data.contacts.filter((contact) => contact.companyId === id),
      contactCandidates: this.data.contactCandidates.filter((candidate) => candidate.companyId === id && candidate.status === "PENDING"),
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
      email: input.email || "",
      careersEmail: input.careersEmail || "",
      careersUrl: input.careersUrl || "",
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
      notes: input.notes || "",
      discoveryStatus: input.discoveryStatus || "NEEDS_RESEARCH",
      lastHrSearchAt: input.lastHrSearchAt || null,
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

  async deleteCompany(id) {
    const index = this.data.companies.findIndex((item) => item.id === id);
    if (index === -1) return null;

    const [deleted] = this.data.companies.splice(index, 1);
    const contactIds = new Set(this.data.contacts.filter((contact) => contact.companyId === id).map((contact) => contact.id));

    this.data.contacts = this.data.contacts.filter((contact) => contact.companyId !== id);
    this.data.contactCandidates = this.data.contactCandidates.filter((candidate) => candidate.companyId !== id);
    this.data.jobOpportunities = this.data.jobOpportunities.filter((job) => job.companyId !== id);
    this.data.interactions = this.data.interactions.filter((interaction) => !contactIds.has(interaction.contactId));

    this.save();
    return deleted;
  }

  async importCompanies(rows) {
    const created = [];
    for (const row of rows) {
      created.push(
        await this.createCompany({
          name: row.name,
          followedOn: row.followedOn,
          website: row.website,
          email: row.email,
          careersEmail: row.careersEmail,
          linkedinUrl: row.linkedinUrl,
          industry: row.industry,
          location: row.location,
          notes: row.notes,
          source: row.source || "CSV_IMPORT"
        })
      );
    }

    return created;
  }

  async listContacts(query = {}) {
    const search = String(query.search || "").toLowerCase();
    const pagination = getPagination(query);
    let contacts = this.data.contacts.map((contact) => decorateContact(contact, this.data.companies, this.data.interactions));

    if (query.status && query.status !== "ALL") {
      contacts = contacts.filter((contact) => contact.status === query.status);
    }

    if (query.filter === "high") {
      contacts = contacts.filter((contact) => Number(contact.priority || 0) >= 85);
    }

    if (query.filter === "email") {
      contacts = contacts.filter((contact) => contact.email);
    }

    if (query.filter === "linkedin") {
      contacts = contacts.filter((contact) => contact.linkedinUrl);
    }

    if (search) {
      contacts = contacts.filter((contact) =>
        [contact.name, contact.role, contact.email, contact.linkedinUrl, contact.company?.name].some((value) =>
          String(value || "").toLowerCase().includes(search)
        )
      );
    }

    contacts.sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0) || a.name.localeCompare(b.name));
    if (pagination) return paginateArray(contacts, pagination);
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
      email: input.email || "",
      linkedinUrl: input.linkedinUrl || "",
      source: input.source || "MANUAL",
      notes: input.notes || "",
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

  async importContacts(rows) {
    const created = [];
    for (const row of rows) {
      created.push(
        await this.createContact({
          companyId: row.companyId,
          name: row.name,
          role: row.role,
          email: row.email,
          linkedinUrl: row.linkedinUrl,
          notes: row.notes,
          source: row.source || "CSV_IMPORT",
          status: "HR_IDENTIFIED",
          relevanceScore: row.relevanceScore ?? null,
          relevanceReason: row.relevanceReason || "",
          nextAction: "Review and approve this contact",
          priority: row.priority ?? 55
        })
      );
    }

    return created;
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

  async listContactCandidates(query = {}) {
    const pagination = getPagination(query);
    let candidates = [...this.data.contactCandidates].map((candidate) => ({
      ...candidate,
      company: this.data.companies.find((company) => company.id === candidate.companyId) || null
    }));

    if (query.companyId) {
      candidates = candidates.filter((candidate) => candidate.companyId === query.companyId);
    }

    if (query.status && query.status !== "ALL") {
      candidates = candidates.filter((candidate) => candidate.status === query.status);
    }

    candidates.sort((a, b) => Number(b.confidenceScore || 0) - Number(a.confidenceScore || 0));
    if (pagination) return paginateArray(candidates, pagination);
    return candidates;
  }

  async createContactCandidates(companyId, rows) {
    const createdAt = now();
    const created = [];

    for (const row of rows) {
      const duplicate = this.data.contactCandidates.some((candidate) => {
        const sameCompany = candidate.companyId === companyId;
        const sameEmail = row.email && candidate.email && candidate.email.toLowerCase() === row.email.toLowerCase();
        const sameName = candidate.name.toLowerCase() === String(row.name || "").toLowerCase();
        return sameCompany && (sameEmail || sameName) && candidate.status !== "REJECTED";
      });

      if (duplicate) continue;

      const candidate = {
        id: randomUUID(),
        companyId,
        name: row.name || "Recruiting Team",
        role: row.role || "HR / Recruiter",
        email: row.email || "",
        linkedinUrl: row.linkedinUrl || "",
        sourceUrl: row.sourceUrl || "",
        confidenceScore: row.confidenceScore ?? 50,
        reason: row.reason || "",
        source: row.source || "AI_DISCOVERY",
        status: row.status || "PENDING",
        createdAt,
        updatedAt: createdAt
      };

      this.data.contactCandidates.push(candidate);
      created.push(candidate);
    }

    const company = this.data.companies.find((item) => item.id === companyId);
    if (company) {
      company.discoveryStatus = created.length ? "CANDIDATES_FOUND" : "NO_NEW_CANDIDATES";
      company.lastHrSearchAt = createdAt;
      company.updatedAt = createdAt;
    }

    this.save();
    return created;
  }

  async updateContactCandidate(id, input) {
    const index = this.data.contactCandidates.findIndex((candidate) => candidate.id === id);
    if (index === -1) return null;

    this.data.contactCandidates[index] = {
      ...this.data.contactCandidates[index],
      ...input,
      updatedAt: now()
    };

    this.save();
    return this.data.contactCandidates[index];
  }

  async approveContactCandidate(id) {
    const candidate = this.data.contactCandidates.find((item) => item.id === id);
    if (!candidate) return null;

    const contact = await this.createContact({
      companyId: candidate.companyId,
      name: candidate.name,
      role: candidate.role,
      email: candidate.email,
      linkedinUrl: candidate.linkedinUrl,
      relevanceScore: candidate.confidenceScore,
      relevanceReason: candidate.reason,
      whyContact: candidate.reason,
      recommendedOutreachAngle: "Verify the contact, then generate a personalized connection request.",
      source: candidate.source,
      notes: `Approved from HR discovery candidate. Source: ${candidate.sourceUrl || "Not provided"}`,
      status: "HR_IDENTIFIED",
      priority: Math.max(55, candidate.confidenceScore || 50)
    });

    await this.updateContactCandidate(id, { status: "APPROVED" });
    return contact;
  }

  async approveContactCandidates(ids = []) {
    const created = [];
    for (const id of ids) {
      const contact = await this.approveContactCandidate(id);
      if (contact) created.push(contact);
    }

    return created;
  }

  async dashboard() {
    const companies = this.data.companies;
    const contacts = this.data.contacts;
    const actionContacts = contacts
      .filter((contact) =>
        ["HR_IDENTIFIED", "CONNECTION_READY", "FOLLOW_UP_READY", "RESPONDED", "INTERESTED", "CV_REQUESTED"].includes(contact.status)
      )
      .sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0))
      .slice(0, 8)
      .map((contact) => decorateContact(contact, this.data.companies, this.data.interactions));
    const pendingCandidates = this.data.contactCandidates.filter((candidate) => candidate.status === "PENDING").length;
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
        pendingRequests: contacts.filter((contact) => contact.status === "CONNECTION_REQUESTED").length,
        pendingCandidates
      },
      todaysActions: actionContacts.map((contact) => ({
          id: contact.id,
          label: `${contact.name} - ${contact.nextAction || "Review next step"}`,
          status: contact.status,
          priority: contact.priority
        })),
      actionContacts,
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
    const search = String(query.search || "").trim();
    const pagination = getPagination(query);
    const and = [];

    if (search) {
      and.push({
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { industry: { contains: search, mode: "insensitive" } },
          { location: { contains: search, mode: "insensitive" } },
          { website: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { careersEmail: { contains: search, mode: "insensitive" } },
          { linkedinUrl: { contains: search, mode: "insensitive" } },
          { notes: { contains: search, mode: "insensitive" } }
        ]
      });
    }

    if (query.filter === "high-match") and.push({ relevanceScore: { gte: 80 } });
    if (query.filter === "hiring") and.push({ hiringSignals: { isEmpty: false } });
    if (query.filter === "recent") and.push({ followedOn: { not: null } });

    const where = and.length ? { AND: and } : {};
    const orderBy =
      query.sort === "name"
        ? [{ name: "asc" }]
        : query.sort === "followed" || query.filter === "recent"
          ? [{ followedOn: "desc" }, { name: "asc" }]
          : [{ relevanceScore: "desc" }, { name: "asc" }];
    const include = { _count: { select: { contacts: true } } };

    if (pagination) {
      const [total, companies] = await Promise.all([
        this.prisma.company.count({ where }),
        this.prisma.company.findMany({
          where,
          orderBy,
          skip: pagination.skip,
          take: pagination.take,
          include
        })
      ]);

      return makePage(companies.map(normalizeCompanyCount), total, pagination);
    }

    const companies = await this.prisma.company.findMany({ where, orderBy, include });
    return companies.map(normalizeCompanyCount);
  }

  async getCompany(id) {
    return this.prisma.company.findUnique({
      where: { id },
      include: {
        contacts: { orderBy: { priority: "desc" } },
        contactCandidates: { where: { status: "PENDING" }, orderBy: { confidenceScore: "desc" } },
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
        email: input.email || null,
        careersEmail: input.careersEmail || null,
        careersUrl: input.careersUrl || null,
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
        notes: input.notes || null,
        discoveryStatus: input.discoveryStatus || "NEEDS_RESEARCH",
        lastHrSearchAt: input.lastHrSearchAt ? new Date(input.lastHrSearchAt) : null,
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

  async deleteCompany(id) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) return null;

    await this.prisma.company.delete({ where: { id } });
    return company;
  }

  async importCompanies(rows) {
    const data = rows.map((row) => ({
      name: row.name,
      normalizedName: row.normalizedName,
      followedOn: row.followedOn ? new Date(row.followedOn) : null,
      website: row.website || null,
      email: row.email || null,
      careersEmail: row.careersEmail || null,
      linkedinUrl: row.linkedinUrl || null,
      industry: row.industry || null,
      location: row.location || null,
      notes: row.notes || null,
      source: row.source || "CSV_IMPORT"
    }));

    await this.prisma.company.createMany({ data, skipDuplicates: true });
    return this.prisma.company.findMany({
      where: { normalizedName: { in: rows.map((row) => row.normalizedName) } }
    });
  }

  async listContacts(query = {}) {
    const search = String(query.search || "").trim();
    const pagination = getPagination(query);
    const and = [];

    if (query.status && query.status !== "ALL") and.push({ status: query.status });
    if (query.filter === "high") and.push({ priority: { gte: 85 } });
    if (query.filter === "email") and.push({ email: { not: null } }, { email: { not: "" } });
    if (query.filter === "linkedin") and.push({ linkedinUrl: { not: null } }, { linkedinUrl: { not: "" } });

    if (search) {
      and.push({
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { role: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { linkedinUrl: { contains: search, mode: "insensitive" } },
          { company: { is: { name: { contains: search, mode: "insensitive" } } } }
        ]
      });
    }

    const where = and.length ? { AND: and } : {};
    const queryConfig = {
      where,
      include: { company: true },
      orderBy: [{ priority: "desc" }, { name: "asc" }]
    };

    if (pagination) {
      const [total, contacts] = await Promise.all([
        this.prisma.contact.count({ where }),
        this.prisma.contact.findMany({
          ...queryConfig,
          skip: pagination.skip,
          take: pagination.take
        })
      ]);

      return makePage(contacts, total, pagination);
    }

    return this.prisma.contact.findMany(queryConfig);
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
        email: input.email || null,
        linkedinUrl: input.linkedinUrl || null,
        source: input.source || "MANUAL",
        notes: input.notes || null,
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

  async importContacts(rows) {
    const created = [];
    for (const row of rows) {
      created.push(
        await this.createContact({
          companyId: row.companyId,
          name: row.name,
          role: row.role,
          email: row.email,
          linkedinUrl: row.linkedinUrl,
          notes: row.notes,
          source: row.source || "CSV_IMPORT",
          status: "HR_IDENTIFIED",
          nextAction: "Review and approve this contact",
          priority: row.priority ?? 55
        })
      );
    }

    return created;
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

  async listContactCandidates(query = {}) {
    const pagination = getPagination(query);
    const queryConfig = {
      where: {
        ...(query.companyId ? { companyId: query.companyId } : {}),
        ...(query.status && query.status !== "ALL" ? { status: query.status } : {})
      },
      include: { company: true },
      orderBy: [{ confidenceScore: "desc" }, { createdAt: "desc" }]
    };

    if (pagination) {
      const [total, candidates] = await Promise.all([
        this.prisma.contactCandidate.count({ where: queryConfig.where }),
        this.prisma.contactCandidate.findMany({
          ...queryConfig,
          skip: pagination.skip,
          take: pagination.take
        })
      ]);

      return makePage(candidates, total, pagination);
    }

    return this.prisma.contactCandidate.findMany(queryConfig);
  }

  async createContactCandidates(companyId, rows) {
    const data = rows.map((row) => ({
      companyId,
      name: row.name || "Recruiting Team",
      role: row.role || "HR / Recruiter",
      email: row.email || null,
      linkedinUrl: row.linkedinUrl || null,
      sourceUrl: row.sourceUrl || null,
      confidenceScore: row.confidenceScore ?? 50,
      reason: row.reason || null,
      source: row.source || "AI_DISCOVERY",
      status: row.status || "PENDING"
    }));

    if (!data.length) return [];

    await this.prisma.contactCandidate.createMany({ data });
    await this.prisma.company.update({
      where: { id: companyId },
      data: { discoveryStatus: "CANDIDATES_FOUND", lastHrSearchAt: new Date() }
    });

    return this.prisma.contactCandidate.findMany({
      where: { companyId, status: "PENDING" },
      include: { company: true },
      orderBy: [{ confidenceScore: "desc" }]
    });
  }

  async updateContactCandidate(id, input) {
    return this.prisma.contactCandidate.update({ where: { id }, data: input });
  }

  async approveContactCandidate(id) {
    const candidate = await this.prisma.contactCandidate.findUnique({ where: { id } });
    if (!candidate) return null;

    const contact = await this.createContact({
      companyId: candidate.companyId,
      name: candidate.name,
      role: candidate.role,
      email: candidate.email,
      linkedinUrl: candidate.linkedinUrl,
      relevanceScore: candidate.confidenceScore,
      relevanceReason: candidate.reason,
      whyContact: candidate.reason,
      recommendedOutreachAngle: "Verify the contact, then generate a personalized connection request.",
      source: candidate.source,
      notes: `Approved from HR discovery candidate. Source: ${candidate.sourceUrl || "Not provided"}`,
      status: "HR_IDENTIFIED",
      priority: Math.max(55, candidate.confidenceScore || 50)
    });

    await this.updateContactCandidate(id, { status: "APPROVED" });
    return contact;
  }

  async approveContactCandidates(ids = []) {
    const created = [];
    for (const id of ids) {
      const contact = await this.approveContactCandidate(id);
      if (contact) created.push(contact);
    }

    return created;
  }

  async dashboard() {
    const connectedStatuses = ["CONNECTED", "FOLLOW_UP_READY", "MESSAGE_SENT", "RESPONDED", "INTERESTED"];
    const activeOpportunityStatuses = ["INTERESTED", "CV_REQUESTED", "CV_SENT", "INTERVIEW", "OFFER"];
    const actionStatuses = ["HR_IDENTIFIED", "CONNECTION_READY", "FOLLOW_UP_READY", "RESPONDED", "INTERESTED", "CV_REQUESTED"];

    const [
      companies,
      highPriority,
      contacts,
      connected,
      opportunities,
      pendingRequests,
      pendingCandidates,
      actionContacts,
      pipelineCounts
    ] = await Promise.all([
      this.prisma.company.count(),
      this.prisma.company.count({ where: { relevanceScore: { gte: 80 } } }),
      this.prisma.contact.count(),
      this.prisma.contact.count({ where: { status: { in: connectedStatuses } } }),
      this.prisma.contact.count({ where: { status: { in: activeOpportunityStatuses } } }),
      this.prisma.contact.count({ where: { status: "CONNECTION_REQUESTED" } }),
      this.prisma.contactCandidate.count({ where: { status: "PENDING" } }),
      this.prisma.contact.findMany({
        where: { status: { in: actionStatuses } },
        include: { company: true },
        orderBy: [{ priority: "desc" }, { name: "asc" }],
        take: 8
      }),
      this.prisma.contact.groupBy({
        by: ["status"],
        _count: { _all: true },
        where: { status: { in: PIPELINE_STATUSES } }
      })
    ]);

    const pipelineMap = new Map(pipelineCounts.map((item) => [item.status, item._count._all]));

    return {
      metrics: {
        companies,
        highPriority,
        contacts,
        connected,
        opportunities,
        pendingRequests,
        pendingCandidates
      },
      todaysActions: actionContacts.map((contact) => ({
        id: contact.id,
        label: `${contact.name} - ${contact.nextAction || "Review next step"}`,
        status: contact.status,
        priority: contact.priority
      })),
      actionContacts,
      pipeline: PIPELINE_STATUSES.map((status) => ({
        status,
        count: pipelineMap.get(status) || 0
      }))
    };
  }
}

export async function createStore() {
  const databaseUrl = process.env.DATABASE_URL || "";
  const hasPlaceholderDatabaseUrl = /USER:PASSWORD@HOST|^postgresql:\/\/$/i.test(databaseUrl);

  if (databaseUrl && !hasPlaceholderDatabaseUrl && process.env.DATA_STORE !== "file") {
    try {
      const { PrismaClient } = await import("@prisma/client");
      const prisma = new PrismaClient();
      await prisma.$connect();
      logger.info("store.selected", { type: "prisma_postgresql" });
      return new PrismaStore(prisma);
    } catch (error) {
      logger.warn("store.prisma_unavailable", { fallback: "file", reason: error.message });
    }
  } else if (process.env.DATA_STORE === "file") {
    logger.warn("store.file_forced", { reason: "DATA_STORE=file" });
  } else if (hasPlaceholderDatabaseUrl) {
    logger.warn("store.placeholder_database_url", { fallback: "file" });
  }

  logger.info("store.selected", { type: "local_file" });
  return new FileStore();
}
