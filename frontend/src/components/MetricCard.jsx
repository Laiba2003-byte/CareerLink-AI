import { Paper, Stack, Typography } from "@mui/material";

export default function MetricCard({ label, value, icon: Icon, tone = "#0f766e" }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.2,
        borderColor: "#dde7e3",
        display: "flex",
        minHeight: 118,
        alignItems: "space-between"
      }}
    >
      <Stack spacing={1.5} sx={{ width: "100%" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography color="text.secondary" fontWeight={800} fontSize="0.88rem">
            {label}
          </Typography>
          {Icon ? <Icon size={20} color={tone} /> : null}
        </Stack>
        <Typography variant="h1" sx={{ fontSize: "2rem" }}>
          {value ?? 0}
        </Typography>
      </Stack>
    </Paper>
  );
}
