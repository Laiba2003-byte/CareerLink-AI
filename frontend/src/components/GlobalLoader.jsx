import { useEffect, useState } from "react";
import { Box, LinearProgress, Paper, Typography } from "@mui/material";

export default function GlobalLoader() {
  const [pending, setPending] = useState(0);

  useEffect(() => {
    function handleLoading(event) {
      setPending(event.detail?.pending || 0);
    }

    window.addEventListener("careerlink:loading", handleLoading);
    return () => window.removeEventListener("careerlink:loading", handleLoading);
  }, []);

  if (!pending) return null;

  return (
    <Box sx={{ position: "fixed", inset: "0 0 auto 0", zIndex: 2000, pointerEvents: "none" }}>
      <LinearProgress sx={{ height: 3 }} />
      <Paper
        elevation={0}
        sx={{
          position: "fixed",
          top: 12,
          right: 16,
          px: 1.3,
          py: 0.7,
          border: "1px solid #c7d2fe",
          bgcolor: "#eef2ff",
          color: "#3730a3"
        }}
      >
        <Typography sx={{ fontSize: "0.78rem", fontWeight: 800 }}>Working...</Typography>
      </Paper>
    </Box>
  );
}
