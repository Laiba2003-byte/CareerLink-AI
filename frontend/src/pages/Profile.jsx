import { useEffect, useState } from "react";
import { Alert, Button, Paper, Stack, TextField } from "@mui/material";
import { Save } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import { api } from "../services/api.js";

const fields = [
  ["name", "Name", false],
  ["email", "Email", false],
  ["bio", "About me", true],
  ["experience", "Experience", true],
  ["skills", "Skills", true],
  ["targetRoles", "Target roles", true],
  ["targetLocations", "Target locations", true],
  ["projects", "Projects", true],
  ["preferredIndustries", "Preferred industries", true]
];

function toForm(profile) {
  const next = {};
  for (const [key] of fields) {
    next[key] = Array.isArray(profile?.[key]) ? profile[key].join("\n") : profile?.[key] || "";
  }
  return next;
}

export default function Profile() {
  const [form, setForm] = useState(toForm({}));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/profile")
      .then((response) => setForm(toForm(response.data)))
      .catch((err) => setError(err.message));
  }, []);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function save(event) {
    event.preventDefault();
    setError("");
    setSaved(false);
    try {
      await api.put("/profile", form);
      setSaved(true);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <PageHeader title="Profile" eyebrow="AI context" />
      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      {saved ? <Alert severity="success" sx={{ mb: 2 }}>Profile saved.</Alert> : null}

      <Paper variant="outlined" sx={{ p: 2.5, borderColor: "#dde7e3", maxWidth: 900 }}>
        <form onSubmit={save}>
          <Stack spacing={2}>
            {fields.map(([key, label, multiline]) => (
              <TextField
                key={key}
                label={label}
                value={form[key]}
                onChange={(event) => update(key, event.target.value)}
                multiline={multiline}
                minRows={multiline ? 3 : undefined}
                fullWidth
              />
            ))}
            <Button type="submit" variant="contained" startIcon={<Save size={18} />} sx={{ alignSelf: "flex-start" }}>
              Save Profile
            </Button>
          </Stack>
        </form>
      </Paper>
    </>
  );
}
