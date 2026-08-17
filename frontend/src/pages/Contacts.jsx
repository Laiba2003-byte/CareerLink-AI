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
import ContactImportDialog from "../components/ContactImportDialog.jsx";
import PageHeader from "../components/PageHeader.jsx";
import StatusChip from "../components/StatusChip.jsx";
import { api } from "../services/api.js";
import { formatDate } from "../utils/format.js";
import { labelStatus } from "../utils/status.js";

const visibleStatuses = [
  { value: "ALL", label: "All" },
  { value: "HR_IDENTIFIED", label: "Needs Review" },
  { value: "HR_APPROVED", label: "Approved" },
  { value: "CONNECTION_READY", label: "Request Ready" },
  { value: "CONNECTION_REQUESTED", label: "Requested" },
  { value: "CONNECTED", label: "Connected" },
  { value: "FOLLOW_UP_READY", label: "Follow-up" },
  { value: "RESPONDED", label: "Responded" },
  { value: "INTERESTED", label: "Interested" }
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
      <PageHeader title="Contacts" subtitle={`${contacts.length} people`}>
        <ContactImportDialog onImported={load} />
        <ContactDialog companies={companies} onCreated={load} />
      </PageHeader>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

      <Paper variant="outlined" sx={{ p: 1.5, borderColor: "divider", mb: 1.5 }}>
        <Stack spacing={1.2}>
          <TextField
            fullWidth
            placeholder="Search contacts..."
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
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            {visibleStatuses.map((item) => (
              <Chip
                key={item.value}
                label={item.label}
                color={status === item.value ? "primary" : "default"}
                variant={status === item.value ? "filled" : "outlined"}
                onClick={() => setStatus(item.value)}
              />
            ))}
          </Stack>
        </Stack>
      </Paper>

      <Box className="table-wrap">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 64 }}>Sr.</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Company</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Relevance</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last interaction</TableCell>
              <TableCell>Next action</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {contacts.map((contact, index) => (
              <TableRow key={contact.id} hover>
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  <Typography sx={{ fontWeight: 740 }}>{contact.name}</Typography>
                  <Typography color="text.secondary" sx={{ fontSize: "0.8rem" }}>
                    {contact.linkedinUrl ? "LinkedIn profile saved" : "LinkedIn profile pending"}
                  </Typography>
                </TableCell>
                <TableCell>{contact.company?.name || "Unknown"}</TableCell>
                <TableCell>{contact.role}</TableCell>
                <TableCell>{contact.email || "Not provided"}</TableCell>
                <TableCell>
                  <span className="score-pill">{contact.relevanceScore ? `${contact.relevanceScore}%` : "New"}</span>
                </TableCell>
                <TableCell>
                  <StatusChip status={contact.status} />
                </TableCell>
                <TableCell>{formatDate(contact.lastInteractionAt)}</TableCell>
                <TableCell>{contact.nextAction || labelStatus(contact.status)}</TableCell>
                <TableCell align="right">
                  <Button component={Link} to={`/contacts/${contact.id}`} variant="outlined">
                    Open
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!contacts.length ? (
              <TableRow>
                <TableCell colSpan={10}>
                  <Box sx={{ py: 5, textAlign: "center" }}>
                    <Typography sx={{ fontWeight: 720 }}>No contacts yet.</Typography>
                    <Typography color="text.secondary" sx={{ mt: 0.4 }}>
                      Add your first HR or recruiter to start building your networking pipeline.
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
