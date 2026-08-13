import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, Chip, Divider, Paper, Stack, TextField, Typography } from "@mui/material";
import { Save } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import { api } from "../services/api.js";

const fields = [
  ["name", "Name", false],
  ["email", "Email", false],
  ["bio", "About", true],
  ["experience", "Experience", true],
  ["skills", "Skills", true],
  ["targetRoles", "Target roles", true],
  ["targetLocations", "Target locations", true],
  ["projects", "Projects", true],
  ["preferredIndustries", "Preferred industries", true]
];

const sections = [
  {
    title: "About",
    description: "Basic identity and profile context used across outreach.",
    fields: ["name", "email", "bio"]
  },
  {
    title: "Experience",
    description: "Summarize your recent work, strengths, and relevant background.",
    fields: ["experience", "projects"]
  },
  {
    title: "Targets",
    description: "Tell the system which roles, locations, and industries matter.",
    fields: ["targetRoles", "targetLocations", "preferredIndustries", "skills"]
  }
];

function toForm(profile) {
  const next = {};
  for (const [key] of fields) {
    next[key] = Array.isArray(profile?.[key]) ? profile[key].join("\n") : profile?.[key] || "";
  }
  return next;
}

function splitPreview(value) {
  return String(value || "")
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function TagPreview({ value }) {
  const tags = useMemo(() => splitPreview(value), [value]);
  if (!tags.length) return null;

  return (
    <Stack direction="row" spacing={0.7} flexWrap="wrap" useFlexGap sx={{ mt: 0.8 }}>
      {tags.map((tag) => (
        <Chip key={tag} label={tag} variant="outlined" />
      ))}
    </Stack>
  );
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
      <PageHeader title="My career profile" subtitle="Structured context for company matching, outreach, and next actions." />
      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      {saved ? <Alert severity="success" sx={{ mb: 2 }}>Profile saved.</Alert> : null}

      <form onSubmit={save}>
        <Paper variant="outlined" sx={{ borderColor: "divider", maxWidth: 980 }}>
          {sections.map((section, index) => (
            <Box key={section.title}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "240px 1fr" },
                  gap: 2.5,
                  p: 2.2
                }}
              >
                <Box>
                  <Typography variant="h2">{section.title}</Typography>
                  <Typography color="text.secondary" sx={{ mt: 0.45 }}>
                    {section.description}
                  </Typography>
                </Box>

                <Stack spacing={1.4}>
                  {section.fields.map((key) => {
                    const config = fields.find(([field]) => field === key);
                    const label = config?.[1] || key;
                    const multiline = config?.[2] || false;
                    const isTagField = ["skills", "targetRoles", "targetLocations", "projects", "preferredIndustries"].includes(key);

                    return (
                      <Box key={key}>
                        <TextField
                          label={label}
                          value={form[key]}
                          onChange={(event) => update(key, event.target.value)}
                          multiline={multiline}
                          minRows={multiline ? 3 : undefined}
                          fullWidth
                        />
                        {isTagField ? <TagPreview value={form[key]} /> : null}
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
              {index < sections.length - 1 ? <Divider /> : null}
            </Box>
          ))}
        </Paper>

        <Button type="submit" variant="contained" startIcon={<Save size={16} />} sx={{ mt: 1.5 }}>
          Save Profile
        </Button>
      </form>
    </>
  );
}
