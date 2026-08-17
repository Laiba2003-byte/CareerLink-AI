import { parse } from "csv-parse/sync";
import { normalizeCompanyName, parseDate } from "./normalize.js";

function pick(row, keys) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && String(row[key]).trim()) {
      return String(row[key]).trim();
    }
  }

  return "";
}

function emailFromValue(value = "") {
  const match = String(value).match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match ? match[0] : "";
}

export function parseCompanyFollowsCsv(buffer) {
  const content = buffer.toString("utf8").replace(/^\uFEFF/, "");
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  return records
    .map((row, index) => {
      const organization =
        row.Organization ||
        row.organization ||
        row.Company ||
        row.company ||
        row.Name ||
        row.name;

      return {
        row: index + 2,
        name: organization ? String(organization).trim() : "",
        normalizedName: normalizeCompanyName(organization || ""),
        followedOn: parseDate(row["Followed On"] || row.followedOn || row.followed_on),
        website: pick(row, ["Website", "website", "Company Website", "companyWebsite", "URL", "url"]),
        email: emailFromValue(pick(row, ["Email", "email", "Company Email", "companyEmail", "Careers Email", "careersEmail"])),
        careersEmail: emailFromValue(pick(row, ["Careers Email", "careersEmail", "Jobs Email", "jobsEmail", "HR Email", "hrEmail"])),
        linkedinUrl: pick(row, ["LinkedIn", "LinkedIn URL", "linkedinUrl", "linkedin", "Company LinkedIn"]),
        industry: pick(row, ["Industry", "industry"]),
        location: pick(row, ["Location", "location"]),
        notes: pick(row, ["Notes", "notes"]),
        source: row.Organization || row["Followed On"] ? "LINKEDIN_EXPORT" : "CSV_IMPORT"
      };
    })
    .filter((row) => row.name);
}

export function parseContactCsv(buffer, companies = [], defaultCompanyId = "") {
  const content = buffer.toString("utf8").replace(/^\uFEFF/, "");
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  const companyByName = new Map(companies.map((company) => [normalizeCompanyName(company.name), company]));
  const companyByDomain = new Map(
    companies
      .flatMap((company) => [company.website, company.email, company.careersEmail])
      .filter(Boolean)
      .map((value) => {
        const domain = String(value).replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[/?#@]/).pop();
        const company = companies.find((item) => [item.website, item.email, item.careersEmail].includes(value));
        return [domain, company];
      })
      .filter(([domain, company]) => domain && company)
  );

  return records
    .map((row, index) => {
      const email = emailFromValue(pick(row, ["Email", "email", "Work Email", "workEmail", "Contact Email"]));
      const companyName = pick(row, ["Company", "company", "Organization", "organization", "Company Name", "companyName"]);
      const emailDomain = email.split("@")[1] || "";
      const company = defaultCompanyId
        ? companies.find((item) => item.id === defaultCompanyId)
        : companyByName.get(normalizeCompanyName(companyName)) || companyByDomain.get(emailDomain);

      return {
        row: index + 2,
        companyId: company?.id || "",
        companyName: company?.name || companyName,
        name: pick(row, ["Name", "name", "Contact", "contact", "Full Name", "fullName"]) || email.split("@")[0] || "",
        role: pick(row, ["Role", "role", "Title", "title", "Job Title", "jobTitle"]) || "HR / Recruiter",
        email,
        linkedinUrl: pick(row, ["LinkedIn", "LinkedIn URL", "linkedinUrl", "linkedin", "Profile"]),
        notes: pick(row, ["Notes", "notes", "Source", "source"]),
        source: "CSV_IMPORT"
      };
    })
    .filter((row) => row.companyId && (row.name || row.email));
}

export function summarizeContactImport(rows, existingContacts = []) {
  const existing = new Set(
    existingContacts.map((contact) => `${contact.companyId}:${String(contact.email || contact.name).toLowerCase()}`)
  );
  const seen = new Set();
  const valid = [];
  const duplicates = [];

  for (const row of rows) {
    const key = `${row.companyId}:${String(row.email || row.name).toLowerCase()}`;
    if (existing.has(key) || seen.has(key)) {
      duplicates.push(row);
      continue;
    }

    seen.add(key);
    valid.push(row);
  }

  return {
    totalRows: rows.length,
    importableCount: valid.length,
    duplicateCount: duplicates.length,
    preview: valid.slice(0, 25),
    duplicates: duplicates.slice(0, 25),
    valid
  };
}

export function summarizeImport(rows, existingCompanies = []) {
  const existing = new Set(existingCompanies.map((company) => company.normalizedName));
  const seen = new Set();
  const valid = [];
  const duplicates = [];

  for (const row of rows) {
    if (!row.normalizedName) continue;

    if (existing.has(row.normalizedName) || seen.has(row.normalizedName)) {
      duplicates.push(row);
      continue;
    }

    seen.add(row.normalizedName);
    valid.push(row);
  }

  return {
    totalRows: rows.length,
    importableCount: valid.length,
    duplicateCount: duplicates.length,
    preview: valid.slice(0, 25),
    duplicates: duplicates.slice(0, 25),
    valid
  };
}
