# Voice Ur Opinion

> A real-time platform to join rooms and share opinions through live audio and video. Speak your mind, connect with others instantly.

## Features

- Real-time peer-to-peer audio/video using WebRTC
- Create and join live discussion rooms
- Mute/unmute toggle with live sync across all participants
- See all active participants in a room in real-time

## Tech Stack

**Frontend**
- React 18 + TypeScript
- Vite
- Redux Toolkit + redux-persist (global state & session persistence)
- Socket.io-client (real-time events)
- WebRTC + freeice (peer-to-peer audio/video)
- Material UI + Tailwind CSS

**Backend**
- Node.js + Express + TypeScript
- Socket.io (WebSocket signaling server)
- MongoDB + Mongoose
- Nodemailer (OTP emails)
- JWT + bcrypt (auth)
- Helmet + CORS (security)

## How it works

1. Sign up with your email — you'll receive an OTP to verify
2. Set your display name and profile
3. Browse or create a room from the home screen
4. Join a room to connect with others via live audio/video
5. Mute yourself anytime, or leave when you're done
6. Room owners can remove participants if needed

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB running locally or a connection URI
- pnpm (recommended) or npm

### Server setup

```bash
cd server
pnpm install
```

Create a `.env` file in the `server` directory:

```env
PORT=9001
MONGO_URL=your_mongodb_connection_string
HASH_SECRET=your_jwt_secret
SENDER_EMAIL=your_email@gmail.com
SENDER_PASS=your_email_app_password
CLIENT_URL=http://localhost:5173
```

Then compile and run:

```bash
pnpm watch     
pnpm dev
```

### Client setup

```bash
cd client
pnpm install
```

Create a `.env` file in the `client` directory:

```env
VITE_SERVER_URL=http://localhost:9001
```

Then start the dev server:

```bash
pnpm dev
```

App will be available at `http://localhost:5173`.

## License

Free to use — [MIT](LICENSE)
