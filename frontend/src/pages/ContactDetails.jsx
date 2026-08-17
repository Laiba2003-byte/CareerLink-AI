import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Divider,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { CheckCircle2, ExternalLink, RefreshCw, Search, Send } from "lucide-react";
import ConfirmButton from "../components/ConfirmButton.jsx";
import MessagePanel from "../components/MessagePanel.jsx";
import PageHeader from "../components/PageHeader.jsx";
import StatusChip from "../components/StatusChip.jsx";
import Timeline from "../components/Timeline.jsx";
import { api } from "../services/api.js";
import { formatDate } from "../utils/format.js";

function linkedinSearchUrl(contact) {
  if (contact?.linkedinUrl) return contact.linkedinUrl;
  const query = encodeURIComponent(`${contact?.name || ""} ${contact?.company?.name || ""} LinkedIn`);
  return `https://www.linkedin.com/search/results/people/?keywords=${query}`;
}

export default function ContactDetails() {
  const { id } = useParams();
  const [contact, setContact] = useState(null);
  const [connectionNote, setConnectionNote] = useState("");
  const [followUpMessage, setFollowUpMessage] = useState("");
  const [responseText, setResponseText] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const canSendConnection = contact?.status === "CONNECTION_READY";
  const canMarkAccepted = contact?.status === "CONNECTION_REQUESTED";
  const canFollowUp = ["CONNECTED", "FOLLOW_UP_READY", "MESSAGE_SENT"].includes(contact?.status);

  const linkedinUrl = useMemo(() => linkedinSearchUrl(contact), [contact]);

  async function load() {
    try {
      const [contactResponse, recommendationResponse] = await Promise.all([
        api.get(`/contacts/${id}`),
        api.get(`/contacts/${id}/next-action`).catch(() => ({ data: null }))
      ]);
      setContact(contactResponse.data);
      setConnectionNote(contactResponse.data.connectionNote || "");
      setFollowUpMessage(contactResponse.data.followUpMessage || "");
      setRecommendation(recommendationResponse.data);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function runAction(name, action) {
    setBusy(name);
    setError("");
    try {
      await action();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  async function patchContact(fields) {
    await api.patch(`/contacts/${id}`, fields);
  }

  async function transition(status) {
    await api.patch(`/contacts/${id}/status`, { status, confirm: true });
  }

  if (!contact && !error) {
    return <LinearProgress />;
  }

  return (
    <>
      <PageHeader
        title={contact?.name || "Contact"}
        subtitle={`${contact?.role || ""} - ${contact?.company?.name || "Unknown company"}`}
      >
        {contact ? <StatusChip status={contact.status} /> : null}
        <Button component="a" href={linkedinUrl} target="_blank" rel="noreferrer" variant="outlined" startIcon={<ExternalLink size={16} />}>
          Open LinkedIn
        </Button>
      </PageHeader>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

      {contact ? (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "1.3fr 0.7fr" }, gap: 2.5 }}>
          <Stack spacing={2}>
            <Timeline interactions={contact.interactions || []} />

            <Paper variant="outlined" sx={{ borderColor: "divider", p: 2 }}>
              <Stack spacing={1.3}>
                <Typography variant="h2">Record recruiter response</Typography>
                <TextField
                  value={responseText}
                  onChange={(event) => setResponseText(event.target.value)}
                  placeholder="Paste the HR or recruiter response"
                  multiline
                  minRows={4}
                  fullWidth
                />
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <ConfirmButton
                    title="Record and analyze response"
                    description="This saves the response to the timeline and updates the recommended next action."
                    disabled={!responseText.trim()}
                    onConfirm={() =>
                      runAction("response", async () => {
                        const response = await api.post(`/contacts/${id}/analyze-response`, {
                          content: responseText,
                          confirm: true
                        });
                        setAnalysis(response.data.analysis);
                        setResponseText("");
                      })
                    }
                  >
                    Analyze response
                  </ConfirmButton>
                  {analysis ? (
                    <Typography color="text.secondary" sx={{ fontSize: "0.82rem" }}>
                      {analysis.recommendedAction}: {analysis.reason}
                    </Typography>
                  ) : null}
                </Stack>
              </Stack>
            </Paper>
          </Stack>

          <Stack spacing={1.5}>
            <Paper variant="outlined" sx={{ borderColor: "divider", p: 1.7 }}>
              <Stack spacing={1.2}>
                <Typography className="section-title">Next action</Typography>
                <Typography variant="h2">{recommendation?.label || contact.nextAction || "Review next step"}</Typography>
                <span className="priority-pill">{contact.priority >= 85 ? "High priority" : "Normal priority"}</span>
                <Typography color="text.secondary">
                  {recommendation?.reason ||
                    "Use the current relationship state, profile fit, and timeline before deciding what to do next."}
                </Typography>
                <Typography color="text.secondary" sx={{ fontSize: "0.8rem" }}>
                  Next action date: {formatDate(contact.nextActionDate)}
                </Typography>
              </Stack>
            </Paper>

            <Paper variant="outlined" sx={{ borderColor: "divider", p: 1.7 }}>
              <Stack spacing={1.1}>
                <Typography className="section-title">Contact</Typography>
                <Box>
                  <Typography sx={{ fontWeight: 740 }}>{contact.name}</Typography>
                  <Typography color="text.secondary">{contact.role}</Typography>
                  <Typography color="text.secondary">{contact.company?.name}</Typography>
                  {contact.email ? <Typography color="text.secondary">{contact.email}</Typography> : null}
                </Box>
                <Divider />
                <Stack direction="row" justifyContent="space-between">
                  <Typography color="text.secondary">Relevance</Typography>
                  <span className="score-pill">{contact.relevanceScore ? `${contact.relevanceScore}%` : "New"}</span>
                </Stack>
                <Box>
                  <Typography className="section-title" sx={{ mb: 0.6 }}>
                    Why contact?
                  </Typography>
                  <Typography color="text.secondary">
                    {contact.whyContact || contact.relevanceReason || "Run contact analysis to evaluate this person."}
                  </Typography>
                </Box>
                <Box>
                  <Typography className="section-title" sx={{ mb: 0.6 }}>
                    Outreach angle
                  </Typography>
                  <Typography color="text.secondary">
                    {contact.recommendedOutreachAngle || "No outreach strategy generated yet."}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                  <Button
                    variant="outlined"
                    startIcon={<Search size={16} />}
                    disabled={busy === "analyze"}
                    onClick={() => runAction("analyze", () => api.post(`/contacts/${id}/analyze`))}
                  >
                    Analyze
                  </Button>
                  <ConfirmButton
                    variant="contained"
                    title="Approve HR contact"
                    description="This moves the contact into the approved workflow for connection note generation."
                    disabled={contact.status !== "HR_IDENTIFIED"}
                    onConfirm={() => runAction("approve", () => transition("HR_APPROVED"))}
                    startIcon={<CheckCircle2 size={16} />}
                  >
                    Approve
                  </ConfirmButton>
                </Stack>
              </Stack>
            </Paper>

            <MessagePanel
              title="Connection request"
              context={`${contact.name} - ${contact.company?.name || "Unknown company"}`}
              value={connectionNote}
              onChange={setConnectionNote}
              placeholder="Generate or draft a concise LinkedIn connection note."
            >
              <Button
                variant="outlined"
                startIcon={<RefreshCw size={16} />}
                disabled={busy === "connection"}
                onClick={() => runAction("connection", () => api.post(`/contacts/${id}/generate-connection`))}
              >
                Regenerate
              </Button>
              <Button
                variant="outlined"
                disabled={busy === "save-note"}
                onClick={() => runAction("save-note", () => patchContact({ connectionNote }))}
              >
                Save
              </Button>
              <ConfirmButton
                title="Approve connection note"
                description="This marks the note ready for you to copy and manually send on LinkedIn."
                disabled={!connectionNote}
                onConfirm={() =>
                  runAction("approve-note", async () => {
                    await patchContact({ connectionNote });
                    await transition("CONNECTION_READY");
                  })
                }
              >
                Approve
              </ConfirmButton>
              <ConfirmButton
                title="Mark request sent"
                description="Confirm only after you manually sent the LinkedIn connection request."
                disabled={!canSendConnection}
                onConfirm={() => runAction("sent", () => transition("CONNECTION_REQUESTED"))}
                startIcon={<Send size={16} />}
              >
                Mark sent
              </ConfirmButton>
            </MessagePanel>

            <Paper variant="outlined" sx={{ borderColor: "divider", p: 1.7 }}>
              <ConfirmButton
                title="Mark connection accepted"
                description="Confirm only after this person accepted your LinkedIn request."
                disabled={!canMarkAccepted}
                onConfirm={() => runAction("accepted", () => transition("FOLLOW_UP_READY"))}
                startIcon={<CheckCircle2 size={16} />}
              >
                Mark accepted
              </ConfirmButton>
            </Paper>

            <MessagePanel
              title="Follow-up"
              context="Purposeful message after the contact accepts."
              value={followUpMessage}
              onChange={setFollowUpMessage}
              placeholder="Generate a follow-up after the contact accepts."
            >
              <Button
                variant="outlined"
                startIcon={<RefreshCw size={16} />}
                disabled={!canFollowUp || busy === "followup"}
                onClick={() => runAction("followup", () => api.post(`/contacts/${id}/generate-followup`))}
              >
                Regenerate
              </Button>
              <Button
                variant="outlined"
                disabled={busy === "save-followup"}
                onClick={() => runAction("save-followup", () => patchContact({ followUpMessage }))}
              >
                Save
              </Button>
              <ConfirmButton
                title="Mark follow-up sent"
                description="Confirm only after you manually sent this message on LinkedIn."
                disabled={!followUpMessage}
                onConfirm={() =>
                  runAction("message-sent", async () => {
                    await patchContact({ followUpMessage });
                    await transition("MESSAGE_SENT");
                  })
                }
                startIcon={<Send size={16} />}
              >
                Mark sent
              </ConfirmButton>
            </MessagePanel>
          </Stack>
        </Box>
      ) : null}
    </>
  );
}
