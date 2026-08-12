import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  InputAdornment,
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
import { formatDate, listText } from "../utils/format.js";

const filters = [
  { value: "all", label: "All" },
  { value: "high-match", label: "High Match" },
  { value: "hiring", label: "Hiring" },
  { value: "recent", label: "Recently Followed" }
];

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");

  async function load() {
    try {
      const response = await api.get("/companies", {
        params: {
          search,
          filter: filter === "all" ? undefined : filter
        }
      });
      setCompanies(response.data);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    const id = setTimeout(load, 180);
    return () => clearTimeout(id);
  }, [search, filter]);

  return (
    <>
      <PageHeader title="Companies" eyebrow={`${companies.length} organizations`}>
        <ImportDialog onImported={load} />
        <CompanyDialog onCreated={load} />
      </PageHeader>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

      <Paper variant="outlined" sx={{ p: 2, borderColor: "#dde7e3", mb: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }}>
          <TextField
            fullWidth
            placeholder="Search companies"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={18} />
                </InputAdornment>
              )
            }}
          />
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {filters.map((item) => (
              <Chip
                key={item.value}
                label={item.label}
                color={filter === item.value ? "primary" : "default"}
                variant={filter === item.value ? "filled" : "outlined"}
                onClick={() => setFilter(item.value)}
              />
            ))}
          </Stack>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ borderColor: "#dde7e3", overflow: "hidden" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Company</TableCell>
              <TableCell>Match</TableCell>
              <TableCell>Hiring signal</TableCell>
              <TableCell>Followed</TableCell>
              <TableCell>Research</TableCell>
              <TableCell align="right">Open</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {companies.map((company) => (
              <TableRow key={company.id} hover>
                <TableCell>
                  <Typography fontWeight={850}>{company.name}</Typography>
                  <Typography color="text.secondary" fontSize="0.88rem">
                    {company.industry || company.location || "Company profile pending"}
                  </Typography>
                </TableCell>
                <TableCell>
                  <span className="score-pill">{company.relevanceScore ? `${company.relevanceScore}%` : "New"}</span>
                </TableCell>
                <TableCell>{company.hiringSignals?.length ? "Yes" : "Unknown"}</TableCell>
                <TableCell>{formatDate(company.followedOn)}</TableCell>
                <TableCell>{listText(company.technologies)}</TableCell>
                <TableCell align="right">
                  <Button component={Link} to={`/companies/${company.id}`} size="small" variant="outlined">
                    Review
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!companies.length ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <Box sx={{ py: 5, textAlign: "center" }}>
                    <Typography color="text.secondary">No companies found.</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Paper>
    </>
  );
}
