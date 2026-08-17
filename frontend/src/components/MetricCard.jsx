import { Box, Typography } from "@mui/material";

export default function MetricCard({ label, value, accent = "#4f46e5", helper }) {
  return (
    <Box
      sx={{
        bgcolor: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 2,
        p: 1.6,
        minHeight: 104,
        position: "relative",
        overflow: "hidden",
        "&:before": {
          content: '""',
          position: "absolute",
          inset: "0 auto 0 0",
          width: 5,
          bgcolor: accent
        }
      }}
    >
      <Typography color="text.secondary" sx={{ fontSize: "0.78rem", fontWeight: 760, mb: 0.7 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: "1.75rem", fontWeight: 820, lineHeight: 1.05 }}>{value ?? 0}</Typography>
      {helper ? (
        <Typography color="text.secondary" sx={{ mt: 0.65, fontSize: "0.78rem" }}>
          {helper}
        </Typography>
      ) : null}
    </Box>
  );
}
