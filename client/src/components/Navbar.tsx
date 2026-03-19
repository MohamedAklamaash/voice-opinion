import appLogo from "../assets/Logo.webp";
import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { Theme } from "../App";
import { avatarForName } from "../utils/avatars";
import { useSelector } from "react-redux";
import axios from "axios";

type Props = {
  name: string;
  imgSrc: string;
  primaryTheme: Theme;
  setprimaryTheme: (theme: Theme) => void;
};

interface Room { _id: string; title: string; owner: string; roomType: string; }

const Navbar = ({ name, imgSrc, setprimaryTheme, primaryTheme }: Props) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [invitedRooms, setInvitedRooms] = useState<Room[]>([]);
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const isLoggedIn = !!name;

  const { email } = useSelector((state: { user: { email: string } }) => state.user);

  useEffect(() => {
    if (!email) return;
    axios.get(`${import.meta.env.VITE_API_URL}/room/myRooms/${encodeURIComponent(email)}`)
      .then(({ data }) => setInvitedRooms(data.data ?? []))
      .catch(() => {});
  }, [email]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const removeRoom = async (roomId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await axios.delete(`${import.meta.env.VITE_API_URL}/room/leaveInvite/${roomId}`, { data: { email } }).catch(() => {});
    setInvitedRooms(prev => prev.filter(r => r._id !== roomId));
  };

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
            <button onClick={() => navigate("/friends")} className="font-mono text-xs tracking-widest hover:opacity-70" style={{ color: "var(--ash)" }}>
              FRIENDS
            </button>

            {/* Invited rooms dropdown */}
            <div className="relative" ref={dropRef}>
              <button
                onClick={() => setDropOpen(o => !o)}
                className="font-mono text-xs tracking-widest hover:opacity-70 flex items-center gap-1"
                style={{ color: invitedRooms.length > 0 ? "var(--gold)" : "var(--ash)" }}
              >
                MY ROOMS
                {invitedRooms.length > 0 && (
                  <span className="w-4 h-4 rounded-full flex items-center justify-center font-mono" style={{ background: "var(--gold)", color: "var(--ink)", fontSize: "10px" }}>
                    {invitedRooms.length}
                  </span>
                )}
              </button>
              {dropOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-64 py-1"
                  style={{ background: "var(--ink-2)", border: "1px solid var(--ink-4)", zIndex: 100 }}
                >
                  <p className="font-mono text-xs tracking-widest px-3 py-2" style={{ color: "var(--ash)", borderBottom: "1px solid var(--ink-4)" }}>
                    INVITED ROOMS
                  </p>
                  {invitedRooms.length === 0 ? (
                    <p className="font-mono text-xs px-3 py-3" style={{ color: "var(--ink-5)" }}>No invited rooms.</p>
                  ) : invitedRooms.map(room => (
                    <div key={room._id} className="flex items-center justify-between px-3 py-2 hover:opacity-80" style={{ borderBottom: "1px solid var(--ink-4)" }}>
                      <Link to={`/room/${room._id}`} onClick={() => setDropOpen(false)} className="flex-1 min-w-0">
                        <p className="font-mono text-xs truncate" style={{ color: "var(--paper)" }}>{room.title}</p>
                        <p className="font-mono text-xs" style={{ color: "var(--ash)", fontSize: "10px" }}>by {room.owner}</p>
                      </Link>
                      <button onClick={e => removeRoom(room._id, e)} className="ml-2 font-mono text-xs hover:opacity-70 flex-shrink-0" style={{ color: "var(--danger)" }} title="Leave invite">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <img src={imgSrc || avatarForName(name)} className="w-7 h-7 rounded-full object-cover" style={{ border: "1px solid var(--ink-5)" }} alt="avatar" />
              <span className="font-mono text-xs" style={{ color: "var(--paper)" }}>{name.charAt(0).toUpperCase() + name.slice(1)}</span>
            </div>
            <button onClick={() => { localStorage.clear(); window.location.href = "/"; }} className="font-mono text-xs tracking-widest hover:opacity-70" style={{ color: "var(--danger)" }}>
              LOG OUT
            </button>
          </>
        )}
      </div>

      <button className="md:hidden font-mono text-xs tracking-widest" style={{ color: "var(--ash)" }} onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? "[ CLOSE ]" : "[ MENU ]"}
      </button>

      {menuOpen && (
        <div className="absolute top-full left-0 right-0 p-5 flex flex-col gap-4 md:hidden anim-fade-in" style={{ background: "var(--ink-2)", borderBottom: "1px solid var(--ink-4)" }}>
          {isLoggedIn && (
            <div className="flex items-center gap-3">
              <img src={imgSrc || avatarForName(name)} className="w-9 h-9 rounded-full object-cover" alt="avatar" />
              <span className="font-mono text-sm">{name.charAt(0).toUpperCase() + name.slice(1)}</span>
            </div>
          )}
          <button onClick={() => setprimaryTheme(primaryTheme === "dark" ? "light" : "dark")} className="font-mono text-xs tracking-widest text-left" style={{ color: "var(--ash)" }}>
            {primaryTheme === "dark" ? "[ DARK MODE ]" : "[ LIGHT MODE ]"}
          </button>
          {isLoggedIn && (
            <button onClick={() => { navigate("/friends"); setMenuOpen(false); }} className="font-mono text-xs tracking-widest text-left" style={{ color: "var(--ash)" }}>
              FRIENDS
            </button>
          )}
          {isLoggedIn && (
            <div>
              <p className="font-mono text-xs tracking-widest mb-2" style={{ color: invitedRooms.length > 0 ? "var(--gold)" : "var(--ash)" }}>MY ROOMS {invitedRooms.length > 0 && `· ${invitedRooms.length}`}</p>
              {invitedRooms.length === 0 ? (
                <p className="font-mono text-xs" style={{ color: "var(--ink-5)" }}>No invited rooms.</p>
              ) : invitedRooms.map(room => (
                <div key={room._id} className="flex items-center justify-between py-1.5">
                  <Link to={`/room/${room._id}`} onClick={() => setMenuOpen(false)} className="flex-1 min-w-0">
                    <p className="font-mono text-xs truncate" style={{ color: "var(--paper)" }}>{room.title}</p>
                  </Link>
                  <button onClick={e => removeRoom(room._id, e)} className="font-mono text-xs ml-2" style={{ color: "var(--danger)" }}>✕</button>
                </div>
              ))}
            </div>
          )}
          {isLoggedIn && (
            <button onClick={() => { localStorage.clear(); window.location.href = "/"; }} className="font-mono text-xs tracking-widest text-left" style={{ color: "var(--danger)" }}>
              LOG OUT
            </button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
