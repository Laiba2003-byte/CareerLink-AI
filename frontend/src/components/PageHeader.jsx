import { Box, Stack, Typography } from "@mui/material";

export default function PageHeader({ title, eyebrow, children }) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={2}
      alignItems={{ xs: "flex-start", sm: "center" }}
      justifyContent="space-between"
      sx={{ mb: 3 }}
    >
      <Box>
        {eyebrow ? (
          <Typography className="section-title" sx={{ mb: 0.6 }}>
            {eyebrow}
          </Typography>
        ) : null}
        <Typography variant="h1">{title}</Typography>
      </Box>
      {children ? <Stack direction="row" spacing={1} flexWrap="wrap">{children}</Stack> : null}
    </Stack>
  );
}
