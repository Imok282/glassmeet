import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import { Message, Letter } from './models.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../');

const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI;

const app = express();
app.use(cors() as any);
app.use(express.json() as any);

app.get('/ping', (req, res) => res.send('pong'));

// Serve Vite build output
app.use(express.static(path.join(projectRoot, 'dist')) as any);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
} as any);

console.log('🚀 GlassMeet Server Starting...');

if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log('🔥 MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Error:', err));
}

const onlineUsers = new Map();

io.on('connection', (socket) => {
  socket.on('login', async (userData) => {
    onlineUsers.set(socket.id, { ...userData, id: socket.id });
    io.emit('online-users', Array.from(onlineUsers.values()));
    
    if (mongoose.connection.readyState === 1) {
      try {
        const letters = await Letter.find({ 
          $or: [{ toUsername: userData.username }, { fromUsername: userData.username }] 
        }).sort({ timestamp: -1 });
        socket.emit('letter-history', letters);
      } catch (e) {
        console.error("Error fetching history:", e);
      }
    }
  });

  socket.on('join-room', async ({ roomId, user }) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-connected', { userId: socket.id, user });
    
    if (mongoose.connection.readyState === 1) {
      try {
        const history = await Message.find({ roomId }).sort({ timestamp: 1 }).limit(50);
        socket.emit('chat-history', history);
      } catch (e) {
        console.error("Error fetching chat history:", e);
      }
    }
  });

  socket.on('send-message', async (message) => {
    if (mongoose.connection.readyState === 1) {
      try { await Message.create(message); } catch (e) { console.error("DB Save Error:", e); }
    }
    io.to(message.roomId).emit('receive-message', message);
  });

  socket.on('send-letter', async (letter) => {
    if (mongoose.connection.readyState === 1) {
      try { await Letter.create(letter); } catch (e) { console.error("Letter Save Error:", e); }
    }
    const targetSockets = Array.from(onlineUsers.entries())
      .filter(([_, user]: any) => user.username === letter.toUsername)
      .map(([id, _]) => id);
    
    targetSockets.forEach(id => io.to(id).emit('receive-letter', letter));
    socket.emit('receive-letter', letter);
  });

  socket.on('offer', (p) => io.to(p.target).emit('offer', p));
  socket.on('answer', (p) => io.to(p.target).emit('answer', p));
  socket.on('ice-candidate', (p) => io.to(p.target).emit('ice-candidate', p));

  socket.on('disconnect', () => {
    onlineUsers.delete(socket.id);
    io.emit('online-users', Array.from(onlineUsers.values()));
    io.emit('user-disconnected', socket.id);
  });

  const relayEvents = [
    'typing', 'draw', 'clear-board', 'toggle-hand', 'reaction', 
    'touch-surface', 'sync-music', 'send-kiss', 'sync-countdown', 
    'sync-note', 'draw-card', 'sync-stars', 'shooting-star', 
    'sync-breathing', 'sync-date-mode'
  ];
  relayEvents.forEach(evt => {
    socket.on(evt, (data) => {
      const { roomId } = data;
      if (roomId) socket.to(roomId).emit(evt, data);
      else socket.broadcast.emit(evt, data);
    });
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(projectRoot, 'dist', 'index.html'));
});

server.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));