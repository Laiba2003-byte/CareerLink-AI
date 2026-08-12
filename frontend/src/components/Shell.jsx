import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography
} from "@mui/material";
import { Building2, LayoutDashboard, Menu, UserRoundCog, UsersRound } from "lucide-react";

const drawerWidth = 252;

const navItems = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Companies", path: "/companies", icon: Building2 },
  { label: "Contacts", path: "/contacts", icon: UsersRound },
  { label: "Profile", path: "/profile", icon: UserRoundCog }
];

function DrawerContent({ onNavigate }) {
  const location = useLocation();

  return (
    <Box sx={{ height: "100%", px: 2, py: 2.5 }}>
      <Box sx={{ px: 1.5, mb: 3 }}>
        <Typography variant="h2" sx={{ fontSize: "1.35rem" }}>
          CareerLink AI
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5, fontSize: "0.88rem" }}>
          Career networking CRM
        </Typography>
      </Box>

      <List disablePadding sx={{ display: "grid", gap: 0.75 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const selected = item.path === "/" ? location.pathname === "/" : location.pathname.startsWith(item.path);

          return (
            <ListItemButton
              key={item.path}
              component={Link}
              to={item.path}
              onClick={onNavigate}
              selected={selected}
              sx={{
                borderRadius: 1,
                minHeight: 44,
                "&.Mui-selected": {
                  bgcolor: "#e3f4ef",
                  color: "primary.dark"
                }
              }}
            >
              <ListItemIcon sx={{ color: "inherit", minWidth: 36 }}>
                <Icon size={19} />
              </ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 800 }} />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );
}

export default function Shell({ children }) {
  const [open, setOpen] = useState(false);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          display: { md: "none" },
          bgcolor: "background.paper",
          color: "text.primary",
          borderBottom: "1px solid #dde5e2"
        }}
      >
        <Toolbar>
          <IconButton edge="start" onClick={() => setOpen(true)} aria-label="Open navigation">
            <Menu size={21} />
          </IconButton>
          <Typography variant="h3" sx={{ ml: 1 }}>
            CareerLink AI
          </Typography>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            borderRight: "1px solid #dde5e2",
            bgcolor: "#fbfcfb"
          }
        }}
      >
        <DrawerContent />
      </Drawer>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": { width: drawerWidth }
        }}
      >
        <DrawerContent onNavigate={() => setOpen(false)} />
      </Drawer>

      <Box
        component="main"
        sx={{
          ml: { md: `${drawerWidth}px` },
          px: { xs: 2, sm: 3, lg: 5 },
          py: { xs: 2.5, sm: 3.5, lg: 4.5 },
          minHeight: "100vh"
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
