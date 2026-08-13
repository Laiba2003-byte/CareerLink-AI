import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    background: {
      default: "#f6f5f2",
      paper: "#ffffff"
    },
    primary: {
      main: "#3f5f8f",
      dark: "#2f4a70"
    },
    secondary: {
      main: "#5f6368"
    },
    success: {
      main: "#3f7f58"
    },
    warning: {
      main: "#a87624"
    },
    error: {
      main: "#a14b45"
    },
    info: {
      main: "#4b6f99"
    },
    text: {
      primary: "#202124",
      secondary: "#686c70"
    },
    divider: "#dedbd4"
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
          boxShadow: "none",
          "&:hover": { boxShadow: "none" }
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
          backgroundColor: "#fbfaf8",
          color: "#686c70",
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
