import { Box, Paper, Stack, Typography } from "@mui/material";
import { formatDate } from "../utils/format.js";

export default function Timeline({ interactions = [] }) {
  return (
    <Paper variant="outlined" sx={{ borderColor: "divider", p: 2.2 }}>
      <Stack spacing={1.6}>
        <Box>
          <Typography variant="h2">Relationship timeline</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.3 }}>
            Every request, reply, note, and status change in order.
          </Typography>
        </Box>

        {interactions.length ? (
          <Stack spacing={0}>
            {interactions.map((interaction, index) => (
              <Box key={interaction.id} sx={{ display: "grid", gridTemplateColumns: "38px 92px 1fr", gap: 1.5 }}>
                <span className="serial-pill">{index + 1}</span>
                <Typography color="text.secondary" sx={{ fontSize: "0.8rem", pt: 0.1 }}>
                  {formatDate(interaction.createdAt)}
                </Typography>
                <Box sx={{ borderLeft: "1px solid #e6e2db", pl: 1.5, pb: index === interactions.length - 1 ? 0 : 2.1 }}>
                  <Typography sx={{ fontWeight: 740 }}>{interaction.type.replaceAll("_", " ")}</Typography>
                  {interaction.content ? (
                    <Typography color="text.secondary" sx={{ mt: 0.45, whiteSpace: "pre-wrap" }}>
                      {interaction.content}
                    </Typography>
                  ) : null}
                </Box>
              </Box>
            ))}
          </Stack>
        ) : (
          <Box sx={{ py: 3 }}>
            <Typography sx={{ fontWeight: 720 }}>No interactions recorded yet.</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.4 }}>
              Timeline entries will appear when you send requests, mark accepts, add notes, or record responses.
            </Typography>
          </Box>
        )}
      </Stack>
    </Paper>
  );
}
