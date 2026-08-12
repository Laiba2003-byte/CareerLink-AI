import { generateJson } from "./ai.service.js";

function firstName(name = "") {
  return String(name).trim().split(/\s+/)[0] || "there";
}

function primarySkill(profile) {
  return profile?.skills?.[0] || "full-stack development";
}

function primaryRole(profile) {
  return profile?.targetRoles?.[0] || "software engineering";
}

export async function generateConnectionNote(contact, company, profile) {
  return generateJson({
    system:
      "Write concise LinkedIn connection notes under 300 characters. Do not claim a personal relationship. Keep it professional and human.",
    prompt: JSON.stringify({ contact, company, profile }),
    fallback: () => ({
      message: `Hi ${firstName(contact.name)}, I noticed your work in talent at ${company.name}. I am exploring ${primaryRole(profile)} opportunities and would value connecting around ${primarySkill(profile)} and engineering roles.`
    })
  });
}

export async function generateFollowUp(contact, company, profile, interactions = []) {
  return generateJson({
    system:
      "Write a purposeful LinkedIn follow-up. It must not only say thanks for connecting. Include a clear professional reason for the conversation.",
    prompt: JSON.stringify({ contact, company, profile, interactions }),
    fallback: () => ({
      message: `Hi ${firstName(contact.name)}, thanks for connecting. I am exploring ${primaryRole(profile)} roles and noticed ${company.name} aligns with my ${primarySkill(profile)} background. If your team is hiring, I would appreciate guidance on the best role or person to speak with.`
    })
  });
}
