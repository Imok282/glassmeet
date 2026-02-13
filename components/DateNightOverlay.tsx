
import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { socket } from '../utils/socket';

// --- Assets & Constants ---
const PETALS = ['🌸', '🥀', '🌹'];
const HEARTS = ['❤️', '💖', '💗', '💞'];
const SPARKLES = ['✨', '⭐'];

// --- Sub-Components ---

const Flame = () => (
  <div className="relative w-4 h-12 -top-10 left-1/2 -translate-x-1/2 origin-bottom">
    {/* Outer Glow Pulse - Realistic Flicker */}
    <motion.div
      animate={{ 
        opacity: [0.2, 0.3, 0.25, 0.35, 0.2, 0.3], 
        scale: [1, 1.2, 1.1, 1.3, 1.15, 1] 
      }}
      transition={{ 
        duration: 3, 
        repeat: Infinity, 
        ease: "easeInOut",
        times: [0, 0.2, 0.4, 0.6, 0.8, 1]
      }}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-orange-500/30 rounded-full blur-2xl"
    />
    
    {/* Main Flame Core */}
    <motion.div 
      animate={{ 
        scaleX: [1, 1.05, 0.95, 1.02, 0.98, 1],
        scaleY: [1, 1.1, 0.92, 1.08, 0.95, 1],
        rotate: [-1, 2, -1.5, 1.5, -0.5, 0],
        skewX: [-2, 2, -1, 1, 0],
      }}
      transition={{ duration: 0.6, repeat: Infinity, ease: "linear", repeatType: "mirror" }}
      className="w-full h-full bg-gradient-to-t from-orange-600 via-orange-400 to-yellow-100 rounded-[50%_50%_50%_50%_/_60%_60%_40%_40%] shadow-[0_0_15px_rgba(255,165,0,0.8)] blur-[0.5px] origin-bottom"
    >
        {/* Inner Blue Core */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-3 bg-blue-600/60 rounded-full blur-[1px]"></div>
    </motion.div>
    
    {/* Wick */}
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[2px] h-3 bg-black/60"></div>
  </div>
);

const Candle = ({ scale = 1, delay = 0 }) => (
  <motion.div 
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 1 }}
    className="relative flex flex-col items-center group"
    style={{ transform: `scale(${scale})` }}
  >
    <Flame />
    {/* Wax Body */}
    <div className="w-12 h-32 bg-gradient-to-r from-stone-200 via-stone-100 to-stone-300 rounded-sm relative shadow-inner">
       <div className="absolute top-0 w-full h-4 bg-stone-100/50 rounded-[50%] blur-[1px]"></div>
       {/* Drips */}
       <div className="absolute top-2 right-2 w-1.5 h-8 bg-stone-100 rounded-full opacity-80 shadow-sm"></div>
       <div className="absolute top-4 right-3 w-1.5 h-4 bg-stone-100 rounded-full opacity-70"></div>
       
       {/* Candle Inner Glow */}
       <div className="absolute top-0 left-0 w-full h-12 bg-gradient-to-b from-orange-200/20 to-transparent rounded-t-sm"></div>
    </div>
    {/* Reflection/Shadow at base */}
    <div className="w-20 h-4 bg-black/40 blur-md rounded-full mt-[-5px]"></div>
  </motion.div>
);

const FloatingParticle: React.FC<{ type: 'petal' | 'heart' | 'sparkle', delay: number, startX: number }> = ({ type, delay, startX }) => {
  const symbol = useMemo(() => {
    if (type === 'petal') return PETALS[Math.floor(Math.random() * PETALS.length)];
    if (type === 'heart') return HEARTS[Math.floor(Math.random() * HEARTS.length)];
    return SPARKLES[Math.floor(Math.random() * SPARKLES.length)];
  }, [type]);

  const size = type === 'sparkle' ? 'text-xl' : type === 'heart' ? 'text-3xl' : 'text-2xl';
  // Slower, more gentle float
  const duration = 18 + Math.random() * 12;

  return (
    <motion.div
      initial={{ y: "110vh", x: `${startX}vw`, opacity: 0, rotate: 0, scale: 0.5 }}
      animate={{ 
        y: "-10vh",
        opacity: [0, 0.8, 1, 0.8, 0],
        rotate: [0, 45, 90, 135, 180],
        x: [`${startX}vw`, `${startX + (Math.random() * 15 - 7.5)}vw`, `${startX}vw`],
        scale: [0.5, 1, 0.8]
      }}
      transition={{ 
        duration: duration, 
        repeat: Infinity, 
        delay: delay, 
        ease: "linear"
      }}
      className={`absolute ${size} filter drop-shadow-[0_0_5px_rgba(255,200,200,0.5)] z-20 pointer-events-none select-none`}
      style={{
        filter: type === 'petal' ? 'blur(0.5px)' : 'none'
      }}
    >
      {symbol}
    </motion.div>
  );
};

export const DateNightOverlay = () => {
  const { isDateMode } = useStore();
  const [particles, setParticles] = useState<any[]>([]);

  // Sync logic
  useEffect(() => {
    const handleSync = ({ isActive }: { isActive: boolean }) => {
        if (isActive !== useStore.getState().isDateMode) {
            useStore.setState({ isDateMode: isActive });
        }
    };
    socket.on('sync-date-mode', handleSync);
    return () => { socket.off('sync-date-mode', handleSync); };
  }, []);

  // Initialize randomized particles
  useEffect(() => {
    if (isDateMode) {
      const newParticles = [];
      // More particles for richer effect
      for (let i = 0; i < 20; i++) {
        newParticles.push({ id: `petal-${i}`, type: 'petal', delay: Math.random() * 20, startX: Math.random() * 100 });
      }
      for (let i = 0; i < 12; i++) {
        newParticles.push({ id: `heart-${i}`, type: 'heart', delay: Math.random() * 25, startX: Math.random() * 100 });
      }
      for (let i = 0; i < 15; i++) {
        newParticles.push({ id: `sparkle-${i}`, type: 'sparkle', delay: Math.random() * 15, startX: Math.random() * 100 });
      }
      setParticles(newParticles);
    }
  }, [isDateMode]);

  if (!isDateMode) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.5 }}
        className="fixed inset-0 z-[45] pointer-events-none overflow-hidden"
      >
        {/* 1. Warm Cinema Filter Base */}
        <div className="absolute inset-0 bg-rose-950/20 mix-blend-multiply z-0"></div>
        
        {/* 2. Ambient Flicker Overlay - Simulates candlelight filling the room */}
        <motion.div 
            animate={{ opacity: [0.2, 0.3, 0.25] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,200,150,0.15)_0%,transparent_70%)] z-0 mix-blend-screen"
        ></motion.div>

        {/* 3. Vignette */}
        <div className="absolute inset-0 shadow-[inset_0_0_180px_rgba(30,0,5,0.7)] z-10"></div>

        {/* 4. Floating Particles */}
        <div className="absolute inset-0 z-20">
            {particles.map(p => (
                <FloatingParticle key={p.id} type={p.type} delay={p.delay} startX={p.startX} />
            ))}
        </div>

        {/* 5. Candle Arrangements (Bottom Layer) */}
        <div className="absolute bottom-0 w-full h-48 z-30 flex items-end justify-between px-[10%] pb-4">
            {/* Left Cluster */}
            <div className="flex items-end gap-[-10px] scale-75 md:scale-100 origin-bottom-left">
                 <Candle scale={0.8} delay={0.2} />
                 <div className="-ml-6 mb-2 z-10"><Candle scale={1.0} delay={0} /></div>
                 <div className="-ml-6"><Candle scale={0.7} delay={0.4} /></div>
                 
                 {/* Rose on table with shadow */}
                 <div className="absolute -right-16 bottom-0 text-6xl opacity-90 rotate-45 filter drop-shadow-2xl brightness-75">🌹</div>
            </div>

            {/* Right Cluster */}
            <div className="flex items-end gap-[-10px] scale-75 md:scale-100 origin-bottom-right">
                 <div className="-mr-6"><Candle scale={0.75} delay={0.5} /></div>
                 <div className="-mr-6 mb-3 z-10"><Candle scale={1.0} delay={0.1} /></div>
                 <Candle scale={0.85} delay={0.3} />
                 
                 {/* Withered Rose with shadow */}
                 <div className="absolute -left-16 bottom-2 text-6xl opacity-90 -rotate-12 filter drop-shadow-2xl brightness-75">🥀</div>
            </div>
        </div>

        {/* 6. Bottom Gradient for blending candles into UI */}
        <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-20"></div>

      </motion.div>
    </AnimatePresence>
  );
};
