export function hasCompanyResearch(company = {}) {
  return Boolean(company.researchSummary || company.matchReason || Number(company.relevanceScore || 0));
}

export function companyResearchLabel(company = {}) {
  return hasCompanyResearch(company) ? "Research ready" : "Research pending";
}

export function hrDiscoveryLabel(company = {}) {
  if (company.discoveryStatus === "CANDIDATES_FOUND") return "HR candidates ready";
  if (company.discoveryStatus === "NO_NEW_CANDIDATES") return "No new HRs found";
  if (company.discoveryStatus === "READY_FOR_HR_DISCOVERY") return "Ready for HR search";
  if (company.lastHrSearchAt) return "HR search done";
  return "HR search not started";
}
