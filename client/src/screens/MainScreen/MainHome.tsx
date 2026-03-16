import { Theme } from "../../App";
import { useState, useEffect } from "react";
import RoomCard from "../../components/RoomCard";
import StartRoomOverlay from "../../components/StartRoomOverlay";
import axios from "axios";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { socket } from "../../sockets/socket";

type Props = { primaryTheme: Theme; };
interface Room { _id: string; title: string; owner: string; roomType: string; }

const MainHome = ({ primaryTheme }: Props) => {
  const [search, setSearch] = useState("");
  const [showModal, setshowModal] = useState(false);
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [invites, setInvites] = useState<Room[]>([]);

  const { userName, phoneNumber, email, userProfileUrl } = useSelector(
    (state: { user: { userName: string; phoneNumber: string; email: string; userProfileUrl: string } }) => state.user
  );

  if (!userName) { window.location.href = "/"; return null; }

  const activateUser = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/userActivation/activateUser`, { name: userName, email, userProfileUrl, phoneNumber });
    } catch {}
  };

  const getAllPublicRooms = async () => {
    try {
      const { data: { data } } = await axios.get(`${import.meta.env.VITE_API_URL}/room/getAllRooms`);
      setAllRooms(data);
    } catch {}
  };

  const getPendingInvites = async () => {
    if (!email) return;
    try {
      const { data: { data } } = await axios.get(`${import.meta.env.VITE_API_URL}/room/pendingInvites/${encodeURIComponent(email)}`);
      setInvites(data ?? []);
    } catch {}
  };

  useEffect(() => { getAllPublicRooms(); activateUser(); getPendingInvites(); }, []);

  useEffect(() => {
    socket.on("new-room", (room: Room) => {
      setAllRooms(prev => prev.some(r => r._id === room._id) ? prev : [room, ...prev]);
    });
    return () => { socket.off("new-room"); };
  }, []);

  const filtered = search
    ? allRooms.filter(r => r.title.toLowerCase().includes(search.toLowerCase()))
    : allRooms;

  return (
    <div style={{ background: "var(--ink)" }}>
      {/* Pending invites */}
      {invites.length > 0 && (
        <div
          className="px-5 py-3 flex items-center gap-4 flex-wrap"
          style={{ background: "rgba(232,184,75,0.08)", borderBottom: "1px solid var(--gold-dim)" }}
        >
          <span className="font-mono text-xs tracking-widest" style={{ color: "var(--gold)" }}>
            📬 {invites.length} PENDING INVITE{invites.length > 1 ? "S" : ""}
          </span>
          <div className="flex gap-3 flex-wrap">
            {invites.map(room => (
              <Link
                key={room._id}
                to={`/room/${room._id}`}
                className="font-mono text-xs tracking-widest px-3 py-1 transition-all hover:opacity-80"
                style={{ border: "1px solid var(--gold)", color: "var(--gold)" }}
              >
                {room.title.slice(0, 20)}{room.title.length > 20 ? "…" : ""} →
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-5 py-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <p className="font-mono text-xs tracking-widest mb-2" style={{ color: "var(--ash)" }}>
              — LIVE ROOMS —
            </p>
            <h1 className="font-bebas leading-none" style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)", color: "var(--paper)" }}>
              HEY,{" "}
              <span style={{ color: "var(--gold)" }}>
                {userName.toUpperCase()}
              </span>
            </h1>
            <p className="font-mono text-xs mt-1" style={{ color: "var(--ash)" }}>
              What do you want to talk about today?
            </p>
          </div>
          <button
            className="font-bebas tracking-widest text-base px-6 py-2.5 transition-all hover:opacity-80"
            style={{ background: "var(--signal)", color: "var(--ink)" }}
            onClick={() => setshowModal(true)}
          >
            + START A ROOM
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="SEARCH ROOMS..."
          className="w-full px-4 py-3 font-mono text-xs tracking-widest outline-none mb-8 transition-colors"
          style={{
            background: "var(--ink-2)",
            border: "1px solid var(--ink-4)",
            color: "var(--paper)",
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--gold)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--ink-4)")}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Rooms grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-24">
            <p className="font-bebas text-5xl mb-2" style={{ color: "var(--ink-4)" }}>NO ROOMS YET</p>
            <p className="font-mono text-xs" style={{ color: "var(--ash)" }}>Be the first to start one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filtered.map((room) => (
              <Link to={`/room/${room._id}`} key={room._id}>
                <RoomCard title={room.title} owner={room.owner} />
              </Link>
            ))}
          </div>
        )}
      </div>

      {showModal && <StartRoomOverlay setshowModal={setshowModal} showModal={showModal} primaryTheme={primaryTheme} />}
    </div>
  );
};

export default MainHome;
