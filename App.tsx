import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useStore } from './store';
import { VideoGrid } from './components/VideoGrid';
import { ChatSidebar } from './components/ChatSidebar';
import { ControlDock } from './components/ControlDock';
import { CinemaCurtains } from './components/CinemaCurtains';
import { Whiteboard } from './components/Whiteboard';
import { ReactionOverlay } from './components/ReactionOverlay';
import { ContactList } from './components/ContactList';
import { MusicPlayer } from './components/MusicPlayer';
import { LoveNotes } from './components/LoveNotes';
import { LoveLetters } from './components/LoveLetters';
import { QuestionDeck } from './components/QuestionDeck';
import { DateNightOverlay } from './components/DateNightOverlay';
import { Stargazing } from './components/Stargazing';
import { BreathingExercise } from './components/BreathingExercise';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ArrowRight, Video as VideoIcon, LogOut, Calendar, Clock, Camera, Upload, AlertCircle, WifiOff } from 'lucide-react';
import { socket } from './utils/socket';
import { User } from './types';

// WebRTC Configuration
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' }
  ]
};

// Optimized Wallpaper
const Wallpaper = ({ blur, dim }: { blur: boolean, dim: boolean }) => (
  <div className={`fixed inset-0 z-[-1] transition-all duration-[2000ms] bg-[#050102] overflow-hidden`}>
    <div className="absolute inset-0 bg-gradient-to-b from-[#1a050a] via-[#050102] to-[#050102]"></div>
    <div className={`absolute top-0 left-0 w-full h-full transition-opacity duration-[2000ms] ${dim ? 'opacity-30' : 'opacity-60'}`}>
        <div className="absolute top-[-20%] left-[10%] w-[60%] h-[60%] rounded-full opacity-20 animate-[pulse_8s_ease-in-out_infinite]"
             style={{ background: 'radial-gradient(circle, rgba(136, 19, 55, 0.4) 0%, transparent 70%)' }}></div>
        <div className="absolute bottom-[-20%] right-[10%] w-[60%] h-[60%] rounded-full opacity-10 animate-[pulse_10s_ease-in-out_infinite]"
             style={{ background: 'radial-gradient(circle, rgba(49, 46, 129, 0.4) 0%, transparent 70%)', animationDelay: '1s' }}></div>
        <div className="absolute top-[20%] left-[20%] w-[60%] h-[60%] rounded-full opacity-5 animate-[pulse_12s_ease-in-out_infinite]"
             style={{ background: 'radial-gradient(circle, rgba(255, 200, 200, 0.2) 0%, transparent 60%)', animationDelay: '2s' }}></div>
    </div>
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000_100%)] opacity-80"></div>
  </div>
);

// Countdown Widget
const CountdownWidget = () => {
    const { isCountdownOpen, toggleCountdown, meetingDate, setMeetingDate, roomId } = useStore();
    const [timeLeft, setTimeLeft] = useState<{days: number, hours: number, minutes: number} | null>(null);

    useEffect(() => {
        const handleSync = ({ date }: { date: string }) => { setMeetingDate(date); };
        socket.on('sync-countdown', handleSync);
        return () => { socket.off('sync-countdown', handleSync); };
    }, [setMeetingDate]);

    useEffect(() => {
        if (!meetingDate) {
            setTimeLeft(null);
            return;
        }
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const distance = new Date(meetingDate).getTime() - now;
            if (distance < 0) {
                setTimeLeft(null);
            } else {
                setTimeLeft({
                    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
                });
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [meetingDate]);

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const date = e.target.value;
        setMeetingDate(date);
        socket.emit('sync-countdown', { roomId, date });
    };

    return (
        <AnimatePresence>
            {isCountdownOpen && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="fixed top-28 right-8 w-72 glass-panel p-6 rounded-3xl z-40 border-rose-900/20"
                >
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2 text-rose-100 font-bold font-serif">
                            <Clock size={16} />
                            <span className="tracking-wide">Until We Meet</span>
                        </div>
                        <button onClick={toggleCountdown} className="text-white/40 hover:text-white">
                             <ArrowRight size={16} />
                        </button>
                    </div>
                    {!meetingDate ? (
                        <div className="text-center py-4">
                            <p className="text-sm text-rose-200/60 mb-3 font-light">Set the date, my love.</p>
                            <input type="datetime-local" onChange={handleDateChange} className="w-full glass-input p-2 rounded-lg text-sm text-white/80" />
                        </div>
                    ) : (
                        <div className="text-center">
                            {timeLeft ? (
                                <div className="grid grid-cols-3 gap-2 mb-4">
                                    <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                                        <div className="text-xl font-bold text-rose-400 font-serif">{timeLeft.days}</div>
                                        <div className="text-[9px] uppercase text-white/30 font-bold tracking-widest">Days</div>
                                    </div>
                                    <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                                        <div className="text-xl font-bold text-rose-400 font-serif">{timeLeft.hours}</div>
                                        <div className="text-[9px] uppercase text-white/30 font-bold tracking-widest">Hrs</div>
                                    </div>
                                    <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                                        <div className="text-xl font-bold text-rose-400 font-serif">{timeLeft.minutes}</div>
                                        <div className="text-[9px] uppercase text-white/30 font-bold tracking-widest">Mins</div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-xl font-serif italic text-rose-400 mb-4 animate-pulse">Together at last.</div>
                            )}
                            <button onClick={() => { setMeetingDate(null); socket.emit('sync-countdown', { roomId, date: null }); }} className="text-xs text-white/30 hover:text-white transition">Reset Date</button>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// Image Resize Helper
const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 200;
                const MAX_HEIGHT = 200;
                let width = img.width;
                let height = img.height;
                if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } }
                else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
};

// --- Room View Component with integrated WebRTC Logic ---
const RoomView = () => {
    const { roomId, currentUser, localStream, isSleepMode, addPeer, removePeer, isJoined } = useStore();
    const peersRef = useRef<Record<string, RTCPeerConnection>>({});
    const iceCandidateQueue = useRef<Record<string, RTCIceCandidate[]>>({});
    const hasInitializedRef = useRef(false);

    // Effect to handle the connection lifecycle
    useEffect(() => {
        if (!roomId || !currentUser || !isJoined || hasInitializedRef.current) return;
        
        console.log(`[RoomView] Initializing connection for room ${roomId} as ${currentUser.username} (${socket.id})`);
        hasInitializedRef.current = true;

        // Ensure user ID matches socket ID
        const myId = socket.id;

        // Helper to create a peer connection
        const createPeer = (targetId: string, initiator: boolean, remoteUser?: User) => {
            if (peersRef.current[targetId]) {
                 console.log(`[RoomView] Peer ${targetId} already exists`);
                 return peersRef.current[targetId];
            }

            console.log(`[RoomView] Creating peer for ${targetId} (Initiator: ${initiator})`);
            const pc = new RTCPeerConnection(ICE_SERVERS);
            peersRef.current[targetId] = pc;
            iceCandidateQueue.current[targetId] = [];

            // Add local tracks
            if (localStream) {
                localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
            }

            // ICE Candidates
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit('ice-candidate', {
                        target: targetId,
                        candidate: event.candidate,
                        senderId: myId
                    });
                }
            };

            // Remote Stream
            pc.ontrack = (event) => {
                console.log(`[RoomView] Received track from ${targetId}`);
                addPeer(targetId, {
                    stream: event.streams[0],
                    user: remoteUser || { id: targetId, username: 'Peer', isHost: false }, // Fallback if user data missing
                    isMuted: false,
                    isVideoOff: false,
                    isSpeaking: false,
                    isScreenSharing: false,
                    isHandRaised: false
                });
            };

            // Connection State Logging
            pc.onconnectionstatechange = () => {
                console.log(`[RoomView] Connection state with ${targetId}: ${pc.connectionState}`);
                if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
                     // Optional: Try restart?
                }
            };

            return pc;
        };

        // --- Socket Event Handlers ---

        const handleUserConnected = async ({ userId, user }: { userId: string, user: User }) => {
            console.log(`[RoomView] User connected: ${user.username} (${userId})`);
            // We are the initiator because we were already in the room
            const pc = createPeer(userId, true, user);
            try {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                socket.emit('offer', { target: userId, sdp: offer, callerUser: currentUser });
            } catch (e) {
                console.error("Error creating offer:", e);
            }
        };

        const handleOffer = async ({ target, sdp, callerUser }: any) => {
            if (target !== myId) return;
            console.log(`[RoomView] Received offer from ${callerUser.username} (${callerUser.id})`);
            
            // We are the receiver
            const pc = createPeer(callerUser.id, false, callerUser);
            
            try {
                // If we somehow have a glare, we can try to handle it, but usually standard flow is fine
                await pc.setRemoteDescription(new RTCSessionDescription(sdp));
                
                // Process queued candidates
                const queue = iceCandidateQueue.current[callerUser.id];
                if (queue && queue.length > 0) {
                    console.log(`[RoomView] Flushing ${queue.length} queued ICE candidates`);
                    for (const candidate of queue) {
                        await pc.addIceCandidate(candidate);
                    }
                    iceCandidateQueue.current[callerUser.id] = [];
                }

                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit('answer', { target: callerUser.id, sdp: answer, senderId: myId });
            } catch (e) {
                console.error("Error handling offer:", e);
            }
        };

        const handleAnswer = async ({ target, sdp, senderId }: any) => {
            if (target !== myId) return;
            console.log(`[RoomView] Received answer from ${senderId}`);
            
            const pc = peersRef.current[senderId];
            if (pc) {
                try {
                    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
                } catch (e) {
                    console.error("Error setting remote description (Answer):", e);
                }
            }
        };

        const handleIceCandidate = async ({ target, candidate, senderId }: any) => {
            if (target !== myId) return;
            
            const pc = peersRef.current[senderId];
            if (pc) {
                try {
                    if (pc.remoteDescription) {
                        await pc.addIceCandidate(new RTCIceCandidate(candidate));
                    } else {
                        // Queue it
                        if (!iceCandidateQueue.current[senderId]) iceCandidateQueue.current[senderId] = [];
                        iceCandidateQueue.current[senderId].push(new RTCIceCandidate(candidate));
                    }
                } catch (e) {
                    console.error("Error adding ICE candidate:", e);
                }
            }
        };

        const handleUserDisconnected = (userId: string) => {
             console.log(`[RoomView] User disconnected: ${userId}`);
             if (peersRef.current[userId]) {
                 (peersRef.current[userId] as RTCPeerConnection).close();
                 delete peersRef.current[userId];
             }
             removePeer(userId);
        };

        // Register Listeners
        socket.on('user-connected', handleUserConnected);
        socket.on('offer', handleOffer);
        socket.on('answer', handleAnswer);
        socket.on('ice-candidate', handleIceCandidate);
        socket.on('user-disconnected', handleUserDisconnected);

        // Join the room now that listeners are ready
        socket.emit('join-room', { roomId, user: currentUser });

        return () => {
            // Cleanup
            socket.off('user-connected', handleUserConnected);
            socket.off('offer', handleOffer);
            socket.off('answer', handleAnswer);
            socket.off('ice-candidate', handleIceCandidate);
            socket.off('user-disconnected', handleUserDisconnected);
            
            Object.values(peersRef.current).forEach(pc => (pc as RTCPeerConnection).close());
            peersRef.current = {};
            hasInitializedRef.current = false;
        };
    }, [roomId, isJoined]); // Removed currentUser to prevent re-runs on user update

    // Separate effect for updating local stream tracks without destroying connection
    useEffect(() => {
        if (!localStream) return;
        Object.values(peersRef.current).forEach((pc: RTCPeerConnection) => {
            const senders = pc.getSenders();
            localStream.getTracks().forEach(track => {
                const sender = senders.find(s => s.track?.kind === track.kind);
                if (sender) {
                    sender.replaceTrack(track).catch(e => console.error("Replace track error", e));
                } else {
                    try { pc.addTrack(track, localStream); } catch(e) { console.warn("Add track warning", e); }
                }
            });
        });
    }, [localStream]);

    return (
        <motion.div key="room" className="w-full h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
             {/* Sleep Mode Overlay */}
             <AnimatePresence>
                {isSleepMode && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[55] bg-black/95 flex items-center justify-center overflow-hidden pointer-events-none"
                    >
                         {/* Stars */}
                         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-60 animate-[pulse_5s_infinite]"></div>
                         <div className="text-center space-y-4">
                             <motion.div 
                                animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="text-9xl text-indigo-200 font-serif"
                             >
                                ☾
                             </motion.div>
                             <p className="text-indigo-300/40 text-sm tracking-[0.3em] uppercase">Goodnight</p>
                         </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Stargazing />
            <BreathingExercise />
            <DateNightOverlay />
            <VideoGrid />
            <ControlDock />
            <ChatSidebar />
            <CinemaCurtains />
            <Whiteboard />
            <ReactionOverlay />
            <MusicPlayer />
            <LoveNotes />
            <LoveLetters />
            <QuestionDeck />
            <CountdownWidget />
        </motion.div>
    );
};

// Lobby Component
const LobbyDashboard = () => {
  const { setRoomId, setIsJoined, setCurrentUser, setLocalStream, currentUser, setOnlineUsers, addDirectMessage } = useStore();
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [meetingId, setMeetingId] = useState('');
  const [isNameEntered, setIsNameEntered] = useState(false);
  const [incomingCall, setIncomingCall] = useState<{ fromUser: User, roomId: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) setMeetingId(roomParam);
  }, []);

  const performLogin = async (username: string, avatarUrl: string | null, skipMedia = false) => {
    setErrorMsg(null);
    setIsLoading(true);

    // 1. Media Setup (or Bypass)
    try {
        if (!skipMedia) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setLocalStream(stream);
            } catch (mediaError: any) {
                console.error("Media permission failed:", mediaError);
                setIsLoading(false);
                if (mediaError.name === 'NotAllowedError') {
                    setErrorMsg("Camera/Mic denied. Please allow permissions or continue without.");
                } else if (mediaError.name === 'NotFoundError') {
                    setErrorMsg("No camera/microphone found on this device.");
                } else {
                    setErrorMsg("Media error: " + mediaError.message);
                }
                return; // Stop here to let user choose
            }
        }
    } catch (e) {
        console.error("Unexpected media error", e);
    }

    // 2. Login Logic
    try {
        localStorage.setItem('glassmeet_username', username);
        if (avatarUrl) localStorage.setItem('glassmeet_avatar', avatarUrl);

        if (!socket.connected) socket.connect();
        
        const finishLogin = () => {
            const user = { 
                id: socket.id || 'offline-' + Date.now().toString().slice(-4), 
                username: username, 
                isHost: false, 
                isHandRaised: false,
                avatarUrl: avatarUrl || undefined
            };
            setCurrentUser(user);
            setIsNameEntered(true);
            
            // Only emit if we are actually connected
            if (socket.connected) {
                socket.emit('login', { username, avatarUrl });
            }
            setIsLoading(false);
        };

        if (socket.connected) {
            finishLogin();
        } else {
            // 3. Socket Timeout (Force Entry if Backend is Down)
            const connectionTimeout = setTimeout(() => {
                console.warn("Socket connection timed out - Entering Offline Mode");
                finishLogin();
            }, 2000); // 2 seconds max wait

            socket.once('connect', () => {
                clearTimeout(connectionTimeout);
                finishLogin();
            });
        }

    } catch (e: any) {
        console.error("Login failed:", e);
        setIsLoading(false);
        setErrorMsg("System error: " + e.message);
    }
  };

  useEffect(() => {
      // PRE-FILL only
      const storedName = localStorage.getItem('glassmeet_username');
      const storedAvatar = localStorage.getItem('glassmeet_avatar');
      if (storedName) {
          setName(storedName);
          if (storedAvatar) setAvatar(storedAvatar);
      }
      setIsLoading(false);
  }, []);

  const handleManualLogin = async () => {
    if (!name) return;
    await performLogin(name.replace(/\s+/g, '').toLowerCase(), avatar);
  };

  const handleLogout = () => {
      localStorage.removeItem('glassmeet_username');
      localStorage.removeItem('glassmeet_avatar');
      setIsNameEntered(false);
      setName('');
      setAvatar(null);
      const stream = useStore.getState().localStream;
      stream?.getTracks().forEach(t => t.stop());
      setLocalStream(null);
      setCurrentUser(null as any);
      socket.disconnect();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          try {
              const base64 = await resizeImage(e.target.files[0]);
              setAvatar(base64);
          } catch (err) { console.error(err); }
      }
  };

  useEffect(() => {
    if (isNameEntered) {
        socket.on('online-users', (users: User[]) => setOnlineUsers(users));
        socket.on('private-message', (msg) => {
            addDirectMessage(msg.fromUsername, {
                id: msg.id,
                fromUsername: msg.fromUsername,
                toUsername: msg.toUsername,
                content: msg.content,
                timestamp: msg.timestamp
            });
        });
        socket.on('incoming-call', ({ fromUser, roomId }) => setIncomingCall({ fromUser, roomId }));
        return () => {
            socket.off('online-users');
            socket.off('private-message');
            socket.off('incoming-call');
        };
    }
  }, [isNameEntered, setOnlineUsers, addDirectMessage]);

  const acceptCall = () => {
    if (incomingCall) { setRoomId(incomingCall.roomId); setIsJoined(true); }
  };

  const joinSpecificRoom = () => {
     if (meetingId) { setRoomId(meetingId); setIsJoined(true); }
  };

  if (isLoading) {
      return (
          <div className="h-screen w-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-6 animate-pulse">
                  <div className="w-16 h-16 rounded-full bg-rose-900/30 flex items-center justify-center border border-rose-500/20">
                    <Heart className="text-rose-500 fill-rose-500/50" size={24} />
                  </div>
              </div>
          </div>
      );
  }

  if (!isNameEntered) {
      return (
        <div className="h-screen w-full flex items-center justify-center p-6 relative overflow-hidden">
            <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                className="glass-panel w-full max-w-md p-12 rounded-[3rem] relative z-10 flex flex-col items-center text-center"
            >
                <div className="relative mb-8 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-rose-500/20 to-pink-500/20 flex items-center justify-center border border-white/5 shadow-inner overflow-hidden mx-auto transition-all group-hover:border-rose-400/50">
                        {avatar ? <img src={avatar} alt="Avatar" className="w-full h-full object-cover" /> : <Camera size={32} className="text-rose-200" />}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Upload size={20} className="text-white" />
                        </div>
                    </div>
                    <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleAvatarUpload} />
                </div>
                <h1 className="text-4xl font-serif font-medium text-white mb-2 tracking-tight text-glow">GlassMeet</h1>
                <p className="text-white/40 font-light mb-10 text-sm">Where distance dissolves into light.</p>
                
                {errorMsg && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex flex-col gap-2 text-left w-full">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={18} />
                            <p className="text-red-200 text-sm leading-snug">{errorMsg}</p>
                        </div>
                        <button 
                            onClick={() => performLogin(name, avatar, true)}
                            className="self-end text-xs bg-red-500/20 hover:bg-red-500/40 text-red-200 px-3 py-1.5 rounded-lg transition"
                        >
                            Continue without Camera
                        </button>
                    </div>
                )}

                <div className="w-full space-y-4">
                    <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value.replace(/\s+/g, '').toLowerCase())}
                        placeholder="Your name"
                        className="w-full glass-input rounded-2xl px-6 py-4 text-center text-lg placeholder-white/20 focus:border-rose-500/50 transition-all lowercase"
                        onKeyDown={(e) => e.key === 'Enter' && handleManualLogin()}
                    />
                    <button onClick={handleManualLogin} disabled={!name} className="w-full bg-white text-black font-medium rounded-2xl py-4 hover:bg-rose-50 transition-all hover:scale-[1.02] shadow-[0_0_20px_rgba(255,255,255,0.1)] disabled:opacity-50">Enter Portal</button>
                </div>
            </motion.div>
        </div>
      );
  }

  return (
    <div className="h-screen w-full flex items-center justify-center p-8 gap-8 relative">
        <AnimatePresence>
            {incomingCall && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
                >
                    <div className="glass-panel p-10 rounded-[3rem] max-w-sm w-full text-center border-rose-500/30 shadow-[0_0_50px_rgba(225,29,72,0.15)]">
                        <div className="relative w-24 h-24 mx-auto mb-6">
                            {incomingCall.fromUser.avatarUrl ? <img src={incomingCall.fromUser.avatarUrl} className="w-24 h-24 rounded-full object-cover border-4 border-black/20" /> : <div className="w-24 h-24 bg-gradient-to-tr from-rose-500 to-pink-600 rounded-full flex items-center justify-center border-4 border-black/20"><VideoIcon size={32} className="text-white" /></div>}
                            <div className="absolute inset-0 bg-rose-500/20 rounded-full animate-ping -z-10"></div>
                        </div>
                        <h3 className="text-3xl font-serif text-white mb-2">@{incomingCall.fromUser.username}</h3>
                        <p className="text-rose-200/50 font-light mb-10">is calling you...</p>
                        <div className="flex gap-4 justify-center">
                            <button onClick={() => setIncomingCall(null)} className="px-8 py-4 rounded-2xl glass-button text-white/60 hover:text-white hover:bg-white/10">Decline</button>
                            <button onClick={acceptCall} className="px-8 py-4 rounded-2xl bg-rose-600 text-white font-medium hover:bg-rose-500 shadow-lg shadow-rose-900/50">Accept</button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex flex-col gap-6 z-10">
            <div className="glass-panel p-6 rounded-[2.5rem] w-80 flex items-center justify-between group hover:border-white/20 transition-colors">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center text-white font-serif text-lg overflow-hidden">
                        {currentUser?.avatarUrl ? <img src={currentUser.avatarUrl} alt="Me" className="w-full h-full object-cover" /> : currentUser?.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="text-white font-medium">@{currentUser?.username}</h3>
                        <div className="flex items-center gap-1.5 text-xs text-rose-400/80 mt-1">
                            {socket.connected ? (
                                <>
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    <span>Connected</span>
                                </>
                            ) : (
                                <>
                                    <WifiOff size={10} className="text-rose-400" />
                                    <span>Offline Mode</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <button onClick={handleLogout} className="p-3 rounded-full hover:bg-white/5 text-white/30 hover:text-white transition"><LogOut size={18} /></button>
            </div>
            <div className="glass-panel p-8 rounded-[2.5rem] w-80 space-y-6">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Room ID</label>
                    <input type="text" value={meetingId} onChange={(e) => setMeetingId(e.target.value)} placeholder="e.g. love-nest" className="w-full glass-input rounded-xl px-4 py-3 text-sm" />
                </div>
                <div className="grid gap-3">
                    <button onClick={joinSpecificRoom} disabled={!meetingId} className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition disabled:opacity-50">Join Room</button>
                    <button onClick={() => { setRoomId(crypto.randomUUID().substring(0, 8)); setIsJoined(true); }} className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium shadow-lg shadow-rose-900/30 transition">Create New</button>
                </div>
            </div>
        </motion.div>

        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="z-10">
            <ContactList />
        </motion.div>
    </div>
  );
};

const App = () => {
    const { isJoined } = useStore();
    
    return (
      <>
        <Wallpaper blur={isJoined} dim={isJoined} />
        <AnimatePresence mode="wait">
            {isJoined ? <RoomView key="room" /> : <LobbyDashboard key="lobby" />}
        </AnimatePresence>
      </>
    );
};

export default App;