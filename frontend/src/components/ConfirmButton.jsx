import { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from "@mui/material";

export default function ConfirmButton({
  children,
  title,
  description,
  onConfirm,
  disabled,
  color = "primary",
  variant = "contained",
  startIcon
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button
        variant={variant}
        color={color}
        disabled={disabled}
        startIcon={startIcon}
        onClick={() => setOpen(true)}
      >
        {children}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{title || children}</DialogTitle>
        <DialogContent>
          <DialogContentText>{description || "Please confirm this state change."}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={confirm} variant="contained" disabled={busy}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
