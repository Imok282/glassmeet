
import { io } from 'socket.io-client';

// Configuration:
// 1. If VITE_SERVER_URL is set (e.g. in Netlify env vars), use it.
// 2. In Production (Monorepo deployment like Render/Railway), default to undefined (connect to same domain).
// 3. In Development, default to localhost:3001.

// Safe access to environment variables to prevent runtime crashes if env is undefined
const env = (import.meta as any).env;

const URL = env?.VITE_SERVER_URL || (env?.PROD ? undefined : 'http://localhost:3001');

export const socket = io(URL, {
  autoConnect: false,
  transports: ['websocket', 'polling']
});
