import { clampScore } from "../../utils/normalize.js";
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

export async function researchCompany(company, profile) {
  return generateJson({
    system:
      "You evaluate whether a company is valuable for a software career networking CRM. Be specific, concise, and practical.",
    prompt: JSON.stringify({ company, profile }),
    fallback: () => {
      const { matches, score } = scoreCompany(company, profile || {});
      const role = profile?.targetRoles?.[0] || "software engineering";

      return {
        summary: `${company.name} appears worth reviewing for ${role} networking based on software, technology, or hiring alignment signals.`,
        industry: company.industry || "Technology / Software",
        technologies: matches.length ? matches : ["JavaScript", "React", "Node.js"],
        hiringSignals: ["Recruiter outreach could uncover current engineering openings"],
        relevanceScore: score,
        matchReason: `The company has signals that overlap with ${role} goals and the user's listed skills.`,
        recommendedRoles: profile?.targetRoles?.length ? profile.targetRoles : ["Full Stack Developer", "Software Engineer"]
      };
    }
  });
}
