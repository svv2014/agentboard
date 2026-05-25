import { useState } from "react";
import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";
import BoardPage from "./pages/BoardPage";
import OnboardPage from "./pages/OnboardPage";

const theme = createTheme({
  palette: { mode: "dark" },
  typography: { fontFamily: "'Inter', sans-serif" },
});

export default function App() {
  const [view, setView] = useState<"onboard" | "board">(
    window.location.hash === "#board" ? "board" : "onboard"
  );

  const goBoard = () => { window.location.hash = "board"; setView("board"); };
  const goOnboard = () => { window.location.hash = ""; setView("onboard"); };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {view === "onboard"
        ? <OnboardPage onEnterBoard={goBoard} />
        : <BoardPage onSetup={goOnboard} />
      }
    </ThemeProvider>
  );
}
