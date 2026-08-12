export function formatDate(value) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function listText(value) {
  return Array.isArray(value) ? value.filter(Boolean).join(", ") : value || "None yet";
}
