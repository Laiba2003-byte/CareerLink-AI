import { useMemo, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField
} from "@mui/material";
import { UserPlus } from "lucide-react";
import { api } from "../services/api.js";

export default function ContactDialog({ companies = [], defaultCompanyId = "", onCreated }) {
  const firstCompanyId = useMemo(() => defaultCompanyId || companies[0]?.id || "", [companies, defaultCompanyId]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    companyId: firstCompanyId,
    name: "",
    role: "",
    linkedinUrl: ""
  });

  function openDialog() {
    setForm({ companyId: firstCompanyId, name: "", role: "", linkedinUrl: "" });
    setOpen(true);
  }

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await api.post("/contacts", form);
      setOpen(false);
      onCreated?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button variant="contained" startIcon={<UserPlus size={18} />} onClick={openDialog} disabled={!companies.length}>
        Add Contact
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={submit}>
          <DialogTitle>Add HR or recruiter</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                select
                label="Company"
                value={form.companyId}
                onChange={(e) => update("companyId", e.target.value)}
                required
              >
                {companies.map((company) => (
                  <MenuItem key={company.id} value={company.id}>
                    {company.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField label="Name" value={form.name} onChange={(e) => update("name", e.target.value)} required />
              <TextField label="Role" value={form.role} onChange={(e) => update("role", e.target.value)} required />
              <TextField label="LinkedIn URL" value={form.linkedinUrl} onChange={(e) => update("linkedinUrl", e.target.value)} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={busy}>
              Save
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}
