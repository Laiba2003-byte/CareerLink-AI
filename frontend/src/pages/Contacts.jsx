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
import ContactDialog from "../components/ContactDialog.jsx";
import PageHeader from "../components/PageHeader.jsx";
import StatusChip from "../components/StatusChip.jsx";
import { api } from "../services/api.js";
import { formatDate } from "../utils/format.js";
import { CONTACT_STATUSES, labelStatus } from "../utils/status.js";

const visibleStatuses = [
  "ALL",
  "HR_IDENTIFIED",
  "HR_APPROVED",
  "CONNECTION_READY",
  "CONNECTION_REQUESTED",
  "FOLLOW_UP_READY",
  "MESSAGE_SENT",
  "RESPONDED",
  "INTERESTED"
];

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [error, setError] = useState("");

  async function load() {
    try {
      const [contactsResponse, companiesResponse] = await Promise.all([
        api.get("/contacts", { params: { search, status } }),
        api.get("/companies")
      ]);
      setContacts(contactsResponse.data);
      setCompanies(companiesResponse.data);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    const id = setTimeout(load, 180);
    return () => clearTimeout(id);
  }, [search, status]);

  return (
    <>
      <PageHeader title="Contacts" eyebrow={`${contacts.length} people`}>
        <ContactDialog companies={companies} onCreated={load} />
      </PageHeader>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

      <Paper variant="outlined" sx={{ p: 2, borderColor: "#dde7e3", mb: 2 }}>
        <Stack spacing={1.5}>
          <TextField
            fullWidth
            placeholder="Search contacts"
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
            {visibleStatuses.map((item) => (
              <Chip
                key={item}
                label={item === "ALL" ? "All" : labelStatus(item)}
                color={status === item ? "primary" : "default"}
                variant={status === item ? "filled" : "outlined"}
                onClick={() => setStatus(item)}
              />
            ))}
          </Stack>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ borderColor: "#dde7e3", overflow: "hidden" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Contact</TableCell>
              <TableCell>Company</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Relevance</TableCell>
              <TableCell>Next Action</TableCell>
              <TableCell>Last Interaction</TableCell>
              <TableCell align="right">Open</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {contacts.map((contact) => (
              <TableRow key={contact.id} hover>
                <TableCell>
                  <Typography fontWeight={850}>{contact.name}</Typography>
                  <Typography color="text.secondary" fontSize="0.88rem">
                    {contact.role}
                  </Typography>
                </TableCell>
                <TableCell>{contact.company?.name || "Unknown"}</TableCell>
                <TableCell>
                  <StatusChip status={contact.status} />
                </TableCell>
                <TableCell>
                  <span className="score-pill">{contact.relevanceScore ? `${contact.relevanceScore}%` : "New"}</span>
                </TableCell>
                <TableCell>{contact.nextAction || "Review contact"}</TableCell>
                <TableCell>{formatDate(contact.lastInteractionAt)}</TableCell>
                <TableCell align="right">
                  <Button component={Link} to={`/contacts/${contact.id}`} size="small" variant="outlined">
                    Open
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!contacts.length ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <Box sx={{ py: 5, textAlign: "center" }}>
                    <Typography color="text.secondary">No contacts found.</Typography>
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
