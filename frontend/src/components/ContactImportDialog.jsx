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

export default function ContactImportDialog({ companyId = "", onImported }) {
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [summary, setSummary] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function formData(dryRun, nextFile = file) {
    const data = new FormData();
    data.append("file", nextFile);
    data.append("dryRun", String(dryRun));
    if (companyId) data.append("companyId", companyId);
    return data;
  }

  async function preview(nextFile) {
    const selected = nextFile || file;
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      const response = await api.post("/contacts/import", formData(true, selected));
      setSummary(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function importContacts() {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const response = await api.post("/contacts/import", formData(false));
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
      <Button variant="outlined" startIcon={<Upload size={16} />} onClick={() => setOpen(true)}>
        Import HR CSV
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Import HR contacts</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {error ? <Alert severity="error">{error}</Alert> : null}
            <Alert severity="info">
              CSV columns can include company, name, role, email, linkedinUrl, and notes. Existing contacts are skipped.
            </Alert>
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
                Choose HR CSV
              </Button>
              <Typography color="text.secondary">{file?.name || "No file selected"}</Typography>
            </Stack>

            {summary ? (
              <Stack spacing={1.2}>
                <Alert severity="success">
                  Found {summary.totalRows} rows, {summary.importableCount} importable, {summary.duplicateCount} duplicates.
                </Alert>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Company</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Email</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(summary.preview || []).map((row) => (
                      <TableRow key={`${row.row}-${row.email || row.name}`}>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>{row.companyName}</TableCell>
                        <TableCell>{row.role}</TableCell>
                        <TableCell>{row.email || "Not provided"}</TableCell>
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
          <Button variant="contained" onClick={importContacts} disabled={!summary?.importableCount || busy}>
            Import Contacts
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
