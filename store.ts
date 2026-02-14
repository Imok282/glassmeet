import { create } from 'zustand';
import { User, ChatMessage, PeerState, DirectMessage, LoveLetter } from './types';

interface AppState {
  // User State
  currentUser: User | null;
  setCurrentUser: (user: User) => void;
  
  // LDR Specific: Hand Holding
  isHoldingHands: boolean;
  toggleHandHold: () => void;

  // Room State
  roomId: string | null;
  setRoomId: (id: string | null) => void;
  isJoined: boolean;
  setIsJoined: (joined: boolean) => void;
  sharingUserId: string | null; // ID of the user currently sharing screen
  setSharingUserId: (id: string | null) => void;

  // Online Cursors
  peerCursors: Record<string, { x: number, y: number, username: string }>;
  updatePeerCursor: (userId: string, data: { x: number, y: number, username: string } | null) => void;

  // Contacts & Direct Messages
  onlineUsers: User[];
  setOnlineUsers: (users: User[]) => void;
  
  directMessages: Record<string, DirectMessage[]>; 
  addDirectMessage: (otherUsername: string, msg: DirectMessage) => void;
  
  selectedContactUsername: string | null;
  setSelectedContactUsername: (username: string | null) => void;

  // Media State
  localStream: MediaStream | null;
  setLocalStream: (stream: MediaStream | null) => void;
  screenStream: MediaStream | null;
  setScreenStream: (stream: MediaStream | null) => void;
  
  // Controls
  isMicOn: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
  toggleMic: () => void;
  toggleCamera: () => void;
  setScreenSharing: (isSharing: boolean) => void;

  // UI Modes
  isChatOpen: boolean;
  toggleChat: () => void;
  isMinimized: boolean;
  toggleMinimize: () => void;
  isWhiteboardOpen: boolean;
  toggleWhiteboard: () => void;
  
  isNoteOpen: boolean;
  toggleNote: () => void;
  noteContent: string;
  setNoteContent: (content: string) => void;

  isLetterBoxOpen: boolean;
  toggleLetterBox: () => void;
  letters: LoveLetter[];
  addLetter: (letter: LoveLetter) => void;
  markLetterAsRead: (id: string) => void;

  isQuestionDeckOpen: boolean;
  toggleQuestionDeck: () => void;
  activeQuestion: string | null;
  setActiveQuestion: (q: string | null) => void;
  
  isSleepMode: boolean;
  toggleSleepMode: () => void;
  
  isDateMode: boolean;
  toggleDateMode: () => void;

  isStargazingOpen: boolean;
  toggleStargazing: () => void;
  
  isBreathingActive: boolean;
  toggleBreathing: () => void;

  lastTouch: { x: number, y: number, id: string } | null;
  setLastTouch: (touch: { x: number, y: number, id: string } | null) => void;
  
  isMusicOpen: boolean;
  toggleMusic: () => void;
  currentTrackIndex: number;
  isPlaying: boolean;
  setMusicState: (index: number, playing: boolean) => void;

  meetingDate: string | null;
  setMeetingDate: (date: string | null) => void;
  isCountdownOpen: boolean;
  toggleCountdown: () => void;

  isGhostMode: boolean;
  setGhostMode: (active: boolean) => void;

  peers: Record<string, PeerState>;
  addPeer: (id: string, peerState: PeerState) => void;
  removePeer: (id: string) => void;
  updatePeer: (id: string, updates: Partial<PeerState>) => void;
  
  messages: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  markMessageAsRead: (messageId: string, userId: string) => void;
  
  typingUsers: string[];
  setTypingUser: (username: string, isTyping: boolean) => void;

  activeReactions: { id: string, emoji: string, startX: number }[];
  activeKisses: { id: string, startX: number, startY: number, rotation: number }[];
  addReaction: (emoji: string) => void;
  removeReaction: (id: string) => void;
  addKiss: () => void;
  removeKiss: (id: string) => void;
}

export const useStore = create<AppState>((set) => ({
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),
  
  isHoldingHands: false,
  toggleHandHold: () => set((state) => ({ isHoldingHands: !state.isHoldingHands })),

  roomId: null,
  setRoomId: (id) => set({ roomId: id }),
  isJoined: false,
  setIsJoined: (joined) => set({ isJoined: joined }),
  sharingUserId: null,
  setSharingUserId: (id) => set({ sharingUserId: id }),

  peerCursors: {},
  updatePeerCursor: (userId, data) => set((state) => {
    const newCursors = { ...state.peerCursors };
    if (!data) delete newCursors[userId];
    else newCursors[userId] = data;
    return { peerCursors: newCursors };
  }),

  onlineUsers: [],
  setOnlineUsers: (users) => set({ onlineUsers: users }),
  directMessages: {},
  addDirectMessage: (otherUsername, msg) => set((state) => ({
    directMessages: {
        ...state.directMessages,
        [otherUsername]: [...(state.directMessages[otherUsername] || []), msg]
    }
  })),
  selectedContactUsername: null,
  setSelectedContactUsername: (username) => set({ selectedContactUsername: username }),

  localStream: null,
  setLocalStream: (stream) => set({ localStream: stream }),
  screenStream: null,
  setScreenStream: (stream) => set({ screenStream: stream }),

  isMicOn: true,
  isCameraOn: true,
  isScreenSharing: false,
  toggleMic: () => set((state) => ({ isMicOn: !state.isMicOn })),
  toggleCamera: () => set((state) => ({ isCameraOn: !state.isCameraOn })),
  setScreenSharing: (isSharing) => set({ isScreenSharing: isSharing }),

  isChatOpen: false,
  toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
  isMinimized: false,
  toggleMinimize: () => set((state) => ({ isMinimized: !state.isMinimized })),
  isWhiteboardOpen: false,
  toggleWhiteboard: () => set((state) => ({ isWhiteboardOpen: !state.isWhiteboardOpen })),

  isNoteOpen: false,
  toggleNote: () => set((state) => ({ isNoteOpen: !state.isNoteOpen })),
  noteContent: '',
  setNoteContent: (content) => set({ noteContent: content }),

  isLetterBoxOpen: false,
  toggleLetterBox: () => set((state) => ({ isLetterBoxOpen: !state.isLetterBoxOpen })),
  letters: [],
  addLetter: (letter) => set((state) => {
    if (state.letters.some(l => l.id === letter.id)) return state;
    return { letters: [letter, ...state.letters] };
  }),
  markLetterAsRead: (id) => set((state) => ({
    letters: state.letters.map(l => l.id === id ? { ...l, isRead: true } : l)
  })),

  isQuestionDeckOpen: false,
  toggleQuestionDeck: () => set((state) => ({ isQuestionDeckOpen: !state.isQuestionDeckOpen })),
  activeQuestion: null,
  setActiveQuestion: (q) => set({ activeQuestion: q }),

  isSleepMode: false,
  toggleSleepMode: () => set((state) => ({ isSleepMode: !state.isSleepMode })),
  
  isDateMode: false,
  toggleDateMode: () => set((state) => ({ isDateMode: !state.isDateMode })),

  isStargazingOpen: false,
  toggleStargazing: () => set((state) => ({ isStargazingOpen: !state.isStargazingOpen })),

  isBreathingActive: false,
  toggleBreathing: () => set((state) => ({ isBreathingActive: !state.isBreathingActive })),

  lastTouch: null,
  setLastTouch: (touch) => set({ lastTouch: touch }),

  isMusicOpen: false,
  toggleMusic: () => set((state) => ({ isMusicOpen: !state.isMusicOpen })),
  currentTrackIndex: 0,
  isPlaying: false,
  setMusicState: (index, playing) => set({ currentTrackIndex: index, isPlaying: playing }),

  meetingDate: localStorage.getItem('glassmeet_meeting_date'),
  setMeetingDate: (date) => {
    if (date) localStorage.setItem('glassmeet_meeting_date', date);
    else localStorage.removeItem('glassmeet_meeting_date');
    set({ meetingDate: date });
  },
  isCountdownOpen: false,
  toggleCountdown: () => set((state) => ({ isCountdownOpen: !state.isCountdownOpen })),

  isGhostMode: false,
  setGhostMode: (active) => set({ isGhostMode: active }),

  peers: {},
  addPeer: (id, peerState) => set((state) => ({ peers: { ...state.peers, [id]: peerState } })),
  removePeer: (id) => set((state) => {
    const newPeers = { ...state.peers };
    delete newPeers[id];
    return { peers: newPeers };
  }),
  updatePeer: (id, updates) => set((state) => {
    const current = state.peers[id];
    if (!current) return state;
    return { peers: { ...state.peers, [id]: { ...current, ...updates } } };
  }),

  messages: [],
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  markMessageAsRead: (messageId, userId) => set((state) => ({
    messages: state.messages.map(m => {
        if (m.id === messageId) {
            const readBy = m.readBy || [];
            if (!readBy.includes(userId)) {
                return { ...m, readBy: [...readBy, userId] };
            }
        }
        return m;
    })
  })),

  typingUsers: [],
  setTypingUser: (username, isTyping) => set((state) => {
    const users = new Set(state.typingUsers);
    if (isTyping) users.add(username);
    else users.delete(username);
    return { typingUsers: Array.from(users) };
  }),

  activeReactions: [],
  activeKisses: [],
  addReaction: (emoji) => set((state) => ({
      activeReactions: [...state.activeReactions, { 
          id: Math.random().toString(36), 
          emoji, 
          startX: Math.random() * 80 + 10 
      }]
  })),
  removeReaction: (id) => set((state) => ({
      activeReactions: state.activeReactions.filter(r => r.id !== id)
  })),
  addKiss: () => set((state) => ({
    activeKisses: [...state.activeKisses, {
        id: Math.random().toString(36),
        startX: 50,
        startY: 50,
        rotation: Math.random() * 30 - 15
    }]
  })),
  removeKiss: (id) => set((state) => ({
    activeKisses: state.activeKisses.filter(k => k.id !== id)
  }))
}));