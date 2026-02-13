import React, { useEffect } from 'react';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { socket } from '../utils/socket';

export const ReactionOverlay = () => {
  const { activeReactions, addReaction, removeReaction } = useStore();

  useEffect(() => {
    const handleReaction = ({ emoji }: { emoji: string }) => {
        addReaction(emoji);
    };

    socket.on('reaction', handleReaction);
    return () => {
        socket.off('reaction', handleReaction);
    };
  }, [addReaction]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      <AnimatePresence>
        {activeReactions.map((r) => (
            <motion.div
                key={r.id}
                initial={{ y: "100vh", x: `${r.startX}vw`, opacity: 1, scale: 0.5 }}
                animate={{ y: "40vh", opacity: 0, scale: 1.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2.5, ease: "easeOut" }}
                onAnimationComplete={() => removeReaction(r.id)}
                className="absolute text-6xl drop-shadow-2xl filter"
            >
                {r.emoji}
            </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};