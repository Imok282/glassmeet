import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { Mic, MicOff, VideoOff, Clapperboard, Hand, EyeOff, Maximize2, Users, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { socket } from '../utils/socket';

const VideoPlayer: React.FC<{ 
    stream: MediaStream | null; 
    isMuted?: boolean; 
    label: string; 
    isSpeaking: boolean; 
    isVideoOff: boolean;
    isMirrored?: boolean;
    isCinemaMode?: boolean;
    isHandRaised?: boolean;
    isGhostMode?: boolean;
    compact?: boolean;
}> = ({ stream, isMuted, label, isSpeaking, isVideoOff, isMirrored, isCinemaMode, isHandRaised, isGhostMode, compact }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const effectivelyMuted = isGhostMode ? true : isMuted;
  const effectivelyVideoOff = isGhostMode ? true : isVideoOff;

  return (
    <div className={`relative w-full h-full overflow-hidden transition-all duration-700 pointer-events-none select-none
      ${isCinemaMode 
          ? 'bg-black shadow-[0_0_100px_rgba(0,0,0,1)]' 
          : compact 
            ? 'rounded-2xl glass-panel-light border border-white/10 shadow-lg'
            : 'rounded-[2.5rem] glass-panel-light border border-white/10 shadow-2xl'}
      ${isSpeaking && !isCinemaMode && !isGhostMode ? 'ring-2 ring-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.3)]' : ''}
      ${isHandRaised ? 'ring-2 ring-amber-400 shadow-[0_0_30px_rgba(252,211,77,0.4)]' : ''}
    `}>
      {effectivelyVideoOff ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[#080405]">
           {isGhostMode ? (
              <div className="flex flex-col items-center gap-3 text-white/10">
                  <EyeOff size={compact ? 20 : 32} />
              </div>
           ) : (
              <div className={`${compact ? 'w-12 h-12 text-lg' : 'w-24 h-24 text-4xl'} rounded-full bg-gradient-to-tr from-rose-950 to-stone-900 flex items-center justify-center font-serif text-white/50 border border-white/5 animate-[pulse_4s_ease-in-out_infinite]`}>
                  {label.charAt(0).toUpperCase()}
              </div>
           )}
        </div>
      ) : (
        <div className="relative w-full h-full group">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted={effectivelyMuted}
              className={`w-full h-full ${isCinemaMode ? 'object-contain' : 'object-cover'} ${isMirrored ? 'scale-x-[-1]' : ''} transition-transform duration-[2s] ease-out`}
            />
            {isCinemaMode && (
                <div className="absolute inset-0 pointer-events-none z-20 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.8)_100%)] shadow-[inset_0_0_150px_rgba(0,0,0,1)]"></div>
            )}
        </div>
      )}
      
      <AnimatePresence>
        {isHandRaised && !isGhostMode && (
            <motion.div 
                initial={{ scale: 0, x: 10, opacity: 0 }}
                animate={{ scale: 1.2, x: 0, opacity: 1 }}
                exit={{ scale: 0, x: 10, opacity: 0 }}
                className={`absolute top-4 right-4 z-30 flex items-center gap-2`}
            >
                <div className={`${compact ? 'p-1.5' : 'p-3'} bg-amber-400 text-black rounded-full shadow-[0_0_20px_rgba(251,191,36,0.6)]`}>
                    <Hand size={compact ? 14 : 20} fill="currentColor" />
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      <div className={`absolute bottom-4 left-4 px-3 py-1.5 rounded-full flex items-center space-x-2 bg-black/60 backdrop-blur-xl border border-white/10 z-20 transition-opacity duration-500 ${isCinemaMode ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
        <span className={`text-white/90 ${compact ? 'text-[10px]' : 'text-xs'} font-medium tracking-wide truncate max-w-[120px]`}>{label}</span>
        {isSpeaking && !isGhostMode && (
            <div className="flex gap-0.5">
                {[1,2,3].map(i => (
                    <motion.div 
                        key={i}
                        animate={{ height: [4, 10, 4] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                        className="w-0.5 bg-rose-400 rounded-full"
                    />
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export const VideoGrid = () => {
  const { localStream, peers, currentUser, isCameraOn, isScreenSharing, sharingUserId, isGhostMode, roomId, activeKisses, removeKiss, isHoldingHands } = useStore();
  const peerIds = Object.keys(peers);
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!currentUser || !roomId) return;
    socket.emit('mouse-move', {
      roomId,
      userId: currentUser.id,
      username: currentUser.username,
      x: e.clientX / window.innerWidth,
      y: e.clientY / window.innerHeight
    });
  };

  const handleContainerClick = (e: React.MouseEvent) => {
      if (!currentUser || !roomId) return;
      socket.emit('touch-surface', {
          roomId,
          user: currentUser,
          x: e.clientX / window.innerWidth,
          y: e.clientY / window.innerHeight
      });
  };
  
  const totalUsers = peerIds.length + 1;
  const anyoneSharing = sharingUserId !== null;
  const sharerStream = sharingUserId === currentUser?.id ? localStream : (sharingUserId ? peers[sharingUserId]?.stream : null);

  // TRUE CINEMATIC STAGE MODE (Full Screen Priority)
  if (anyoneSharing) {
      return (
        <div onMouseMove={handleMouseMove} onClick={handleContainerClick} className="fixed inset-0 z-10 flex bg-black cursor-none overflow-hidden">
            {/* The Main Stage */}
            <div className="flex-1 relative h-full flex items-center justify-center">
                <VideoPlayer 
                    stream={sharerStream || null} 
                    isMuted={sharingUserId === currentUser?.id} 
                    label={sharingUserId === currentUser?.id ? "Your Presentation" : `${peers[sharingUserId || '']?.user.username}'s Presentation`} 
                    isSpeaking={false} 
                    isVideoOff={false}
                    isMirrored={false}
                    isCinemaMode={true}
                    isGhostMode={isGhostMode}
                />
                
                {/* Visual Status Indicator */}
                <div className="absolute top-10 left-10 flex items-center gap-3 bg-rose-600/20 backdrop-blur-3xl px-6 py-4 rounded-3xl border border-rose-500/30 opacity-80 z-30 pointer-events-none">
                    <Monitor className="text-rose-400 animate-pulse" size={20} />
                    <span className="text-white text-sm font-bold tracking-widest uppercase">Live Cinema Mode</span>
                </div>
            </div>

            {/* macOS Floating Sidebar for Participants */}
            <div className="w-72 h-full bg-[#050102]/80 backdrop-blur-3xl border-l border-white/5 p-8 flex flex-col gap-6 overflow-y-auto">
                <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-2 px-1 flex items-center gap-2">
                    <Users size={12} /> Participants
                </div>
                
                {/* Local User */}
                <div className="aspect-video w-full flex-shrink-0 relative group">
                    <VideoPlayer stream={localStream} isMuted={true} label="You" isSpeaking={false} isVideoOff={!isCameraOn} isMirrored={!isScreenSharing} isHandRaised={isHoldingHands} isGhostMode={isGhostMode} compact={true} />
                </div>
                
                {/* Remote Peers */}
                {peerIds.filter(id => id !== sharingUserId).map((id) => (
                    <div key={id} className="aspect-video w-full flex-shrink-0">
                        <VideoPlayer stream={peers[id].stream || null} label={peers[id].user.username} isSpeaking={peers[id].isSpeaking} isVideoOff={peers[id].isVideoOff} isMuted={false} isMirrored={false} isHandRaised={peers[id].isHandRaised} isGhostMode={isGhostMode} compact={true} />
                    </div>
                ))}
            </div>

            {/* Global Interaction Layer (Mirrored Kisses) */}
            <div className="absolute inset-0 pointer-events-none z-[60]">
                 <AnimatePresence>
                    {activeKisses.map(k => (
                        <motion.div 
                          key={k.id} 
                          initial={{ opacity: 0, scale: 0.5, y: 100 }} 
                          animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 3, 3, 5], x: [0, -60, 60, 0], y: [100, -200] }} 
                          transition={{ duration: 4.5, ease: "easeOut" }} 
                          onAnimationComplete={() => removeKiss(k.id)} 
                          className="absolute inset-0 flex items-center justify-center text-[15rem] filter drop-shadow-[0_0_100px_rgba(244,63,94,0.7)]"
                        >
                            💋
                        </motion.div>
                    ))}
                 </AnimatePresence>
            </div>
        </div>
      );
  }

  // STANDARD GRID MODE
  const gridCols = totalUsers === 1 ? 'grid-cols-1' : totalUsers === 2 ? 'grid-cols-2' : totalUsers <= 4 ? 'grid-cols-2' : 'grid-cols-3';

  return (
    <div onMouseMove={handleMouseMove} onClick={handleContainerClick} className={`flex-1 p-8 md:p-16 grid gap-8 md:gap-12 ${gridCols} content-center max-w-[110rem] mx-auto w-full h-full relative cursor-none`}>
        <div className="absolute inset-0 pointer-events-none z-[60]">
             <AnimatePresence>
                {activeKisses.map(k => (
                    <motion.div 
                      key={k.id} 
                      initial={{ opacity: 0, scale: 0.5 }} 
                      animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 2.5, 2.5, 4], x: [0, -40, 40, 0], y: [0, -100] }} 
                      transition={{ duration: 3.5, ease: "easeOut" }} 
                      onAnimationComplete={() => removeKiss(k.id)} 
                      className="absolute inset-0 flex items-center justify-center text-[12rem] filter drop-shadow-[0_0_60px_rgba(244,63,94,0.6)]"
                    >
                        💋
                    </motion.div>
                ))}
             </AnimatePresence>
        </div>
      <motion.div layout className={`aspect-video relative shadow-2xl transition-all duration-700 ${totalUsers === 1 ? 'max-w-4xl mx-auto w-full' : ''}`}>
        <VideoPlayer stream={localStream} isMuted={true} label="You" isSpeaking={false} isVideoOff={!isCameraOn} isMirrored={!isScreenSharing} isHandRaised={isHoldingHands} isGhostMode={isGhostMode} />
      </motion.div>
      {peerIds.map((id) => (
        <motion.div key={id} layout className="aspect-video relative shadow-2xl">
          <VideoPlayer stream={peers[id].stream || null} label={peers[id].user.username} isSpeaking={peers[id].isSpeaking} isVideoOff={peers[id].isVideoOff} isMuted={false} isMirrored={false} isHandRaised={peers[id].isHandRaised} isGhostMode={isGhostMode} />
        </motion.div>
      ))}
    </div>
  );
};