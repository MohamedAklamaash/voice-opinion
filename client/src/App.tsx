import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Navbar from "./components/Navbar";
import { useEffect, useState } from "react";
import SignInpage from "./pages/SignInpage";
import GetOtpPage from "./screens/GetOtpPage";
import NamePage from "./screens/NamePage";
import LoginPage from "./screens/LoginPage";
import MainHome from "./screens/MainScreen/MainHome";
import { useSelector } from "react-redux";
import RoomPage from "./pages/RoomPage";
import FriendsPage from "./pages/FriendsPage";
export type Theme = "light" | "dark";

const DARK = {
  "--ink": "#0a0a0a", "--ink-2": "#141414", "--ink-3": "#1e1e1e",
  "--ink-4": "#2a2a2a", "--ink-5": "#3a3a3a", "--ash": "#888",
  "--paper": "#f0ebe3", "--gold": "#e8b84b", "--gold-dim": "#a07c28",
  "--signal": "#3ddc84", "--danger": "#e84040",
};
const LIGHT = {
  "--ink": "#f5f0e8", "--ink-2": "#ede8df", "--ink-3": "#e4ddd2",
  "--ink-4": "#ccc5b8", "--ink-5": "#b0a898", "--ash": "#6b6560",
  "--paper": "#1a1714", "--gold": "#b07d1a", "--gold-dim": "#8a6010",
  "--signal": "#1a8a4a", "--danger": "#c0392b",
};

const App = () => {
  const [primaryTheme, setprimaryTheme] = useState<Theme>("dark");
  const [stepPageCount, setstepPageCount] = useState<number>(0);
  const { userName, userProfileUrl } = useSelector((state: any) => state.user);

  useEffect(() => {
    const vars = primaryTheme === "dark" ? DARK : LIGHT;
    const root = document.documentElement;
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
  }, [primaryTheme]);

  return (
    <div style={{ background: "var(--ink)", color: "var(--paper)", height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Router>
        <Navbar
          name={userName}
          imgSrc={userProfileUrl}
          setprimaryTheme={setprimaryTheme}
          primaryTheme={primaryTheme}
        />
        {/* This is the scrollable area — pages fill it, scroll only when content overflows */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
          <Routes>
          <Route
            path="/"
            element={
              <Home
                stepPageCount={stepPageCount}
                setstepPageCount={setstepPageCount}
              />
            }
          />
          <Route
            path="/signIn"
            element={
              <SignInpage
                setstepPageCount={setstepPageCount}
                stepPageCount={stepPageCount}
                primaryTheme={primaryTheme}
              />
            }
          />
          <Route
            path="/getUrOtp"
            element={
              <GetOtpPage
                setstepPageCount={setstepPageCount}
                stepPageCount={stepPageCount}
                primaryTheme={primaryTheme}
              />
            }
          />
          <Route
            path="/enterName"
            element={
              <NamePage
                stepPageCount={stepPageCount}
                setstepPageCount={setstepPageCount}
                primaryTheme={primaryTheme}
              />
            }
          />
          <Route
            path="/loginPage"
            element={
              <LoginPage
                stepPageCount={stepPageCount}
                setstepPageCount={setstepPageCount}
                primaryTheme={primaryTheme}
              />
            }
          />
          <Route
            element={<MainHome primaryTheme={primaryTheme} />}
            path="/home"
          />
          <Route
            path="/room/:id"
            element={<RoomPage primaryTheme={primaryTheme} />}
          />
          <Route
            path="/friends"
            element={<FriendsPage />}
          />
        </Routes>
        </div>
      </Router>
    </div>
  );
};

export default App;
