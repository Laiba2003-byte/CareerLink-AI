import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from "@mui/material";
import { Globe2, Linkedin, Mail, Search, Trash2, UsersRound } from "lucide-react";
import CompanyDialog from "../components/CompanyDialog.jsx";
import ConfirmButton from "../components/ConfirmButton.jsx";
import ImportDialog from "../components/ImportDialog.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { api } from "../services/api.js";
import { companyResearchLabel, hasCompanyResearch, hrDiscoveryLabel } from "../utils/companyStatus.js";
import { formatDate } from "../utils/format.js";

const filters = [
  { value: "all", label: "All" },
  { value: "high-match", label: "High Match" },
  { value: "hiring", label: "Hiring" },
  { value: "recent", label: "Recently Followed" }
];

function CompanyLinks({ company }) {
  const links = [
    { href: company.website, label: "Website", icon: Globe2 },
    { href: company.email || company.careersEmail ? `mailto:${company.email || company.careersEmail}` : "", label: "Email", icon: Mail },
    { href: company.linkedinUrl, label: "LinkedIn", icon: Linkedin }
  ].filter((item) => item.href);

  if (!links.length) return <Typography color="text.secondary">No links</Typography>;

  return (
    <Stack direction="row" spacing={0.6} flexWrap="wrap" useFlexGap>
      {links.map((item) => {
        const Icon = item.icon;
        return (
          <Typography
            key={item.label}
            component="a"
            href={item.href}
            target={item.href.startsWith("mailto:") ? undefined : "_blank"}
            rel="noreferrer"
            className="link-pill"
          >
            <Icon size={13} style={{ marginRight: 4 }} />
            {item.label}
          </Typography>
        );
      })}
    </Stack>
  );
}

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("match");
  const [busy, setBusy] = useState(false);
  const [rowBusy, setRowBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      const [companiesResponse, contactsResponse] = await Promise.all([
        api.get("/companies", {
          params: {
            search,
            filter: filter === "all" ? undefined : filter
          }
        }),
        api.get("/contacts")
      ]);
      setCompanies(companiesResponse.data);
      setContacts(contactsResponse.data);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    const id = setTimeout(load, 180);
    return () => clearTimeout(id);
  }, [search, filter]);

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const contactCounts = useMemo(() => {
    return contacts.reduce((acc, contact) => {
      if (contact.companyId) acc[contact.companyId] = (acc[contact.companyId] || 0) + 1;
      return acc;
    }, {});
  }, [contacts]);

  const sortedCompanies = useMemo(() => {
    const next = [...companies];
    if (sort === "name") next.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "followed") next.sort((a, b) => new Date(b.followedOn || 0) - new Date(a.followedOn || 0));
    if (sort === "match") next.sort((a, b) => Number(b.relevanceScore || 0) - Number(a.relevanceScore || 0));
    return next;
  }, [companies, sort]);

  function toggle(id) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function toggleAll() {
    if (selected.length === sortedCompanies.length) {
      setSelected([]);
      return;
    }
    setSelected(sortedCompanies.map((company) => company.id));
  }

  async function discoverSelected() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await api.post("/companies/bulk-discover-hrs", {
        companyIds: selected,
        maxResults: 3
      });
      setNotice(`HR discovery finished: ${response.data.candidatesCreated} candidates created.`);
      setSelected([]);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function researchOne(companyId) {
    setRowBusy(`research-${companyId}`);
    setError("");
    setNotice("");
    try {
      await api.post(`/companies/${companyId}/research`);
      setNotice("Company research updated.");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setRowBusy("");
    }
  }

  async function deleteCompany(company) {
    setRowBusy(`delete-${company.id}`);
    setError("");
    setNotice("");
    try {
      await api.delete(`/companies/${company.id}`);
      setSelected((current) => current.filter((item) => item !== company.id));
      setNotice(`${company.name} deleted.`);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setRowBusy("");
    }
  }

  return (
    <>
      <PageHeader title="Companies" subtitle={`${companies.length} companies in your CRM`}>
        <Button
          variant="contained"
          startIcon={<UsersRound size={16} />}
          disabled={!selected.length || busy}
          onClick={discoverSelected}
        >
          Find HRs for selected
        </Button>
        <ImportDialog onImported={load} />
        <CompanyDialog onCreated={load} />
      </PageHeader>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      {notice ? <Alert severity="success" sx={{ mb: 2 }}>{notice}</Alert> : null}

      <Paper variant="outlined" sx={{ p: 1.5, borderColor: "divider", mb: 1.5 }}>
        <Stack direction={{ xs: "column", lg: "row" }} spacing={1} alignItems={{ lg: "center" }}>
          <TextField
            fullWidth
            placeholder="Search companies, emails, websites..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={16} />
                </InputAdornment>
              )
            }}
          />
          <TextField select label="Filter" value={filter} onChange={(event) => setFilter(event.target.value)} sx={{ minWidth: 170 }}>
            {filters.map((item) => (
              <MenuItem key={item.value} value={item.value}>
                {item.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField select label="Sort" value={sort} onChange={(event) => setSort(event.target.value)} sx={{ minWidth: 150 }}>
            <MenuItem value="match">Match</MenuItem>
            <MenuItem value="followed">Followed</MenuItem>
            <MenuItem value="name">Name</MenuItem>
          </TextField>
        </Stack>
      </Paper>

      <Box className="table-wrap">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={Boolean(sortedCompanies.length) && selected.length === sortedCompanies.length}
                  indeterminate={Boolean(selected.length) && selected.length < sortedCompanies.length}
                  onChange={toggleAll}
                />
              </TableCell>
              <TableCell sx={{ width: 64 }}>Sr.</TableCell>
              <TableCell>Company</TableCell>
              <TableCell>Links</TableCell>
              <TableCell>Followed</TableCell>
              <TableCell>Match</TableCell>
              <TableCell>Contacts</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedCompanies.map((company, index) => (
              <TableRow key={company.id} hover>
                <TableCell padding="checkbox">
                  <Checkbox checked={selectedSet.has(company.id)} onChange={() => toggle(company.id)} />
                </TableCell>
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  <Typography sx={{ fontWeight: 740 }}>{company.name}</Typography>
                  <Typography color="text.secondary" sx={{ fontSize: "0.8rem" }}>
                    {company.industry || company.location || "Company profile pending"}
                  </Typography>
                </TableCell>
                <TableCell>
                  <CompanyLinks company={company} />
                </TableCell>
                <TableCell>{formatDate(company.followedOn)}</TableCell>
                <TableCell>
                  <span className="score-pill">{company.relevanceScore ? `${company.relevanceScore}%` : "New"}</span>
                </TableCell>
                <TableCell>{contactCounts[company.id] || 0} contacts</TableCell>
                <TableCell>
                  <Stack spacing={0.5} alignItems="flex-start">
                    <Chip
                      size="small"
                      label={companyResearchLabel(company)}
                      color={hasCompanyResearch(company) ? "success" : "warning"}
                      variant={hasCompanyResearch(company) ? "filled" : "outlined"}
                    />
                    <Typography color="text.secondary" sx={{ fontSize: "0.78rem" }}>
                      {hrDiscoveryLabel(company)}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={0.75} justifyContent="flex-end" flexWrap="wrap" useFlexGap>
                    {!hasCompanyResearch(company) ? (
                      <Button
                        variant="outlined"
                        startIcon={<Search size={15} />}
                        disabled={rowBusy === `research-${company.id}`}
                        onClick={() => researchOne(company.id)}
                      >
                        Research
                      </Button>
                    ) : null}
                    <Button component={Link} to={`/companies/${company.id}`} variant="outlined">
                      Review
                    </Button>
                    <ConfirmButton
                      title="Delete company"
                      description={`Delete ${company.name} and its related contacts, candidates, interactions, and jobs?`}
                      color="error"
                      variant="text"
                      disabled={rowBusy === `delete-${company.id}`}
                      startIcon={<Trash2 size={15} />}
                      onConfirm={() => deleteCompany(company)}
                    >
                      Delete
                    </ConfirmButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {!sortedCompanies.length ? (
              <TableRow>
                <TableCell colSpan={9}>
                  <Box sx={{ py: 5, textAlign: "center" }}>
                    <Typography sx={{ fontWeight: 720 }}>No companies found.</Typography>
                    <Typography color="text.secondary" sx={{ mt: 0.4 }}>
                      Import LinkedIn companies, upload a normal company CSV, or add companies manually.
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Box>
    </>
  );
}
