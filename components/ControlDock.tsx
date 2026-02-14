import React, { useState } from 'react';
import { useStore } from '../store';
import { Mic, MicOff, Video, VideoOff, MonitorUp, MessageSquare, PhoneOff, MinusCircle, Smile, EyeOff, Moon, Music, Heart, Calendar, Sparkles, Feather, Flower2, Telescope, Wind, Mail, Hand } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { socket } from '../utils/socket';

export const ControlDock = () => {
  const { 
    isMicOn, toggleMic, isCameraOn, toggleCamera, isScreenSharing, setScreenSharing,
    setLocalStream, localStream, isChatOpen, toggleChat, setRoomId, setIsJoined,
    toggleMinimize, isMinimized, currentUser, toggleHandHold, isHoldingHands, addReaction,
    isGhostMode, setGhostMode, isSleepMode, toggleSleepMode, toggleMusic, isMusicOpen,
    addKiss, toggleCountdown, isCountdownOpen, toggleNote, isNoteOpen, toggleQuestionDeck,
    isQuestionDeckOpen, isDateMode, toggleDateMode, isStargazingOpen, toggleStargazing,
    isBreathingActive, toggleBreathing, isLetterBoxOpen, toggleLetterBox, letters, setSharingUserId
  } = useStore();
  
  const [showReactions, setShowReactions] = useState(false);
  const REACTION_EMOJIS = ['❤️', '😂', '🎉', '😮', '👍'];

  const unreadLetters = letters.filter(l => l.toUsername === currentUser?.username && !l.isRead).length;

  const handleLeave = () => {
    localStream?.getTracks().forEach(track => track.stop());
    setRoomId(null);
    setIsJoined(false);
    window.location.reload();
  };

  const handleHandHold = () => {
    const roomId = useStore.getState().roomId;
    toggleHandHold();
    socket.emit('toggle-hand', { roomId, isHandRaised: !isHoldingHands });
  };

  const handleScreenShare = async () => {
    const roomId = useStore.getState().roomId;
    if (isScreenSharing) {
        localStream?.getTracks().forEach(track => track.stop());
        setScreenSharing(false);
        setSharingUserId(null);
        socket.emit('screen-share-toggle', { roomId, userId: null });
        try {
            const camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setLocalStream(camStream);
        } catch (e) { console.error(e); }
    } else {
        try {
            const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
            setLocalStream(displayStream);
            setScreenSharing(true);
            setSharingUserId(currentUser?.id || null);
            socket.emit('screen-share-toggle', { roomId, userId: currentUser?.id });
            displayStream.getVideoTracks()[0].onended = async () => {
                setScreenSharing(false);
                setSharingUserId(null);
                socket.emit('screen-share-toggle', { roomId, userId: null });
                const camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setLocalStream(camStream);
            };
        } catch (e) { console.error(e); }
    }
  };

  const ControlButton = ({ icon: Icon, onClick, active = false, danger = false, label, badge }: any) => (
    <div className="relative group flex flex-col items-center">
      <button 
        onClick={onClick}
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 relative
          ${active ? 'bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)]' : danger ? 'bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white' : 'glass-button text-white/70 hover:text-white'}
        `}
      >
        <Icon size={20} />
        {badge > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#050102]">{badge}</span>}
      </button>
    </div>
  );

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4">
      <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-panel p-2 rounded-full flex items-center gap-1 shadow-2xl border-white/10">
        <div className="flex items-center gap-1 border-r border-white/10 pr-2 mr-1">
          <ControlButton icon={isMicOn ? Mic : MicOff} onClick={toggleMic} active={!isMicOn} label="Mic" />
          <ControlButton icon={isCameraOn ? Video : VideoOff} onClick={toggleCamera} active={!isCameraOn} label="Camera" />
          <ControlButton icon={MonitorUp} onClick={handleScreenShare} active={isScreenSharing} label="Share Screen" />
        </div>
        <div className="flex items-center gap-1 border-r border-white/10 pr-2 mr-1">
          <ControlButton icon={Heart} onClick={() => socket.emit('send-kiss', { roomId: useStore.getState().roomId })} label="Send Kiss" />
          <ControlButton icon={Smile} onClick={() => setShowReactions(!showReactions)} active={showReactions} label="Reactions" />
          <ControlButton icon={Hand} onClick={handleHandHold} active={isHoldingHands} label="Hold Hands" />
        </div>
        <div className="flex items-center gap-1 border-r border-white/10 pr-2 mr-1">
          <ControlButton icon={Flower2} onClick={() => { toggleDateMode(); socket.emit('sync-date-mode', { roomId: useStore.getState().roomId, isActive: !isDateMode }); }} active={isDateMode} label="Date Night" />
          <ControlButton icon={Telescope} onClick={toggleStargazing} active={isStargazingOpen} label="Stargazing" />
          <ControlButton icon={Wind} onClick={() => { toggleBreathing(); socket.emit('sync-breathing', { roomId: useStore.getState().roomId, isActive: !isBreathingActive }); }} active={isBreathingActive} label="Breathe" />
          <ControlButton icon={Music} onClick={toggleMusic} active={isMusicOpen} label="Music" />
        </div>
        <div className="flex items-center gap-1 border-r border-white/10 pr-2 mr-1">
          <ControlButton icon={MessageSquare} onClick={toggleChat} active={isChatOpen} label="Chat" />
          <ControlButton icon={Mail} onClick={toggleLetterBox} active={isLetterBoxOpen} label="Love Letters" badge={unreadLetters} />
          <ControlButton icon={Sparkles} onClick={toggleQuestionDeck} active={isQuestionDeckOpen} label="Deep Talk" />
          <ControlButton icon={Feather} onClick={toggleNote} active={isNoteOpen} label="Our Notes" />
          <ControlButton icon={Calendar} onClick={toggleCountdown} active={isCountdownOpen} label="Countdown" />
        </div>
        <ControlButton icon={PhoneOff} onClick={handleLeave} danger label="Leave Room" />
      </motion.div>
    </div>
  );
};