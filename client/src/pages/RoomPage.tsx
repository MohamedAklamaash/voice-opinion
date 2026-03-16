import { useEffect, useState, FC, useRef } from "react";
import { Theme } from "../App";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useSelector } from "react-redux";
import MicOutlinedIcon from "@mui/icons-material/MicOutlined";
import MicOffIcon from "@mui/icons-material/MicOff";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import { avatarForName } from "../utils/avatars";
import { socket } from "../sockets/socket";
import { socketActions } from "../constants/Actions";

interface Props { primaryTheme: Theme; }
interface RoomData { owner: string; title: string; speakers: string[]; roomType: string; }
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

    const { userName, email } = useSelector(
        (state: { user: { userName: string; email: string } }) => state.user
    );

    // All WebRTC state in refs to avoid stale closures
    const pcs = useRef<Record<string, RTCPeerConnection>>({});
    const localStream = useRef<MediaStream | null>(null);
    const audioEls = useRef<Record<string, HTMLAudioElement>>({});

    if (!userName) { navigate("/signIn"); return null; }

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
            console.log("[ontrack] from", peerId, "streams:", e.streams.length);
            const stream = e.streams[0] ?? new MediaStream([e.track]);

            // Get or create audio element
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
        const el = audioEls.current[peerId];
        if (el) { el.srcObject = null; el.remove(); delete audioEls.current[peerId]; }
    };

    // Fetch room details — auto-join mic if already a speaker (e.g. room owner)
    useEffect(() => {
        axios.get<{ data: RoomData; userData: User[]; success: boolean }>(
            `${import.meta.env.VITE_API_URL}/room/getRoomDetails/${id}`
        ).then(async ({ data: { data, userData: users, success } }) => {
            if (!success) { navigate("/home"); return; }
            setRoomData(data);
            setUserData(users);
            const alreadyIn = data.speakers.includes(userName);
            if (alreadyIn) {
                // Acquire mic and join signaling without hitting joinRoom API again
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                    localStream.current = stream;
                    const me = users.find(u => u.name === userName);
                    socket.emit(socketActions.JOIN, { roomId: id, user: me ?? { name: userName } });
                    setInRoom(true);
                } catch (err) {
                    console.error("[auto-join mic]", err);
                    setInRoom(true); // still mark in room even if mic denied
                }
            }
        }).catch(console.error);
    }, [id]);

    // Socket signaling
    useEffect(() => {
        // New joiner: existing peers tell us about themselves — WE create offers
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
                // Only process answer if we have a PC that sent an offer
                if (!pc || pc.signalingState !== "have-local-offer") {
                    console.warn("[sdp] ignoring answer — no pending offer for", peerId);
                    return;
                }
                await pc.setRemoteDescription(new RTCSessionDescription(sessionDescription));
                return;
            }

            // It's an offer — create PC if needed, add tracks, send answer
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

        const onJoin = ({ users }: { users: User[] }) => {
            setUserData(prev => {
                const socketIdMap = Object.fromEntries(prev.filter(u => u.name && u.socketId).map(u => [u.name, u.socketId]));
                const merged = users.filter(u => u.name).map(u => ({ ...u, socketId: socketIdMap[u.name!] ?? u.socketId }));
                // dedupe by name, keep last
                return Array.from(new Map(merged.map(u => [u.name, u])).values());
            });
        };

        const onLeave = ({ users }: { users: User[] }) => {
            const currentIds = new Set(users.map(u => u.socketId).filter(Boolean));
            Object.keys(pcs.current).forEach(pid => { if (!currentIds.has(pid)) closePC(pid); });
            setUserData(users);
        };

        const onMuteInfo = ({ users }: { users: User[] }) => setUserData(users);
        const onRemovePeer = ({ users }: { users: User[] }) => setUserData(users);
        const onKicked = () => { void doLeave(); navigate("/home"); };

        socket.on("existing-peers", onExistingPeers);
        socket.on("new-peer", onNewPeer);
        socket.on(socketActions.SESSION_DESCRIPTION, onSDP);
        socket.on(socketActions.ICE_CANDIDATE, onICE);
        socket.on(socketActions.JOIN, onJoin);
        socket.on(socketActions.LEAVE, onLeave);
        socket.on(socketActions.MUTE_INFO, onMuteInfo);
        socket.on(socketActions.REMOVE_PEER, onRemovePeer);
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
            // Emit JOIN — server will send existing-peers back, then we create offers
            socket.emit(socketActions.JOIN, { roomId: id, user: u });
            setInRoom(true);
        } catch (err) {
            console.error("[joinRoom]", err);
        }
    };

    const doLeave = async () => {
        localStream.current?.getTracks().forEach(t => t.stop());
        localStream.current = null;
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
        // Update local userData immediately so UI reflects change without waiting for server
        setUserData(prev => prev.map(u => u.name === userName ? { ...u, isMuted: next } : u));
        const self = userData.find(u => u.name === userName);
        if (self?._id) socket.emit(socketActions.MUTE, { roomId: id, userId: String(self._id) });
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
        try {
            const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/room/invite/${id}`, {
                ownerEmail: email, inviteEmail: inviteEmail.trim()
            });
            setInviteStatus(data.success ? "Invite sent!" : data.msg);
            if (data.success) setInviteEmail("");
        } catch { setInviteStatus("Failed to send invite."); }
        setTimeout(() => setInviteStatus(null), 3000);
    };

    const isOwner = roomData.owner === userName;

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

                    {/* Invite UI */}
                    {isOwner && roomData.roomType !== "public" && (
                        <div className="mt-4 flex gap-2">
                            <input
                                type="email"
                                placeholder="Invite by email..."
                                value={inviteEmail}
                                onChange={e => setInviteEmail(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && sendInvite()}
                                className="flex-1 px-3 py-2 font-mono text-xs outline-none transition-colors"
                                style={{
                                    background: "var(--ink-3)",
                                    border: "1px solid var(--ink-4)",
                                    color: "var(--paper)",
                                }}
                                onFocus={(e) => (e.target.style.borderColor = "var(--gold)")}
                                onBlur={(e) => (e.target.style.borderColor = "var(--ink-4)")}
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
                        <p className="font-mono text-xs mt-2" style={{ color: "var(--signal)" }}>{inviteStatus}</p>
                    )}
                </div>

                {/* Speakers label */}
                <p className="font-mono text-xs tracking-widest mb-5" style={{ color: "var(--ash)" }}>
                    — SPEAKERS · {userData.length} —
                </p>

                {/* Speakers grid */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-6">
                    {Array.from(new Map(userData.filter(u => u.name).map(u => [u.socketId ?? u._id ?? u.name, u])).values()).map((user) => {
                        const isMe = user.name === userName;
                        const speaking = inRoom && !user.isMuted;
                        return (
                            <div key={user.socketId ?? user._id ?? user.name} className="flex flex-col items-center gap-2">
                                <div className="relative">
                                    {/* Speaking ring */}
                                    {speaking && (
                                        <span
                                            className="absolute inset-0 rounded-full"
                                            style={{
                                                border: "2px solid var(--signal)",
                                                animation: "pulse-ring 1.2s ease-out infinite",
                                            }}
                                        />
                                    )}
                                    <img
                                        src={user.userProfileUrl || avatarForName(user.name)}
                                        alt={user.name}
                                        className="w-14 h-14 rounded-full object-cover"
                                        style={{
                                            border: `2px solid ${speaking ? "var(--signal)" : "var(--ink-4)"}`,
                                        }}
                                    />
                                    {user.isMuted && (
                                        <span
                                            className="absolute -bottom-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full"
                                            style={{ background: "var(--danger)" }}
                                        >
                                            <MicOffIcon sx={{ fontSize: 11 }} />
                                        </span>
                                    )}
                                </div>
                                <p className="font-mono text-xs text-center truncate w-full" style={{ color: "var(--paper)" }}>
                                    {isMe ? "YOU" : user.name.slice(0, 8) + (user.name.length > 8 ? "…" : "")}
                                </p>
                                <VoiceBars active={speaking} />
                                {isOwner && !isMe && (
                                    <button
                                        onClick={() => removeUser(user)}
                                        className="transition-opacity hover:opacity-70"
                                        style={{ color: "var(--danger)" }}
                                        title="Remove"
                                    >
                                        <PersonRemoveIcon sx={{ fontSize: 14 }} />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Floating mute button */}
            {inRoom && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                    <button
                        onClick={toggleMute}
                        className="flex items-center gap-2 px-7 py-3 font-bebas tracking-widest text-base transition-all hover:opacity-80"
                        style={{
                            background: isMuted ? "var(--danger)" : "var(--gold)",
                            color: "var(--ink)",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                        }}
                    >
                        {isMuted ? <MicOffIcon fontSize="small" /> : <MicOutlinedIcon fontSize="small" />}
                        {isMuted ? "UNMUTE" : "MUTE"}
                    </button>
                </div>
            )}
        </div>
    );
};

export default RoomPage;
