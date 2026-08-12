import { nextActionForStatus } from "../../utils/status.js";
import { generateJson } from "./ai.service.js";

export async function recommendNextAction(contact, company, profile, interactions = []) {
  return generateJson({
    system:
      "Recommend the next best action for one career networking contact. Return a short practical action and priority.",
    prompt: JSON.stringify({ contact, company, profile, interactions }),
    fallback: () => {
      const statusMap = {
        HR_IDENTIFIED: "REVIEW_CONTACT",
        HR_APPROVED: "SEND_CONNECTION",
        CONNECTION_READY: "SEND_CONNECTION",
        CONNECTION_REQUESTED: "WAIT",
        CONNECTED: "FOLLOW_UP",
        FOLLOW_UP_READY: "FOLLOW_UP",
        MESSAGE_SENT: "WAIT",
        RESPONDED: "RESPOND",
        INTERESTED: "SEND_CV",
        CV_REQUESTED: "SEND_CV"
      };

      return {
        action: statusMap[contact.status] || "REVIEW_CONTACT",
        label: nextActionForStatus(contact.status),
        priority: contact.priority || 50,
        reason: `Based on the current status ${contact.status}, the next step should be visible and user-approved.`
      };
    }
  });
}
