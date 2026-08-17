import { useRef, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from "@mui/material";
import { Upload } from "lucide-react";
import { api } from "../services/api.js";
import { formatDate } from "../utils/format.js";

export default function ImportDialog({ onImported }) {
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [summary, setSummary] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function formData(dryRun) {
    const data = new FormData();
    data.append("file", file);
    data.append("dryRun", String(dryRun));
    return data;
  }

  async function preview(nextFile) {
    const selected = nextFile || file;
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      const data = new FormData();
      data.append("file", selected);
      data.append("dryRun", "true");
      const response = await api.post("/companies/import", data);
      setSummary(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function importCompanies() {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const response = await api.post("/companies/import", formData(false));
      setSummary(response.data);
      onImported?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button variant="outlined" startIcon={<Upload size={18} />} onClick={() => setOpen(true)}>
        Import CSV
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Import company data</DialogTitle>
        <DialogContent>
          <Stack spacing={2.2} sx={{ pt: 1 }}>
            {error ? <Alert severity="error">{error}</Alert> : null}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                hidden
                onChange={(event) => {
                  const selected = event.target.files?.[0];
                  setFile(selected || null);
                  if (selected) preview(selected);
                }}
              />
              <Button variant="contained" onClick={() => inputRef.current?.click()} disabled={busy}>
                Choose company CSV
              </Button>
              <Typography color="text.secondary">{file?.name || "No file selected"}</Typography>
            </Stack>

            {summary ? (
              <Stack spacing={1.5}>
                <Alert severity="info">
                  Found {summary.totalRows} rows, {summary.importableCount} importable, {summary.duplicateCount} duplicates.
                </Alert>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: 64 }}>Sr.</TableCell>
                      <TableCell>Organization</TableCell>
                      <TableCell>Followed On</TableCell>
                      <TableCell>Website</TableCell>
                      <TableCell>Email</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(summary.preview || []).map((row, index) => (
                      <TableRow key={`${row.row}-${row.name}`}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>{formatDate(row.followedOn)}</TableCell>
                        <TableCell>{row.website || "Not provided"}</TableCell>
                        <TableCell>{row.email || row.careersEmail || "Not provided"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Stack>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
          <Button onClick={() => preview()} disabled={!file || busy}>
            Preview
          </Button>
          <Button variant="contained" onClick={importCompanies} disabled={!summary?.importableCount || busy}>
            Import Companies
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
