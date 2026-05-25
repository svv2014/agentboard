import { useEffect, useState, useRef } from "react";
import { Box, Chip, Typography, Card, CardContent, CircularProgress, AppBar, Toolbar, Tooltip, Button, Collapse, IconButton, Menu, MenuItem } from "@mui/material";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import SettingsIcon from "@mui/icons-material/Settings";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import RefreshIcon from "@mui/icons-material/Refresh";
import api from "../api";

const REFRESH_OPTIONS = [
  { label: "3s", ms: 3000 },
  { label: "5s", ms: 5000 },
  { label: "10s", ms: 10000 },
  { label: "30s", ms: 30000 },
  { label: "1m", ms: 60000 },
  { label: "off", ms: 0 },
];

interface Item {
  id: number;
  title: string;
  description?: string;
  status: string;
  created_by: string;
  updated_at: string;
}

interface Project {
  id: number;
  name: string;
  statuses: string[];
  items: Item[];
}

interface Board {
  id: number;
  name: string;
  groups: Project[];
}

const STATUS_COLORS: Record<string, string> = {
  triage: "#6366f1",
  todo: "#3b82f6",
  doing: "#f59e0b",
  "in-progress": "#f59e0b",
  blocked: "#ef4444",
  reviewing: "#a855f7",
  backlog: "#6b7280",
  done: "#22c55e",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function loadCollapsed(key: string, def: boolean): boolean {
  try { return JSON.parse(localStorage.getItem(key) ?? String(def)); } catch { return def; }
}

function saveCollapsed(key: string, val: boolean) {
  localStorage.setItem(key, String(val));
}

export default function BoardPage({ onSetup }: { onSetup?: () => void }) {
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [collapsedGroups, setCollapsedGroups] = useState<Record<number, boolean>>({});
  const [hideEmpty, setHideEmpty] = useState(() => loadCollapsed("ab_hideEmpty", true));
  const [refreshMs, setRefreshMs] = useState(() => parseInt(localStorage.getItem("ab_refreshMs") ?? "5000"));
  const [refreshAnchor, setRefreshAnchor] = useState<null | HTMLElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = () =>
    api.get("/board/").then(({ data }) => {
      setBoard(data);
      setLastRefresh(new Date());
      setLoading(false);
    });

  useEffect(() => {
    refresh();
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (refreshMs > 0) {
      intervalRef.current = setInterval(refresh, refreshMs);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [refreshMs]);

  const toggleGroup = (id: number) => {
    setCollapsedGroups((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      saveCollapsed(`ab_group_${id}`, next[id]);
      return next;
    });
  };

  const toggleHideEmpty = () => {
    setHideEmpty((v: boolean) => { saveCollapsed("ab_hideEmpty", !v); return !v; });
  };

  if (loading)
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="#0a0a0a">
        <CircularProgress size={28} sx={{ color: "#6366f1" }} />
      </Box>
    );

  const totalItems = board?.groups.flatMap((g) => g.items).length ?? 0;
  const activeItems = board?.groups.flatMap((g) => g.items).filter((i) => ["doing", "in-progress"].includes(i.status)).length ?? 0;
  const blockedItems = board?.groups.flatMap((g) => g.items).filter((i) => i.status === "blocked").length ?? 0;

  return (
    <Box bgcolor="#0a0a0a" minHeight="100vh">
      <AppBar position="static" sx={{ bgcolor: "#111", borderBottom: "1px solid #222" }} elevation={0}>
        <Toolbar sx={{ gap: 1 }}>
          <SmartToyIcon sx={{ color: "#6366f1", mr: 0.5 }} />
          <Typography variant="h6" fontWeight={700} color="white" flexGrow={1}>AgentBoard</Typography>
          {blockedItems > 0 && (
            <Chip label={`${blockedItems} blocked`} size="small" sx={{ bgcolor: "#2a1a1a", color: "#ef4444", fontWeight: 600 }} />
          )}
          <Chip label={`${activeItems} active`} size="small" sx={{ bgcolor: "#1a2a1a", color: "#22c55e", fontWeight: 600 }} />
          <Chip label={`${totalItems} total`} size="small" sx={{ bgcolor: "#1a1a2a", color: "#6366f1", fontWeight: 600 }} />
          <Tooltip title={hideEmpty ? "Show empty columns" : "Hide empty columns"}>
            <IconButton size="small" onClick={toggleHideEmpty} sx={{ color: hideEmpty ? "#6366f1" : "grey.700", ml: 0.5 }}>
              <VisibilityOffIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {/* Refresh interval picker */}
          <Tooltip title="Refresh interval">
            <Button
              size="small"
              endIcon={<RefreshIcon sx={{ fontSize: "12px !important" }} />}
              onClick={(e) => setRefreshAnchor(e.currentTarget)}
              sx={{ color: "grey.600", fontSize: "0.7rem", minWidth: 0, px: 1, ml: 0.5, "&:hover": { color: "grey.300" } }}
            >
              {REFRESH_OPTIONS.find((o) => o.ms === refreshMs)?.label ?? "5s"}
            </Button>
          </Tooltip>
          <Menu
            anchorEl={refreshAnchor}
            open={Boolean(refreshAnchor)}
            onClose={() => setRefreshAnchor(null)}
            slotProps={{ paper: { sx: { bgcolor: "#1a1a1a", border: "1px solid #333", minWidth: 80 } } }}
          >
            {REFRESH_OPTIONS.map((opt) => (
              <MenuItem
                key={opt.ms}
                selected={opt.ms === refreshMs}
                onClick={() => {
                  setRefreshMs(opt.ms);
                  localStorage.setItem("ab_refreshMs", String(opt.ms));
                  setRefreshAnchor(null);
                }}
                sx={{ fontSize: "0.8rem", color: opt.ms === refreshMs ? "#6366f1" : "grey.300", py: 0.5 }}
              >
                {opt.label}
              </MenuItem>
            ))}
          </Menu>
          <Typography variant="caption" color="grey.700" ml={0.5}>
            {refreshMs === 0 ? "paused" : timeAgo(lastRefresh.toISOString())}
          </Typography>
          {onSetup && (
            <IconButton size="small" onClick={onSetup} sx={{ color: "grey.700", "&:hover": { color: "grey.300" } }}>
              <SettingsIcon fontSize="small" />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      <Box p={3}>
        {board?.groups.map((group) => {
          const isCollapsed = collapsedGroups[group.id] ?? false;
          const groupTotal = group.items.length;
          const groupActive = group.items.filter((i) => ["doing", "in-progress"].includes(i.status)).length;
          const groupBlocked = group.items.filter((i) => i.status === "blocked").length;

          return (
            <Box key={group.id} mb={isCollapsed ? 2 : 4}>
              {/* Group header — clickable to collapse */}
              <Box
                display="flex"
                alignItems="center"
                gap={1}
                mb={isCollapsed ? 0 : 1.5}
                sx={{ cursor: "pointer", userSelect: "none", "&:hover .group-name": { color: "grey.300" } }}
                onClick={() => toggleGroup(group.id)}
              >
                <Box sx={{ color: "grey.700", display: "flex", alignItems: "center" }}>
                  {isCollapsed ? <KeyboardArrowRightIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
                </Box>
                <Typography className="group-name" variant="overline" color="grey.500" letterSpacing={2} fontWeight={600}>
                  {group.name}
                </Typography>
                <Box display="flex" gap={0.5} ml={1}>
                  {groupBlocked > 0 && (
                    <Chip label={`${groupBlocked} blocked`} size="small" sx={{ height: 16, fontSize: "0.6rem", bgcolor: "#2a1a1a", color: "#ef4444" }} />
                  )}
                  {groupActive > 0 && (
                    <Chip label={`${groupActive} active`} size="small" sx={{ height: 16, fontSize: "0.6rem", bgcolor: "#1a2a1a", color: "#22c55e" }} />
                  )}
                  {isCollapsed && groupTotal > 0 && (
                    <Chip label={`${groupTotal} items`} size="small" sx={{ height: 16, fontSize: "0.6rem", bgcolor: "#1e1e1e", color: "grey.500" }} />
                  )}
                </Box>
              </Box>

              <Collapse in={!isCollapsed} timeout={150}>
                <Box display="flex" gap={2} sx={{ overflowX: "auto", pb: 1, alignItems: "flex-start" }}>
                  {group.statuses.map((status) => {
                    const items = group.items.filter((i) => i.status === status);
                    if (hideEmpty && items.length === 0) return null;
                    const color = STATUS_COLORS[status] || "#6b7280";
                    return (
                      <Box key={status} minWidth={230} maxWidth={280} flexShrink={0}>
                        <Box display="flex" alignItems="center" gap={1} mb={1.5} px={0.5}>
                          <Box width={7} height={7} borderRadius="50%" sx={{ bgcolor: color }} />
                          <Typography variant="caption" color="grey.500" textTransform="uppercase" letterSpacing={1.5} fontWeight={600} fontSize="0.65rem">
                            {status}
                          </Typography>
                          {items.length > 0 && (
                            <Box sx={{ ml: "auto", bgcolor: "#1e1e1e", borderRadius: "10px", px: 0.8, py: 0.1 }}>
                              <Typography variant="caption" color="grey.500" fontSize="0.65rem">{items.length}</Typography>
                            </Box>
                          )}
                        </Box>
                        <Box display="flex" flexDirection="column" gap={1}>
                          {items.map((item) => (
                            <Card
                              key={item.id}
                              sx={{
                                bgcolor: "#161616",
                                border: "1px solid #222",
                                borderLeft: `3px solid ${color}`,
                                borderRadius: "6px",
                                transition: "background 0.15s",
                                "&:hover": { bgcolor: "#1c1c1c" },
                              }}
                              elevation={0}
                            >
                              <CardContent sx={{ p: "10px 12px !important" }}>
                                <Typography variant="body2" color="white" fontWeight={500} lineHeight={1.4}>
                                  {item.title}
                                </Typography>
                                {item.description && (
                                  <Tooltip title={item.description} placement="top">
                                    <Typography
                                      variant="caption"
                                      color="grey.600"
                                      display="block"
                                      mt={0.5}
                                      sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "default" }}
                                    >
                                      {item.description}
                                    </Typography>
                                  </Tooltip>
                                )}
                                <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                                  <Chip
                                    label={item.created_by}
                                    size="small"
                                    icon={<SmartToyIcon style={{ fontSize: 10 }} />}
                                    sx={{ height: 18, fontSize: "0.6rem", bgcolor: "#1e1e2e", color: "#818cf8", "& .MuiChip-icon": { color: "#818cf8", ml: "4px" } }}
                                  />
                                  <Typography variant="caption" color="grey.700" fontSize="0.6rem">
                                    {timeAgo(item.updated_at)}
                                  </Typography>
                                </Box>
                              </CardContent>
                            </Card>
                          ))}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Collapse>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
