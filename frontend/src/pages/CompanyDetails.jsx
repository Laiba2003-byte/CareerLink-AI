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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from "@mui/material";
import { ExternalLink, Search } from "lucide-react";
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
      <PageHeader
        title={company?.name || "Company"}
        subtitle={`${company?.industry || "Industry pending"} · ${company?.location || "Location not set"}`}
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
            Open LinkedIn
          </Button>
        ) : null}
        <Button variant="outlined" startIcon={<Search size={16} />} onClick={research} disabled={busy}>
          Research Company
        </Button>
        <ContactDialog companies={companies} defaultCompanyId={id} onCreated={load} />
      </PageHeader>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

      {company ? (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "1fr 0.72fr" }, gap: 3 }}>
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

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2 }}>
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
            </Stack>
          </Paper>

          <Box>
            <Typography variant="h2" sx={{ mb: 1.2 }}>
              Potential contacts
            </Typography>
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
                            Add HR or recruiter contacts manually for V1.
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
          </Box>
        </Box>
      ) : null}
    </>
  );
}
