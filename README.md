# Voice Ur Opinion

> A real-time platform to join rooms and share opinions through live audio, video, and chat.

## Features

**Rooms**
- Create public, social, or private rooms
- Public rooms are visible to everyone; social rooms appear for friends of the owner; private rooms require an invite
- Room owners can end the room or remove participants at any time

**Audio & Video**
- Real-time peer-to-peer audio and video via WebRTC
- Toggle mic mute/unmute — synced live across all participants with visual indicators
- Toggle camera on/off — video fills the tile when on, avatar shown when off

**Video Grid**
- Google Meet-style square tiles — avatar centered when cam is off, full video fill when cam is on
- Pin any participant to feature them in a large tile above the rest
- Mute indicator, voice bars, and remove button overlaid on each tile

**Chat**
- In-room chat panel with WhatsApp-style layout — your messages on the right, others on the left with name and timestamp
- Public room chat is visible to anyone viewing the room, even before joining
- Social and private room chat is hidden until you join
- Chat history is delivered on join; last 200 messages per room retained in memory

**Invites**
- Room owners can invite by email (private) or pick from friends (social)
- Invite status updates live — pending → joined as soon as the user enters
- Pending invites shown on the home screen for quick access

**Auth**
- Email OTP verification on sign-up
- JWT-based sessions with redux-persist for seamless re-login
- Profile photo upload via Cloudinary

**Friends**
- Search users by name, send/accept/decline friend requests
- Friends grid layout for easy browsing

## Tech Stack

**Frontend** — React 18, TypeScript, Vite, Redux Toolkit + redux-persist, Socket.io-client, WebRTC, Material UI, Tailwind CSS

**Backend** — Node.js, Express, TypeScript, Socket.io, MongoDB + Mongoose, Nodemailer, JWT + bcrypt, Helmet + CORS

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas URI)
- pnpm

### Server

```bash
cd server && pnpm install
```

```bash
pnpm watch && pnpm dev
```

### Client

```bash
cd client && pnpm install
```

```bash
pnpm dev
```

## License

MIT
