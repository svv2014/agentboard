import { useState } from "react";
import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";
import LoginPage from "./pages/LoginPage";
import BoardPage from "./pages/BoardPage";

const theme = createTheme({
  palette: { mode: "dark" },
  typography: { fontFamily: "'Inter', sans-serif" },
});

export default function App() {
  const [authed, setAuthed] = useState(!!localStorage.getItem("token"));

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {authed
        ? <BoardPage onLogout={() => { localStorage.removeItem("token"); setAuthed(false); }} />
        : <LoginPage onLogin={() => setAuthed(true)} />
      }
    </ThemeProvider>
  );
}
