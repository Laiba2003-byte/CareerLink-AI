import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
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
import { Search } from "lucide-react";
import CompanyDialog from "../components/CompanyDialog.jsx";
import ImportDialog from "../components/ImportDialog.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { api } from "../services/api.js";
import { formatDate } from "../utils/format.js";

const filters = [
  { value: "all", label: "All" },
  { value: "high-match", label: "High Match" },
  { value: "hiring", label: "Hiring" },
  { value: "recent", label: "Recently Followed" }
];

function researchStatus(company) {
  if (company.researchSummary || company.relevanceScore) return "Research ready";
  return "Needs research";
}

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("match");
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

  return (
    <>
      <PageHeader title="Companies" subtitle={`${companies.length} companies from LinkedIn`}>
        <ImportDialog onImported={load} />
        <CompanyDialog onCreated={load} />
      </PageHeader>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

      <Paper variant="outlined" sx={{ p: 1.5, borderColor: "divider", mb: 1.5 }}>
        <Stack direction={{ xs: "column", lg: "row" }} spacing={1} alignItems={{ lg: "center" }}>
          <TextField
            fullWidth
            placeholder="Search companies..."
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
              <TableCell>Company</TableCell>
              <TableCell>Followed</TableCell>
              <TableCell>Match</TableCell>
              <TableCell>Hiring</TableCell>
              <TableCell>Contacts</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedCompanies.map((company) => (
              <TableRow key={company.id} hover>
                <TableCell>
                  <Typography sx={{ fontWeight: 740 }}>{company.name}</Typography>
                  <Typography color="text.secondary" sx={{ fontSize: "0.8rem" }}>
                    {company.industry || company.location || "Company profile pending"}
                  </Typography>
                </TableCell>
                <TableCell>{formatDate(company.followedOn)}</TableCell>
                <TableCell>
                  <span className="score-pill">{company.relevanceScore ? `${company.relevanceScore}%` : "New"}</span>
                </TableCell>
                <TableCell>
                  <Chip
                    label={company.hiringSignals?.length ? "Hiring" : "Unknown"}
                    variant="outlined"
                    sx={{
                      bgcolor: company.hiringSignals?.length ? "#f4faf6" : "#f7f6f3",
                      borderColor: company.hiringSignals?.length ? "#d9e6dd" : "#d8d5cf",
                      color: company.hiringSignals?.length ? "#2f6f48" : "text.secondary"
                    }}
                  />
                </TableCell>
                <TableCell>{contactCounts[company.id] || 0} contacts</TableCell>
                <TableCell>{researchStatus(company)}</TableCell>
                <TableCell align="right">
                  <Button component={Link} to={`/companies/${company.id}`} variant="outlined">
                    Review
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!sortedCompanies.length ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <Box sx={{ py: 5, textAlign: "center" }}>
                    <Typography sx={{ fontWeight: 720 }}>No companies found.</Typography>
                    <Typography color="text.secondary" sx={{ mt: 0.4 }}>
                      Import your LinkedIn Company Follows.csv or add a company manually.
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
