import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Divider,
  Paper,
  Stack,
  Typography
} from "@mui/material";
import { ArrowRight } from "lucide-react";
import ImportDialog from "../components/ImportDialog.jsx";
import MetricCard from "../components/MetricCard.jsx";
import StatusChip from "../components/StatusChip.jsx";
import { api } from "../services/api.js";
import { formatDate } from "../utils/format.js";
import { labelStatus } from "../utils/status.js";

function priorityLabel(priority = 50) {
  if (priority >= 85) return "High priority";
  if (priority >= 65) return "Medium";
  return "Normal";
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [error, setError] = useState("");

  async function load() {
    try {
      const [dashboardResponse, profileResponse, contactsResponse] = await Promise.all([
        api.get("/dashboard"),
        api.get("/profile"),
        api.get("/contacts")
      ]);
      setData(dashboardResponse.data);
      setProfile(profileResponse.data);
      setContacts(contactsResponse.data);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const metrics = data?.metrics || {};
  const actionContacts = useMemo(() => {
    const ids = new Set((data?.todaysActions || []).map((item) => item.id));
    return contacts
      .filter((contact) => ids.has(contact.id))
      .sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0))
      .slice(0, 6);
  }, [contacts, data]);

  return (
    <>
      <Paper
        variant="outlined"
        sx={{
          borderColor: "#d9ddff",
          bgcolor: "#eef2ff",
          p: { xs: 2, md: 2.7 },
          mb: 2.2,
          overflow: "hidden",
          position: "relative"
        }}
      >
        <Box
          sx={{
            position: "absolute",
            right: -70,
            top: -80,
            width: 220,
            height: 220,
            borderRadius: "50%",
            bgcolor: "rgba(8, 145, 178, 0.15)"
          }}
        />
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          sx={{ position: "relative" }}
        >
          <Box>
            <Typography className="section-title" sx={{ color: "#3730a3", mb: 0.7 }}>
              Career command center
            </Typography>
            <Typography variant="h1" sx={{ fontSize: { xs: "1.8rem", md: "2.2rem" } }}>
              Good morning, {profile?.name?.trim() || "Laiba"}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.7 }}>
              Keep companies, HR discovery, and outreach moving without wasting AI calls.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button component={Link} to="/companies" variant="contained" endIcon={<ArrowRight size={16} />}>
              Find HRs
            </Button>
            <ImportDialog onImported={load} />
          </Stack>
        </Stack>
      </Paper>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

      <Box sx={{ mb: 2.5 }}>
        <Box
          sx={{
            display: "grid",
            gap: 1.4,
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              sm: "repeat(3, minmax(0, 1fr))",
              lg: "repeat(6, minmax(0, 1fr))"
            }
          }}
        >
          <MetricCard label="Companies" value={metrics.companies} accent="#4f46e5" helper="Tracked targets" />
          <MetricCard label="Potential HRs" value={metrics.contacts} accent="#0891b2" helper="Approved people" />
          <MetricCard label="Candidates" value={metrics.pendingCandidates} accent="#f97316" helper="Need review" />
          <MetricCard label="Connections" value={metrics.connected} accent="#16a34a" helper="Active network" />
          <MetricCard label="Opportunities" value={metrics.opportunities} accent="#e11d48" helper="Hot signals" />
          <MetricCard label="Pending" value={metrics.pendingRequests} accent="#2563eb" helper="Requests sent" />
        </Box>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "1.35fr 0.65fr" }, gap: 2.5 }}>
        <Box>
          <Stack direction="row" alignItems="flex-end" justifyContent="space-between" sx={{ mb: 1.2 }}>
            <Box>
              <Typography variant="h2">Today's actions</Typography>
              <Typography color="text.secondary" sx={{ mt: 0.25 }}>
                People and opportunities that need your attention.
              </Typography>
            </Box>
          </Stack>

          <Paper variant="outlined" sx={{ borderColor: "divider" }}>
            {actionContacts.length ? (
              actionContacts.map((contact, index) => (
                <Box key={contact.id}>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", md: "1fr 180px 90px" },
                      gap: 2,
                      alignItems: "center",
                      px: 2,
                      py: 1.6,
                      "&:hover": { bgcolor: "#fbfaf8" }
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 760 }}>{contact.name}</Typography>
                      <Typography color="text.secondary" sx={{ fontSize: "0.82rem" }}>
                        {contact.role} - {contact.company?.name || "Unknown company"}
                      </Typography>
                      <Typography sx={{ mt: 1 }}>{contact.nextAction || "Review next step"}</Typography>
                      <Typography color="text.secondary" sx={{ fontSize: "0.78rem" }}>
                        Last interaction: {formatDate(contact.lastInteractionAt)}
                      </Typography>
                    </Box>
                    <Stack spacing={0.7} alignItems={{ xs: "flex-start", md: "flex-end" }}>
                      <span className="priority-pill">{priorityLabel(contact.priority)}</span>
                      <StatusChip status={contact.status} />
                    </Stack>
                    <Button component={Link} to={`/contacts/${contact.id}`} variant="outlined">
                      Review
                    </Button>
                  </Box>
                  {index < actionContacts.length - 1 ? <Divider /> : null}
                </Box>
              ))
            ) : (
              <Box sx={{ p: 2.5 }}>
                <Typography sx={{ fontWeight: 720 }}>No actions waiting.</Typography>
                <Typography color="text.secondary" sx={{ mt: 0.4 }}>
                  Add contacts or import LinkedIn companies to start building your networking pipeline.
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>

        <Box>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.2 }}>
            <Typography variant="h2">Networking pipeline</Typography>
            <Button component={Link} to="/pipeline" variant="text">
              View all
            </Button>
          </Stack>
          <Paper variant="outlined" sx={{ borderColor: "divider", p: 1 }}>
            <Box sx={{ display: "grid", gap: 0.5 }}>
              {(data?.pipeline || []).map((item) => (
                <Button
                  key={item.status}
                  component={Link}
                  to={`/pipeline?status=${item.status}`}
                  variant="text"
                  sx={{
                    justifyContent: "space-between",
                    color: "text.primary",
                    px: 1,
                    py: 0.8,
                    borderRadius: 1
                  }}
                >
                  <span>{labelStatus(item.status)}</span>
                  <span>{item.count}</span>
                </Button>
              ))}
            </Box>
          </Paper>
        </Box>
      </Box>
    </>
  );
}
