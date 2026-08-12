import { Chip } from "@mui/material";
import { labelStatus, statusColor } from "../utils/status.js";

export default function StatusChip({ status }) {
  return <Chip size="small" color={statusColor(status)} label={labelStatus(status)} variant="outlined" />;
}
