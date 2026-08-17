import { clampScore } from "../../utils/normalize.js";
import { generateJson } from "./ai.service.js";

function domainFromCompany(company = {}) {
  const source = company.website || company.email || company.careersEmail || "";
  if (!source) return "";

  return String(source)
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split(/[/?#@]/)
    .pop()
    .toLowerCase();
}

function linkedinSearch(company, role) {
  const query = encodeURIComponent(`${company.name} ${role} LinkedIn`);
  return `https://www.linkedin.com/search/results/people/?keywords=${query}`;
}

function fallbackCandidates(company, maxResults = 3) {
  const domain = domainFromCompany(company);
  const base = [
    {
      name: "Talent Acquisition Team",
      role: "Talent Acquisition",
      email: company.careersEmail || (domain ? `careers@${domain}` : ""),
      confidenceScore: domain ? 64 : 48
    },
    {
      name: "Recruiting Team",
      role: "Technical Recruiter",
      email: domain ? `jobs@${domain}` : "",
      confidenceScore: domain ? 58 : 44
    },
    {
      name: "HR Team",
      role: "Human Resources",
      email: domain ? `hr@${domain}` : "",
      confidenceScore: domain ? 52 : 40
    }
  ];

  return base.slice(0, maxResults).map((candidate) => ({
    ...candidate,
    linkedinUrl: "",
    sourceUrl: company.linkedinUrl || linkedinSearch(company, candidate.role),
    reason:
      "Generated as a low-cost discovery candidate from company data. Verify the person or inbox before outreach.",
    source: "AI_DISCOVERY",
    status: "PENDING"
  }));
}

export async function discoverHrCandidates(company, profile, { maxResults = 3 } = {}) {
  return generateJson({
    task: "hr.discovery",
    system:
      "Find likely HR, recruiter, talent acquisition, or people-team contacts for a career networking CRM. Only return structured candidate records. Avoid inventing highly specific claims; include confidence and reason.",
    prompt: JSON.stringify({ company, profile, maxResults }),
    fallback: () => ({
      candidates: fallbackCandidates(company, maxResults)
    })
  }).then((result) => {
    const candidates = Array.isArray(result.candidates) ? result.candidates : [];

    return candidates.slice(0, maxResults).map((candidate) => ({
      name: candidate.name || "Recruiting Team",
      role: candidate.role || "HR / Recruiter",
      email: candidate.email || "",
      linkedinUrl: candidate.linkedinUrl || "",
      sourceUrl: candidate.sourceUrl || company.linkedinUrl || linkedinSearch(company, candidate.role || "recruiter"),
      confidenceScore: clampScore(candidate.confidenceScore || candidate.confidence || 50),
      reason:
        candidate.reason ||
        "Potential HR/recruiting contact discovered from available company context. Verify before outreach.",
      source: candidate.source || "AI_DISCOVERY",
      status: "PENDING"
    }));
  });
}
