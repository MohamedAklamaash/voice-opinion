import appLogo from "../assets/Logo.webp";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Theme } from "../App";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import DummyLogo from "../assets/DummyLogo.jpeg";

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
    <nav className="sticky top-0 z-50 px-4 py-3 flex items-center justify-between border-b border-primary-black-400 backdrop-blur-sm bg-opacity-90 bg-primary-black-700">
      {/* Logo */}
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate(isLoggedIn ? "/home" : "/")}>
        <img src={appLogo} className="w-9 h-9 rounded-full" alt="Logo" />
        <span className="font-montserrat font-bold text-lg text-gradient-violet hidden sm:block">Voice Ur Opinion</span>
      </div>

      {/* Desktop right */}
      <div className="hidden md:flex items-center gap-4">
        <button
          onClick={() => setprimaryTheme(primaryTheme === "dark" ? "light" : "dark")}
          className="p-2 rounded-full hover:bg-secondary-black-600 transition-colors"
        >
          {primaryTheme === "dark" ? <DarkModeIcon fontSize="small" /> : <LightModeIcon fontSize="small" />}
        </button>
        {isLoggedIn && (
          <>
            <div className="flex items-center gap-2">
              <img src={imgSrc || DummyLogo} className="w-8 h-8 rounded-full object-cover" alt="avatar" />
              <span className="font-poppins text-sm font-semibold">{name.charAt(0).toUpperCase() + name.slice(1)}</span>
            </div>
            <button
              onClick={() => { localStorage.clear(); window.location.href = "/"; }}
              className="text-sm font-poppins text-red-400 hover:text-red-300 transition-colors"
            >
              Log out
            </button>
          </>
        )}
      </div>

      {/* Mobile hamburger */}
      <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? <CloseIcon /> : <MenuIcon />}
      </button>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="absolute top-full left-0 right-0 bg-primary-black-700 border-b border-primary-black-400 p-4 flex flex-col gap-4 md:hidden">
          {isLoggedIn && (
            <div className="flex items-center gap-3">
              <img src={imgSrc || DummyLogo} className="w-10 h-10 rounded-full object-cover" alt="avatar" />
              <span className="font-poppins font-semibold">{name.charAt(0).toUpperCase() + name.slice(1)}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-secondary-white text-sm font-poppins">{primaryTheme === "dark" ? "Dark mode" : "Light mode"}</span>
            <button onClick={() => setprimaryTheme(primaryTheme === "dark" ? "light" : "dark")} className="p-2 rounded-full hover:bg-secondary-black-600">
              {primaryTheme === "dark" ? <DarkModeIcon fontSize="small" /> : <LightModeIcon fontSize="small" />}
            </button>
          </div>
          {isLoggedIn && (
            <button
              onClick={() => { localStorage.clear(); window.location.href = "/"; }}
              className="text-left text-red-400 font-poppins text-sm hover:text-red-300"
            >
              Log out
            </button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
