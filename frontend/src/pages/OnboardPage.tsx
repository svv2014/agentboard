import { useState, useEffect } from "react";
import {
  Box, Typography, Card, CardContent, Button, Chip,
  Stepper, Step, StepLabel, StepContent, Divider, Alert
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import api from "../api";

const MCP_URL = import.meta.env.VITE_API_URL || "http://localhost:8100";

const CLAUDE_CONFIG = `{
  "mcpServers": {
    "agentboard": {
      "type": "http",
      "url": "${MCP_URL}/mcp"
    }
  }
}`;

const AGENT_PROMPT = `You have access to AgentBoard via MCP.
Track your tasks on the board as you work:
- create_item when starting something
- move_item to update status (todo → doing → done)
- update_item to add notes or metadata`;

function CopyBlock({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box sx={{ position: "relative", mb: 1 }}>
      <Box
        component="pre"
        sx={{
          bgcolor: "#0d0d0d",
          border: "1px solid #2a2a2a",
          borderRadius: "6px",
          p: 2,
          pr: 6,
          fontSize: "0.75rem",
          color: "#a5f3a5",
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          overflowX: "auto",
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
          m: 0,
        }}
      >
        {value}
      </Box>
      <Button
        size="small"
        onClick={copy}
        sx={{
          position: "absolute",
          top: 8,
          right: 8,
          minWidth: 0,
          p: 0.5,
          color: copied ? "#22c55e" : "grey.600",
          "&:hover": { color: "white" },
        }}
      >
        {copied ? <CheckCircleIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
      </Button>
    </Box>
  );
}

export default function OnboardPage({ onEnterBoard }: { onEnterBoard: () => void }) {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [boardInfo, setBoardInfo] = useState<{ groups: number; items: number } | null>(null);

  const testConnection = async () => {
    try {
      const { data } = await api.get("/board/");
      const items = data.groups.reduce((sum: number, g: any) => sum + g.items.length, 0);
      setBoardInfo({ groups: data.groups.length, items });
      setConnected(true);
    } catch {
      setConnected(false);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <Box bgcolor="#0a0a0a" minHeight="100vh" display="flex" flexDirection="column" alignItems="center" pt={6} px={2}>
      <Box maxWidth={620} width="100%">
        {/* Header */}
        <Box display="flex" alignItems="center" gap={1.5} mb={1}>
          <SmartToyIcon sx={{ color: "#6366f1", fontSize: 32 }} />
          <Typography variant="h4" fontWeight={700} color="white">AgentBoard</Typography>
        </Box>
        <Typography color="grey.500" mb={4}>
          Kanban task tracking for AI agents. Point your agent here — it handles the rest.
        </Typography>

        {/* Connection status */}
        <Card sx={{ bgcolor: "#111", border: "1px solid #222", borderRadius: 2, mb: 4 }}>
          <CardContent sx={{ p: "16px 20px !important" }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box display="flex" alignItems="center" gap={1}>
                <Box
                  width={8} height={8} borderRadius="50%"
                  bgcolor={connected === true ? "#22c55e" : connected === false ? "#ef4444" : "#f59e0b"}
                  sx={{ boxShadow: connected === true ? "0 0 6px #22c55e" : "none" }}
                />
                <Typography variant="body2" color={connected === true ? "#22c55e" : connected === false ? "#ef4444" : "grey.400"}>
                  {connected === null ? "Checking connection..." : connected ? "Backend connected" : "Backend not reachable"}
                </Typography>
                {boardInfo && (
                  <Box display="flex" gap={1} ml={1}>
                    <Chip label={`${boardInfo.groups} groups`} size="small" sx={{ height: 18, fontSize: "0.6rem", bgcolor: "#1a1a2a", color: "#818cf8" }} />
                    <Chip label={`${boardInfo.items} items`} size="small" sx={{ height: 18, fontSize: "0.6rem", bgcolor: "#1a2a1a", color: "#22c55e" }} />
                  </Box>
                )}
              </Box>
              <Button size="small" sx={{ color: "grey.500", fontSize: "0.7rem" }} onClick={testConnection}>
                recheck
              </Button>
            </Box>
            <Typography variant="caption" color="grey.700" display="block" mt={0.5}>
              {MCP_URL}/mcp
            </Typography>
          </CardContent>
        </Card>

        {/* Steps */}
        <Stepper orientation="vertical" sx={{ "& .MuiStepLabel-label": { color: "grey.300" }, "& .MuiStepIcon-root": { color: "#6366f1" } }}>
          <Step active expanded>
            <StepLabel>
              <Typography variant="body1" fontWeight={600} color="white">Add to your agent config</Typography>
            </StepLabel>
            <StepContent sx={{ borderLeft: "1px solid #2a2a2a", ml: "11px" }}>
              <Typography variant="body2" color="grey.500" mb={1.5}>
                Add this to your <code style={{ color: "#a5f3a5" }}>openclaw.json</code> agent config, or any MCP-compatible client:
              </Typography>
              <CopyBlock label="MCP config" value={CLAUDE_CONFIG} />
            </StepContent>
          </Step>

          <Step active expanded>
            <StepLabel>
              <Typography variant="body1" fontWeight={600} color="white">Add to your agent's system prompt</Typography>
            </StepLabel>
            <StepContent sx={{ borderLeft: "1px solid #2a2a2a", ml: "11px" }}>
              <Typography variant="body2" color="grey.500" mb={1.5}>
                Tell your agent how to use the board:
              </Typography>
              <CopyBlock label="Agent prompt" value={AGENT_PROMPT} />
            </StepContent>
          </Step>

          <Step active expanded>
            <StepLabel>
              <Typography variant="body1" fontWeight={600} color="white">Watch the board</Typography>
            </StepLabel>
            <StepContent sx={{ borderLeft: "1px solid #2a2a2a", ml: "11px", pb: 2 }}>
              <Typography variant="body2" color="grey.500" mb={2}>
                Once your agent is running, tasks appear here automatically. The board refreshes every 5 seconds.
              </Typography>
              <Button
                variant="contained"
                onClick={onEnterBoard}
                sx={{ bgcolor: "#6366f1", "&:hover": { bgcolor: "#5254cc" }, borderRadius: "6px", textTransform: "none", fontWeight: 600 }}
                endIcon={<OpenInNewIcon fontSize="small" />}
              >
                Open board
              </Button>
            </StepContent>
          </Step>
        </Stepper>

        <Divider sx={{ borderColor: "#1e1e1e", my: 4 }} />

        {/* MCP tools reference */}
        <Typography variant="overline" color="grey.600" letterSpacing={2} display="block" mb={2}>
          Available MCP tools
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1} mb={4}>
          {["list_board", "create_item", "move_item", "update_item", "get_item", "delete_item", "create_group", "list_groups"].map((tool) => (
            <Chip
              key={tool}
              label={tool}
              size="small"
              sx={{ bgcolor: "#111", border: "1px solid #2a2a2a", color: "#818cf8", fontFamily: "monospace", fontSize: "0.7rem" }}
            />
          ))}
        </Box>

        {connected === false && (
          <Alert severity="warning" sx={{ bgcolor: "#1a1500", border: "1px solid #3a2a00", color: "#fbbf24", mb: 3 }}>
            Backend not running. Start it with: <code>uvicorn app.main:app --port 8100</code>
          </Alert>
        )}
      </Box>
    </Box>
  );
}
