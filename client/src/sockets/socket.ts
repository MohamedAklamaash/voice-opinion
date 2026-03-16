import { io } from "socket.io-client";

export const socket = io(import.meta.env.VITE_SOCKET_URL, {
    reconnectionAttempts: Infinity,
    timeout: 10000,
    autoConnect: true,
    transports: ["websocket", "polling"],
});
