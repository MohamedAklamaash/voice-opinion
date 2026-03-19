import { FC, useEffect, useRef, useState } from "react";
import { socket } from "../sockets/socket";
import { socketActions } from "../constants/Actions";
import { avatarForName } from "../utils/avatars";
import SendIcon from "@mui/icons-material/Send";

export interface ChatMessage {
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  timestamp: string;
}

interface Props {
  roomId: string;
  roomType: string;
  currentUserName: string;
  currentUserId: string;
  currentUserAvatar?: string;
  inRoom: boolean;
}

const ChatPanel: FC<Props> = ({ roomId, roomType, currentUserName, currentUserId, currentUserAvatar, inRoom }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const isPublic = roomType === "public";
  const canSeeChat = isPublic || inRoom;

  useEffect(() => {
    if (!canSeeChat) return;
    if (isPublic) {
      socket.emit("get-chat-history", { roomId });
    }
  }, [canSeeChat, roomId]);

  useEffect(() => {
    const onHistory = ({ messages }: { messages: ChatMessage[] }) => setMessages(messages);
    const onMessage = ({ message }: { message: ChatMessage }) =>
      setMessages(prev => [...prev, message]);

    socket.on("chat-history", onHistory);
    socket.on(socketActions.CHAT_MESSAGE, onMessage);
    return () => {
      socket.off("chat-history", onHistory);
      socket.off(socketActions.CHAT_MESSAGE, onMessage);
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    const trimmed = text.trim();
    if (!trimmed || !inRoom) return;
    const msg: ChatMessage = {
      senderId: currentUserId,
      senderName: currentUserName,
      senderAvatar: currentUserAvatar,
      text: trimmed,
      timestamp: new Date().toISOString(),
    };
    socket.emit(socketActions.CHAT_MESSAGE, { roomId, message: msg });
    setText("");
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div
      className="flex flex-col"
      style={{
        height: "480px",
        border: "1px solid var(--ink-4)",
        background: "var(--ink-2)",
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-2.5 flex items-center gap-2"
        style={{ borderBottom: "1px solid var(--ink-4)" }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--signal)" }} />
        <span className="font-mono text-xs tracking-widest" style={{ color: "var(--ash)" }}>
          ROOM CHAT
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3">
        {!canSeeChat ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="font-mono text-xs text-center" style={{ color: "var(--ash)" }}>
              🔒 Join the room to see the chat
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="font-mono text-xs" style={{ color: "var(--ink-5)" }}>
              No messages yet. Say something!
            </p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.senderId === currentUserId;
            return (
              <div key={i} className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                {!isMe && (
                  <img
                    src={msg.senderAvatar || avatarForName(msg.senderName)}
                    alt={msg.senderName}
                    className="w-7 h-7 rounded-full object-cover flex-shrink-0 mb-0.5"
                  />
                )}
                <div className={`flex flex-col gap-0.5 max-w-[70%] ${isMe ? "items-end" : "items-start"}`}>
                  {!isMe && (
                    <span className="font-mono text-[10px] px-1" style={{ color: "var(--gold)" }}>
                      {msg.senderName}
                    </span>
                  )}
                  <div
                    className="px-3 py-2 font-mono text-xs leading-relaxed break-words"
                    style={{
                      background: isMe ? "var(--gold)" : "var(--ink-3)",
                      color: isMe ? "var(--ink)" : "var(--paper)",
                      borderRadius: isMe ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                    }}
                  >
                    {msg.text}
                  </div>
                  <span className="font-mono text-[10px] px-1" style={{ color: "var(--ink-5)" }}>
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={{ borderTop: "1px solid var(--ink-4)" }}
      >
        {inRoom ? (
          <>
            <input
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 font-mono text-xs outline-none"
              style={{
                background: "var(--ink-3)",
                border: "1px solid var(--ink-4)",
                color: "var(--paper)",
              }}
              onFocus={e => (e.target.style.borderColor = "var(--gold)")}
              onBlur={e => (e.target.style.borderColor = "var(--ink-4)")}
            />
            <button
              onClick={sendMessage}
              disabled={!text.trim()}
              className="p-2 transition-all hover:opacity-80 disabled:opacity-30"
              style={{ background: "var(--gold)", color: "var(--ink)" }}
            >
              <SendIcon sx={{ fontSize: 16 }} />
            </button>
          </>
        ) : (
          <p className="font-mono text-xs w-full text-center py-1" style={{ color: "var(--ink-5)" }}>
            {canSeeChat ? "Join the room to send messages" : ""}
          </p>
        )}
      </div>
    </div>
  );
};

export default ChatPanel;
