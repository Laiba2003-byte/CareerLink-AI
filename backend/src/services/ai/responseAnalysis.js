import { generateJson } from "./ai.service.js";

export async function analyzeRecruiterResponse(contact, responseText) {
  return generateJson({
    system:
      "Analyze a recruiter or HR response and recommend the next action for a job-seeking networking CRM.",
    prompt: JSON.stringify({ contact, responseText }),
    fallback: () => {
      const text = String(responseText || "").toLowerCase();
      const wantsCv = /cv|resume|send.*profile|share.*profile/.test(text);
      const interview = /interview|call|meeting|schedule/.test(text);
      const negative = /not hiring|no opening|not available|unfortunately|not looking/.test(text);

      if (wantsCv) {
        return {
          intent: "HIGH",
          sentiment: "POSITIVE",
          hiringSignal: true,
          urgency: "TODAY",
          opportunityLevel: "HIGH",
          recommendedAction: "SEND_CV",
          reason: "The recruiter asked for a CV or profile, which is a strong hiring signal."
        };
      }

      if (interview) {
        return {
          intent: "HIGH",
          sentiment: "POSITIVE",
          hiringSignal: true,
          urgency: "TODAY",
          opportunityLevel: "HIGH",
          recommendedAction: "RESPOND",
          reason: "The response suggests scheduling a call or interview."
        };
      }

      if (negative) {
        return {
          intent: "LOW",
          sentiment: "NEUTRAL",
          hiringSignal: false,
          urgency: "LOW",
          opportunityLevel: "LOW",
          recommendedAction: "REENGAGE_LATER",
          reason: "The response does not indicate an active opportunity right now."
        };
      }

      return {
        intent: "MEDIUM",
        sentiment: "NEUTRAL",
        hiringSignal: false,
        urgency: "NORMAL",
        opportunityLevel: "MEDIUM",
        recommendedAction: "RESPOND",
        reason: "The response deserves a thoughtful reply, but no explicit hiring signal was detected."
      };
    }
  });
}
