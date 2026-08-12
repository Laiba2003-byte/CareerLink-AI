import { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField
} from "@mui/material";
import { Plus } from "lucide-react";
import { api } from "../services/api.js";

const initial = {
  name: "",
  website: "",
  linkedinUrl: "",
  industry: "",
  location: "",
  description: ""
};

export default function CompanyDialog({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await api.post("/companies", form);
      setForm(initial);
      setOpen(false);
      onCreated?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => setOpen(true)}>
        Add Company
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={submit}>
          <DialogTitle>Add company</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField label="Company name" value={form.name} onChange={(e) => update("name", e.target.value)} required />
              <TextField label="Website" value={form.website} onChange={(e) => update("website", e.target.value)} />
              <TextField label="LinkedIn URL" value={form.linkedinUrl} onChange={(e) => update("linkedinUrl", e.target.value)} />
              <TextField label="Industry" value={form.industry} onChange={(e) => update("industry", e.target.value)} />
              <TextField label="Location" value={form.location} onChange={(e) => update("location", e.target.value)} />
              <TextField
                label="Description"
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                multiline
                minRows={3}
              />
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
