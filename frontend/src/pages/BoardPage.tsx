import { useEffect, useState } from "react";
import { Box, Chip, Typography, Card, CardContent, CircularProgress, AppBar, Toolbar, Button } from "@mui/material";
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
  blocked: "#ef4444",
  done: "#22c55e",
};

export default function BoardPage({ onLogout }: { onLogout: () => void }) {
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/board/").then(({ data }) => {
      setBoard(data);
      setLoading(false);
    });
    const interval = setInterval(() => {
      api.get("/board/").then(({ data }) => setBoard(data));
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>;

  return (
    <Box bgcolor="#0f0f0f" minHeight="100vh">
      <AppBar position="static" sx={{ bgcolor: "#1a1a1a" }} elevation={0}>
        <Toolbar>
          <Typography variant="h6" fontWeight={700} flexGrow={1}>AgentBoard</Typography>
          <Typography variant="body2" color="grey.400" mr={2}>{board?.name}</Typography>
          <Button color="inherit" size="small" onClick={onLogout}>Logout</Button>
        </Toolbar>
      </AppBar>
      <Box p={3} sx={{ overflowX: "auto" }}>
        {board?.groups.map((group) => (
          <Box key={group.id} mb={4}>
            <Typography variant="subtitle1" fontWeight={600} color="grey.300" mb={1}>{group.name}</Typography>
            <Box display="flex" gap={2} sx={{ overflowX: "auto", pb: 1 }}>
              {group.statuses.map((status) => {
                const items = group.items.filter((i) => i.status === status);
                return (
                  <Box key={status} minWidth={220} maxWidth={280} flexShrink={0}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Box width={8} height={8} borderRadius="50%" bgcolor={STATUS_COLORS[status] || "#6b7280"} />
                      <Typography variant="caption" color="grey.400" textTransform="uppercase" letterSpacing={1}>
                        {status}
                      </Typography>
                      <Chip label={items.length} size="small" sx={{ height: 16, fontSize: "0.65rem", bgcolor: "#2a2a2a", color: "grey.400" }} />
                    </Box>
                    <Box display="flex" flexDirection="column" gap={1}>
                      {items.map((item) => (
                        <Card key={item.id} sx={{ bgcolor: "#1e1e1e", borderRadius: 1 }} elevation={0}>
                          <CardContent sx={{ p: "10px !important" }}>
                            <Typography variant="body2" color="white" fontWeight={500}>{item.title}</Typography>
                            {item.description && (
                              <Typography variant="caption" color="grey.500" display="block" mt={0.5}
                                sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {item.description}
                              </Typography>
                            )}
                            <Typography variant="caption" color="grey.600" display="block" mt={0.5}>
                              {item.created_by}
                            </Typography>
                          </CardContent>
                        </Card>
                      ))}
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
