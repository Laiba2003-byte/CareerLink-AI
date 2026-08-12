import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Box,
  LinearProgress,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Typography
} from "@mui/material";
import { Building2, CheckCircle2, Clock3, Flame, Send, UsersRound } from "lucide-react";
import MetricCard from "../components/MetricCard.jsx";
import PageHeader from "../components/PageHeader.jsx";
import StatusChip from "../components/StatusChip.jsx";
import { api } from "../services/api.js";
import { labelStatus } from "../utils/status.js";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/dashboard")
      .then((response) => setData(response.data))
      .catch((err) => setError(err.message));
  }, []);

  const maxPipeline = useMemo(() => {
    const counts = data?.pipeline?.map((item) => item.count) || [1];
    return Math.max(1, ...counts);
  }, [data]);

  const metrics = data?.metrics || {};

  return (
    <>
      <PageHeader title="Dashboard" eyebrow="CareerLink AI" />
      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          mb: 3
        }}
      >
        <MetricCard label="Companies" value={metrics.companies} icon={Building2} />
        <MetricCard label="High Priority" value={metrics.highPriority} icon={Flame} tone="#c97913" />
        <MetricCard label="HRs" value={metrics.contacts} icon={UsersRound} tone="#7c3aed" />
        <MetricCard label="Connected" value={metrics.connected} icon={CheckCircle2} tone="#138a43" />
        <MetricCard label="Opportunities" value={metrics.opportunities} icon={Send} tone="#b45309" />
        <MetricCard label="Pending" value={metrics.pendingRequests} icon={Clock3} tone="#2563eb" />
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.05fr 0.95fr" }, gap: 2.5 }}>
        <Paper variant="outlined" sx={{ p: 2.4, borderColor: "#dde7e3" }}>
          <Stack spacing={1.5}>
            <Typography variant="h2">Today's actions</Typography>
            {data?.todaysActions?.length ? (
              <List disablePadding>
                {data.todaysActions.map((item) => (
                  <ListItemButton
                    key={item.id}
                    component={Link}
                    to={`/contacts/${item.id}`}
                    sx={{ borderRadius: 1, px: 1.2 }}
                  >
                    <ListItemText
                      primary={item.label}
                      secondary={`Priority ${item.priority || 50}`}
                      primaryTypographyProps={{ fontWeight: 800 }}
                    />
                    <StatusChip status={item.status} />
                  </ListItemButton>
                ))}
              </List>
            ) : (
              <Typography color="text.secondary">No urgent actions. Import companies or add contacts to build the pipeline.</Typography>
            )}
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2.4, borderColor: "#dde7e3" }}>
          <Stack spacing={1.6}>
            <Typography variant="h2">Networking pipeline</Typography>
            {(data?.pipeline || []).map((item) => (
              <Box key={item.status}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.6 }}>
                  <Typography fontWeight={800}>{labelStatus(item.status)}</Typography>
                  <Typography color="text.secondary" fontWeight={800}>
                    {item.count}
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={(item.count / maxPipeline) * 100}
                  sx={{ height: 8, borderRadius: 1, bgcolor: "#e9eeec" }}
                />
              </Box>
            ))}
          </Stack>
        </Paper>
      </Box>
    </>
  );
}
