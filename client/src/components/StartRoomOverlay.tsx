import { Theme } from "../App";
import { useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { socket } from "../sockets/socket";
import { socketActions } from "../constants/Actions";
import PeopleIcon from "@mui/icons-material/People";
import PublicIcon from "@mui/icons-material/Public";
import LockIcon from "@mui/icons-material/Lock";
import CloseIcon from "@mui/icons-material/Close";

type Props = {
  setshowModal: (v: boolean) => void;
  showModal: boolean;
  primaryTheme: Theme;
};

type RoomType = "social" | "public" | "private";

const ROOM_TYPES: { type: RoomType; label: string; desc: string; icon: React.ReactNode }[] = [
  { type: "social", label: "Social", desc: "Friends & followers", icon: <PeopleIcon /> },
  { type: "public", label: "Public", desc: "Open to everyone", icon: <PublicIcon /> },
  { type: "private", label: "Private", desc: "Invite only", icon: <LockIcon /> },
];

const StartRoomOverlay = ({ setshowModal, showModal, primaryTheme: _p }: Props) => {
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 px-4 pb-4 sm:pb-0">
      <div className="bg-primary-black-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-montserrat font-bold text-xl">Start a Room</h2>
          <button onClick={() => setshowModal(!showModal)} className="p-1 rounded-full hover:bg-secondary-black-600">
            <CloseIcon fontSize="small" />
          </button>
        </div>
        <input
          type="text"
          placeholder="What do you want to talk about?"
          className="w-full bg-secondary-black-600 text-white px-4 py-3 rounded-xl mb-5 font-poppins text-sm outline-none border border-primary-black-400 focus:border-primary-indigo transition-colors"
          onChange={(e) => settitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && createARoom()}
        />
        <div className="grid grid-cols-3 gap-3 mb-6">
          {ROOM_TYPES.map(({ type, label, desc, icon }) => (
            <button
              key={type}
              onClick={() => setselectRoom(type)}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                selectRoom === type ? "border-primary-indigo bg-primary-indigo/10" : "border-primary-black-400 hover:border-primary-indigo/50"
              }`}
            >
              <span className={selectRoom === type ? "text-primary-indigo" : "text-secondary-white"}>{icon}</span>
              <span className="font-poppins text-xs font-semibold">{label}</span>
              <span className="font-poppins text-xs text-secondary-white">{desc}</span>
            </button>
          ))}
        </div>
        <button
          className="w-full bg-primary-success hover:opacity-90 transition-opacity rounded-full py-3 font-montserrat font-bold disabled:opacity-50"
          onClick={createARoom}
          disabled={!title.trim() || loading}
        >
          {loading ? "Creating..." : "Let's Go 🎙️"}
        </button>
      </div>
    </div>
  );
};

export default StartRoomOverlay;
