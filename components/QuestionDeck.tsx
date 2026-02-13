import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, RefreshCcw } from 'lucide-react';
import { socket } from '../utils/socket';

const QUESTIONS = [
  "What is your favorite memory of us?",
  "What is one thing you've always wanted to ask me but were afraid to?",
  "Where do you see us in 5 years?",
  "What is my most annoying habit?",
  "If we could travel anywhere right now, where would we go?",
  "What song reminds you of me?",
  "When did you first realize you liked/loved me?",
  "What is your idea of a perfect day?",
  "What is one thing I do that makes you feel appreciated?",
  "If you could relive one day of your life, which would it be?",
  "What is your biggest fear regarding our relationship?",
  "What is one small thing that always makes you smile?"
];

export const QuestionDeck = () => {
  const { isQuestionDeckOpen, toggleQuestionDeck, activeQuestion, setActiveQuestion, roomId } = useStore();
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    const handleDraw = ({ question }: { question: string }) => {
        setActiveQuestion(question);
        setIsFlipped(true);
    };

    socket.on('draw-card', handleDraw);
    return () => { socket.off('draw-card', handleDraw); };
  }, [setActiveQuestion]);

  const drawCard = () => {
      if (isFlipped) {
          // Reset for new draw
          setIsFlipped(false);
          setTimeout(() => {
              const randomQ = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
              setActiveQuestion(randomQ);
              socket.emit('draw-card', { roomId, question: randomQ });
              setIsFlipped(true);
          }, 300);
      } else {
          const randomQ = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
          setActiveQuestion(randomQ);
          socket.emit('draw-card', { roomId, question: randomQ });
          setIsFlipped(true);
      }
  };

  const closeDeck = () => {
      toggleQuestionDeck();
      setIsFlipped(false);
      setActiveQuestion(null);
  };

  return (
    <AnimatePresence>
      {isQuestionDeckOpen && (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none"
        >
            <div className="relative pointer-events-auto">
                <motion.div 
                    initial={{ y: 50, scale: 0.8 }}
                    animate={{ y: 0, scale: 1 }}
                    exit={{ y: 50, scale: 0.8 }}
                    className="relative w-80 h-[28rem] perspective-1000"
                >
                    <motion.div
                        className="w-full h-full relative preserve-3d transition-all duration-700 cursor-pointer"
                        animate={{ rotateY: isFlipped ? 180 : 0 }}
                        onClick={drawCard}
                        style={{ transformStyle: 'preserve-3d' }}
                    >
                        {/* Front of Card (The Back design) */}
                        <div className="absolute inset-0 backface-hidden rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-[#0f0205]">
                            <div className="absolute inset-0 bg-gradient-to-br from-rose-900/40 via-black to-purple-900/40"></div>
                            <div className="absolute inset-2 border border-white/20 rounded-2xl flex flex-col items-center justify-center">
                                <Sparkles className="text-rose-400 mb-4 animate-pulse" size={48} />
                                <h3 className="font-serif text-2xl text-rose-100 tracking-widest uppercase">Deep<br/>Talk</h3>
                                <p className="text-white/40 text-xs mt-4 font-sans tracking-wide">Tap to Draw</p>
                            </div>
                            {/* Texture */}
                            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
                        </div>

                        {/* Back of Card (The Question) */}
                        <div 
                            className="absolute inset-0 backface-hidden rounded-3xl overflow-hidden shadow-2xl bg-white flex items-center justify-center p-8 text-center"
                            style={{ transform: 'rotateY(180deg)' }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-rose-50 to-white"></div>
                            <div className="relative z-10">
                                <span className="text-6xl text-rose-200 font-serif absolute -top-10 -left-4">"</span>
                                <h3 className="font-serif text-2xl text-rose-900 leading-relaxed">
                                    {activeQuestion || "..."}
                                </h3>
                                <span className="text-6xl text-rose-200 font-serif absolute -bottom-16 -right-4 rotate-180">"</span>
                            </div>
                            
                            <div className="absolute bottom-6 text-rose-300 text-[10px] tracking-[0.2em] uppercase font-bold">
                                GlassMeet Connection
                            </div>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Controls below card */}
                <div className="mt-8 flex justify-center gap-4">
                     <button onClick={closeDeck} className="p-4 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-md transition border border-white/10">
                         <X size={20} />
                     </button>
                     <button onClick={drawCard} className="px-8 py-4 rounded-full bg-rose-600 text-white font-medium hover:bg-rose-500 shadow-lg shadow-rose-900/40 transition flex items-center gap-2">
                         <RefreshCcw size={18} />
                         <span>Next Card</span>
                     </button>
                </div>
            </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};