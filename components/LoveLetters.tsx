
import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Mail, PenTool, ChevronLeft, Inbox, Clock } from 'lucide-react';
import { socket } from '../utils/socket';
import { LoveLetter, StationeryType } from '../types';

const THEMES: Record<StationeryType, { bg: string, text: string, texture: string, accent: string }> = {
    cream: {
        bg: '#fffcf5',
        text: '#4a4036',
        texture: 'https://www.transparenttextures.com/patterns/cream-paper.png',
        accent: '#8c7b6c'
    },
    rose: {
        bg: '#fff0f5',
        text: '#5e2a38',
        texture: 'https://www.transparenttextures.com/patterns/shattered-island.png',
        accent: '#d66d90'
    },
    midnight: {
        bg: '#1a1b26',
        text: '#d4d4d8',
        texture: 'https://www.transparenttextures.com/patterns/stardust.png',
        accent: '#7aa2f7'
    }
};

export const LoveLetters = () => {
  const { isLetterBoxOpen, toggleLetterBox, letters, addLetter, currentUser, onlineUsers, markLetterAsRead } = useStore();
  const [view, setView] = useState<'inbox' | 'compose' | 'read'>('inbox');
  const [selectedLetter, setSelectedLetter] = useState<LoveLetter | null>(null);
  
  // Compose State
  const [toUser, setToUser] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [stationery, setStationery] = useState<StationeryType>('cream');
  const [isSending, setIsSending] = useState(false);

  // Initialize socket listeners
  useEffect(() => {
    const handleReceiveLetter = (letter: LoveLetter) => {
        addLetter(letter);
    };

    const handleHistory = (history: LoveLetter[]) => {
        // Bulk add, filtering duplicates in store
        history.forEach(l => addLetter(l));
    };

    socket.on('receive-letter', handleReceiveLetter);
    socket.on('letter-history', handleHistory);

    return () => {
        socket.off('receive-letter', handleReceiveLetter);
        socket.off('letter-history', handleHistory);
    };
  }, [addLetter]);

  const handleSend = () => {
      if (!currentUser || !toUser || !content.trim()) return;
      setIsSending(true);

      const letter: LoveLetter = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          fromUsername: currentUser.username,
          toUsername: toUser,
          subject: subject || 'Untitled Letter',
          content: content,
          stationery,
          timestamp: new Date().toISOString(),
          isRead: false
      };

      socket.emit('send-letter', letter);

      // Reset
      setTimeout(() => {
          setIsSending(false);
          setView('inbox');
          setSubject('');
          setContent('');
          setToUser('');
      }, 500);
  };

  const openLetter = (letter: LoveLetter) => {
      setSelectedLetter(letter);
      setView('read');
      if (!letter.isRead && letter.toUsername === currentUser?.username) {
          socket.emit('mark-letter-read', { letterId: letter.id });
          markLetterAsRead(letter.id);
      }
  };

  const potentialRecipients = onlineUsers.filter(u => u.username !== currentUser?.username);

  return (
    <AnimatePresence>
      {isLetterBoxOpen && (
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/60 backdrop-blur-md"
        >
            <div className="w-full max-w-4xl h-[80vh] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative">
                {/* Close Button */}
                <button 
                    onClick={toggleLetterBox}
                    className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/5 hover:bg-black/10 transition"
                >
                    <X size={20} className="text-gray-600" />
                </button>

                {/* Sidebar Navigation */}
                <div className="w-full md:w-64 bg-rose-50/50 border-r border-rose-100 p-6 flex flex-col gap-4">
                    <h2 className="text-2xl font-serif font-bold text-rose-900 mb-4 flex items-center gap-2">
                        <Mail size={24} /> Post Office
                    </h2>
                    
                    <button 
                        onClick={() => setView('inbox')}
                        className={`p-3 rounded-xl flex items-center gap-3 transition ${view === 'inbox' ? 'bg-rose-500 text-white shadow-md' : 'hover:bg-rose-100 text-rose-800'}`}
                    >
                        <Inbox size={18} /> Inbox
                    </button>

                    <button 
                        onClick={() => setView('compose')}
                        className={`p-3 rounded-xl flex items-center gap-3 transition ${view === 'compose' ? 'bg-rose-500 text-white shadow-md' : 'hover:bg-rose-100 text-rose-800'}`}
                    >
                        <PenTool size={18} /> Compose
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 bg-white relative overflow-hidden">
                    {/* INBOX VIEW */}
                    {view === 'inbox' && (
                        <div className="h-full overflow-y-auto p-8">
                            <h3 className="text-xl font-serif text-gray-800 mb-6">Your Letters</h3>
                            {letters.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                                    <Mail size={48} className="mb-4 opacity-50" />
                                    <p>No letters yet. Why not write one?</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {letters.map(letter => {
                                        const isReceived = letter.toUsername === currentUser?.username;
                                        return (
                                            <div 
                                                key={letter.id}
                                                onClick={() => openLetter(letter)}
                                                className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md group relative overflow-hidden ${
                                                    !letter.isRead && isReceived ? 'bg-rose-50 border-rose-200' : 'bg-white border-gray-100'
                                                }`}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h4 className={`font-bold text-lg ${!letter.isRead && isReceived ? 'text-rose-900' : 'text-gray-800'}`}>
                                                            {letter.subject}
                                                        </h4>
                                                        <p className="text-sm text-gray-500 flex items-center gap-2">
                                                            {isReceived ? <span>From: @{letter.fromUsername}</span> : <span>To: @{letter.toUsername}</span>}
                                                            <span>•</span>
                                                            <Clock size={12} /> {new Date(letter.timestamp).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    {!letter.isRead && isReceived && (
                                                        <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center shadow-lg transform rotate-12">
                                                            <span className="text-xs text-white font-bold">NEW</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-gray-400 text-sm line-clamp-1 italic font-serif opacity-70">
                                                    Click to read...
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* COMPOSE VIEW */}
                    {view === 'compose' && (
                        <div className="h-full flex flex-col p-8 overflow-y-auto">
                            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Recipient</label>
                                    <select 
                                        value={toUser}
                                        onChange={(e) => setToUser(e.target.value)}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-200 outline-none"
                                    >
                                        <option value="">Select a Soul...</option>
                                        {potentialRecipients.map(u => (
                                            <option key={u.username} value={u.username}>@{u.username}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Stationery</label>
                                    <div className="flex gap-2">
                                        {(['cream', 'rose', 'midnight'] as StationeryType[]).map(s => (
                                            <button
                                                key={s}
                                                onClick={() => setStationery(s)}
                                                className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${stationery === s ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                                                style={{ backgroundColor: THEMES[s].bg }}
                                                title={s}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <input 
                                type="text" 
                                placeholder="Subject"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="w-full p-4 text-xl font-serif border-b border-gray-100 focus:border-rose-300 outline-none mb-4 placeholder-gray-300"
                            />

                            <div className="flex-1 relative rounded-lg overflow-hidden border border-gray-100 shadow-inner">
                                <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: `url("${THEMES[stationery].texture}")` }}></div>
                                <textarea 
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Write your heart out..."
                                    className="w-full h-full p-6 bg-transparent resize-none focus:outline-none font-serif text-lg leading-loose"
                                    style={{ 
                                        backgroundColor: THEMES[stationery].bg,
                                        color: THEMES[stationery].text
                                    }}
                                />
                            </div>

                            <div className="mt-6 flex justify-end">
                                <button 
                                    onClick={handleSend}
                                    disabled={isSending || !toUser || !content.trim()}
                                    className="px-8 py-3 bg-rose-600 text-white rounded-xl hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-lg hover:shadow-rose-200"
                                >
                                    {isSending ? 'Sealing...' : <><Send size={18} /> Send Letter</>}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* READ VIEW */}
                    {view === 'read' && selectedLetter && (
                        <div className="h-full overflow-y-auto p-4 md:p-12 bg-gray-100 flex items-center justify-center">
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="w-full max-w-2xl min-h-[60vh] shadow-2xl rounded-sm p-8 md:p-12 relative"
                                style={{ 
                                    backgroundColor: THEMES[selectedLetter.stationery].bg,
                                    color: THEMES[selectedLetter.stationery].text,
                                }}
                            >
                                <div className="absolute inset-0 pointer-events-none opacity-30" style={{ backgroundImage: `url("${THEMES[selectedLetter.stationery].texture}")` }}></div>
                                
                                <button 
                                    onClick={() => setView('inbox')}
                                    className="absolute top-4 left-4 p-2 hover:bg-black/5 rounded-full transition z-10"
                                >
                                    <ChevronLeft size={24} style={{ color: THEMES[selectedLetter.stationery].accent }} />
                                </button>

                                <div className="relative z-10">
                                    <div className="flex justify-between items-end border-b pb-4 mb-6" style={{ borderColor: THEMES[selectedLetter.stationery].accent }}>
                                        <div>
                                            <p className="text-xs uppercase tracking-widest opacity-60 mb-1">{new Date(selectedLetter.timestamp).toLocaleDateString()}</p>
                                            <h2 className="text-3xl font-serif font-bold leading-tight">{selectedLetter.subject}</h2>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs uppercase tracking-widest opacity-60">From</p>
                                            <p className="font-serif italic text-lg">@{selectedLetter.fromUsername}</p>
                                        </div>
                                    </div>

                                    <div className="font-serif text-xl leading-9 whitespace-pre-wrap">
                                        {selectedLetter.content}
                                    </div>

                                    <div className="mt-12 text-center opacity-40">
                                        <p className="text-xs uppercase tracking-[0.3em]">~ End of Letter ~</p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
