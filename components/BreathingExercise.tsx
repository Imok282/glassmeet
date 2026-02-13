
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { socket } from '../utils/socket';
import { Wind } from 'lucide-react';

export const BreathingExercise = () => {
  const { isBreathingActive, toggleBreathing, roomId } = useStore();
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [text, setText] = useState('Inhale');

  // Cycle logic
  useEffect(() => {
    if (!isBreathingActive) return;

    let timeoutId: any;

    const runCycle = () => {
        // Inhale (4s)
        setPhase('inhale');
        setText('Breathe In');
        
        timeoutId = setTimeout(() => {
            // Hold (4s)
            setPhase('hold');
            setText('Hold');
            
            timeoutId = setTimeout(() => {
                // Exhale (4s)
                setPhase('exhale');
                setText('Breathe Out');
                
                timeoutId = setTimeout(() => {
                    runCycle(); // Loop
                }, 4000);
            }, 4000);
        }, 4000);
    };

    runCycle();

    return () => clearTimeout(timeoutId);
  }, [isBreathingActive]);

  // Socket listener for toggle
  useEffect(() => {
    const handleSync = ({ isActive }: { isActive: boolean }) => {
        if (isActive !== useStore.getState().isBreathingActive) {
            useStore.setState({ isBreathingActive: isActive });
        }
    };
    socket.on('sync-breathing', handleSync);
    return () => { socket.off('sync-breathing', handleSync); };
  }, []);

  const handleClose = () => {
      toggleBreathing();
      socket.emit('sync-breathing', { roomId, isActive: false });
  };

  return (
    <AnimatePresence>
        {isBreathingActive && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 backdrop-blur-md"
            >
                <div className="relative flex flex-col items-center justify-center">
                    {/* Glowing Orb */}
                    <motion.div
                        animate={{
                            scale: phase === 'inhale' ? 1.5 : phase === 'hold' ? 1.5 : 0.8,
                            opacity: phase === 'inhale' ? 0.8 : phase === 'hold' ? 1 : 0.6,
                            filter: phase === 'hold' ? 'blur(8px)' : 'blur(16px)'
                        }}
                        transition={{ duration: 4, ease: "easeInOut" }}
                        className="w-64 h-64 rounded-full bg-gradient-to-tr from-sky-200 to-indigo-300 shadow-[0_0_100px_rgba(165,243,252,0.4)]"
                    ></motion.div>
                    
                    {/* Ring Guide */}
                    <motion.div
                        animate={{
                            scale: phase === 'inhale' ? 1.5 : phase === 'hold' ? 1.5 : 0.8,
                            borderColor: phase === 'hold' ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.2)'
                        }}
                        transition={{ duration: 4, ease: "easeInOut" }}
                        className="absolute w-64 h-64 rounded-full border border-white/30"
                    ></motion.div>

                    {/* Text */}
                    <motion.div
                        key={text}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute text-3xl font-serif text-white tracking-widest font-light mix-blend-difference"
                    >
                        {text}
                    </motion.div>

                    {/* Footer */}
                    <div className="absolute bottom-[-100px] flex flex-col items-center gap-4">
                        <span className="text-white/40 text-xs uppercase tracking-[0.2em]">Synchronized Breathing</span>
                        <button 
                            onClick={handleClose}
                            className="px-6 py-2 rounded-full border border-white/10 text-white/50 hover:bg-white/10 hover:text-white transition text-sm"
                        >
                            End Session
                        </button>
                    </div>
                </div>
            </motion.div>
        )}
    </AnimatePresence>
  );
};
