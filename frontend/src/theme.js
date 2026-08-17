import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    background: {
      default: "#f4f7fb",
      paper: "#ffffff"
    },
    primary: {
      main: "#4f46e5",
      dark: "#3730a3"
    },
    secondary: {
      main: "#0891b2"
    },
    success: {
      main: "#16a34a"
    },
    warning: {
      main: "#d97706"
    },
    error: {
      main: "#dc2626"
    },
    info: {
      main: "#2563eb"
    },
    text: {
      primary: "#111827",
      secondary: "#667085"
    },
    divider: "#e5e7eb"
  },
  shape: {
    borderRadius: 6
  },
  typography: {
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: 14,
    h1: { fontSize: "1.68rem", fontWeight: 750, letterSpacing: 0, lineHeight: 1.25 },
    h2: { fontSize: "1rem", fontWeight: 720, letterSpacing: 0, lineHeight: 1.35 },
    h3: { fontSize: "0.92rem", fontWeight: 700, letterSpacing: 0, lineHeight: 1.35 },
    body1: { fontSize: "0.875rem", letterSpacing: 0 },
    body2: { fontSize: "0.8rem", letterSpacing: 0 },
    button: { textTransform: "none", fontWeight: 650, letterSpacing: 0 }
  },
  components: {
    MuiButton: {
      defaultProps: {
        size: "small"
      },
      styleOverrides: {
        root: {
          borderRadius: 6,
          minHeight: 32,
          boxShadow: "none"
        },
        contained: {
          backgroundColor: "#4f46e5",
          boxShadow: "none",
          "&:hover": { backgroundColor: "#4338ca", boxShadow: "none" }
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          boxShadow: "none"
        }
      }
    },
    MuiChip: {
      defaultProps: {
        size: "small"
      },
      styleOverrides: {
        root: {
          borderRadius: 5,
          fontWeight: 650,
          height: 24
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottomColor: "#e6e2db",
          fontSize: "0.86rem",
          padding: "11px 14px"
        },
        head: {
          backgroundColor: "#f8fafc",
          color: "#667085",
          fontSize: "0.74rem",
          fontWeight: 750,
          letterSpacing: "0.04em",
          textTransform: "uppercase"
        }
      }
    },
    MuiTextField: {
      defaultProps: {
        size: "small"
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          backgroundColor: "#ffffff"
        }
      }
    }
  }
});
