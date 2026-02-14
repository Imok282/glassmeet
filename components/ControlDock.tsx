import React, { useState } from 'react';
import { useStore } from '../store';
import { 
  Mic, MicOff, Video, VideoOff, 
  MonitorUp, MessageSquare, PhoneOff, 
  MinusCircle, Smile, EyeOff, Moon, Music, Heart, Calendar,
  Sparkles, Feather, Flower2, Telescope, Wind, Mail, Hand
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { socket } from '../utils/socket';

export const ControlDock = () => {
  const { 
    isMicOn, toggleMic, 
    isCameraOn, toggleCamera,
    isScreenSharing, setScreenSharing,
    setLocalStream, 
    localStream,    
    isChatOpen, toggleChat,
    setRoomId, setIsJoined,
    toggleMinimize, isMinimized,
    currentUser, toggleHandHold, isHoldingHands, addReaction,
    isGhostMode, setGhostMode,
    isSleepMode, toggleSleepMode,
    toggleMusic, isMusicOpen,
    addKiss, toggleCountdown, isCountdownOpen,
    toggleNote, isNoteOpen,
    toggleQuestionDeck, isQuestionDeckOpen,
    isDateMode, toggleDateMode,
    isStargazingOpen, toggleStargazing,
    isBreathingActive, toggleBreathing,
    isLetterBoxOpen, toggleLetterBox, letters,
    setSharingUserId
  } = useStore();
  
  const [showReactions, setShowReactions] = useState(false);
  const REACTION_EMOJIS = ['❤️', '😂', '🎉', '😮', '👍'];

  const unreadLetters = letters.filter(l => l.toUsername === currentUser?.username && !l.isRead).length;

  const handleLeave = () => {
    const stream = useStore.getState().localStream;
    stream?.getTracks().forEach(track => track.stop());
    setRoomId(null);
    setIsJoined(false);
    setScreenSharing(false);
    setSharingUserId(null);
  };

  const handleMinimize = () => {
    toggleMinimize();
    document.title = isMinimized ? "GlassMeet" : "Notes";
  };

  const handleGhostMode = () => {
    if (isGhostMode) {
        setGhostMode(false);
        if (isMinimized) toggleMinimize();
    } else {
        if (isMicOn) toggleMic();
        if (isCameraOn) toggleCamera();
        setGhostMode(true);
        if (!isMinimized) toggleMinimize();
        document.title = "Google Docs";
    }
  };

  const handleHandHold = () => {
    const currentRoomId = useStore.getState().roomId;
    toggleHandHold();
    socket.emit('toggle-hand', { roomId: currentRoomId, userId: currentUser?.id, isHandRaised: !isHoldingHands });
  };

  const handleBreathing = () => {
    const currentRoomId = useStore.getState().roomId;
    toggleBreathing();
    socket.emit('sync-breathing', { roomId: currentRoomId, isActive: !isBreathingActive });
  };
  
  const handleDateMode = () => {
    const currentRoomId = useStore.getState().roomId;
    toggleDateMode();
    socket.emit('sync-date-mode', { roomId: currentRoomId, isActive: !isDateMode });
  };

  const handleStargazing = () => {
    toggleStargazing();
  };

  const sendReaction = (emoji: string) => {
    const currentRoomId = useStore.getState().roomId;
    addReaction(emoji);
    socket.emit('reaction', { roomId: currentRoomId, emoji });
    setShowReactions(false);
  };

  const sendKiss = () => {
    const currentRoomId = useStore.getState().roomId;
    addKiss();
    socket.emit('send-kiss', { roomId: currentRoomId, fromUser: currentUser?.username });
  };

  const handleScreenShare = async () => {
    const currentRoomId = useStore.getState().roomId;
    
    if (isScreenSharing) {
        localStream?.getTracks().forEach(track => {
            if (track.label.includes('screen') || track.label.includes('display')) track.stop();
        });
        setScreenSharing(false);
        setSharingUserId(null);
        socket.emit('screen-share-toggle', { roomId: currentRoomId, userId: null });
        try {
            const camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setLocalStream(camStream);
        } catch (e) { console.error(e); }
    } else {
        try {
            const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: "always" } as any, audio: true });
            setLocalStream(displayStream);
            setScreenSharing(true);
            setSharingUserId(currentUser?.id || null);
            socket.emit('screen-share-toggle', { roomId: currentRoomId, userId: currentUser?.id });
            
            displayStream.getVideoTracks()[0].onended = () => {
                setScreenSharing(false);
                setSharingUserId(null);
                socket.emit('screen-share-toggle', { roomId: currentRoomId, userId: null });
            };
        } catch (e) { console.error(e); }
    }
  };

  const ControlButton = ({ icon: Icon, onClick, active = false, danger = false, label, badge }: any) => (
    <div className="relative group flex flex-col items-center">
      <button 
        onClick={onClick}
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 relative
          ${active 
            ? 'bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)]' 
            : danger 
              ? 'bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white' 
              : 'glass-button text-white/70 hover:text-white'}
        `}
      >
        <Icon size={20} />
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#050102]">
            {badge}
          </span>
        )}
      </button>
      <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/80 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        {label}
      </span>
    </div>
  );

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4">
      {/* Interaction Dock */}
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-panel p-2 rounded-full flex items-center gap-1 shadow-2xl border-white/10"
      >
        <div className="flex items-center gap-1 border-r border-white/10 pr-2 mr-1">
          <ControlButton icon={isMicOn ? Mic : MicOff} onClick={toggleMic} active={!isMicOn} label="Mic" />
          <ControlButton icon={isCameraOn ? Video : VideoOff} onClick={toggleCamera} active={!isCameraOn} label="Camera" />
          <ControlButton icon={MonitorUp} onClick={handleScreenShare} active={isScreenSharing} label="Share Screen" />
        </div>

        <div className="flex items-center gap-1 border-r border-white/10 pr-2 mr-1">
          <ControlButton icon={Heart} onClick={sendKiss} label="Send Kiss" />
          <div className="relative">
            <ControlButton icon={Smile} onClick={() => setShowReactions(!showReactions)} active={showReactions} label="Reactions" />
            <AnimatePresence>
              {showReactions && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: -60 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md rounded-full p-2 flex gap-2 border border-white/10"
                >
                  {REACTION_EMOJIS.map(emoji => (
                    /* Fix: Removed duplicate key attribute */
                    <button key={emoji} onClick={() => sendReaction(emoji)} className="hover:scale-125 transition text-xl">{emoji}</button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {/* Fix: Added Hand icon to imports above to resolve 'Cannot find name Hand' error */}
          <ControlButton icon={Hand} onClick={handleHandHold} active={isHoldingHands} label="Hold Hands" />
        </div>

        <div className="flex items-center gap-1 border-r border-white/10 pr-2 mr-1">
          <ControlButton icon={Flower2} onClick={handleDateMode} active={isDateMode} label="Date Night" />
          <ControlButton icon={Telescope} onClick={handleStargazing} active={isStargazingOpen} label="Stargazing" />
          <ControlButton icon={Wind} onClick={handleBreathing} active={isBreathingActive} label="Breathe" />
          <ControlButton icon={Music} onClick={toggleMusic} active={isMusicOpen} label="Music" />
        </div>

        <div className="flex items-center gap-1 border-r border-white/10 pr-2 mr-1">
          <ControlButton icon={MessageSquare} onClick={toggleChat} active={isChatOpen} label="Chat" />
          <ControlButton icon={Mail} onClick={toggleLetterBox} active={isLetterBoxOpen} label="Love Letters" badge={unreadLetters} />
          <ControlButton icon={Sparkles} onClick={toggleQuestionDeck} active={isQuestionDeckOpen} label="Deep Talk" />
          <ControlButton icon={Feather} onClick={toggleNote} active={isNoteOpen} label="Our Notes" />
          <ControlButton icon={Calendar} onClick={toggleCountdown} active={isCountdownOpen} label="Countdown" />
        </div>

        <div className="flex items-center gap-1 border-r border-white/10 pr-2 mr-1">
          <ControlButton icon={isMinimized ? MinusCircle : MinusCircle} onClick={handleMinimize} active={isMinimized} label="Stealth Mode" />
          <ControlButton icon={isGhostMode ? EyeOff : Smile} onClick={handleGhostMode} active={isGhostMode} label="Ghost Mode" />
          <ControlButton icon={Moon} onClick={toggleSleepMode} active={isSleepMode} label="Sleep Mode" />
        </div>

        <ControlButton icon={PhoneOff} onClick={handleLeave} danger label="Leave Room" />
      </motion.div>
    </div>
  );
};