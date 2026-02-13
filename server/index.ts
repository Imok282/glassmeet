
import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import { Message, Letter } from './models';

// --- CONFIGURATION ---
const PORT = process.env.PORT || 3001;
// Connection String: Use env var for production, fallback to localhost for dev
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/glassmeet';

// --- EXPRESS & SOCKET SETUP ---
const app = express();
// Fix: Casting to any to avoid type mismatch with Express RequestHandler
app.use(cors() as any);
// Fix: Casting to any to avoid type mismatch with Express middleware
app.use(express.json() as any);

// Serve static files from the React build directory
// In production, we assume 'dist' is at the project root (process.cwd())
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join((process as any).cwd(), 'dist');
  app.use(express.static(distPath) as any);
}

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// --- DATABASE CONNECTION ---
console.log('🔄 Connecting to MongoDB...');
// Log masked URI for debugging
const maskedURI = MONGODB_URI.replace(/:([^:@]+)@/, ':****@');
console.log(`📍 Target URI: ${maskedURI}`);

// Connect with Stable API options (matching your snippet)
mongoose.connect(MONGODB_URI, {
  serverApi: {
    version: '1',
    strict: true,
    deprecationErrors: true,
  }
} as mongoose.ConnectOptions)
  .then(() => {
    console.log('🔥 MongoDB Connected Successfully');
    console.log('✅ Public Persistence Enabled');
  })
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.log('💡 TIP: Check your .env file password and MongoDB Atlas "Network Access" IP Whitelist.');
    console.log('⚠️  Falling back to In-Memory mode (Data will be lost on restart)');
  });

// --- IN-MEMORY STATE (Transient Data) ---
// We keep users in memory because connection status is ephemeral by nature
const onlineUsers = new Map();
// Fallback for messages if DB is down
const memoryMessages: any[] = [];
// Fallback for letters if DB is down
const memoryLetters: any[] = [];

// --- HELPER FUNCTIONS ---

async function saveMessage(message: any) {
  const messageData = {
    ...message,
    timestamp: new Date()
  };

  if (mongoose.connection.readyState === 1) {
    try {
      // Save to MongoDB
      await Message.create(messageData);
    } catch (e) {
      console.error("DB Save Error:", e);
    }
  } else {
    // Fallback
    memoryMessages.push(messageData);
    if (memoryMessages.length > 500) memoryMessages.shift();
  }
}

async function getRoomHistory(roomId: string) {
  if (mongoose.connection.readyState === 1) {
    try {
      // Fetch from MongoDB
      return await Message.find({ roomId })
        .sort({ timestamp: 1 })
        .limit(50);
    } catch (e) {
      console.error("DB Fetch Error:", e);
      return [];
    }
  } else {
    // Fallback
    return memoryMessages
      .filter(m => m.roomId === roomId)
      .slice(-50);
  }
}

async function markMessageRead(messageId: string, userId: string) {
  if (mongoose.connection.readyState === 1) {
    try {
      await Message.findOneAndUpdate(
        { id: messageId },
        { $addToSet: { readBy: userId } }
      );
    } catch (e) { console.error("DB Update Error", e); }
  } else {
    const msg = memoryMessages.find(m => m.id === messageId);
    if (msg) {
        if (!msg.readBy) msg.readBy = [];
        if (!msg.readBy.includes(userId)) msg.readBy.push(userId);
    }
  }
}

async function saveLetter(letter: any) {
  if (mongoose.connection.readyState === 1) {
    try {
      await Letter.create(letter);
    } catch (e) { console.error("Letter Save Error:", e); }
  } else {
    memoryLetters.push(letter);
  }
}

async function getLettersForUser(username: string) {
  if (mongoose.connection.readyState === 1) {
    try {
      // Get letters received by user OR sent by user
      return await Letter.find({ 
        $or: [{ toUsername: username }, { fromUsername: username }] 
      }).sort({ timestamp: -1 });
    } catch (e) { console.error("Letter Fetch Error:", e); return []; }
  } else {
    return memoryLetters
      .filter(l => l.toUsername === username || l.fromUsername === username)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}

async function markLetterRead(letterId: string) {
  if (mongoose.connection.readyState === 1) {
    try {
      await Letter.findOneAndUpdate({ id: letterId }, { isRead: true });
    } catch (e) { console.error("Letter Update Error", e); }
  } else {
    const letter = memoryLetters.find(l => l.id === letterId);
    if (letter) letter.isRead = true;
  }
}

// --- SOCKET LOGIC ---

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // LOBBY: Login
  socket.on('login', async (userData) => {
    onlineUsers.set(socket.id, { ...userData, id: socket.id });
    io.emit('online-users', Array.from(onlineUsers.values()));

    // Fetch letters for this user
    const letters = await getLettersForUser(userData.username);
    socket.emit('letter-history', letters);
  });

  // LETTERS: Send
  socket.on('send-letter', async (letter) => {
    console.log(`Letter sent from ${letter.fromUsername} to ${letter.toUsername}`);
    await saveLetter(letter);

    // Send to recipient if online
    const targetSockets = Array.from(onlineUsers.entries())
        .filter(([_, user]: [string, any]) => user.username === letter.toUsername)
        .map(([socketId, _]) => socketId);
    
    targetSockets.forEach(targetId => {
        io.to(targetId as string).emit('receive-letter', letter);
    });

    // Send back to sender for their outbox update
    socket.emit('receive-letter', letter);
  });

  // LETTERS: Mark Read
  socket.on('mark-letter-read', async ({ letterId }) => {
    await markLetterRead(letterId);
  });

  // LOBBY: Direct Message
  socket.on('private-message', ({ toUsername, content, fromUsername }) => {
    const targetSockets = Array.from(onlineUsers.entries())
        .filter(([_, user]: [string, any]) => user.username === toUsername)
        .map(([socketId, _]) => socketId);

    targetSockets.forEach(targetId => {
        io.to(targetId as string).emit('private-message', {
            id: Date.now().toString(),
            fromUsername,
            toUsername,
            content,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
    });
  });

  // LOBBY: Call Request
  socket.on('call-user', ({ userToCallUsername, fromUser, roomId }) => {
    const targetSockets = Array.from(onlineUsers.entries())
        .filter(([_, user]: [string, any]) => user.username === userToCallUsername)
        .map(([socketId, _]) => socketId);

    targetSockets.forEach(targetId => {
        io.to(targetId as string).emit('incoming-call', { fromUser, roomId });
    });
  });

  // ROOM: Join
  socket.on('join-room', async ({ roomId, user }) => {
    socket.join(roomId);
    
    // Broadcast to room
    socket.to(roomId).emit('user-connected', { userId: socket.id, user });

    // Send History
    const history = await getRoomHistory(roomId);
    socket.emit('chat-history', history);
  });

  // WebRTC Signaling
  socket.on('offer', (payload) => io.to(payload.target).emit('offer', payload));
  socket.on('answer', (payload) => io.to(payload.target).emit('answer', payload));
  socket.on('ice-candidate', (payload) => io.to(payload.target).emit('ice-candidate', payload));

  // Chat
  socket.on('send-message', async (message) => {
    const messageToSave = { 
      ...message, 
      readBy: message.readBy || [],
    };
    
    await saveMessage(messageToSave);
    io.to(message.roomId).emit('receive-message', messageToSave);
  });

  socket.on('mark-read', async ({ roomId, messageId, userId }) => {
    await markMessageRead(messageId, userId);
    io.to(roomId).emit('message-read', { messageId, userId });
  });

  socket.on('typing', ({ roomId, username, isTyping }) => {
    socket.to(roomId).emit('user-typing', { username, isTyping });
  });

  // Features
  socket.on('draw', ({ roomId, data }) => socket.to(roomId).emit('draw', data));
  socket.on('clear-board', ({ roomId }) => socket.to(roomId).emit('clear-board'));
  socket.on('toggle-hand', ({ roomId, userId, isHandRaised }) => socket.to(roomId).emit('hand-toggled', { userId: socket.id, isHandRaised }));
  socket.on('reaction', ({ roomId, emoji }) => socket.to(roomId).emit('reaction', { emoji }));
  socket.on('touch-surface', ({ roomId, x, y, user }) => io.to(roomId).emit('touch-surface', { x, y, user }));
  socket.on('sync-music', ({ roomId, trackIndex, isPlaying, timestamp }) => socket.to(roomId).emit('sync-music', { trackIndex, isPlaying, timestamp }));
  socket.on('send-kiss', ({ roomId, fromUser }) => socket.to(roomId).emit('receive-kiss', { fromUser }));
  socket.on('sync-countdown', ({ roomId, date }) => socket.to(roomId).emit('sync-countdown', { date }));
  socket.on('sync-note', ({ roomId, content }) => socket.to(roomId).emit('sync-note', { content }));
  socket.on('draw-card', ({ roomId, question }) => socket.to(roomId).emit('draw-card', { question }));
  socket.on('sync-stars', ({ roomId, offset }) => socket.to(roomId).emit('sync-stars', offset));
  socket.on('shooting-star', ({ roomId }) => socket.to(roomId).emit('shooting-star'));
  socket.on('sync-breathing', ({ roomId, isActive }) => socket.to(roomId).emit('sync-breathing', { isActive }));
  socket.on('sync-date-mode', ({ roomId, isActive }) => socket.to(roomId).emit('sync-date-mode', { isActive }));

  // Disconnect
  socket.on('disconnect', () => {
    onlineUsers.delete(socket.id);
    io.emit('online-users', Array.from(onlineUsers.values()));
    io.emit('user-disconnected', socket.id);
  });

  // Handle SPA routing (must be last)
  if (process.env.NODE_ENV === 'production') {
    app.get('*', (req, res) => {
      res.sendFile(path.join((process as any).cwd(), 'dist', 'index.html'));
    });
  }
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
