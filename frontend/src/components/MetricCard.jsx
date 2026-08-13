import { Box, Typography } from "@mui/material";

export default function MetricCard({ label, value }) {
  return (
    <Box
      sx={{
        px: { xs: 0, sm: 2 },
        py: 1.2,
        borderRight: { sm: "1px solid #e6e2db" },
        "&:last-of-type": { borderRight: 0 }
      }}
    >
      <Typography color="text.secondary" sx={{ fontSize: "0.76rem", fontWeight: 720, mb: 0.4 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: "1.45rem", fontWeight: 760, lineHeight: 1.15 }}>{value ?? 0}</Typography>
    </Box>
  );
}
