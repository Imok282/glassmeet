
import React, { useState } from 'react';
import { useStore } from '../store';
import { 
  Mic, MicOff, Video, VideoOff, 
  MonitorUp, MessageSquare, PhoneOff, 
  MinusCircle, AlertCircle, Film,
  Hand, Smile, EyeOff, Moon, Music, Heart, Calendar,
  Sparkles, Feather, Flower2, Telescope, Wind, Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { socket } from '../utils/socket';

const REACTION_EMOJIS = ['❤️', '😂', '🎉', '😮', '👍'];

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
    currentUser, toggleHandHold, isHoldingHands, addReaction, roomId,
    isGhostMode, setGhostMode,
    isSleepMode, toggleSleepMode,
    toggleMusic, isMusicOpen,
    addKiss, toggleCountdown, isCountdownOpen,
    toggleNote, isNoteOpen,
    toggleQuestionDeck, isQuestionDeckOpen,
    isDateMode, toggleDateMode,
    isStargazingOpen, toggleStargazing,
    isBreathingActive, toggleBreathing,
    isLetterBoxOpen, toggleLetterBox, letters
  } = useStore();
  
  const [showReactions, setShowReactions] = useState(false);

  // Compute unread letters count
  const unreadLetters = letters.filter(l => l.toUsername === currentUser?.username && !l.isRead).length;

  const handleLeave = () => {
    const stream = useStore.getState().localStream;
    stream?.getTracks().forEach(track => track.stop());
    setRoomId(null);
    setIsJoined(false);
    setScreenSharing(false);
  };

  const handleEmergency = () => {
    const stream = useStore.getState().localStream;
    stream?.getTracks().forEach(track => track.stop());
    window.location.href = "https://www.youtube.com";
  };

  const handleMinimize = () => {
    toggleMinimize();
    document.title = "Notes";
    if (!isGhostMode) window.open("https://www.youtube.com", "_blank");
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
        window.open("https://www.youtube.com", "_blank"); 
        document.title = "Google Docs";
    }
  };

  const handleHandHold = () => {
    toggleHandHold();
    socket.emit('toggle-hand', { roomId, userId: currentUser?.id, isHandRaised: !isHoldingHands }); // Reusing event for now but treating as hand hold
  };

  const handleBreathing = () => {
    toggleBreathing();
    socket.emit('sync-breathing', { roomId, isActive: !isBreathingActive });
  };
  
  const handleDateMode = () => {
      toggleDateMode();
      socket.emit('sync-date-mode', { roomId, isActive: !isDateMode });
  };

  const sendReaction = (emoji: string) => {
    addReaction(emoji);
    socket.emit('reaction', { roomId, emoji });
    setShowReactions(false);
  };

  const sendKiss = () => {
    addKiss();
    socket.emit('send-kiss', { roomId, fromUser: currentUser?.username });
  };

  const handleScreenShare = async () => {
    // ... (Keep existing logic)
    const currentStream = localStream;
    if (isScreenSharing) {
        currentStream?.getVideoTracks().forEach(track => {
            if (track.label.includes('screen') || track.label.includes('display')) track.stop();
        });
        setScreenSharing(false);
        try {
            const camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setLocalStream(camStream);
        } catch (e) { console.error(e); }
    } else {
        try {
            const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: "always" } as any, audio: true });
            const videoTrack = displayStream.getVideoTracks()[0];
            const audioTrack = currentStream?.getAudioTracks()[0];
            const tracks = [videoTrack];
            if (displayStream.getAudioTracks().length > 0) tracks.push(displayStream.getAudioTracks()[0]); 
            else if (audioTrack) tracks.push(audioTrack);

            setLocalStream(new MediaStream(tracks));
            setScreenSharing(true);
            videoTrack.onended = async () => {
                setScreenSharing(false);
                try {
                    const camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                    setLocalStream(camStream);
                } catch (e) { console.error(e); }
            };
        } catch (e) { console.log(e); }
    }
  };

  const ButtonBase = ({ active, danger, onClick, children, tooltip, className = "" }: any) => (
    <motion.button
      whileHover={{ scale: 1.1, y: -2 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-300 relative group
        ${danger 
            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500 hover:text-white' 
            : active 
                ? 'bg-white/10 text-white border border-white/10 hover:bg-white/20' 
                : 'bg-black/20 text-white/40 border border-white/5 hover:bg-white/10 hover:text-white/80' 
        }
        ${className}
      `}
    >
      {children}
      {/* Tooltip */}
      <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/80 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10">
        {tooltip}
      </span>
    </motion.button>
  );

  return (
    <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${isScreenSharing ? 'translate-y-24 hover:translate-y-0' : 'translate-y-0'}`}>
      
      {/* Reactions Popover */}
      <AnimatePresence>
        {showReactions && (
            <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: -20, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute left-1/2 -translate-x-1/2 bottom-full flex gap-2 p-2 rounded-full glass-panel mb-2"
            >
                {REACTION_EMOJIS.map(emoji => (
                    <button 
                        key={emoji}
                        onClick={() => sendReaction(emoji)}
                        className="text-2xl hover:scale-125 transition-transform p-1.5"
                    >
                        {emoji}
                    </button>
                ))}
            </motion.div>
        )}
      </AnimatePresence>

      <div className={`
        flex items-center gap-3 p-3 rounded-3xl
        glass-panel
        transition-colors duration-1000
        ${isSleepMode ? 'bg-black/60 border-white/5' : ''}
        ${isDateMode ? 'shadow-[0_0_50px_rgba(244,63,94,0.3)] border-rose-500/30' : ''}
      `}>
        
        {/* Media Controls */}
        <div className="flex gap-2">
            <ButtonBase active={isMicOn} onClick={toggleMic} tooltip="Mic">
            {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
            </ButtonBase>

            <ButtonBase active={isCameraOn} onClick={toggleCamera} tooltip="Camera">
            {isCameraOn ? <Video size={20} /> : <VideoOff size={20} />}
            </ButtonBase>
        </div>

        <div className="w-px h-8 bg-white/10" />

        {/* Intimacy Features */}
        <div className="flex gap-2">
             <ButtonBase active={isDateMode} onClick={handleDateMode} tooltip="Date Night" className={isDateMode ? "text-rose-400" : ""}>
                <Flower2 size={20} className={isDateMode ? "text-rose-400 fill-rose-500/20" : ""} />
            </ButtonBase>

            <ButtonBase active={!isStargazingOpen} onClick={toggleStargazing} tooltip="Stargaze" className={isStargazingOpen ? "bg-purple-500/20 text-purple-300 border-purple-500/30" : ""}>
                <Telescope size={20} className={isStargazingOpen ? "text-purple-200" : ""} />
            </ButtonBase>
            
            <ButtonBase active={!isBreathingActive} onClick={handleBreathing} tooltip="Breathe" className={isBreathingActive ? "bg-cyan-500/20 text-cyan-300" : ""}>
                <Wind size={20} />
            </ButtonBase>

            <ButtonBase active={!isMusicOpen} onClick={toggleMusic} tooltip="Music">
                <Music size={20} className={isMusicOpen ? "text-rose-400" : ""} />
            </ButtonBase>

            <ButtonBase active={!isQuestionDeckOpen} onClick={toggleQuestionDeck} tooltip="Deep Talk">
                <Sparkles size={20} className={isQuestionDeckOpen ? "text-yellow-400" : ""} />
            </ButtonBase>

            <ButtonBase active={!isNoteOpen} onClick={toggleNote} tooltip="Notes">
                <Feather size={20} className={isNoteOpen ? "text-rose-300" : ""} />
            </ButtonBase>

             <ButtonBase active={true} onClick={sendKiss} tooltip="Kiss">
                <Heart size={20} className="text-rose-400 fill-rose-500/20" />
            </ButtonBase>

            {/* Hand Holding Button (Replaces Hand Raise) */}
            <ButtonBase 
                active={isHoldingHands} 
                onClick={handleHandHold} 
                tooltip={isHoldingHands ? "Let Go" : "Hold Hands"}
                className={isHoldingHands ? "border-amber-400/50 bg-amber-500/10" : ""}
            >
                 <Hand size={20} className={isHoldingHands ? "text-amber-300 fill-amber-300/30" : "text-white/60"} />
            </ButtonBase>
        </div>

        <div className="w-px h-8 bg-white/10" />
        
        {/* Environment */}
        <div className="flex gap-2">
            <ButtonBase active={!isCountdownOpen} onClick={toggleCountdown} tooltip="Timer">
                <Calendar size={20} className={isCountdownOpen ? "text-rose-400" : ""} />
            </ButtonBase>

            <ButtonBase active={isSleepMode} onClick={toggleSleepMode} tooltip="Sleep">
            <Moon size={20} className={isSleepMode ? "text-indigo-300 fill-indigo-300/30" : ""} />
            </ButtonBase>

            <ButtonBase active={!isScreenSharing} onClick={handleScreenShare} tooltip="Cinema">
            {isScreenSharing ? <Film size={20} className="text-rose-400 animate-pulse" /> : <MonitorUp size={20} />}
            </ButtonBase>
        </div>

        <div className="w-px h-8 bg-white/10" />

        {/* Social */}
        <div className="flex gap-2">
            <ButtonBase active={showReactions} onClick={() => setShowReactions(!showReactions)} tooltip="React">
                <Smile size={20} className={showReactions ? "text-rose-400" : ""} />
            </ButtonBase>

            <ButtonBase active={!isLetterBoxOpen} onClick={toggleLetterBox} tooltip="Letters" className="relative">
                <Mail size={20} className={isLetterBoxOpen ? "text-rose-300" : ""} />
                {unreadLetters > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full text-[10px] flex items-center justify-center text-white border border-black/50">
                        {unreadLetters}
                    </span>
                )}
            </ButtonBase>

            <ButtonBase active={!isChatOpen} onClick={toggleChat} tooltip="Chat">
            <MessageSquare size={20} className={isChatOpen ? "text-blue-400" : ""} />
            </ButtonBase>
        </div>

        <div className="w-px h-8 bg-white/10" />

        {/* System */}
        <div className="flex gap-2">
            <ButtonBase active={!isGhostMode} onClick={handleGhostMode} tooltip="Ghost">
                <EyeOff size={20} className={isGhostMode ? "text-white/40" : "text-purple-400"} />
            </ButtonBase>

            <ButtonBase active={true} onClick={handleMinimize} tooltip="Hide">
            <MinusCircle size={20} className="text-yellow-500" />
            </ButtonBase>

            <ButtonBase danger onClick={handleLeave} tooltip="Leave">
            <PhoneOff size={20} />
            </ButtonBase>
        </div>

        {/* Panic Button - Separated */}
        <div className="ml-2 pl-2 border-l border-white/10">
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleEmergency}
                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-rose-900/40 border border-white/10"
                title="EMERGENCY ESCAPE"
            >
                <AlertCircle size={20} />
            </motion.button>
        </div>
      </div>
    </div>
  );
};
