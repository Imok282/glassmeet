
export interface User {
  id: string; // Socket ID (Transient)
  username: string; // Unique Handle (Persistent)
  isHost: boolean;
  avatarUrl?: string;
  isHandRaised?: boolean;
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  content: string;
  timestamp: string;
  type: 'text' | 'image' | 'file';
  fileUrl?: string;
  readBy: string[];
}

export interface DirectMessage {
  id: string;
  fromUsername: string;
  toUsername: string;
  content: string;
  timestamp: string;
}

export interface PeerState {
  stream?: MediaStream;
  isMuted: boolean;
  isVideoOff: boolean;
  isSpeaking: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  user: User;
}

export interface RoomState {
  roomId: string | null;
  users: User[];
  isJoined: boolean;
}

export type StationeryType = 'cream' | 'rose' | 'midnight';

export interface LoveLetter {
  id: string;
  fromUsername: string;
  toUsername: string;
  subject: string;
  content: string;
  stationery: StationeryType;
  timestamp: string; // ISO string
  isRead: boolean;
}
