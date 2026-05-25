import { useEffect, useState } from "react";
import { Box, Chip, Typography, Card, CardContent, CircularProgress, AppBar, Toolbar, Tooltip, Button } from "@mui/material";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import SettingsIcon from "@mui/icons-material/Settings";
import api from "../api";

interface Item {
  id: number;
  title: string;
  description?: string;
  status: string;
  created_by: string;
  updated_at: string;
}

interface Group {
  id: number;
  name: string;
  statuses: string[];
  items: Item[];
}

interface Board {
  id: number;
  name: string;
  groups: Group[];
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

export default function BoardPage({ onSetup }: { onSetup?: () => void }) {
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const refresh = () =>
    api.get("/board/").then(({ data }) => {
      setBoard(data);
      setLastRefresh(new Date());
      setLoading(false);
    });

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading)
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="#0a0a0a">
        <CircularProgress size={28} sx={{ color: "#6366f1" }} />
      </Box>
    );

  const totalItems = board?.groups.flatMap((g) => g.items).length ?? 0;
  const activeItems = board?.groups.flatMap((g) => g.items).filter((i) => ["doing", "in-progress"].includes(i.status)).length ?? 0;

  return (
    <Box bgcolor="#0a0a0a" minHeight="100vh">
      <AppBar position="static" sx={{ bgcolor: "#111", borderBottom: "1px solid #222" }} elevation={0}>
        <Toolbar sx={{ gap: 1 }}>
          <SmartToyIcon sx={{ color: "#6366f1", mr: 0.5 }} />
          <Typography variant="h6" fontWeight={700} color="white" flexGrow={1}>
            AgentBoard
          </Typography>
          <Chip label={`${activeItems} active`} size="small" sx={{ bgcolor: "#1a2a1a", color: "#22c55e", fontWeight: 600 }} />
          <Chip label={`${totalItems} total`} size="small" sx={{ bgcolor: "#1a1a2a", color: "#6366f1", fontWeight: 600 }} />
          <Typography variant="caption" color="grey.600" ml={1}>
            refreshed {timeAgo(lastRefresh.toISOString())}
          </Typography>
          {onSetup && (
            <Button size="small" onClick={onSetup} sx={{ color: "grey.600", minWidth: 0, ml: 1, "&:hover": { color: "grey.300" } }}>
              <SettingsIcon fontSize="small" />
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Box p={3}>
        {board?.groups.map((group) => (
          <Box key={group.id} mb={5}>
            <Typography variant="overline" color="grey.500" letterSpacing={2} fontWeight={600} display="block" mb={1.5}>
              {group.name}
            </Typography>
            <Box display="flex" gap={2} sx={{ overflowX: "auto", pb: 1, alignItems: "flex-start" }}>
              {group.statuses.map((status) => {
                const items = group.items.filter((i) => i.status === status);
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
                            transition: "border-color 0.15s",
                            "&:hover": { borderColor: color, bgcolor: "#1c1c1c" },
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
                      {items.length === 0 && (
                        <Box sx={{ border: "1px dashed #222", borderRadius: "6px", p: 1.5, textAlign: "center" }}>
                          <Typography variant="caption" color="grey.800" fontSize="0.65rem">empty</Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
