
import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // Client-side generated ID
  roomId: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  username: { type: String, required: true },
  avatarUrl: { type: String }, // Base64 or URL
  content: { type: String, required: true },
  type: { type: String, enum: ['text', 'file', 'image'], default: 'text' },
  fileUrl: String,
  readBy: { type: [String], default: [] },
  timestamp: { type: Date, default: Date.now }
});

const RoomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  hostId: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  participants: [{
    userId: String,
    username: String,
    joinedAt: Date
  }]
});

const LetterSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  fromUsername: { type: String, required: true },
  toUsername: { type: String, required: true, index: true },
  subject: { type: String, default: 'Untitled' },
  content: { type: String, required: true },
  stationery: { type: String, enum: ['cream', 'rose', 'midnight'], default: 'cream' },
  isRead: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});

export const Message = mongoose.model('Message', MessageSchema);
export const Room = mongoose.model('Room', RoomSchema);
export const Letter = mongoose.model('Letter', LetterSchema);
