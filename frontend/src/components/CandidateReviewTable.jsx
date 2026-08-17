import {
  Box,
  Button,
  Checkbox,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from "@mui/material";
import { Check, X } from "lucide-react";
import { useMemo, useState } from "react";
import { api } from "../services/api.js";

export default function CandidateReviewTable({ candidates = [], onChanged }) {
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState("");

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  function toggle(id) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  async function approve(id) {
    setBusy(id);
    try {
      await api.post(`/contact-candidates/${id}/approve`);
      onChanged?.();
    } finally {
      setBusy("");
    }
  }

  async function reject(id) {
    setBusy(id);
    try {
      await api.patch(`/contact-candidates/${id}`, { status: "REJECTED" });
      onChanged?.();
    } finally {
      setBusy("");
    }
  }

  async function approveSelected() {
    setBusy("bulk");
    try {
      await api.post("/contact-candidates/approve-bulk", { ids: selected });
      setSelected([]);
      onChanged?.();
    } finally {
      setBusy("");
    }
  }

  if (!candidates.length) {
    return (
      <Box sx={{ py: 4, textAlign: "center" }}>
        <Typography sx={{ fontWeight: 720 }}>No pending HR candidates.</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.4 }}>
          Run HR discovery or import HR contacts to build this company’s outreach list.
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={1}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography color="text.secondary" sx={{ fontSize: "0.82rem" }}>
          {candidates.length} pending candidates
        </Typography>
        <Button variant="contained" disabled={!selected.length || busy === "bulk"} onClick={approveSelected}>
          Approve selected
        </Button>
      </Stack>
      <Box className="table-wrap">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" />
              <TableCell>Candidate</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Confidence</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {candidates.map((candidate) => (
              <TableRow key={candidate.id} hover>
                <TableCell padding="checkbox">
                  <Checkbox checked={selectedSet.has(candidate.id)} onChange={() => toggle(candidate.id)} />
                </TableCell>
                <TableCell>
                  <Typography sx={{ fontWeight: 740 }}>{candidate.name}</Typography>
                  <Typography color="text.secondary" sx={{ fontSize: "0.8rem" }}>
                    {candidate.role}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography>{candidate.email || "Email not found"}</Typography>
                  {candidate.linkedinUrl || candidate.sourceUrl ? (
                    <Typography
                      component="a"
                      href={candidate.linkedinUrl || candidate.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      color="primary"
                      sx={{ display: "block", fontSize: "0.8rem", mt: 0.2 }}
                    >
                      Source link
                    </Typography>
                  ) : null}
                </TableCell>
                <TableCell>
                  <span className="score-pill">{candidate.confidenceScore || 50}%</span>
                </TableCell>
                <TableCell sx={{ maxWidth: 320 }}>
                  <Typography color="text.secondary" sx={{ fontSize: "0.82rem" }}>
                    {candidate.reason || "Review before adding this contact."}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={0.75} justifyContent="flex-end">
                    <Button
                      variant="outlined"
                      startIcon={<Check size={15} />}
                      disabled={busy === candidate.id}
                      onClick={() => approve(candidate.id)}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="text"
                      color="error"
                      startIcon={<X size={15} />}
                      disabled={busy === candidate.id}
                      onClick={() => reject(candidate.id)}
                    >
                      Reject
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Stack>
  );
}
