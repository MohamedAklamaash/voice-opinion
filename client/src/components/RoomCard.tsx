import { avatarForName } from "../utils/avatars";

type Props = { title: string; owner: string; };

const RoomCard = ({ title, owner }: Props) => (
  <div
    className="group p-4 cursor-pointer transition-all hover:-translate-y-0.5"
    style={{ background: "var(--ink-2)", border: "1px solid var(--ink-4)" }}
    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--gold)")}
    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--ink-4)")}
  >
    <div className="flex items-center gap-1.5 mb-3">
      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--signal)" }} />
      <span className="font-mono text-xs tracking-widest" style={{ color: "var(--signal)" }}>LIVE</span>
    </div>
    <h2 className="font-bebas text-xl leading-tight mb-4 line-clamp-2" style={{ color: "var(--paper)" }}>
      {title}
    </h2>
    <div className="flex items-center gap-2">
      <img src={avatarForName(owner)} alt={owner} className="w-6 h-6 rounded-full object-cover" style={{ border: "1px solid var(--ink-5)" }} />
      <span className="font-mono text-xs truncate" style={{ color: "var(--ash)" }}>{owner}</span>
    </div>
  </div>
);

export default RoomCard;
