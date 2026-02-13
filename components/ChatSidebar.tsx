import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { X, Send, Paperclip, Smile, Image as ImageIcon, FileText, Check, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { socket } from '../utils/socket';

const EMOJIS = ['👍', '👋', '😂', '🎉', '❤️', '🔥', '😮', '😢', '🤔', '😎', '🚀', '💻', '💯', '✨', '🎵', '☕'];

export const ChatSidebar = () => {
  const { isChatOpen, toggleChat, messages, addMessage, currentUser, typingUsers, markMessageAsRead } = useStore();
  const [input, setInput] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, isChatOpen, typingUsers]);

  // Mark messages as read when sidebar is open
  useEffect(() => {
    if (isChatOpen && currentUser && messages.length > 0) {
        messages.forEach(msg => {
            // If I haven't read it and I'm not the sender
            if (msg.userId !== currentUser.id && (!msg.readBy || !msg.readBy.includes(currentUser.id))) {
                socket.emit('mark-read', { roomId: useStore.getState().roomId, messageId: msg.id, userId: currentUser.id });
                // Optimistic local update
                markMessageAsRead(msg.id, currentUser.id);
            }
        });
    }
  }, [isChatOpen, messages, currentUser, markMessageAsRead]);

  // Socket: Receive Messages & Read Receipts
  useEffect(() => {
    const handleReceiveMessage = (msg: any) => {
        // Only add if not already present (deduping just in case)
        if (!messages.some(m => m.id === msg.id)) {
            addMessage(msg);
            
            // If chat is open, mark as read immediately
            if (useStore.getState().isChatOpen && currentUser && msg.userId !== currentUser.id) {
                 socket.emit('mark-read', { roomId: useStore.getState().roomId, messageId: msg.id, userId: currentUser.id });
                 markMessageAsRead(msg.id, currentUser.id);
            }
        }
    };

    const handleMessageRead = ({ messageId, userId }: { messageId: string, userId: string }) => {
        markMessageAsRead(messageId, userId);
    };
    
    socket.on('receive-message', handleReceiveMessage);
    socket.on('message-read', handleMessageRead);
    
    return () => {
        socket.off('receive-message', handleReceiveMessage);
        socket.off('message-read', handleMessageRead);
    };
  }, [messages, addMessage, markMessageAsRead, currentUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    
    if (currentUser) {
        socket.emit('typing', { roomId: useStore.getState().roomId, username: currentUser.username, isTyping: true });
        
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('typing', { roomId: useStore.getState().roomId, username: currentUser.username, isTyping: false });
        }, 2000);
    }
  };

  const sendMessage = (content: string, type: 'text' | 'image' | 'file' = 'text', fileUrl?: string) => {
    if (!currentUser) return;

    const newMessage = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      roomId: useStore.getState().roomId,
      userId: currentUser.id,
      username: currentUser.username,
      avatarUrl: currentUser.avatarUrl,
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type,
      fileUrl,
      readBy: []
    };

    // Optimistic Update
    addMessage(newMessage as any);
    
    // Send to Server
    socket.emit('send-message', newMessage);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
    setShowEmoji(false);
    
    // Clear typing immediately
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit('typing', { roomId: useStore.getState().roomId, username: currentUser!.username, isTyping: false });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
        const result = reader.result as string;
        const isImage = file.type.startsWith('image/');
        sendMessage(isImage ? 'Sent an image' : `Sent a file: ${file.name}`, isImage ? 'image' : 'file', result);
    };
    reader.readAsDataURL(file);
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addEmoji = (emoji: string) => {
    setInput(prev => prev + emoji);
  };

  return (
    <AnimatePresence>
      {isChatOpen && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed right-8 top-8 bottom-32 w-[26rem] glass-panel rounded-[2rem] flex flex-col overflow-hidden z-40 bg-white/60 border-rose-100 shadow-[0_20px_50px_rgba(244,63,94,0.15)] ring-1 ring-white/50"
        >
          {/* Header */}
          <div className="p-6 border-b border-rose-100 flex justify-between items-center bg-white/40 backdrop-blur-md">
            <div>
                 <h3 className="text-rose-950 font-serif font-bold text-xl tracking-tight">Messages</h3>
                 <p className="text-xs text-rose-500 font-medium">Room Chat</p>
            </div>
            <button onClick={toggleChat} className="text-rose-400 hover:text-rose-800 transition-colors p-2 hover:bg-rose-100 rounded-full">
              <X size={20} />
            </button>
          </div>

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 scroll-smooth">
            {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-60">
                    <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-2">
                        <Smile size={32} className="text-rose-400" />
                    </div>
                    <p className="text-rose-800 text-base font-serif italic">Start the conversation...</p>
                </div>
            )}
            {messages.map((msg) => {
              const isMe = msg.userId === currentUser?.id;
              // Check if anyone OTHER than the sender has read it
              const isRead = msg.readBy && msg.readBy.some(id => id !== msg.userId);
              
              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`flex items-end space-x-2 ${isMe ? 'flex-row-reverse space-x-reverse' : ''}`}>
                     <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm flex-shrink-0 font-serif overflow-hidden ${
                         isMe ? 'bg-rose-500' : 'bg-pink-400'
                     }`}>
                        {msg.avatarUrl ? (
                            <img src={msg.avatarUrl} alt={msg.username} className="w-full h-full object-cover" />
                        ) : (
                            msg.username.charAt(0).toUpperCase()
                        )}
                     </div>
                     <div className={`max-w-[85%] p-4 rounded-2xl text-[15px] shadow-sm backdrop-blur-sm border relative group ${
                       isMe 
                         ? 'bg-rose-500 text-white rounded-br-none border-rose-400' 
                         : 'bg-white/80 text-rose-950 rounded-bl-none border-rose-100'
                     }`}>
                       {msg.type === 'text' && <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>}
                       {msg.type === 'image' && (
                         <div className="rounded-lg overflow-hidden mt-1 mb-1">
                            <img src={msg.fileUrl} alt="Shared" className="max-w-full h-auto object-cover" />
                         </div>
                       )}
                       {msg.type === 'file' && (
                         <div className="flex items-center space-x-2 bg-black/5 p-2 rounded-lg">
                            <FileText size={20} />
                            <a href={msg.fileUrl} download="download" className="underline truncate max-w-[150px]">{msg.content}</a>
                         </div>
                       )}
                     </div>
                  </div>
                  <div className={`flex items-center mt-1.5 mx-11 space-x-1 ${isMe ? 'justify-end' : ''}`}>
                    <span className="text-[10px] text-rose-400 font-medium">{msg.timestamp}</span>
                    {isMe && (
                        <span title={isRead ? "Seen" : "Sent"}>
                            {isRead ? (
                                <CheckCheck size={12} className="text-rose-600" />
                            ) : (
                                <Check size={12} className="text-rose-300" />
                            )}
                        </span>
                    )}
                  </div>
                </div>
              );
            })}
            
            {/* Typing Indicator */}
            <AnimatePresence>
            {typingUsers.length > 0 && (
               <motion.div 
                 initial={{ opacity: 0, y: 10, height: 0 }} 
                 animate={{ opacity: 1, y: 0, height: 'auto' }}
                 exit={{ opacity: 0, y: 10, height: 0 }}
                 className="flex items-center space-x-2 ml-11 pb-2"
               >
                   <div className="flex space-x-1 bg-rose-100 px-3 py-2 rounded-full shadow-sm">
                       <div className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                       <div className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                       <div className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                   </div>
                   <span className="text-xs text-rose-400 italic font-medium truncate max-w-[200px]">
                       {typingUsers.length === 1 
                           ? <>{typingUsers[0]} is typing...</>
                           : typingUsers.length === 2
                               ? <>{typingUsers.join(' & ')} are typing...</>
                               : <>{typingUsers.length} people are typing...</>
                       }
                   </span>
               </motion.div>
            )}
            </AnimatePresence>
            
            <div ref={messagesEndRef} />
          </div>

          {/* Emoji Picker */}
          <AnimatePresence>
            {showEmoji && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="absolute bottom-24 left-6 right-6 bg-white/90 backdrop-blur-xl border border-rose-100 p-4 rounded-3xl shadow-xl z-50 grid grid-cols-8 gap-2"
                >
                    {EMOJIS.map(emoji => (
                        <button 
                            key={emoji} 
                            onClick={() => addEmoji(emoji)}
                            className="p-2 hover:bg-rose-100 rounded-xl transition text-2xl flex items-center justify-center"
                        >
                            {emoji}
                        </button>
                    ))}
                </motion.div>
            )}
          </AnimatePresence>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-5 border-t border-rose-100 bg-white/50 backdrop-blur-lg relative z-40">
            <div className="relative group">
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                onFocus={() => setShowEmoji(false)}
                placeholder="Message..."
                className="w-full glass-input rounded-2xl py-4 pl-5 pr-14 text-sm text-rose-900 placeholder-rose-400 focus:bg-white/80 transition shadow-inner border-rose-200 focus:border-rose-400"
              />
              <button 
                type="submit"
                className="absolute right-2 top-2 p-2.5 bg-rose-500 rounded-xl text-white hover:bg-rose-600 transition-colors shadow-lg disabled:opacity-50 disabled:bg-rose-300"
                disabled={!input.trim()}
              >
                <Send size={18} />
              </button>
            </div>
            
            <div className="flex items-center space-x-3 mt-3 px-1">
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    hidden 
                    onChange={handleFileUpload} 
                    accept="image/*,application/pdf"
                />
                <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-100 rounded-full transition"
                    title="Attach File"
                >
                    <Paperclip size={20} />
                </button>
                <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-100 rounded-full transition"
                    title="Upload Image"
                >
                    <ImageIcon size={20} />
                </button>
                <div className="flex-1"></div>
                <button 
                    type="button" 
                    onClick={() => setShowEmoji(!showEmoji)}
                    className={`p-2 hover:bg-rose-100 rounded-full transition ${showEmoji ? 'text-rose-600 bg-rose-50' : 'text-rose-400 hover:text-rose-600'}`}
                >
                    <Smile size={20} />
                </button>
            </div>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
};