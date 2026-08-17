const LEVELS = {
  silent: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4
};

const configuredLevel = String(process.env.LOG_LEVEL || "info").toLowerCase();
const activeLevel = LEVELS[configuredLevel] ?? LEVELS.info;

function sanitizeUrl(value) {
  try {
    const url = new URL(value);
    if (url.username || url.password) {
      url.username = "redacted";
      url.password = "redacted";
    }
    return url.toString();
  } catch {
    return value;
  }
}

function redact(value, key = "") {
  if (value === null || value === undefined) return value;

  if (/authorization|api[_-]?key|token|secret|password|database_url/i.test(key)) {
    return "[redacted]";
  }

  if (typeof value === "string") {
    if (/^postgresql:\/\//i.test(value)) return sanitizeUrl(value);
    if (/Bearer\s+\S+/i.test(value)) return value.replace(/Bearer\s+\S+/i, "Bearer [redacted]");
    return value.length > 500 ? `${value.slice(0, 500)}...` : value;
  }

  if (Array.isArray(value)) return value.map((item) => redact(item));

  if (typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([entryKey, entryValue]) => [entryKey, redact(entryValue, entryKey)]));
  }

  return value;
}

function write(level, event, details = {}) {
  if ((LEVELS[level] || 0) > activeLevel) return;

  const payload = Object.keys(details).length ? ` ${JSON.stringify(redact(details))}` : "";
  console[level === "debug" ? "log" : level](`[${level}] ${event}${payload}`);
}

export const logger = {
  debug: (event, details) => write("debug", event, details),
  info: (event, details) => write("info", event, details),
  warn: (event, details) => write("warn", event, details),
  error: (event, details) => write("error", event, details)
};
