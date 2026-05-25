import { useState } from "react";
import { Box, Button, TextField, Typography, Paper, Tabs, Tab } from "@mui/material";
import api from "../api";

export default function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [tab, setTab] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async () => {
    try {
      const endpoint = tab === 0 ? "/auth/login" : "/auth/register";
      const { data } = await api.post(endpoint, { email, password });
      localStorage.setItem("token", data.access_token);
      onLogin();
    } catch (e: any) {
      setError(e.response?.data?.detail || "Error");
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="#0f0f0f">
      <Paper sx={{ p: 4, width: 360, bgcolor: "#1a1a1a" }}>
        <Typography variant="h5" fontWeight={700} mb={2} color="white">AgentBoard</Typography>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label="Login" sx={{ color: "grey.400" }} />
          <Tab label="Register" sx={{ color: "grey.400" }} />
        </Tabs>
        <TextField fullWidth label="Email" value={email} onChange={(e) => setEmail(e.target.value)} sx={{ mb: 2 }} variant="outlined" />
        <TextField fullWidth label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} sx={{ mb: 2 }} />
        {error && <Typography color="error" mb={1}>{error}</Typography>}
        <Button fullWidth variant="contained" onClick={submit}>
          {tab === 0 ? "Login" : "Register"}
        </Button>
      </Paper>
    </Box>
  );
}
