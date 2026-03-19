import express, { Express } from "express";
import dotenv from "dotenv";
dotenv.config();
const app: Express = express();
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";
import otpRoutes from "./routes/Otp_routes";
import { mongoConnection } from "./mongoConnection";
import { createServer } from "node:http";
import { Server, Socket } from "socket.io";
import roomRoutes from "./routes/Room_Routes";
import activationRoutes from './routes/ActivationRoutes';
import friendRoutes from './routes/Friends_Routes';
import { socketActions } from "./actions/SocketActions";
import { UserSchema } from "./models/UserDataModel";
import { RoomSchema } from "./models/RoomModal";

mongoConnection();

const server = createServer(app);
export const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] }
});

app.use(cors({ origin: "*" }));
app.use(morgan("tiny"));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/Otp", otpRoutes);
app.use("/room", roomRoutes);
app.use("/userActivation", activationRoutes);
app.use("/friends", friendRoutes);

interface User {
    name?: string;
    activated?: boolean;
    email?: string;
    phoneNumber?: string;
    userProfileUrl?: string;
    socketId?: string;
    isMuted?: boolean;
    _id?: string;
    owner?: string;
}

const socketUserMap: Record<string, User[]> = {};

interface ChatMessage { senderId: string; senderName: string; senderAvatar?: string; text: string; timestamp: string; }
const roomChats: Record<string, ChatMessage[]> = {};

io.on("connection", (socket: Socket) => {
    console.log("User connected", socket.id);

    socket.on(socketActions.JOIN, async (data) => {
        try {
            const { roomId, user }: { roomId: string; user: User } = data;
            if (!socketUserMap[roomId]) socketUserMap[roomId] = [];

            user.isMuted = false;
            user.socketId = socket.id;

            socket.emit("existing-peers", {
                peers: socketUserMap[roomId].map(u => ({ peerId: u.socketId, peerUser: u }))
            });

            socketUserMap[roomId].forEach(existingUser => {
                if (existingUser.socketId) {
                    io.to(existingUser.socketId).emit("new-peer", {
                        peerId: socket.id,
                        peerUser: user,
                        createOffer: false,
                    });
                }
            });

            socketUserMap[roomId].push(user);
            socket.join(roomId);

            if (roomChats[roomId]?.length) {
                socket.emit("chat-history", { messages: roomChats[roomId] });
            }

            io.to(roomId).emit(socketActions.JOIN, { user, users: socketUserMap[roomId] });

            const updatedRoom = await RoomSchema.findById(roomId).lean();
            if (updatedRoom) {
                io.to(roomId).emit(socketActions.ROOM_UPDATED, {
                    invitedEmails: updatedRoom.invitedEmails,
                    acceptedEmails: updatedRoom.acceptedEmails,
                });
            }
        } catch (error) {
            console.error('Error in JOIN:', error);
        }
    });

    socket.on(socketActions.LEAVE, ({ user, roomId }: { user: User; roomId: string }) => {
        try {
            if (!socketUserMap[roomId]) return;
            socketUserMap[roomId] = socketUserMap[roomId].filter(u => u.socketId !== socket.id);
            io.to(roomId).emit(socketActions.LEAVE, { users: socketUserMap[roomId] });
            socket.leave(roomId);
        } catch (error) { console.log(error); }
    });

    socket.on(socketActions.RELAY_ICE, ({ iceCandidate, peerId }: { iceCandidate: RTCIceCandidateInit; peerId: string }) => {
        io.to(peerId).emit(socketActions.ICE_CANDIDATE, { peerId: socket.id, iceCandidate });
    });

    socket.on(socketActions.RELAY_SDP, ({ sessionDescription, peerId }: { sessionDescription: RTCSessionDescriptionInit; peerId: string }) => {
        io.to(peerId).emit(socketActions.SESSION_DESCRIPTION, { peerId: socket.id, sessionDescription });
    });

    socket.on(socketActions.CHAT_MESSAGE, ({ roomId, message }: { roomId: string; message: ChatMessage }) => {
        if (!roomChats[roomId]) roomChats[roomId] = [];
        roomChats[roomId].push(message);
        if (roomChats[roomId].length > 200) roomChats[roomId].shift();
        io.to(roomId).emit(socketActions.CHAT_MESSAGE, { message });
    });

    socket.on("get-chat-history", async ({ roomId }: { roomId: string }) => {
        const room = await RoomSchema.findById(roomId).lean();
        if (!room || room.roomType !== "public") return;
        socket.emit("chat-history", { messages: roomChats[roomId] ?? [] });
    });

    socket.on(socketActions.MUTE, ({ roomId, userId }: { roomId: string; userId: string }) => {
        if (!socketUserMap[roomId]) return;
        socketUserMap[roomId] = socketUserMap[roomId].map(u => {
            if (String(u._id) === String(userId)) u.isMuted = !u.isMuted;
            return u;
        });
        io.to(roomId).emit(socketActions.MUTE_INFO, { users: socketUserMap[roomId] });
    });

    socket.on(socketActions.REMOVE_PEER, async ({ peerId, userName, roomId }: { peerId: string; userName: string; roomId: string }) => {
        const room = await RoomSchema.findById(roomId);
        if (room?.owner === userName && socketUserMap[roomId]) {
            const target = socketUserMap[roomId]?.find(u => u._id === peerId);
            if (target?.socketId) {
                io.to(target.socketId).emit("kicked");
            }
            socketUserMap[roomId] = socketUserMap[roomId].filter(u => u._id !== peerId);
            io.to(roomId).emit(socketActions.REMOVE_PEER, { users: socketUserMap[roomId] });
        }
    });

    socket.on("disconnect", () => {
        for (const roomId in socketUserMap) {
            const before = socketUserMap[roomId].length;
            socketUserMap[roomId] = socketUserMap[roomId].filter(u => u.socketId !== socket.id);
            if (socketUserMap[roomId].length !== before) {
                io.to(roomId).emit(socketActions.LEAVE, { users: socketUserMap[roomId] });
            }
        }
        console.log("User disconnected:", socket.id);
    });
});

server.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});
