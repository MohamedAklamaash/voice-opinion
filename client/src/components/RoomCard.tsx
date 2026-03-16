import DummyLogo from "../assets/DummyLogo.jpeg";
import PeopleIcon from "@mui/icons-material/People";

type Props = { title: string; owner: string; };

const RoomCard = ({ title, owner }: Props) => (
  <div className="bg-secondary-black-600 hover:bg-primary-black-400 transition-colors rounded-2xl p-4 w-full cursor-pointer">
    <h2 className="font-montserrat font-bold text-base text-white mb-3 line-clamp-2">{title}</h2>
    <div className="flex items-center gap-2">
      <img src={DummyLogo} alt={owner} className="w-7 h-7 rounded-full object-cover" />
      <span className="font-poppins text-xs text-secondary-white truncate">{owner}</span>
    </div>
    <div className="flex items-center gap-1 mt-2 text-secondary-white">
      <PeopleIcon sx={{ fontSize: 14 }} />
      <span className="font-poppins text-xs">Live</span>
      <span className="w-2 h-2 rounded-full bg-primary-success ml-1 animate-pulse" />
    </div>
  </div>
);

export default RoomCard;
