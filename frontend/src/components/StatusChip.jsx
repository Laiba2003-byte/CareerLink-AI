import { Chip } from "@mui/material";
import { labelStatus, statusColor } from "../utils/status.js";

const tone = {
  default: { borderColor: "#d8d5cf", bgcolor: "#f7f6f3", color: "#5f6368" },
  primary: { borderColor: "#d7dfeb", bgcolor: "#f4f7fb", color: "#2f4a70" },
  info: { borderColor: "#d7dfeb", bgcolor: "#f4f7fb", color: "#2f4a70" },
  success: { borderColor: "#d9e6dd", bgcolor: "#f4faf6", color: "#2f6f48" },
  warning: { borderColor: "#e6dcc8", bgcolor: "#fbf7ee", color: "#7b5a1f" },
  error: { borderColor: "#ead8d6", bgcolor: "#fbf4f3", color: "#8a3d38" }
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
