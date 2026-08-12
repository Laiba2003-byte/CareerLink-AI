export const CONTACT_STATUSES = [
  "NOT_CONTACTED",
  "HR_IDENTIFIED",
  "HR_APPROVED",
  "CONNECTION_READY",
  "CONNECTION_REQUESTED",
  "CONNECTED",
  "FOLLOW_UP_READY",
  "MESSAGE_SENT",
  "RESPONDED",
  "INTERESTED",
  "CV_REQUESTED",
  "CV_SENT",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "CLOSED"
];

export const PIPELINE_STATUSES = [
  "NOT_CONTACTED",
  "HR_IDENTIFIED",
  "HR_APPROVED",
  "CONNECTION_READY",
  "CONNECTION_REQUESTED",
  "CONNECTED",
  "FOLLOW_UP_READY",
  "MESSAGE_SENT",
  "RESPONDED",
  "INTERESTED"
];

export const IMPORTANT_STATUS_CHANGES = new Set([
  "HR_APPROVED",
  "CONNECTION_READY",
  "CONNECTION_REQUESTED",
  "CONNECTED",
  "FOLLOW_UP_READY",
  "MESSAGE_SENT",
  "RESPONDED",
  "INTERESTED",
  "CV_REQUESTED",
  "CV_SENT",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "CLOSED"
]);

export function nextActionForStatus(status) {
  const map = {
    NOT_CONTACTED: "Identify a relevant HR or recruiter",
    HR_IDENTIFIED: "Review and approve this contact",
    HR_APPROVED: "Generate a personalized connection note",
    CONNECTION_READY: "Open LinkedIn and send the request manually",
    CONNECTION_REQUESTED: "Wait for acceptance",
    CONNECTED: "Generate a purposeful follow-up",
    FOLLOW_UP_READY: "Review and manually send follow-up",
    MESSAGE_SENT: "Wait for recruiter response",
    RESPONDED: "Analyze the response and decide next step",
    INTERESTED: "Reply with CV, portfolio, or availability",
    CV_REQUESTED: "Send CV promptly",
    CV_SENT: "Wait for recruiter review",
    INTERVIEW: "Prepare interview material",
    OFFER: "Review offer details",
    REJECTED: "Close or re-engage later",
    CLOSED: "No active action"
  };

  return map[status] || "Review this contact";
}
