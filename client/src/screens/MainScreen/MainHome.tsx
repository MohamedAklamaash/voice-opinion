import { Theme } from "../../App";
import { useState, useEffect } from "react";
import AddIcon from "@mui/icons-material/Add";
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

  const filtered = search ? allRooms.filter(r => r.title.toLowerCase().includes(search.toLowerCase())) : allRooms;

  return (
    <div className="min-h-screen px-4 py-6 max-w-5xl mx-auto">
      {/* Pending invites banner */}
      {invites.length > 0 && (
        <div className="mb-5 bg-primary-indigo/10 border border-primary-indigo rounded-2xl p-4">
          <p className="font-poppins font-semibold text-sm mb-3">📬 You have {invites.length} pending invite{invites.length > 1 ? "s" : ""}</p>
          <div className="flex flex-col gap-2">
            {invites.map(room => (
              <div key={room._id} className="flex items-center justify-between gap-3">
                <span className="font-poppins text-sm truncate">{room.title} <span className="text-secondary-white">by {room.owner}</span></span>
                <Link to={`/room/${room._id}`} className="bg-primary-indigo hover:opacity-90 text-white text-xs font-poppins font-semibold px-3 py-1.5 rounded-full whitespace-nowrap">
                  Join
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-montserrat font-bold text-2xl">
            Hey, {userName.charAt(0).toUpperCase() + userName.slice(1)} 👋
          </h1>
          <p className="text-secondary-white text-sm font-poppins">What do you want to talk about today?</p>
        </div>
        <button
          className="flex items-center gap-2 bg-primary-success hover:opacity-90 transition-opacity px-4 py-2 rounded-full font-poppins font-semibold text-sm"
          onClick={() => setshowModal(true)}
        >
          <AddIcon fontSize="small" /> Start a Room
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="🔍  Search rooms..."
        className={`w-full ${primaryTheme === "dark" ? "bg-secondary-black-600 text-white" : "bg-gray-100 text-black"} px-4 py-3 rounded-xl mb-6 font-poppins text-sm outline-none border border-primary-black-400 focus:border-primary-indigo transition-colors`}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Rooms */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <span className="text-5xl">🎙️</span>
          <p className="text-secondary-white font-poppins mt-4">No rooms yet. Be the first to start one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map((room) => (
            <Link to={`/room/${room._id}`} key={room._id}>
              <RoomCard title={room.title} owner={room.owner} />
            </Link>
          ))}
        </div>
      )}

      {showModal && <StartRoomOverlay setshowModal={setshowModal} showModal={showModal} primaryTheme={primaryTheme} />}
    </div>
  );
};

export default MainHome;
