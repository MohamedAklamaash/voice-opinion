import appLogo from "../assets/Logo.webp";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Theme } from "../App";
import { avatarForName } from "../utils/avatars";

type Props = {
  name: string;
  imgSrc: string;
  primaryTheme: Theme;
  setprimaryTheme: (theme: Theme) => void;
};

const Navbar = ({ name, imgSrc, setprimaryTheme, primaryTheme }: Props) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const isLoggedIn = !!name;

  return (
    <nav
      className="sticky top-0 z-50 flex items-center justify-between px-5 py-3"
      style={{ background: "var(--ink)", borderBottom: "1px solid var(--ink-4)" }}
    >
      <div
        className="flex items-center gap-3 cursor-pointer select-none"
        onClick={() => navigate(isLoggedIn ? "/home" : "/")}
      >
        <img src={appLogo} className="w-8 h-8 rounded-full object-cover" alt="Logo" />
        <span className="font-bebas tracking-widest text-xl hidden sm:block" style={{ color: "var(--gold)" }}>
          Voice Ur Opinion
        </span>
      </div>

      <div className="hidden md:flex items-center gap-5">
        <button
          onClick={() => setprimaryTheme(primaryTheme === "dark" ? "light" : "dark")}
          className="font-mono text-xs tracking-widest"
          style={{ color: "var(--ash)" }}
        >
          {primaryTheme === "dark" ? "[ DARK ]" : "[ LIGHT ]"}
        </button>
        {isLoggedIn && (
          <>
            <div className="flex items-center gap-2">
              <img
                src={imgSrc || avatarForName(name)}
                className="w-7 h-7 rounded-full object-cover"
                style={{ border: "1px solid var(--ink-5)" }}
                alt="avatar"
              />
              <span className="font-mono text-xs" style={{ color: "var(--paper)" }}>
                {name.charAt(0).toUpperCase() + name.slice(1)}
              </span>
            </div>
            <button
              onClick={() => { localStorage.clear(); window.location.href = "/"; }}
              className="font-mono text-xs tracking-widest hover:opacity-70"
              style={{ color: "var(--danger)" }}
            >
              LOG OUT
            </button>
          </>
        )}
      </div>

      <button
        className="md:hidden font-mono text-xs tracking-widest"
        style={{ color: "var(--ash)" }}
        onClick={() => setMenuOpen(!menuOpen)}
      >
        {menuOpen ? "[ CLOSE ]" : "[ MENU ]"}
      </button>

      {menuOpen && (
        <div
          className="absolute top-full left-0 right-0 p-5 flex flex-col gap-4 md:hidden anim-fade-in"
          style={{ background: "var(--ink-2)", borderBottom: "1px solid var(--ink-4)" }}
        >
          {isLoggedIn && (
            <div className="flex items-center gap-3">
              <img src={imgSrc || avatarForName(name)} className="w-9 h-9 rounded-full object-cover" alt="avatar" />
              <span className="font-mono text-sm">{name.charAt(0).toUpperCase() + name.slice(1)}</span>
            </div>
          )}
          <button
            onClick={() => setprimaryTheme(primaryTheme === "dark" ? "light" : "dark")}
            className="font-mono text-xs tracking-widest text-left"
            style={{ color: "var(--ash)" }}
          >
            {primaryTheme === "dark" ? "[ DARK MODE ]" : "[ LIGHT MODE ]"}
          </button>
          {isLoggedIn && (
            <button
              onClick={() => { localStorage.clear(); window.location.href = "/"; }}
              className="font-mono text-xs tracking-widest text-left"
              style={{ color: "var(--danger)" }}
            >
              LOG OUT
            </button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
