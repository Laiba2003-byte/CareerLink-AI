import { Paper, Stack, TextField, Typography } from "@mui/material";

export default function MessagePanel({ title, value, onChange, children, placeholder }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.2, borderColor: "#dde7e3" }}>
      <Stack spacing={1.5}>
        <Typography className="section-title">{title}</Typography>
        <TextField
          value={value || ""}
          onChange={(event) => onChange?.(event.target.value)}
          placeholder={placeholder}
          multiline
          minRows={4}
          fullWidth
        />
        {children ? <Stack direction="row" spacing={1} flexWrap="wrap">{children}</Stack> : null}
      </Stack>
    </Paper>
  );
}
