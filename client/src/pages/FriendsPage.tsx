import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { avatarForName } from "../utils/avatars";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";

interface UserInfo { name: string; email: string; userProfileUrl?: string; }

const API = import.meta.env.VITE_API_URL;

const FriendsPage = () => {
    const { email } = useSelector((state: { user: { email: string } }) => state.user);
    const [friends, setFriends] = useState<UserInfo[]>([]);
    const [pending, setPending] = useState<UserInfo[]>([]);
    const [sent, setSent] = useState<UserInfo[]>([]);
    const [searchQ, setSearchQ] = useState("");
    const [searchResults, setSearchResults] = useState<UserInfo[]>([]);
    const [msg, setMsg] = useState<string | null>(null);

    const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(null), 3000); };

    const load = async () => {
        const enc = encodeURIComponent(email);
        const [f, p, s] = await Promise.all([
            axios.get(`${API}/friends/list/${enc}`),
            axios.get(`${API}/friends/pending/${enc}`),
            axios.get(`${API}/friends/sent/${enc}`),
        ]);
        setFriends(f.data.data ?? []);
        setPending(p.data.data ?? []);
        setSent(s.data.data ?? []);
    };

    useEffect(() => { if (email) load(); }, [email]);

    useEffect(() => {
        if (searchQ.length < 2) { setSearchResults([]); return; }
        const t = setTimeout(async () => {
            const { data } = await axios.get(`${API}/friends/search`, { params: { q: searchQ, email } });
            setSearchResults(data.data ?? []);
        }, 300);
        return () => clearTimeout(t);
    }, [searchQ]);

    const sendRequest = async (toEmail: string) => {
        try {
            await axios.post(`${API}/friends/request`, { from: email, to: toEmail });
            flash("Friend request sent!");
            setSearchQ("");
            setSearchResults([]);
            load();
        } catch (e: any) {
            flash(e.response?.data?.msg ?? "Failed to send request");
        }
    };

    const respond = async (fromEmail: string, action: "accepted" | "rejected") => {
        await axios.put(`${API}/friends/respond`, { email, fromEmail, action });
        flash(action === "accepted" ? "Friend added!" : "Request declined.");
        load();
    };

    const alreadyConnected = (u: UserInfo) =>
        friends.some(f => f.email === u.email) ||
        sent.some(s => s.email === u.email) ||
        pending.some(p => p.email === u.email);

    return (
        <div className="max-w-2xl mx-auto px-5 py-8" style={{ background: "var(--ink)" }}>
            <p className="font-mono text-xs tracking-widest mb-2" style={{ color: "var(--ash)" }}>— SOCIAL —</p>
            <h1 className="font-bebas text-5xl mb-6" style={{ color: "var(--paper)" }}>FRIENDS</h1>

            {msg && (
                <p className="font-mono text-xs mb-4 px-3 py-2" style={{ background: "rgba(232,184,75,0.1)", color: "var(--gold)", border: "1px solid var(--gold-dim)" }}>
                    {msg}
                </p>
            )}

            {/* Search */}
            <div className="mb-8">
                <p className="font-mono text-xs tracking-widest mb-2" style={{ color: "var(--ash)" }}>FIND PEOPLE</p>
                <input
                    type="text"
                    placeholder="Search by username..."
                    value={searchQ}
                    onChange={e => setSearchQ(e.target.value)}
                    className="w-full px-4 py-3 font-mono text-sm outline-none transition-colors"
                    style={{ background: "var(--ink-2)", border: "1px solid var(--ink-4)", color: "var(--paper)" }}
                    onFocus={e => (e.target.style.borderColor = "var(--gold)")}
                    onBlur={e => (e.target.style.borderColor = "var(--ink-4)")}
                />
                {searchResults.length > 0 && (
                    <div style={{ border: "1px solid var(--ink-4)", background: "var(--ink-2)" }}>
                        {searchResults.map(u => (
                            <div key={u.email} className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--ink-4)" }}>
                                <div className="flex items-center gap-3">
                                    <img src={u.userProfileUrl || avatarForName(u.name)} className="w-8 h-8 rounded-full object-cover" alt={u.name} />
                                    <span className="font-mono text-sm" style={{ color: "var(--paper)" }}>{u.name}</span>
                                </div>
                                {alreadyConnected(u) ? (
                                    <span className="font-mono text-xs" style={{ color: "var(--ash)" }}>PENDING / FRIEND</span>
                                ) : (
                                    <button onClick={() => sendRequest(u.email)} className="flex items-center gap-1 font-mono text-xs px-3 py-1 transition-all hover:opacity-80" style={{ background: "var(--gold)", color: "var(--ink)" }}>
                                        <PersonAddIcon sx={{ fontSize: 14 }} /> ADD
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Pending requests */}
            {pending.length > 0 && (
                <div className="mb-8">
                    <p className="font-mono text-xs tracking-widest mb-3" style={{ color: "var(--ash)" }}>
                        INCOMING REQUESTS · {pending.length}
                    </p>
                    {pending.map(u => (
                        <div key={u.email} className="flex items-center justify-between px-4 py-3 mb-2" style={{ border: "1px solid var(--ink-4)", background: "var(--ink-2)" }}>
                            <div className="flex items-center gap-3">
                                <img src={u.userProfileUrl || avatarForName(u.name)} className="w-8 h-8 rounded-full object-cover" alt={u.name} />
                                <span className="font-mono text-sm" style={{ color: "var(--paper)" }}>{u.name}</span>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => respond(u.email, "accepted")} className="flex items-center gap-1 font-mono text-xs px-3 py-1 hover:opacity-80" style={{ background: "var(--signal)", color: "var(--ink)" }}>
                                    <CheckIcon sx={{ fontSize: 14 }} /> ACCEPT
                                </button>
                                <button onClick={() => respond(u.email, "rejected")} className="flex items-center gap-1 font-mono text-xs px-3 py-1 hover:opacity-80" style={{ background: "var(--ink-4)", color: "var(--paper)" }}>
                                    <CloseIcon sx={{ fontSize: 14 }} /> DECLINE
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Friends list */}
            <div className="mb-8">
                <p className="font-mono text-xs tracking-widest mb-3" style={{ color: "var(--ash)" }}>
                    YOUR FRIENDS · {friends.length}
                </p>
                {friends.length === 0 ? (
                    <p className="font-mono text-xs" style={{ color: "var(--ink-5)" }}>No friends yet. Search for people above.</p>
                ) : (
                    friends.map(u => (
                        <div key={u.email} className="flex items-center gap-3 px-4 py-3 mb-2" style={{ border: "1px solid var(--ink-4)", background: "var(--ink-2)" }}>
                            <img src={u.userProfileUrl || avatarForName(u.name)} className="w-8 h-8 rounded-full object-cover" alt={u.name} />
                            <span className="font-mono text-sm" style={{ color: "var(--paper)" }}>{u.name}</span>
                        </div>
                    ))
                )}
            </div>

            {/* Sent requests */}
            {sent.length > 0 && (
                <div>
                    <p className="font-mono text-xs tracking-widest mb-3" style={{ color: "var(--ash)" }}>
                        SENT REQUESTS · {sent.length}
                    </p>
                    {sent.map(u => (
                        <div key={u.email} className="flex items-center gap-3 px-4 py-3 mb-2" style={{ border: "1px solid var(--ink-4)", background: "var(--ink-2)" }}>
                            <img src={u.userProfileUrl || avatarForName(u.name)} className="w-8 h-8 rounded-full object-cover" alt={u.name} />
                            <span className="font-mono text-sm" style={{ color: "var(--paper)" }}>{u.name}</span>
                            <span className="font-mono text-xs ml-auto" style={{ color: "var(--ash)" }}>PENDING</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FriendsPage;
