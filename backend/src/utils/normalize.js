export function normalizeCompanyName(name = "") {
  return String(name)
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[.,]+$/g, "")
    .toLowerCase();
}

export function splitList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (!value) return [];

  return String(value)
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function clampScore(score) {
  return Math.max(0, Math.min(100, Math.round(Number(score) || 0)));
}

export function parseDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}
