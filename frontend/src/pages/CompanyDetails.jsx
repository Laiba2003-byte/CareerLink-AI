import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from "@mui/material";
import { ExternalLink, Search } from "lucide-react";
import CandidateReviewTable from "../components/CandidateReviewTable.jsx";
import ContactDialog from "../components/ContactDialog.jsx";
import ContactImportDialog from "../components/ContactImportDialog.jsx";
import PageHeader from "../components/PageHeader.jsx";
import StatusChip from "../components/StatusChip.jsx";
import { api } from "../services/api.js";
import { formatDate, listText } from "../utils/format.js";

export default function CompanyDetails() {
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [busy, setBusy] = useState(false);
  const [discovering, setDiscovering] = useState(false);
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

  async function discoverHrs() {
    setDiscovering(true);
    setError("");
    try {
      await api.post(`/companies/${id}/discover-hrs`, { maxResults: 3 });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setDiscovering(false);
    }
  }

  if (!company && !error) {
    return <LinearProgress />;
  }

  return (
    <>
      <PageHeader
        title={company?.name || "Company"}
        subtitle={`${company?.industry || "Industry pending"} - ${company?.location || "Location not set"}`}
      >
        {company?.linkedinUrl || company?.website ? (
          <Button
            component="a"
            href={company.linkedinUrl || company.website}
            target="_blank"
            rel="noreferrer"
            variant="outlined"
            startIcon={<ExternalLink size={16} />}
          >
            Open Link
          </Button>
        ) : null}
        <Button variant="outlined" startIcon={<Search size={16} />} onClick={research} disabled={busy}>
          Research
        </Button>
        <Button variant="contained" startIcon={<Search size={16} />} onClick={discoverHrs} disabled={discovering}>
          Find HRs
        </Button>
        <ContactImportDialog companyId={id} onImported={load} />
        <ContactDialog companies={companies} defaultCompanyId={id} onCreated={load} />
      </PageHeader>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

      {company ? (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "1fr 0.76fr" }, gap: 3 }}>
          <Paper variant="outlined" sx={{ borderColor: "divider", p: 2.2 }}>
            <Stack spacing={2.2}>
              <Box>
                <Typography className="section-title" sx={{ mb: 0.8 }}>
                  Company overview
                </Typography>
                <Typography>
                  {company.researchSummary || company.description || "Run company research to generate a focused overview."}
                </Typography>
              </Box>

              <Divider />

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" }, gap: 2 }}>
                <Box>
                  <Typography className="section-title" sx={{ mb: 0.7 }}>
                    Match
                  </Typography>
                  <span className="score-pill">{company.relevanceScore ? `${company.relevanceScore}%` : "New"}</span>
                </Box>
                <Box>
                  <Typography className="section-title" sx={{ mb: 0.7 }}>
                    Followed
                  </Typography>
                  <Typography>{formatDate(company.followedOn)}</Typography>
                </Box>
                <Box>
                  <Typography className="section-title" sx={{ mb: 0.7 }}>
                    Source
                  </Typography>
                  <Typography>{company.source}</Typography>
                </Box>
                <Box>
                  <Typography className="section-title" sx={{ mb: 0.7 }}>
                    HR discovery
                  </Typography>
                  <span className="discovery-pill">{(company.discoveryStatus || "NEEDS_RESEARCH").replaceAll("_", " ")}</span>
                </Box>
              </Box>

              <Divider />

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2 }}>
                <Box>
                  <Typography className="section-title" sx={{ mb: 0.7 }}>
                    Website
                  </Typography>
                  {company.website ? (
                    <Typography component="a" href={company.website} target="_blank" rel="noreferrer" color="primary">
                      {company.website}
                    </Typography>
                  ) : (
                    <Typography color="text.secondary">Not provided</Typography>
                  )}
                </Box>
                <Box>
                  <Typography className="section-title" sx={{ mb: 0.7 }}>
                    Email
                  </Typography>
                  <Typography>{company.email || company.careersEmail || "Not provided"}</Typography>
                </Box>
                <Box>
                  <Typography className="section-title" sx={{ mb: 0.7 }}>
                    Careers
                  </Typography>
                  {company.careersUrl ? (
                    <Typography component="a" href={company.careersUrl} target="_blank" rel="noreferrer" color="primary">
                      Careers page
                    </Typography>
                  ) : (
                    <Typography color="text.secondary">Not provided</Typography>
                  )}
                </Box>
              </Box>

              <Divider />

              <Box>
                <Typography className="section-title" sx={{ mb: 0.8 }}>
                  Why this company?
                </Typography>
                <Typography>{company.matchReason || "No match reason yet."}</Typography>
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2.2 }}>
                <Box>
                  <Typography className="section-title" sx={{ mb: 0.8 }}>
                    Hiring signals
                  </Typography>
                  <Typography>{listText(company.hiringSignals)}</Typography>
                </Box>
                <Box>
                  <Typography className="section-title" sx={{ mb: 0.8 }}>
                    Technology signals
                  </Typography>
                  <Typography>{listText(company.technologies)}</Typography>
                </Box>
                <Box>
                  <Typography className="section-title" sx={{ mb: 0.8 }}>
                    Relevant roles
                  </Typography>
                  <Typography>{listText(company.recommendedRoles)}</Typography>
                </Box>
              </Box>

              {company.notes ? (
                <>
                  <Divider />
                  <Box>
                    <Typography className="section-title" sx={{ mb: 0.8 }}>
                      Notes
                    </Typography>
                    <Typography>{company.notes}</Typography>
                  </Box>
                </>
              ) : null}
            </Stack>
          </Paper>

          <Box>
            <Typography variant="h2" sx={{ mb: 1 }}>
              HR contacts
            </Typography>
            <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
              <Chip label={`${company.contacts?.length || 0} approved contacts`} variant="outlined" />
              <Chip label={`${company.contactCandidates?.length || 0} pending candidates`} variant="outlined" color="primary" />
            </Stack>
            <Box className="table-wrap">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Contact</TableCell>
                    <TableCell>Match</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {company.contacts?.length ? (
                    company.contacts.map((contact) => (
                      <TableRow key={contact.id} hover>
                        <TableCell>
                          <Typography sx={{ fontWeight: 740 }}>{contact.name}</Typography>
                          <Typography color="text.secondary" sx={{ fontSize: "0.8rem" }}>
                            {contact.role}
                          </Typography>
                          {contact.email ? (
                            <Typography color="text.secondary" sx={{ fontSize: "0.78rem" }}>
                              {contact.email}
                            </Typography>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <span className="score-pill">{contact.relevanceScore ? `${contact.relevanceScore}%` : "New"}</span>
                        </TableCell>
                        <TableCell>
                          <StatusChip status={contact.status} />
                        </TableCell>
                        <TableCell align="right">
                          <Button component={Link} to={`/contacts/${contact.id}`} variant="outlined">
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <Box sx={{ py: 4, textAlign: "center" }}>
                          <Typography sx={{ fontWeight: 720 }}>No contacts yet.</Typography>
                          <Typography color="text.secondary" sx={{ mt: 0.4 }}>
                            Add HR manually, import HR CSV, or run HR discovery.
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>

            <Box sx={{ mt: 2.5 }}>
              <Typography variant="h2" sx={{ mb: 1 }}>
                HR candidates
              </Typography>
              <CandidateReviewTable candidates={company.contactCandidates || []} onChanged={load} />
            </Box>
          </Box>
        </Box>
      ) : null}
    </>
  );
}
