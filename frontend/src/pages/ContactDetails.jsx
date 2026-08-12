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
import { CheckCircle2, ExternalLink, RefreshCw, Send, Sparkles } from "lucide-react";
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
      <PageHeader title={contact?.name || "Contact"} eyebrow={contact?.company?.name || "Contact details"}>
        <Button component="a" href={linkedinUrl} target="_blank" rel="noreferrer" startIcon={<ExternalLink size={18} />}>
          Open LinkedIn
        </Button>
      </PageHeader>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

      {contact ? (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "0.82fr 1.18fr" }, gap: 2.5 }}>
          <Stack spacing={2.5}>
            <Paper variant="outlined" sx={{ p: 2.4, borderColor: "#dde7e3" }}>
              <Stack spacing={1.7}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography className="section-title">Status</Typography>
                  <StatusChip status={contact.status} />
                </Stack>
                <Box>
                  <Typography variant="h2">{contact.role}</Typography>
                  <Typography color="text.secondary">{contact.company?.name}</Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography className="section-title" sx={{ mb: 0.8 }}>
                    Why contact?
                  </Typography>
                  <Typography>{contact.whyContact || contact.relevanceReason || "Run contact analysis to evaluate this person."}</Typography>
                </Box>
                <Box>
                  <Typography className="section-title" sx={{ mb: 0.8 }}>
                    Outreach angle
                  </Typography>
                  <Typography>{contact.recommendedOutreachAngle || "No outreach strategy generated yet."}</Typography>
                </Box>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Button
                    variant="outlined"
                    startIcon={<Sparkles size={18} />}
                    disabled={busy === "analyze"}
                    onClick={() => runAction("analyze", () => api.post(`/contacts/${id}/analyze`))}
                  >
                    Analyze Contact
                  </Button>
                  <ConfirmButton
                    variant="contained"
                    title="Approve HR contact"
                    description="This moves the contact into the approved workflow for connection note generation."
                    disabled={contact.status !== "HR_IDENTIFIED"}
                    onConfirm={() => runAction("approve", () => transition("HR_APPROVED"))}
                    startIcon={<CheckCircle2 size={18} />}
                  >
                    Approve HR
                  </ConfirmButton>
                </Stack>
              </Stack>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2.4, borderColor: "#dde7e3" }}>
              <Stack spacing={1.4}>
                <Typography className="section-title">AI Recommendation</Typography>
                <Typography variant="h2">{recommendation?.label || contact.nextAction || "Review next action"}</Typography>
                <Typography color="text.secondary">{recommendation?.reason || `Priority ${contact.priority || 50}`}</Typography>
                <Typography fontWeight={850}>Next action date: {formatDate(contact.nextActionDate)}</Typography>
              </Stack>
            </Paper>
          </Stack>

          <Stack spacing={2.5}>
            <MessagePanel
              title="Connection message"
              value={connectionNote}
              onChange={setConnectionNote}
              placeholder="Generate or draft a concise LinkedIn connection note."
            >
              <Button
                variant="outlined"
                startIcon={<RefreshCw size={18} />}
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
                Save Edits
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
                startIcon={<CheckCircle2 size={18} />}
              >
                Approve
              </ConfirmButton>
              <ConfirmButton
                title="Mark request sent"
                description="Confirm only after you manually sent the LinkedIn connection request."
                disabled={!canSendConnection}
                onConfirm={() => runAction("sent", () => transition("CONNECTION_REQUESTED"))}
                startIcon={<Send size={18} />}
              >
                Mark Sent
              </ConfirmButton>
            </MessagePanel>

            <Paper variant="outlined" sx={{ p: 2.2, borderColor: "#dde7e3" }}>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <ConfirmButton
                  title="Mark connection accepted"
                  description="Confirm only after this person accepted your LinkedIn request."
                  disabled={!canMarkAccepted}
                  onConfirm={() => runAction("accepted", () => transition("FOLLOW_UP_READY"))}
                  startIcon={<CheckCircle2 size={18} />}
                >
                  Mark Accepted
                </ConfirmButton>
              </Stack>
            </Paper>

            <MessagePanel
              title="Follow-up message"
              value={followUpMessage}
              onChange={setFollowUpMessage}
              placeholder="Generate a follow-up after the contact accepts."
            >
              <Button
                variant="outlined"
                startIcon={<RefreshCw size={18} />}
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
                Save Edits
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
                startIcon={<Send size={18} />}
              >
                Mark Sent
              </ConfirmButton>
            </MessagePanel>

            <Paper variant="outlined" sx={{ p: 2.2, borderColor: "#dde7e3" }}>
              <Stack spacing={1.5}>
                <Typography className="section-title">Response analysis</Typography>
                <TextField
                  value={responseText}
                  onChange={(event) => setResponseText(event.target.value)}
                  placeholder="Paste the HR or recruiter response"
                  multiline
                  minRows={4}
                  fullWidth
                />
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
                  startIcon={<Sparkles size={18} />}
                >
                  Analyze
                </ConfirmButton>
                {analysis ? (
                  <Alert severity={analysis.opportunityLevel === "HIGH" ? "success" : "info"}>
                    {analysis.recommendedAction}: {analysis.reason}
                  </Alert>
                ) : null}
              </Stack>
            </Paper>

            <Timeline interactions={contact.interactions || []} />
          </Stack>
        </Box>
      ) : null}
    </>
  );
}
