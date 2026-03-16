import { Theme } from "../App";
import { useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { socket } from "../sockets/socket";
import { socketActions } from "../constants/Actions";
import CloseIcon from "@mui/icons-material/Close";

type Props = {
  setshowModal: (v: boolean) => void;
  showModal: boolean;
  primaryTheme: Theme;
};

type RoomType = "social" | "public" | "private";

const ROOM_TYPES: { type: RoomType; label: string; desc: string }[] = [
  { type: "social", label: "SOCIAL", desc: "Friends & followers" },
  { type: "public", label: "PUBLIC", desc: "Open to everyone" },
  { type: "private", label: "PRIVATE", desc: "Invite only" },
];

const StartRoomOverlay = ({ setshowModal, showModal }: Props) => {
  const [selectRoom, setselectRoom] = useState<RoomType>("public");
  const [title, settitle] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { email } = useSelector((state: { user: { email: string } }) => state.user);

  const createARoom = async () => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      const { data: { data } } = await axios.post(`${import.meta.env.VITE_API_URL}/room/createARoom`, {
        email, title: title.trim(), roomType: selectRoom,
      });
      socket.emit(socketActions.JOIN, { roomId: data._id, user: data });
      navigate(`/room/${data._id}`);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0"
      style={{ background: "rgba(0,0,0,0.8)" }}
    >
      <div
        className="w-full max-w-md p-6 anim-fade-up"
        style={{ background: "var(--ink-2)", border: "1px solid var(--ink-4)" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="font-mono text-xs tracking-widest mb-1" style={{ color: "var(--ash)" }}>
              — NEW ROOM —
            </p>
            <h2 className="font-bebas text-4xl" style={{ color: "var(--paper)" }}>
              START A ROOM
            </h2>
          </div>
          <button
            onClick={() => setshowModal(!showModal)}
            className="font-mono text-xs tracking-widest hover:opacity-70"
            style={{ color: "var(--ash)" }}
          >
            <CloseIcon fontSize="small" />
          </button>
        </div>

        {/* Title input */}
        <input
          type="text"
          placeholder="What do you want to talk about?"
          className="w-full px-4 py-3 font-mono text-sm outline-none mb-5 transition-colors"
          style={{
            background: "var(--ink-3)",
            border: "1px solid var(--ink-4)",
            color: "var(--paper)",
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--gold)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--ink-4)")}
          onChange={(e) => settitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && createARoom()}
        />

        {/* Room type */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {ROOM_TYPES.map(({ type, label, desc }) => (
            <button
              key={type}
              onClick={() => setselectRoom(type)}
              className="flex flex-col items-start p-3 transition-all"
              style={{
                border: `1px solid ${selectRoom === type ? "var(--gold)" : "var(--ink-4)"}`,
                background: selectRoom === type ? "rgba(232,184,75,0.06)" : "transparent",
              }}
            >
              <span
                className="font-bebas text-sm tracking-widest mb-0.5"
                style={{ color: selectRoom === type ? "var(--gold)" : "var(--paper)" }}
              >
                {label}
              </span>
              <span className="font-mono text-xs" style={{ color: "var(--ash)" }}>{desc}</span>
            </button>
          ))}
        </div>

        <button
          className="w-full font-bebas tracking-widest text-lg py-3 transition-all hover:opacity-80 disabled:opacity-30"
          style={{ background: "var(--signal)", color: "var(--ink)" }}
          onClick={createARoom}
          disabled={!title.trim() || loading}
        >
          {loading ? "CREATING..." : "LET'S GO 🎙️"}
        </button>
      </div>
    </div>
  );
};

export default StartRoomOverlay;
