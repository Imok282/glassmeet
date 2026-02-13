import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { Mic, MicOff, VideoOff, Clapperboard, Hand, EyeOff } from 'lucide-react';
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
}> = ({ stream, isMuted, label, isSpeaking, isVideoOff, isMirrored, isCinemaMode, isHandRaised, isGhostMode }) => {
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
          ? 'bg-black rounded-lg border border-white/10 shadow-2xl' 
          : 'rounded-[2rem] glass-panel-light border border-white/10 shadow-lg'}
      ${isSpeaking && !isCinemaMode && !isGhostMode ? 'ring-1 ring-rose-400/50' : ''}
      ${isHandRaised ? 'ring-2 ring-amber-300 shadow-[0_0_30px_rgba(252,211,77,0.3)]' : ''}
    `}>
      {effectivelyVideoOff ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[#050102]">
           {isGhostMode ? (
              <div className="flex flex-col items-center gap-3 text-white/20">
                  <EyeOff size={32} />
              </div>
           ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-rose-900/40 to-black flex items-center justify-center text-4xl font-serif text-white/50 border border-white/5 animate-[pulse_4s_ease-in-out_infinite]">
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
              className={`w-full h-full ${isCinemaMode ? 'object-contain' : 'object-cover'} ${isMirrored ? 'scale-x-[-1]' : ''} transition-transform duration-[2s] ease-out group-hover:scale-105`}
            />
            
            {/* Cinematic Overlays */}
            {isCinemaMode ? (
                <>
                    {/* Vignette - darkening corners for focus */}
                    <div className="absolute inset-0 pointer-events-none z-20 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.5)_100%)]"></div>
                    
                    {/* Static Film Grain - subtle texture */}
                    <div 
                        className="absolute inset-0 pointer-events-none z-10 opacity-[0.12] mix-blend-overlay"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                        }}
                    ></div>
                </>
            ) : (
                /* Simple Overlay for non-cinema mode */
                <div className="absolute inset-0 pointer-events-none z-10 bg-black/10"></div>
            )}
            
            {/* Warm Golden Tint when holding hands */}
            {isHandRaised && (
                <div className="absolute inset-0 z-20 bg-amber-500/10 mix-blend-soft-light pointer-events-none transition-opacity duration-1000"></div>
            )}
        </div>
      )}
      
      {/* Hand/Heart Indicator */}
      <AnimatePresence>
        {isHandRaised && !isGhostMode && (
            <motion.div 
                initial={{ scale: 0, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0, y: 10 }}
                className="absolute top-6 right-6 z-30 flex items-center gap-2"
            >
                <div className="bg-amber-400/20 backdrop-blur-md p-2 rounded-full border border-amber-400/30 text-amber-200">
                    <Hand size={16} fill="currentColor" />
                </div>
                <span className="text-[10px] font-bold text-amber-200 uppercase tracking-widest bg-black/40 px-2 py-1 rounded-full backdrop-blur-sm">Holding Hands</span>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Name Tag - Minimalist */}
      <div className={`absolute bottom-6 left-6 px-4 py-2 rounded-full flex items-center space-x-2 bg-black/40 backdrop-blur-md transition-opacity duration-300 z-20 border border-white/5 ${isCinemaMode ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
        <span className="text-white/90 text-xs font-medium tracking-wide">{label}</span>
      </div>
    </div>
  );
};

export const VideoGrid = () => {
  const { localStream, peers, currentUser, isCameraOn, isScreenSharing, isGhostMode, roomId, addKiss, activeKisses, removeKiss, isHoldingHands } = useStore();
  const peerIds = Object.keys(peers);
  
  const [ripples, setRipples] = useState<{ id: string, x: number, y: number }[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleTouch = (data: { x: number, y: number, user: any }) => {
        const id = Date.now().toString() + Math.random();
        setRipples(prev => [...prev, { id, x: data.x, y: data.y }]);
        setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 2000);
    };

    const handleKiss = () => addKiss();

    socket.on('touch-surface', handleTouch);
    socket.on('receive-kiss', handleKiss);

    return () => {
        socket.off('touch-surface', handleTouch);
        socket.off('receive-kiss', handleKiss);
    };
  }, [currentUser, addKiss]);

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current || !currentUser) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      socket.emit('touch-surface', { roomId, x, y, user: currentUser });
  };
  
  const totalUsers = peerIds.length + 1;
  const gridCols = totalUsers === 1 ? 'grid-cols-1' : totalUsers <= 4 ? 'grid-cols-2' : 'grid-cols-3';

  if (isScreenSharing) {
      return (
        <div className="flex-1 w-full h-full flex flex-col items-center justify-center p-4 relative z-10">
            <motion.div 
                layoutId="shared-screen"
                className="w-full max-w-[90%] h-[75%] relative group"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
            >
                <VideoPlayer 
                    stream={localStream} 
                    isMuted={true} 
                    label="Now Showing" 
                    isSpeaking={false} 
                    isVideoOff={false}
                    isMirrored={false}
                    isCinemaMode={true}
                    isHandRaised={false}
                    isGhostMode={isGhostMode}
                />
            </motion.div>
        </div>
      );
  }

  return (
    <div 
        ref={containerRef}
        onClick={handleContainerClick}
        className={`flex-1 p-12 grid gap-12 ${gridCols} content-center max-w-[100rem] mx-auto w-full h-full relative cursor-pointer`}
    >
        {/* Kiss Layer */}
        <div className="absolute inset-0 pointer-events-none z-[60]">
             <AnimatePresence>
                {activeKisses.map(k => (
                    <motion.div
                        key={k.id}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ 
                            opacity: [0, 1, 1, 0], 
                            scale: [0.5, 2, 2.5, 3], 
                            x: [0, -20, 20, 0], 
                            y: [0, -50] 
                        }}
                        transition={{ duration: 3, ease: "easeOut" }}
                        onAnimationComplete={() => removeKiss(k.id)}
                        className="absolute inset-0 flex items-center justify-center text-[8rem] filter drop-shadow-[0_0_50px_rgba(244,63,94,0.4)]"
                    >
                        💋
                    </motion.div>
                ))}
             </AnimatePresence>
        </div>

        {/* Liquid Glass Ripples */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-50">
            <AnimatePresence>
                {ripples.map(ripple => (
                    <motion.div
                        key={ripple.id}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 2.5, opacity: 1 }}
                        exit={{ opacity: 0, scale: 3 }}
                        transition={{ duration: 2, ease: "easeOut" }}
                        className="absolute rounded-full"
                        style={{
                            left: `${ripple.x * 100}%`,
                            top: `${ripple.y * 100}%`,
                            width: '120px',
                            height: '120px',
                            transform: 'translate(-50%, -50%)',
                            // Glass-like refraction effect using backdrop-filter
                            backdropFilter: 'blur(4px) brightness(1.2)',
                            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%)',
                            boxShadow: 'inset 0 0 20px rgba(255,255,255,0.2), 0 0 10px rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.15)'
                        }}
                    />
                ))}
            </AnimatePresence>
        </div>

      <motion.div layout className="aspect-video relative shadow-2xl pointer-events-none">
        <VideoPlayer 
            stream={localStream} 
            isMuted={true} 
            label="You"
            isSpeaking={false} 
            isVideoOff={!isCameraOn && !isScreenSharing}
            isMirrored={!isScreenSharing} 
            isHandRaised={isHoldingHands} // Use local state
            isGhostMode={isGhostMode}
        />
      </motion.div>

      {peerIds.map((id) => (
        <motion.div key={id} layout className="aspect-video relative shadow-2xl pointer-events-none">
          <VideoPlayer 
            stream={peers[id].stream || null} 
            label={peers[id].user.username} 
            isSpeaking={peers[id].isSpeaking}
            isVideoOff={peers[id].isVideoOff}
            isMuted={isGhostMode ? true : false} 
            isMirrored={false}
            isHandRaised={peers[id].isHandRaised} // Use peer state
            isGhostMode={isGhostMode}
          />
        </motion.div>
      ))}
    </div>
  );
};