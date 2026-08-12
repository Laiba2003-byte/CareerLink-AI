export const CONTACT_STATUSES = [
  "ALL",
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

export const PRIMARY_PIPELINE = [
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

export function labelStatus(status = "") {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

export function statusColor(status) {
  if (["INTERESTED", "CV_REQUESTED", "INTERVIEW", "OFFER"].includes(status)) return "success";
  if (["HR_IDENTIFIED", "CONNECTION_READY", "FOLLOW_UP_READY", "RESPONDED"].includes(status)) return "warning";
  if (["REJECTED", "CLOSED"].includes(status)) return "default";
  if (["CONNECTION_REQUESTED", "MESSAGE_SENT"].includes(status)) return "info";
  return "primary";
}
