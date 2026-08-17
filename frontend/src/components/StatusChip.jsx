import { Chip } from "@mui/material";
import { labelStatus, statusColor } from "../utils/status.js";

const tone = {
  default: { borderColor: "#e5e7eb", bgcolor: "#f8fafc", color: "#475467" },
  primary: { borderColor: "#c7d2fe", bgcolor: "#eef2ff", color: "#3730a3" },
  info: { borderColor: "#bfdbfe", bgcolor: "#eff6ff", color: "#1d4ed8" },
  success: { borderColor: "#bbf7d0", bgcolor: "#f0fdf4", color: "#15803d" },
  warning: { borderColor: "#fed7aa", bgcolor: "#fff7ed", color: "#9a3412" },
  error: { borderColor: "#fecaca", bgcolor: "#fef2f2", color: "#b91c1c" }
};

export default function StatusChip({ status }) {
  const color = statusColor(status);
  const styles = tone[color] || tone.default;

  return (
    <Chip
      label={labelStatus(status)}
      variant="outlined"
      sx={{
        ...styles,
        ".MuiChip-label": { px: 0.85 }
      }}
    />
  );
}
