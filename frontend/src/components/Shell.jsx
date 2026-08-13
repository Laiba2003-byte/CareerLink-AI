import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  AppBar,
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography
} from "@mui/material";
import {
  Building2,
  Columns3,
  Home,
  Menu,
  Settings,
  UserRound,
  UsersRound
} from "lucide-react";
import { api } from "../services/api.js";

const drawerWidth = 232;

const primaryNav = [
  { label: "Overview", path: "/", icon: Home },
  { label: "Companies", path: "/companies", icon: Building2 },
  { label: "Contacts", path: "/contacts", icon: UsersRound },
  { label: "Pipeline", path: "/pipeline", icon: Columns3 }
];

const workspaceNav = [
  { label: "My Profile", path: "/profile", icon: UserRound },
  { label: "Settings", path: "/settings", icon: Settings }
];

function NavList({ items, onNavigate }) {
  const location = useLocation();

  return (
    <List disablePadding sx={{ display: "grid", gap: 0.25 }}>
      {items.map((item) => {
        const Icon = item.icon;
        const selected = item.path === "/" ? location.pathname === "/" : location.pathname.startsWith(item.path);

        return (
          <ListItemButton
            key={`${item.label}-${item.path}`}
            component={Link}
            to={item.path}
            onClick={onNavigate}
            selected={selected}
            sx={{
              borderRadius: 1,
              minHeight: 34,
              px: 1,
              color: selected ? "text.primary" : "text.secondary",
              "&.Mui-selected": {
                bgcolor: "#ece9e2",
                color: "text.primary"
              },
              "&.Mui-selected:hover": {
                bgcolor: "#e6e2db"
              }
            }}
          >
            <ListItemIcon sx={{ color: "inherit", minWidth: 30 }}>
              <Icon size={16} />
            </ListItemIcon>
            <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: "0.86rem", fontWeight: 680 }} />
          </ListItemButton>
        );
      })}
    </List>
  );
}

function DrawerContent({ onNavigate }) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    api.get("/profile").then((response) => setProfile(response.data)).catch(() => {});
  }, []);

  const name = profile?.name?.trim() || "Laiba";
  const initial = name.charAt(0).toUpperCase();

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", px: 1.5, py: 1.75 }}>
      <Box sx={{ px: 1, mb: 2.4 }}>
        <Typography sx={{ fontSize: "1.04rem", fontWeight: 780, lineHeight: 1.12 }}>CareerLink</Typography>
        <Typography sx={{ fontSize: "1.04rem", fontWeight: 780, lineHeight: 1.12 }}>AI</Typography>
      </Box>

      <NavList items={primaryNav} onNavigate={onNavigate} />

      <Divider sx={{ my: 2, borderColor: "#e2ded7" }} />

      <Typography className="section-title" sx={{ px: 1, mb: 0.75 }}>
        Workspace
      </Typography>
      <NavList items={workspaceNav} onNavigate={onNavigate} />

      <Box sx={{ flex: 1 }} />
      <Divider sx={{ mb: 1.2, borderColor: "#e2ded7" }} />
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1, py: 0.75 }}>
        <Avatar sx={{ width: 28, height: 28, bgcolor: "#e6e2db", color: "#202124", fontSize: "0.8rem" }}>
          {initial}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography noWrap sx={{ fontSize: "0.86rem", fontWeight: 720 }}>
            {name}
          </Typography>
          <Typography noWrap color="text.secondary" sx={{ fontSize: "0.76rem" }}>
            Personal workspace
          </Typography>
        </Box>
      </Box>
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
          borderBottom: "1px solid #dedbd4"
        }}
      >
        <Toolbar variant="dense">
          <IconButton edge="start" onClick={() => setOpen(true)} aria-label="Open navigation">
            <Menu size={19} />
          </IconButton>
          <Typography sx={{ ml: 1, fontWeight: 760 }}>CareerLink AI</Typography>
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
            borderRight: "1px solid #dedbd4",
            bgcolor: "#fbfaf8"
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
          "& .MuiDrawer-paper": { width: drawerWidth, bgcolor: "#fbfaf8" }
        }}
      >
        <DrawerContent onNavigate={() => setOpen(false)} />
      </Drawer>

      <Box
        component="main"
        sx={{
          ml: { md: `${drawerWidth}px` },
          px: { xs: 2, sm: 3, lg: 4 },
          py: { xs: 2, sm: 2.75, lg: 3.25 },
          minHeight: "100vh"
        }}
      >
        <Box sx={{ maxWidth: 1320 }}>{children}</Box>
      </Box>
    </Box>
  );
}
