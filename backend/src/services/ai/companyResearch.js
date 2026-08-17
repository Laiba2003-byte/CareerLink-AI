import { clampScore } from "../../utils/normalize.js";
import { logger } from "../../utils/logger.js";
import { generateJson } from "./ai.service.js";

const TECH_KEYWORDS = [
  "React",
  "Node.js",
  "JavaScript",
  "TypeScript",
  "Python",
  "SQL",
  "PostgreSQL",
  "AWS",
  "AI",
  "Machine Learning",
  "Frontend",
  "Backend",
  "Full Stack"
];

function scoreCompany(company, profile) {
  const text = `${company.name} ${company.description || ""} ${company.industry || ""}`.toLowerCase();
  const profileTerms = [
    ...(profile.skills || []),
    ...(profile.targetRoles || []),
    ...(profile.preferredIndustries || [])
  ].map((item) => item.toLowerCase());

  const matches = TECH_KEYWORDS.filter((keyword) => {
    const key = keyword.toLowerCase();
    return text.includes(key) || profileTerms.some((term) => term.includes(key));
  });

  const softwareSignal = /software|tech|systems|digital|data|cloud|ai|engineering|solutions/.test(text);
  const score = 48 + matches.length * 6 + (softwareSignal ? 18 : 0);

  return {
    matches,
    score: clampScore(score)
  };
}

function fallbackResearch(company, profile) {
  const { matches, score } = scoreCompany(company, profile || {});
  const role = profile?.targetRoles?.[0] || "software engineering";

  return {
    summary: `${company.name} appears worth reviewing for ${role} networking based on software, technology, or hiring alignment signals.`,
    description: company.description || "",
    industry: company.industry || "Technology / Software",
    technologies: matches.length ? matches : ["JavaScript", "React", "Node.js"],
    hiringSignals: ["Recruiter outreach could uncover current engineering openings"],
    relevanceScore: score,
    matchReason: `The company has signals that overlap with ${role} goals and the user's listed skills.`,
    recommendedRoles: profile?.targetRoles?.length ? profile.targetRoles : ["Full Stack Developer", "Software Engineer"]
  };
}

function toArray(value, fallback = []) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string" && value.trim()) {
    return value
      .split(/[,;\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return fallback;
}

function looksNegative(text = "") {
  return /not valuable|insufficient|not recommended|lack of|lacks|no job|not enough/i.test(text);
}

function normalizeResearchResult(raw, company, profile) {
  const fallback = fallbackResearch(company, profile);
  const topLevelKeys = ["summary", "industry", "technologies", "hiringSignals", "relevanceScore", "matchReason", "recommendedRoles"];
  const hasExpectedShape = raw && topLevelKeys.some((key) => raw[key] !== undefined);

  if (!hasExpectedShape) {
    const assessment = raw?.evaluation?.valueAssessment || {};
    const evaluatedCompany = raw?.evaluation?.company || {};
    const recommendation = assessment.overallRecommendation || "";

    logger.warn("company.research.unexpected_shape", {
      companyId: company.id,
      companyName: company.name,
      topLevelKeys: raw ? Object.keys(raw) : [],
      nestedEvaluationKeys: raw?.evaluation ? Object.keys(raw.evaluation) : [],
      action: raw?.evaluation ? "normalized_nested_evaluation" : "used_fallback"
    });

    if (raw?.evaluation) {
      return {
        ...fallback,
        summary: recommendation || fallback.summary,
        description: evaluatedCompany.description || company.description || fallback.description,
        industry: evaluatedCompany.industry || company.industry || fallback.industry,
        technologies: [],
        hiringSignals: [assessment.companyPresence, assessment.profileCompleteness].filter(Boolean),
        relevanceScore: looksNegative(recommendation) ? 35 : fallback.relevanceScore,
        matchReason: [assessment.companyPresence, assessment.profileCompleteness].filter(Boolean).join(" ") || fallback.matchReason,
        recommendedRoles: fallback.recommendedRoles
      };
    }

    return fallback;
  }

  return {
    ...fallback,
    ...raw,
    summary: raw.summary || raw.researchSummary || fallback.summary,
    description: raw.description || company.description || fallback.description,
    industry: raw.industry || company.industry || fallback.industry,
    technologies: toArray(raw.technologies, fallback.technologies),
    hiringSignals: toArray(raw.hiringSignals, fallback.hiringSignals),
    relevanceScore: clampScore(raw.relevanceScore || raw.score || fallback.relevanceScore),
    matchReason: raw.matchReason || raw.reason || fallback.matchReason,
    recommendedRoles: toArray(raw.recommendedRoles || raw.roles, fallback.recommendedRoles)
  };
}

export async function researchCompany(company, profile) {
  const result = await generateJson({
    task: "company.research",
    system:
      "You evaluate whether a company is valuable for a software career networking CRM. Return one JSON object with exactly these top-level keys: summary, description, industry, technologies, hiringSignals, relevanceScore, matchReason, recommendedRoles. Do not wrap the result inside evaluation, company, profile, or valueAssessment.",
    prompt: JSON.stringify({ company, profile }),
    fallback: () => fallbackResearch(company, profile)
  });

  const normalized = normalizeResearchResult(result, company, profile);
  logger.info("company.research.normalized", {
    companyId: company.id,
    companyName: company.name,
    relevanceScore: normalized.relevanceScore,
    industry: normalized.industry,
    technologyCount: normalized.technologies.length,
    hiringSignalCount: normalized.hiringSignals.length,
    recommendedRoleCount: normalized.recommendedRoles.length
  });

  return normalized;
}
