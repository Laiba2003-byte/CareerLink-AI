import { Box, Stack, Typography } from "@mui/material";

export default function PageHeader({ title, eyebrow, subtitle, children }) {
  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={2}
      alignItems={{ xs: "flex-start", md: "flex-start" }}
      justifyContent="space-between"
      sx={{ mb: 2.5 }}
    >
      <Box sx={{ minWidth: 0 }}>
        {eyebrow ? (
          <Typography className="section-title" sx={{ mb: 0.55 }}>
            {eyebrow}
          </Typography>
        ) : null}
        <Typography variant="h1">{title}</Typography>
        {subtitle ? (
          <Typography color="text.secondary" sx={{ mt: 0.65 }}>
            {subtitle}
          </Typography>
        ) : null}
      </Box>
      {children ? (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {children}
        </Stack>
      ) : null}
    </Stack>
  );
}
