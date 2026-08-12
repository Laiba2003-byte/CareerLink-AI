import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Divider,
  LinearProgress,
  Paper,
  Stack,
  Typography
} from "@mui/material";
import { ExternalLink, Sparkles } from "lucide-react";
import ContactDialog from "../components/ContactDialog.jsx";
import PageHeader from "../components/PageHeader.jsx";
import StatusChip from "../components/StatusChip.jsx";
import { api } from "../services/api.js";
import { formatDate, listText } from "../utils/format.js";

export default function CompanyDetails() {
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    try {
      const [companyResponse, companiesResponse] = await Promise.all([
        api.get(`/companies/${id}`),
        api.get("/companies")
      ]);
      setCompany(companyResponse.data);
      setCompanies(companiesResponse.data);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function research() {
    setBusy(true);
    setError("");
    try {
      const response = await api.post(`/companies/${id}/research`);
      setCompany(response.data.company);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!company && !error) {
    return <LinearProgress />;
  }

  return (
    <>
      <PageHeader title={company?.name || "Company"} eyebrow="Company details">
        <Button variant="outlined" startIcon={<Sparkles size={18} />} onClick={research} disabled={busy}>
          Research
        </Button>
        {company?.website ? (
          <Button component="a" href={company.website} target="_blank" rel="noreferrer" startIcon={<ExternalLink size={18} />}>
            Website
          </Button>
        ) : null}
        <ContactDialog companies={companies} defaultCompanyId={id} onCreated={load} />
      </PageHeader>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

      {company ? (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "0.8fr 1.2fr" }, gap: 2.5 }}>
          <Stack spacing={2.5}>
            <Paper variant="outlined" sx={{ p: 2.4, borderColor: "#dde7e3" }}>
              <Stack spacing={1.8}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography className="section-title">Match score</Typography>
                  <span className="score-pill">{company.relevanceScore ? `${company.relevanceScore}%` : "New"}</span>
                </Stack>
                <Typography variant="h2">{company.industry || "Industry pending"}</Typography>
                <Typography color="text.secondary">{company.location || "Location not set"}</Typography>
                <Divider />
                <Box>
                  <Typography className="section-title" sx={{ mb: 0.8 }}>
                    Why this company?
                  </Typography>
                  <Typography>{company.matchReason || company.researchSummary || "Run AI research to evaluate this company."}</Typography>
                </Box>
                <Box>
                  <Typography className="section-title" sx={{ mb: 0.8 }}>
                    Technology signals
                  </Typography>
                  <Typography>{listText(company.technologies)}</Typography>
                </Box>
                <Box>
                  <Typography className="section-title" sx={{ mb: 0.8 }}>
                    Hiring signals
                  </Typography>
                  <Typography>{listText(company.hiringSignals)}</Typography>
                </Box>
                <Typography color="text.secondary" fontSize="0.88rem">
                  Source: {company.source} | Followed: {formatDate(company.followedOn)}
                </Typography>
              </Stack>
            </Paper>
          </Stack>

          <Paper variant="outlined" sx={{ p: 2.4, borderColor: "#dde7e3" }}>
            <Stack spacing={1.8}>
              <Typography variant="h2">Potential HRs</Typography>
              {company.contacts?.length ? (
                company.contacts.map((contact) => (
                  <Paper key={contact.id} variant="outlined" sx={{ p: 1.8, borderColor: "#e2e9e6" }}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1.2}
                      justifyContent="space-between"
                      alignItems={{ sm: "center" }}
                    >
                      <Box>
                        <Typography fontWeight={850}>{contact.name}</Typography>
                        <Typography color="text.secondary">{contact.role}</Typography>
                      </Box>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <StatusChip status={contact.status} />
                        <span className="score-pill">{contact.relevanceScore ? `${contact.relevanceScore}%` : "New"}</span>
                        <Button component={Link} to={`/contacts/${contact.id}`} size="small" variant="outlined">
                          Review
                        </Button>
                      </Stack>
                    </Stack>
                  </Paper>
                ))
              ) : (
                <Typography color="text.secondary">No contacts yet. Add HR or recruiter contacts manually for V1.</Typography>
              )}
            </Stack>
          </Paper>
        </Box>
      ) : null}
    </>
  );
}
