import { parse } from "csv-parse/sync";
import { normalizeCompanyName, parseDate } from "./normalize.js";

export function parseCompanyFollowsCsv(buffer) {
  const content = buffer.toString("utf8").replace(/^\uFEFF/, "");
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  return records
    .map((row, index) => {
      const organization =
        row.Organization ||
        row.organization ||
        row.Company ||
        row.company ||
        row.Name ||
        row.name;

      return {
        row: index + 2,
        name: organization ? String(organization).trim() : "",
        normalizedName: normalizeCompanyName(organization || ""),
        followedOn: parseDate(row["Followed On"] || row.followedOn || row.followed_on),
        source: "LINKEDIN_EXPORT"
      };
    })
    .filter((row) => row.name);
}

export function summarizeImport(rows, existingCompanies = []) {
  const existing = new Set(existingCompanies.map((company) => company.normalizedName));
  const seen = new Set();
  const valid = [];
  const duplicates = [];

  for (const row of rows) {
    if (!row.normalizedName) continue;

    if (existing.has(row.normalizedName) || seen.has(row.normalizedName)) {
      duplicates.push(row);
      continue;
    }

    seen.add(row.normalizedName);
    valid.push(row);
  }

  return {
    totalRows: rows.length,
    importableCount: valid.length,
    duplicateCount: duplicates.length,
    preview: valid.slice(0, 25),
    duplicates: duplicates.slice(0, 25),
    valid
  };
}
