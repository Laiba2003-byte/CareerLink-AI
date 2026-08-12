import { clampScore } from "../../utils/normalize.js";
import { generateJson } from "./ai.service.js";

function isRecruitingRole(role = "") {
  return /recruit|talent|people|hr|human resources|acquisition|staffing|sourc/i.test(role);
}

export async function analyzeContact(contact, company, profile) {
  return generateJson({
    system:
      "You evaluate whether a professional contact is relevant for career networking. Favor recruiters, HR, talent acquisition, and engineering hiring stakeholders.",
    prompt: JSON.stringify({ contact, company, profile }),
    fallback: () => {
      const recruiter = isRecruitingRole(contact.role);
      const score = recruiter ? 92 : 62;

      return {
        relevanceScore: clampScore(score),
        relevanceReason: recruiter
          ? `${contact.role} is directly tied to hiring or talent conversations at ${company.name}.`
          : `${contact.role} may still be useful, but it is not an obvious recruiting role.`,
        whyContact: recruiter
          ? "This contact can likely route hiring interest, CVs, or role availability to the right team."
          : "This contact may provide context or a referral path if their role overlaps with engineering hiring.",
        recommendedOutreachAngle: `Mention your fit for ${profile?.targetRoles?.[0] || "software roles"} and ask for guidance on relevant openings at ${company.name}.`,
        priority: recruiter ? 86 : 54
      };
    }
  });
}
