import { Paper, Stack, TextField, Typography } from "@mui/material";

export default function MessagePanel({ title, context, value, onChange, children, placeholder }) {
  const count = (value || "").length;

  return (
    <Paper variant="outlined" sx={{ borderColor: "divider", p: 1.7 }}>
      <Stack spacing={1.1}>
        <Stack direction="row" alignItems="baseline" justifyContent="space-between" spacing={1}>
          <Typography className="section-title">{title}</Typography>
          <Typography color="text.secondary" sx={{ fontSize: "0.76rem" }}>
            {count} chars
          </Typography>
        </Stack>
        {context ? (
          <Typography color="text.secondary" sx={{ fontSize: "0.8rem" }}>
            {context}
          </Typography>
        ) : null}
        <TextField
          value={value || ""}
          onChange={(event) => onChange?.(event.target.value)}
          placeholder={placeholder}
          multiline
          minRows={4}
          fullWidth
        />
        {children ? (
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            {children}
          </Stack>
        ) : null}
      </Stack>
    </Paper>
  );
}
