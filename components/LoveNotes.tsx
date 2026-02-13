import React, { useEffect } from 'react';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Feather, Save } from 'lucide-react';
import { socket } from '../utils/socket';

export const LoveNotes = () => {
  const { isNoteOpen, toggleNote, noteContent, setNoteContent, roomId } = useStore();

  useEffect(() => {
    const handleSync = ({ content }: { content: string }) => {
        setNoteContent(content);
    };

    socket.on('sync-note', handleSync);
    return () => { socket.off('sync-note', handleSync); };
  }, [setNoteContent]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setNoteContent(newContent);
    socket.emit('sync-note', { roomId, content: newContent });
  };

  const handleDownload = () => {
      const element = document.createElement("a");
      const file = new Blob([noteContent], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = "our_love_note.txt";
      document.body.appendChild(element);
      element.click();
  };

  return (
    <AnimatePresence>
      {isNoteOpen && (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-8 pointer-events-none"
        >
            <div className="w-full max-w-2xl bg-[#fffcf5] text-gray-800 rounded-lg shadow-2xl overflow-hidden pointer-events-auto flex flex-col relative"
                 style={{ 
                    backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")',
                    minHeight: '60vh',
                    boxShadow: '0 0 50px rgba(0,0,0,0.5), 0 0 0 10px rgba(255,255,255,0.1)'
                 }}
            >
                {/* Header */}
                <div className="h-16 flex items-center justify-between px-8 border-b border-stone-200">
                    <div className="flex items-center gap-3 text-stone-600">
                        <Feather size={20} />
                        <span className="font-serif italic text-lg tracking-wide">Shared Thoughts</span>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleDownload} className="p-2 hover:bg-stone-100 rounded-full transition text-stone-500" title="Save Note">
                            <Save size={18} />
                        </button>
                        <button onClick={toggleNote} className="p-2 hover:bg-rose-50 hover:text-rose-500 rounded-full transition text-stone-500">
                            <X size={22} />
                        </button>
                    </div>
                </div>

                {/* Paper Lines background simulation in textarea */}
                <div className="flex-1 relative">
                    <div className="absolute inset-0 pointer-events-none opacity-10"
                         style={{
                             backgroundImage: 'linear-gradient(#999 1px, transparent 1px)',
                             backgroundSize: '100% 2rem',
                             marginTop: '2rem'
                         }}
                    ></div>
                    
                    <textarea 
                        value={noteContent}
                        onChange={handleChange}
                        placeholder="Write something beautiful together..."
                        className="w-full h-full bg-transparent resize-none p-8 font-serif text-xl leading-8 focus:outline-none text-stone-800 placeholder-stone-300"
                        style={{ lineHeight: '2rem' }}
                        autoFocus
                    />
                </div>
                
                {/* Footer Stamp */}
                <div className="absolute bottom-4 right-8 opacity-20 pointer-events-none">
                    <div className="border-2 border-rose-900 rounded-full p-4 rotate-12">
                        <span className="font-serif font-bold text-rose-900 text-xs uppercase tracking-widest">GlassMeet<br/>Original</span>
                    </div>
                </div>
            </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};