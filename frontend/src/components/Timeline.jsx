import { List, ListItem, ListItemText, Paper, Stack, Typography } from "@mui/material";
import { formatDate } from "../utils/format.js";

export default function Timeline({ interactions = [] }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.2, borderColor: "#dde7e3" }}>
      <Stack spacing={1}>
        <Typography className="section-title">Timeline</Typography>
        {interactions.length ? (
          <List dense disablePadding>
            {interactions.map((interaction) => (
              <ListItem key={interaction.id} disableGutters sx={{ alignItems: "flex-start" }}>
                <ListItemText
                  primary={`${formatDate(interaction.createdAt)} - ${interaction.type.replaceAll("_", " ")}`}
                  secondary={interaction.content}
                  primaryTypographyProps={{ fontWeight: 800 }}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography color="text.secondary">No interactions recorded yet.</Typography>
        )}
      </Stack>
    </Paper>
  );
}
