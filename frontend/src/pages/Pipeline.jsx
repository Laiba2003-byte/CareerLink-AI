import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Typography
} from "@mui/material";
import PageHeader from "../components/PageHeader.jsx";
import StatusChip from "../components/StatusChip.jsx";
import { api } from "../services/api.js";
import { labelStatus } from "../utils/status.js";

const columns = [
  { status: "HR_IDENTIFIED", label: "HR Identified" },
  { status: "HR_APPROVED", label: "Approved" },
  { status: "CONNECTION_READY", label: "Request Ready" },
  { status: "CONNECTION_REQUESTED", label: "Requested" },
  { status: "CONNECTED", label: "Connected" },
  { status: "FOLLOW_UP_READY", label: "Follow-up" },
  { status: "RESPONDED", label: "Responded" },
  { status: "INTERESTED", label: "Interested" }
];

const filters = [
  { value: "all", label: "All" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "email", label: "Email" },
  { value: "high", label: "High priority" }
];

export default function Pipeline() {
  const [contacts, setContacts] = useState([]);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();
  const focusedStatus = searchParams.get("status");

  useEffect(() => {
    api
      .get("/contacts")
      .then((response) => {
        setContacts(response.data);
        setError("");
      })
      .catch((err) => setError(err.message));
  }, []);

  const visibleContacts = useMemo(() => {
    if (filter === "high") return contacts.filter((contact) => Number(contact.priority || 0) >= 85);
    if (filter === "email") return [];
    return contacts;
  }, [contacts, filter]);

  const grouped = useMemo(() => {
    return columns.reduce((acc, column) => {
      acc[column.status] = visibleContacts
        .filter((contact) => contact.status === column.status)
        .sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0));
      return acc;
    }, {});
  }, [visibleContacts]);

  return (
    <>
      <PageHeader title="Networking pipeline" subtitle="Review every relationship by stage and next action." />

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

      <Paper variant="outlined" sx={{ p: 1.3, borderColor: "divider", mb: 1.5 }}>
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
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
      </Paper>

      <Box sx={{ overflowX: "auto", pb: 1 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: `repeat(${columns.length}, minmax(230px, 1fr))`,
            gap: 1.2,
            minWidth: 1840
          }}
        >
          {columns.map((column) => {
            const items = grouped[column.status] || [];
            const focused = focusedStatus === column.status;

            return (
              <Box
                key={column.status}
                sx={{
                  border: "1px solid",
                  borderColor: focused ? "#b9c8dc" : "divider",
                  bgcolor: focused ? "#f4f7fb" : "#fbfaf8",
                  borderRadius: 1,
                  minHeight: 520
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 1.2, py: 1 }}>
                  <Typography sx={{ fontWeight: 740 }}>{column.label}</Typography>
                  <Typography color="text.secondary" sx={{ fontSize: "0.8rem", fontWeight: 720 }}>
                    {items.length}
                  </Typography>
                </Stack>
                <hr className="muted-rule" />
                <Stack spacing={0.8} sx={{ p: 0.9 }}>
                  {items.map((contact) => (
                    <Paper
                      key={contact.id}
                      component={Link}
                      to={`/contacts/${contact.id}`}
                      variant="outlined"
                      sx={{
                        display: "block",
                        borderColor: "#e1ded8",
                        p: 1.1,
                        bgcolor: "#fff",
                        transition: "border-color 120ms ease, background-color 120ms ease",
                        "&:hover": {
                          borderColor: "#c9c4ba",
                          bgcolor: "#fdfcfb"
                        }
                      }}
                    >
                      <Stack spacing={0.75}>
                        <Box>
                          <Typography sx={{ fontWeight: 740 }}>{contact.name}</Typography>
                          <Typography color="text.secondary" sx={{ fontSize: "0.78rem" }}>
                            {contact.company?.name || "Unknown company"}
                          </Typography>
                        </Box>
                        <Typography color="text.secondary" sx={{ fontSize: "0.8rem" }}>
                          {contact.role}
                        </Typography>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <span className="score-pill">{contact.relevanceScore ? `${contact.relevanceScore}%` : "New"}</span>
                          <StatusChip status={contact.status} />
                        </Stack>
                        <Typography color="text.secondary" sx={{ fontSize: "0.78rem" }}>
                          Next: {contact.nextAction || labelStatus(contact.status)}
                        </Typography>
                      </Stack>
                    </Paper>
                  ))}
                  {!items.length ? (
                    <Box sx={{ px: 0.6, py: 2 }}>
                      <Typography color="text.secondary" sx={{ fontSize: "0.82rem" }}>
                        No contacts in this stage.
                      </Typography>
                    </Box>
                  ) : null}
                </Stack>
              </Box>
            );
          })}
        </Box>
      </Box>

      {filter === "email" ? (
        <Box sx={{ mt: 1.5 }}>
          <Typography color="text.secondary">
            Email outreach stages will appear here after the email workflow is added.
          </Typography>
        </Box>
      ) : null}
    </>
  );
}
