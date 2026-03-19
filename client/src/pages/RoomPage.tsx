import { useEffect, useState, FC, useRef } from "react";
import { Theme } from "../App";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useSelector } from "react-redux";
import MicOutlinedIcon from "@mui/icons-material/MicOutlined";
import MicOffIcon from "@mui/icons-material/MicOff";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import PushPinIcon from "@mui/icons-material/PushPin";
import { avatarForName } from "../utils/avatars";
import { socket } from "../sockets/socket";
import { socketActions } from "../constants/Actions";
import ChatPanel from "../components/ChatPanel";

interface Props { primaryTheme: Theme; }
interface RoomData { owner: string; title: string; speakers: string[]; roomType: string; invitedEmails?: string[]; acceptedEmails?: string[]; }
interface User { name: string; userProfileUrl?: string; _id?: string; isMuted?: boolean; socketId?: string; }

const ICE_SERVERS: RTCIceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
];

const VoiceBars: FC<{ active: boolean }> = ({ active }) => {
    if (!active) return null;
    return (
        <div className="flex items-end gap-[2px] h-4">
            {[1, 2, 3, 4, 3, 2, 1].map((h, i) => (
                <div
                    key={i}
                    style={{
                        width: "2px",
                        height: `${h * 3}px`,
                        background: "var(--signal)",
                        animation: `bar-dance ${0.4 + i * 0.07}s ease-in-out infinite`,
                        animationDelay: `${i * 0.05}s`,
                    }}
                />
            ))}
        </div>
    );
};

const RoomPage: FC<Props> = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [roomData, setRoomData] = useState<RoomData>({ owner: "", title: "", speakers: [], roomType: "public" });
    const [userData, setUserData] = useState<User[]>([]);
    const [inRoom, setInRoom] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteStatus, setInviteStatus] = useState<string | null>(null);
    const [inviteListOpen, setInviteListOpen] = useState(false);
    const [friendPickerOpen, setFriendPickerOpen] = useState(false);
    const [friends, setFriends] = useState<{ name: string; email: string; userProfileUrl?: string }[]>([]);
    const [friendSearch, setFriendSearch] = useState("");
    const [pinnedUser, setPinnedUser] = useState<string | null>(null);

    const { userName, email, userProfileUrl } = useSelector(
        (state: { user: { userName: string; email: string; userProfileUrl: string } }) => state.user
    );

    const pcs = useRef<Record<string, RTCPeerConnection>>({});
    const localStream = useRef<MediaStream | null>(null);
    const audioEls = useRef<Record<string, HTMLAudioElement>>({});
    const videoEls = useRef<Record<string, HTMLVideoElement>>({});
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const isMutedRef = useRef(false);
    const [isVideoOn, setIsVideoOn] = useState(false);

    useEffect(() => {
        if (!userName) navigate(`/signIn?redirect=/room/${id}`);
    }, [userName]);

    const createPC = (peerId: string): RTCPeerConnection => {
        if (pcs.current[peerId]) return pcs.current[peerId];

        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

        pc.onicecandidate = ({ candidate }) => {
            if (candidate) {
                console.log("[ICE] sending candidate to", peerId);
                socket.emit(socketActions.RELAY_ICE, { iceCandidate: candidate, peerId });
            }
        };

        pc.oniceconnectionstatechange = () =>
            console.log(`[ICE state ${peerId}]`, pc.iceConnectionState);

        pc.ontrack = (e) => {
            console.log("[ontrack] from", peerId, "track kind:", e.track.kind);
            const stream = e.streams[0] ?? new MediaStream([e.track]);

            if (e.track.kind === "audio") {
                let el = audioEls.current[peerId];
                if (!el) {
                    el = document.createElement("audio");
                    el.autoplay = true;
                    (el as any).playsInline = true;
                    document.body.appendChild(el);
                    audioEls.current[peerId] = el;
                }
                el.srcObject = stream;
                el.play().catch(err => console.error("[audio play]", err));
            } else if (e.track.kind === "video") {
                let el = videoEls.current[peerId];
                if (!el) {
                    el = document.createElement("video");
                    el.autoplay = true;
                    el.playsInline = true;
                    el.muted = true;
                    videoEls.current[peerId] = el;
                }
                el.srcObject = stream;
                setUserData(prev => [...prev]);
            }
        };

        pcs.current[peerId] = pc;
        return pc;
    };

    const addTracks = (pc: RTCPeerConnection) => {
        if (!localStream.current) { console.warn("[addTracks] no local stream yet"); return; }
        const existingSenders = pc.getSenders().map(s => s.track);
        localStream.current.getTracks().forEach(track => {
            if (!existingSenders.includes(track)) {
                console.log("[addTracks] adding track", track.kind);
                pc.addTrack(track, localStream.current!);
            }
        });
    };

    const closePC = (peerId: string) => {
        pcs.current[peerId]?.close();
        delete pcs.current[peerId];
        const audio = audioEls.current[peerId];
        if (audio) { audio.srcObject = null; audio.remove(); delete audioEls.current[peerId]; }
        const video = videoEls.current[peerId];
        if (video) { video.srcObject = null; delete videoEls.current[peerId]; }
    };

    useEffect(() => {
        const init = async () => {
            await axios.post(`${import.meta.env.VITE_API_URL}/userActivation/activateUser`, {
                name: userName, email, userProfileUrl,
            }).catch(() => {});

            const { data: { data, userData: users, success } } = await axios.get<{ data: RoomData; userData: User[]; success: boolean }>(
                `${import.meta.env.VITE_API_URL}/room/getRoomDetails/${id}`
            );
            if (!success) { navigate("/home"); return; }
            setRoomData(data);
            if (data.roomType === "social") {
                axios.get(`${import.meta.env.VITE_API_URL}/friends/list/${encodeURIComponent(email)}`)
                    .then(r => setFriends(r.data.data ?? []))
                    .catch(() => {});
            }
            const alreadyIn = data.speakers.includes(userName);
            if (alreadyIn) {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                    localStream.current = stream;
                    const me = users.find(u => u.name === userName);
                    socket.emit(socketActions.JOIN, { roomId: id, user: me ?? { name: userName, email, userProfileUrl } });
                    setInRoom(true);
                } catch (err) {
                    console.error("[auto-join mic]", err);
                    setInRoom(true);
                }
            }
        };
        init().catch(console.error);
    }, [id]);

    useEffect(() => {
            const onExistingPeers = async ({ peers }: { peers: { peerId: string; peerUser: User }[] }) => {
            console.log("[existing-peers]", peers.length, "peers");
            for (const { peerId, peerUser } of peers) {
                if (!peerUser?.name) continue;
                setUserData(prev =>
                    prev.some(u => u.name === peerUser.name)
                        ? prev.map(u => u.name === peerUser.name ? { ...u, socketId: peerId } : u)
                        : [...prev, { ...peerUser, socketId: peerId }]
                );
                const pc = createPC(peerId);
                addTracks(pc);
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                console.log("[offer] sending to", peerId);
                socket.emit(socketActions.RELAY_SDP, { sessionDescription: offer, peerId });
            }
        };

        const onNewPeer = ({ peerId, peerUser }: { peerId: string; peerUser: User; createOffer: boolean }) => {
            console.log("[new-peer]", peerId);
            if (!peerUser?.name) return;
            setUserData(prev =>
                prev.some(u => u.name === peerUser.name)
                    ? prev.map(u => u.name === peerUser.name ? { ...u, socketId: peerId } : u)
                    : [...prev, { ...peerUser, socketId: peerId }]
            );
            const pc = createPC(peerId);
            addTracks(pc);
        };

        const onSDP = async ({ peerId, sessionDescription }: { peerId: string; sessionDescription: RTCSessionDescriptionInit }) => {
            console.log("[sdp]", sessionDescription.type, "from", peerId);
            const pc = pcs.current[peerId];

            if (sessionDescription.type === "answer") {
                if (!pc || pc.signalingState !== "have-local-offer") {
                    console.warn("[sdp] ignoring answer — no pending offer for", peerId);
                    return;
                }
                await pc.setRemoteDescription(new RTCSessionDescription(sessionDescription));
                return;
            }

            const targetPc = pc ?? createPC(peerId);
            if (!pc) addTracks(targetPc);
            addTracks(targetPc);
            await targetPc.setRemoteDescription(new RTCSessionDescription(sessionDescription));
            const answer = await targetPc.createAnswer();
            await targetPc.setLocalDescription(answer);
            console.log("[answer] sending to", peerId);
            socket.emit(socketActions.RELAY_SDP, { sessionDescription: answer, peerId });
        };

        const onICE = ({ peerId, iceCandidate }: { peerId: string; iceCandidate: RTCIceCandidateInit }) => {
            pcs.current[peerId]?.addIceCandidate(new RTCIceCandidate(iceCandidate))
                .catch(e => console.error("[addIceCandidate]", e));
        };

        const preserveMyMute = (users: User[]) =>
            users.filter(u => u.name).map(u =>
                u.name === userName ? { ...u, isMuted: isMutedRef.current } : u
            );

        const onJoin = ({ users }: { users: User[] }) => {
            setUserData(Array.from(new Map(preserveMyMute(users).map(u => [u.name, u])).values()));
        };

        const onLeave = ({ users }: { users: User[] }) => {
            const currentIds = new Set(users.map(u => u.socketId).filter(Boolean));
            Object.keys(pcs.current).forEach(pid => { if (!currentIds.has(pid)) closePC(pid); });
            setUserData(users);
        };

        const onMuteInfo = ({ users }: { users: User[] }) => setUserData(preserveMyMute(users));
        const onRemovePeer = ({ users }: { users: User[] }) => setUserData(users);
        const onKicked = () => { void doLeave(); navigate("/home"); };
        const onRoomUpdated = ({ invitedEmails, acceptedEmails }: { invitedEmails: string[]; acceptedEmails: string[] }) => {
            setRoomData(prev => ({ ...prev, invitedEmails, acceptedEmails }));
        };

        socket.on("existing-peers", onExistingPeers);
        socket.on("new-peer", onNewPeer);
        socket.on(socketActions.SESSION_DESCRIPTION, onSDP);
        socket.on(socketActions.ICE_CANDIDATE, onICE);
        socket.on(socketActions.JOIN, onJoin);
        socket.on(socketActions.LEAVE, onLeave);
        socket.on(socketActions.MUTE_INFO, onMuteInfo);
        socket.on(socketActions.REMOVE_PEER, onRemovePeer);
        socket.on(socketActions.ROOM_UPDATED, onRoomUpdated);
        socket.on("kicked", onKicked);

        return () => {
            socket.off("existing-peers", onExistingPeers);
            socket.off("new-peer", onNewPeer);
            socket.off(socketActions.SESSION_DESCRIPTION, onSDP);
            socket.off(socketActions.ICE_CANDIDATE, onICE);
            socket.off(socketActions.JOIN, onJoin);
            socket.off(socketActions.LEAVE, onLeave);
            socket.off(socketActions.MUTE_INFO, onMuteInfo);
            socket.off(socketActions.REMOVE_PEER, onRemovePeer);
            socket.off(socketActions.ROOM_UPDATED, onRoomUpdated);
            socket.off("kicked", onKicked);
        };
    }, []); // empty deps — handlers use refs, no stale closure issues

    const joinRoom = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            localStream.current = stream;
            console.log("[joinRoom] mic acquired, tracks:", stream.getTracks().length);

            const { data: { userData: u } } = await axios.put(
                `${import.meta.env.VITE_API_URL}/room/joinRoom/${id}`, { email }
            );
            socket.emit(socketActions.JOIN, { roomId: id, user: u });
            setInRoom(true);
        } catch (err) {
            console.error("[joinRoom]", err);
        }
    };

    const doLeave = async () => {
        localStream.current?.getTracks().forEach(t => t.stop());
        localStream.current = null;
        if (localVideoRef.current) localVideoRef.current.srcObject = null;
        setIsVideoOn(false);
        Object.keys(pcs.current).forEach(closePC);
        try {
            const { data: { userData: u } } = await axios.put(
                `${import.meta.env.VITE_API_URL}/room/leaveRoom/${id}`, { email }
            );
            socket.emit(socketActions.LEAVE, { user: u, roomId: id });
        } catch { /* ignore */ }
        setInRoom(false);
    };

    const leaveRoom = async () => { await doLeave(); navigate("/home"); };

    const toggleMute = () => {
        if (!localStream.current) return;
        const next = !isMuted;
        localStream.current.getAudioTracks().forEach(t => { t.enabled = !next; });
        setIsMuted(next);
        isMutedRef.current = next;
        setUserData(prev => prev.map(u => u.name === userName ? { ...u, isMuted: next } : u));
        const self = userData.find(u => u.name === userName);
        if (self?._id) socket.emit(socketActions.MUTE, { roomId: id, userId: String(self._id) });
    };

    const toggleVideo = async () => {
        if (!inRoom) return;
        if (isVideoOn) {
            localStream.current?.getVideoTracks().forEach(t => { t.stop(); localStream.current!.removeTrack(t); });
            Object.values(pcs.current).forEach(pc => {
                pc.getSenders().filter(s => s.track?.kind === "video").forEach(s => pc.removeTrack(s));
            });
            if (localVideoRef.current) localVideoRef.current.srcObject = null;
            setIsVideoOn(false);
        } else {
            try {
                const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
                const videoTrack = videoStream.getVideoTracks()[0];
                localStream.current?.addTrack(videoTrack);
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = new MediaStream([videoTrack]);
                }
                // Add video track to all existing PCs
                Object.values(pcs.current).forEach(pc => {
                    pc.addTrack(videoTrack, localStream.current!);
                });
                setIsVideoOn(true);
            } catch (err) {
                console.error("[toggleVideo]", err);
            }
        }
    };

    const deleteRoom = async () => {
        await axios.delete(`${import.meta.env.VITE_API_URL}/room/deleteARoom/${id}`);
        await doLeave();
        navigate("/home");
    };

    const removeUser = (user: User) => {
        if (user._id) socket.emit(socketActions.REMOVE_PEER, { peerId: user._id, userName, roomId: id });
    };

    const sendInvite = async () => {
        if (!inviteEmail.trim()) return;
        const target = inviteEmail.trim();
        try {
            const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/room/invite/${id}`, {
                ownerEmail: email, inviteEmail: target
            });
            if (data.success) {
                setInviteEmail("");
                setRoomData(prev => ({
                    ...prev,
                    invitedEmails: prev.invitedEmails?.includes(target)
                        ? prev.invitedEmails
                        : [...(prev.invitedEmails ?? []), target],
                }));
                setInviteStatus(data.emailFailed ? "⚠️ Invited, but email delivery failed." : "✓ Invite sent!");
            } else {
                setInviteStatus(data.msg);
            }
        } catch { setInviteStatus("Failed to send invite."); }
        setTimeout(() => setInviteStatus(null), 4000);
    };

    const isOwner = roomData.owner === userName;

    if (!userName) return null;

    return (
        <div className="pb-28" style={{ background: "var(--ink)" }}>
            <div className="max-w-4xl mx-auto px-5 py-8">
                {/* Room header */}
                <div
                    className="p-5 mb-8"
                    style={{ border: "1px solid var(--ink-4)", background: "var(--ink-2)" }}
                >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <p className="font-mono text-xs tracking-widest mb-2" style={{ color: "var(--ash)" }}>
                                HOSTED BY{" "}
                                <span style={{ color: "var(--gold)" }}>{roomData.owner.toUpperCase()}</span>
                            </p>
                            <h1 className="font-bebas text-4xl leading-tight" style={{ color: "var(--paper)" }}>
                                {roomData.title}
                            </h1>
                            <div className="flex items-center gap-1.5 mt-2">
                                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--signal)" }} />
                                <span className="font-mono text-xs tracking-widest" style={{ color: "var(--signal)" }}>
                                    LIVE · {roomData.roomType.toUpperCase()}
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-2 flex-wrap items-center">
                            {isOwner ? (
                                <button
                                    onClick={deleteRoom}
                                    className="font-bebas tracking-widest text-sm px-5 py-2 transition-all hover:opacity-80"
                                    style={{ background: "var(--danger)", color: "var(--paper)" }}
                                >
                                    END ROOM
                                </button>
                            ) : (
                                <button
                                    onClick={inRoom ? leaveRoom : joinRoom}
                                    className="font-bebas tracking-widest text-sm px-5 py-2 transition-all hover:opacity-80"
                                    style={{
                                        background: inRoom ? "var(--danger)" : "var(--signal)",
                                        color: "var(--ink)",
                                    }}
                                >
                                    {inRoom ? "LEAVE" : "JOIN ROOM 🎙️"}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Invite UI — owner only, non-public rooms */}
                    {isOwner && roomData.roomType !== "public" && (
                        <div className="mt-4">
                            {/* Social: collapsible friend picker */}
                            {roomData.roomType === "social" ? (
                                <div>
                                    <button
                                        onClick={() => setFriendPickerOpen(o => !o)}
                                        className="flex items-center gap-2 font-mono text-xs tracking-widest hover:opacity-70 mb-2"
                                        style={{ color: "var(--gold)" }}
                                    >
                                        <span>{friendPickerOpen ? "▾" : "▸"}</span>
                                        INVITE A FRIEND
                                    </button>
                                    {friendPickerOpen && (
                                        <div style={{ border: "1px solid var(--ink-4)", background: "var(--ink-3)" }}>
                                            <input
                                                type="text"
                                                placeholder="Search friends..."
                                                value={friendSearch}
                                                onChange={e => setFriendSearch(e.target.value)}
                                                autoFocus
                                                className="w-full px-3 py-2 font-mono text-xs outline-none"
                                                style={{ background: "transparent", borderBottom: "1px solid var(--ink-4)", color: "var(--paper)" }}
                                            />
                                            <div className="max-h-40 overflow-y-auto">
                                                {friends
                                                    .filter(f =>
                                                        !friendSearch.trim() ||
                                                        f.name.toLowerCase().includes(friendSearch.toLowerCase())
                                                    )
                                                    .map(f => (
                                                        <button
                                                            key={f.email}
                                                            onClick={() => {
                                                                setInviteEmail(f.email);
                                                                setFriendPickerOpen(false);
                                                                setFriendSearch("");
                                                            }}
                                                            className="w-full flex items-center gap-3 px-3 py-2 text-left hover:opacity-70 transition-opacity"
                                                            style={{ borderBottom: "1px solid var(--ink-4)" }}
                                                        >
                                                            <img src={f.userProfileUrl || avatarForName(f.name)} className="w-6 h-6 rounded-full object-cover flex-shrink-0" alt={f.name} />
                                                            <span className="font-mono text-xs" style={{ color: "var(--paper)" }}>{f.name}</span>
                                                        </button>
                                                    ))
                                                }
                                                {friends.filter(f => !friendSearch.trim() || f.name.toLowerCase().includes(friendSearch.toLowerCase())).length === 0 && (
                                                    <p className="font-mono text-xs px-3 py-2" style={{ color: "var(--ink-5)" }}>No friends found.</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {/* Show selected friend + send button */}
                                    {inviteEmail && (
                                        <div className="flex gap-2 mt-2">
                                            <div className="flex-1 px-3 py-2 font-mono text-xs" style={{ background: "var(--ink-3)", border: "1px solid var(--gold)", color: "var(--gold)" }}>
                                                {inviteEmail}
                                            </div>
                                            <button
                                                onClick={sendInvite}
                                                className="font-bebas tracking-widest text-sm px-4 py-2 transition-all hover:opacity-80"
                                                style={{ background: "var(--gold)", color: "var(--ink)" }}
                                            >
                                                INVITE
                                            </button>
                                            <button
                                                onClick={() => setInviteEmail("")}
                                                className="font-mono text-xs px-2 hover:opacity-70"
                                                style={{ color: "var(--ash)" }}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* Private: plain email input */
                                <div className="flex gap-2">
                                    <input
                                        type="email"
                                        placeholder="Invite by email..."
                                        value={inviteEmail}
                                        onChange={e => setInviteEmail(e.target.value)}
                                        onKeyDown={e => e.key === "Enter" && sendInvite()}
                                        className="flex-1 px-3 py-2 font-mono text-xs outline-none transition-colors"
                                        style={{ background: "var(--ink-3)", border: "1px solid var(--ink-4)", color: "var(--paper)" }}
                                        onFocus={e => (e.target.style.borderColor = "var(--gold)")}
                                        onBlur={e => (e.target.style.borderColor = "var(--ink-4)")}
                                    />
                                    <button
                                        onClick={sendInvite}
                                        disabled={!inviteEmail.trim()}
                                        className="font-bebas tracking-widest text-sm px-4 py-2 transition-all hover:opacity-80 disabled:opacity-30"
                                        style={{ background: "var(--gold)", color: "var(--ink)" }}
                                    >
                                        INVITE
                                    </button>
                                </div>
                            )}

                            {inviteStatus && (
                                <p className="font-mono text-xs mt-2" style={{ color: inviteStatus.startsWith("⚠️") ? "var(--gold)" : inviteStatus.startsWith("✓") ? "var(--signal)" : "var(--danger)" }}>
                                    {inviteStatus}
                                </p>
                            )}

                            {/* Collapsible invite status list */}
                            {((roomData.invitedEmails?.length ?? 0) + (roomData.acceptedEmails?.length ?? 0)) > 0 && (
                                <div className="mt-3">
                                    <button
                                        onClick={() => setInviteListOpen(o => !o)}
                                        className="flex items-center gap-2 font-mono text-xs tracking-widest hover:opacity-70"
                                        style={{ color: "var(--ash)" }}
                                    >
                                        <span>{inviteListOpen ? "▾" : "▸"}</span>
                                        INVITE STATUS · {(roomData.invitedEmails?.length ?? 0) + (roomData.acceptedEmails?.length ?? 0)}
                                    </button>
                                    {inviteListOpen && (
                                        <div className="mt-2 flex flex-col gap-1">
                                            {(roomData.acceptedEmails ?? []).map(e => (
                                                <div key={e} className="flex items-center justify-between px-3 py-1.5 font-mono text-xs" style={{ background: "rgba(61,220,132,0.06)", border: "1px solid rgba(61,220,132,0.2)" }}>
                                                    <span style={{ color: "var(--paper)" }}>{e}</span>
                                                    <span style={{ color: "var(--signal)" }}>✓ JOINED</span>
                                                </div>
                                            ))}
                                            {(roomData.invitedEmails ?? []).map(e => (
                                                <div key={e} className="flex items-center justify-between px-3 py-1.5 font-mono text-xs" style={{ background: "rgba(232,184,75,0.04)", border: "1px solid var(--ink-4)" }}>
                                                    <span style={{ color: "var(--paper)" }}>{e}</span>
                                                    <span style={{ color: "var(--ash)" }}>⏳ PENDING</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Speakers label */}
                <p className="font-mono text-xs tracking-widest mb-5" style={{ color: "var(--ash)" }}>
                    — SPEAKERS · {userData.length} —
                </p>

                {/* Speakers grid */}
                {(() => {
                    const users = Array.from(new Map(userData.filter(u => u.name).map(u => [u.socketId ?? u._id ?? u.name, u])).values());
                    const pinned = pinnedUser ? users.find(u => (u.socketId ?? u._id ?? u.name) === pinnedUser) : null;
                    const rest = pinned ? users.filter(u => (u.socketId ?? u._id ?? u.name) !== pinnedUser) : users;

                    const renderTile = (user: User, large = false) => {
                        const isMe = user.name === userName;
                        const speaking = inRoom && !user.isMuted;
                        const hasVideo = isMe ? isVideoOn : !!videoEls.current[user.socketId ?? ""];
                        const key = user.socketId ?? user._id ?? user.name;
                        const isPinned = pinnedUser === key;
                        return (
                            <div
                                key={key}
                                className="relative overflow-hidden"
                                style={{
                                    aspectRatio: "1 / 1",
                                    background: "var(--ink-3)",
                                    border: `2px solid ${speaking ? "var(--signal)" : "var(--ink-4)"}`,
                                    boxShadow: speaking ? "0 0 0 2px var(--signal)" : "none",
                                    transition: "border-color 0.2s, box-shadow 0.2s",
                                }}
                            >
                                {hasVideo ? (
                                    <video
                                        ref={isMe ? localVideoRef : (el) => { if (el && user.socketId && videoEls.current[user.socketId]) el.srcObject = videoEls.current[user.socketId].srcObject; }}
                                        autoPlay playsInline muted={isMe}
                                        className="absolute inset-0 w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <img
                                            src={user.userProfileUrl || avatarForName(user.name)}
                                            alt={user.name}
                                            className={`${large ? "w-28 h-28" : "w-16 h-16"} rounded-full object-cover`}
                                            style={{ border: `2px solid ${speaking ? "var(--signal)" : "var(--ink-4)"}` }}
                                        />
                                    </div>
                                )}
                                {/* Bottom bar */}
                                <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-2 py-1.5" style={{ background: "rgba(0,0,0,0.55)" }}>
                                    <span className="font-mono text-xs truncate" style={{ color: "var(--paper)" }}>
                                        {isMe ? "YOU" : user.name.slice(0, 12) + (user.name.length > 12 ? "…" : "")}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        {speaking && <VoiceBars active />}
                                        {user.isMuted && <MicOffIcon sx={{ fontSize: 13, color: "#e84040" }} />}
                                        <button
                                            onClick={() => setPinnedUser(isPinned ? null : key)}
                                            className="hover:opacity-70"
                                            style={{ color: isPinned ? "var(--gold)" : "var(--ash)", lineHeight: 0 }}
                                            title={isPinned ? "Unpin" : "Pin"}
                                        >
                                            <PushPinIcon sx={{ fontSize: 13 }} />
                                        </button>
                                        {isOwner && !isMe && (
                                            <button onClick={() => removeUser(user)} className="hover:opacity-70" style={{ color: "var(--danger)", lineHeight: 0 }}>
                                                <PersonRemoveIcon sx={{ fontSize: 13 }} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    };

                    return (
                        <div className="flex flex-col gap-3">
                            {pinned && (
                                <div className="grid grid-cols-1">
                                    {renderTile(pinned, true)}
                                </div>
                            )}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {rest.map(u => renderTile(u, false))}
                            </div>
                        </div>
                    );
                })()}

                {/* Chat */}
                <div className="mt-8">
                    <ChatPanel
                        roomId={id!}
                        roomType={roomData.roomType}
                        currentUserName={userName}
                        currentUserId={userData.find(u => u.name === userName)?._id ?? userName}
                        currentUserAvatar={userProfileUrl}
                        inRoom={inRoom}
                    />
                </div>
            </div>

            {/* Floating controls */}
            {inRoom && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex gap-2">
                    <button
                        onClick={toggleMute}
                        className="flex items-center gap-2 px-7 py-3 font-bebas tracking-widest text-base transition-all hover:opacity-80"
                        style={{ background: isMuted ? "var(--danger)" : "var(--gold)", color: "var(--ink)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}
                    >
                        {isMuted ? <MicOffIcon fontSize="small" /> : <MicOutlinedIcon fontSize="small" />}
                        {isMuted ? "UNMUTE" : "MUTE"}
                    </button>
                    <button
                        onClick={toggleVideo}
                        className="flex items-center gap-2 px-7 py-3 font-bebas tracking-widest text-base transition-all hover:opacity-80"
                        style={{ background: isVideoOn ? "var(--signal)" : "var(--ink-4)", color: isVideoOn ? "var(--ink)" : "var(--paper)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}
                    >
                        {isVideoOn ? <VideocamIcon fontSize="small" /> : <VideocamOffIcon fontSize="small" />}
                        {isVideoOn ? "CAM ON" : "CAM OFF"}
                    </button>
                </div>
            )}
        </div>
    );
};

export default RoomPage;
