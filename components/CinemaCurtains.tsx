import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { Star } from 'lucide-react';

export const CinemaCurtains = () => {
  const { sharingUserId } = useStore();
  const isPresenting = sharingUserId !== null;

  // Realistic pull-back transition
  const curtainTransition = {
      duration: 3.8,
      ease: [0.45, 0, 0.55, 1] as any,
      delay: 3.0 
  };

  return (
    <div className="fixed inset-0 z-[150] pointer-events-none overflow-hidden">
      <AnimatePresence>
        {isPresenting && (
            <motion.div key="curtain-container" exit={{ opacity: 0 }} transition={{ delay: 6.5 }}>
                {/* Intro Title Card */}
                <div className="absolute inset-0 flex items-center justify-center z-[170] pointer-events-none">
                    <motion.div
                        key="intro-content"
                        initial={{ opacity: 0, scale: 0.8, filter: "blur(20px)" }}
                        animate={{ 
                            opacity: [0, 1, 1, 1, 0], 
                            scale: [0.9, 1, 1, 1.1, 1.2], 
                            filter: ["blur(20px)", "blur(0px)", "blur(0px)", "blur(0px)", "blur(40px)"] 
                        }}
                        transition={{ 
                            duration: 3, 
                            times: [0, 0.2, 0.7, 0.85, 1], 
                            ease: "easeInOut" 
                        }}
                        className="bg-black/80 p-12 md:p-24 rounded-[4rem] border-double border-8 border-yellow-600/40 shadow-[0_0_200px_rgba(234,179,8,0.2)] backdrop-blur-3xl relative overflow-hidden"
                    >
                         <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-yellow-500/10 to-transparent skew-x-12 animate-[pulse_4s_infinite]"></div>
                         <div className="text-center relative z-10">
                            <div className="flex justify-center mb-8 space-x-6 opacity-80">
                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}><Star className="text-yellow-500 fill-yellow-500" size={32} /></motion.div>
                                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 3, repeat: Infinity }}><Star className="text-yellow-200 fill-yellow-200" size={56} /></motion.div>
                                <motion.div animate={{ rotate: -360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}><Star className="text-yellow-500 fill-yellow-500" size={32} /></motion.div>
                            </div>
                            <h1 className="text-7xl md:text-9xl font-serif font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-yellow-400 to-yellow-800 tracking-tight drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] uppercase scale-y-110" style={{ textShadow: '0 0 50px rgba(234,179,8,0.6)' }}>Feature</h1>
                            <h2 className="text-4xl md:text-6xl font-serif italic text-rose-100/90 mt-4 tracking-widest font-light">Presentation</h2>
                            <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 1.5, delay: 0.5 }} className="h-[2px] bg-gradient-to-r from-transparent via-yellow-500 to-transparent mt-12 shadow-[0_0_30px_rgba(234,179,8,1)] mx-auto"></motion.div>
                         </div>
                    </motion.div>
                </div>

                {/* Left Velvet Curtain */}
                <motion.div
                    initial={{ x: "0%", scaleX: 1 }}
                    animate={{ x: "-95%", scaleX: 0.2 }}
                    exit={{ x: "0%", scaleX: 1 }}
                    transition={curtainTransition}
                    className="absolute top-0 bottom-0 left-0 w-[51%] z-[150] origin-left shadow-[50px_0_150px_rgba(0,0,0,0.8)]"
                    style={{ 
                        backgroundColor: '#2e0202',
                        backgroundImage: `repeating-linear-gradient(90deg, 
                            rgba(0,0,0,0.6) 0%, 
                            rgba(0,0,0,0.2) 2%, 
                            rgba(255,255,255,0.05) 4%, 
                            rgba(0,0,0,0.2) 6%, 
                            rgba(0,0,0,0.6) 8%), 
                            radial-gradient(circle at 100% 50%, #7f1d1d 0%, #450a0a 50%, #1a0303 100%)`,
                        backgroundSize: '100% 100%',
                        boxShadow: 'inset -50px 0 100px rgba(0,0,0,0.9)'
                    }}
                >
                     <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-r from-yellow-900 via-yellow-400 to-yellow-900 z-20 shadow-[0_0_40px_rgba(234,179,8,0.5)]"></div>
                </motion.div>

                {/* Right Velvet Curtain */}
                <motion.div
                    initial={{ x: "0%", scaleX: 1 }}
                    animate={{ x: "95%", scaleX: 0.2 }}
                    exit={{ x: "0%", scaleX: 1 }}
                    transition={curtainTransition}
                    className="absolute top-0 bottom-0 right-0 w-[51%] z-[150] origin-right shadow-[-50px_0_150px_rgba(0,0,0,0.8)]"
                    style={{ 
                        backgroundColor: '#2e0202',
                        backgroundImage: `repeating-linear-gradient(90deg, 
                            rgba(0,0,0,0.6) 0%, 
                            rgba(0,0,0,0.2) 2%, 
                            rgba(255,255,255,0.05) 4%, 
                            rgba(0,0,0,0.2) 6%, 
                            rgba(0,0,0,0.6) 8%), 
                            radial-gradient(circle at 0% 50%, #7f1d1d 0%, #450a0a 50%, #1a0303 100%)`,
                        backgroundSize: '100% 100%',
                        boxShadow: 'inset 50px 0 100px rgba(0,0,0,0.9)'
                    }}
                >
                     <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-l from-yellow-900 via-yellow-400 to-yellow-900 z-20 shadow-[0_0_40px_rgba(234,179,8,0.5)]"></div>
                </motion.div>
                
                {/* Top Valence */}
                <motion.div
                    initial={{ y: 0 }}
                    animate={{ y: "-100%" }}
                    exit={{ y: 0 }}
                    transition={{ duration: 2, delay: 3.8, ease: "easeInOut" }}
                    className="absolute top-0 left-0 right-0 h-48 z-[155] flex"
                >
                     {[...Array(6)].map((_, i) => (
                         <div key={i} className="flex-1 h-32 bg-[#450a0a] rounded-b-[40%] shadow-2xl relative overflow-hidden border-b-4 border-yellow-600">
                             <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60"></div>
                         </div>
                     ))}
                </motion.div>
                <motion.div initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ delay: 5.5, duration: 2 }} className="absolute inset-0 bg-black -z-10"></motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};