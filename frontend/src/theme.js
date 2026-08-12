import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    background: {
      default: "#f5f7f6",
      paper: "#ffffff"
    },
    primary: {
      main: "#0f766e",
      dark: "#115e59"
    },
    secondary: {
      main: "#7c3aed"
    },
    success: {
      main: "#138a43"
    },
    warning: {
      main: "#c97913"
    },
    error: {
      main: "#b42318"
    },
    text: {
      primary: "#18211f",
      secondary: "#5c6662"
    }
  },
  shape: {
    borderRadius: 8
  },
  typography: {
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: { fontSize: "2.1rem", fontWeight: 800, letterSpacing: 0 },
    h2: { fontSize: "1.55rem", fontWeight: 750, letterSpacing: 0 },
    h3: { fontSize: "1.2rem", fontWeight: 700, letterSpacing: 0 },
    button: { textTransform: "none", fontWeight: 700, letterSpacing: 0 }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none"
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 700
        }
      }
    }
  }
});
