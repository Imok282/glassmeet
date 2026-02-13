import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { Search, Phone, MessageSquare, X, Send, User as UserIcon, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { socket } from '../utils/socket';
import { User } from '../types';

export const ContactList = () => {
  const { 
    onlineUsers, 
    currentUser, 
    directMessages, 
    addDirectMessage, 
    selectedContactUsername, 
    setSelectedContactUsername,
    setRoomId,
    setIsJoined
  } = useStore();

  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [directMessages, selectedContactUsername]);

  const handleSelectContact = (username: string) => {
    setSelectedContactUsername(username);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedContactUsername || !currentUser) return;

    // Add locally
    const msg = {
        id: Date.now().toString(),
        fromUsername: currentUser.username,
        toUsername: selectedContactUsername,
        content: input,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    addDirectMessage(selectedContactUsername, msg);

    // Send via socket (routed by username)
    socket.emit('private-message', {
        toUsername: selectedContactUsername,
        content: input,
        fromUsername: currentUser.username
    });

    setInput('');
  };

  const handleCall = (username: string) => {
    if (!currentUser) return;
    const newRoomId = `call-${Date.now()}`; // Generate unique room ID
    
    // Notify the other user (routed by username)
    socket.emit('call-user', {
        userToCallUsername: username,
        fromUser: currentUser,
        roomId: newRoomId
    });

    // Join myself
    setRoomId(newRoomId);
    setIsJoined(true);
  };

  const selectedUser = onlineUsers.find(u => u.username === selectedContactUsername);
  const messages = selectedContactUsername ? (directMessages[selectedContactUsername] || []) : [];

  // Filter out myself from the list
  const uniqueUsers = Array.from(new Map<string, User>(onlineUsers.map(u => [u.username, u] as [string, User])).values());
  const filteredUsers = uniqueUsers.filter(u => u.username !== currentUser?.username);

  return (
    <div className="flex h-[36rem] w-[56rem] glass-panel rounded-[2.5rem] overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border-white/60">
      {/* Sidebar (List) */}
      <div className="w-1/3 border-r border-rose-100 bg-white/40 backdrop-blur-md flex flex-col">
        <div className="p-6 border-b border-rose-100">
            <h2 className="text-2xl font-serif font-bold text-rose-950 mb-4">Connections</h2>
            <div className="relative group">
                <Search className="absolute left-3 top-3.5 text-rose-400 group-focus-within:text-rose-600 transition" size={16} />
                <input 
                    type="text" 
                    placeholder="Search hearts..." 
                    className="w-full glass-input rounded-xl py-3 pl-10 pr-3 text-sm border-rose-200 focus:ring-rose-200"
                />
            </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredUsers.length === 0 && (
                <div className="flex flex-col items-center justify-center mt-20 text-rose-300">
                    <Heart size={32} className="opacity-40 mb-2" />
                    <span className="text-sm">No active souls nearby.</span>
                </div>
            )}
            {filteredUsers.map(user => (
                <button
                    key={user.username}
                    onClick={() => handleSelectContact(user.username)}
                    className={`w-full p-4 rounded-2xl flex items-center space-x-3 transition-all ${
                        selectedContactUsername === user.username 
                        ? 'bg-rose-100/80 border border-rose-200 shadow-sm' 
                        : 'hover:bg-white/40 border border-transparent'
                    }`}
                >
                    <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-rose-400 to-pink-500 flex items-center justify-center text-white font-serif font-bold text-lg shadow-md overflow-hidden">
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                            ) : (
                                user.username.charAt(0).toUpperCase()
                            )}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                            <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                    <div className="text-left flex-1 min-w-0">
                        <p className={`text-base font-bold truncate ${selectedContactUsername === user.username ? 'text-rose-900' : 'text-gray-700'}`}>@{user.username}</p>
                        <p className="text-xs text-rose-400 font-medium">Available</p>
                    </div>
                </button>
            ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white/20 relative">
        {selectedContactUsername ? (
            <>
                {/* Chat Header */}
                <div className="px-6 py-4 border-b border-rose-100 flex justify-between items-center bg-white/40 backdrop-blur-sm">
                    <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full bg-rose-200 flex items-center justify-center text-lg font-serif font-bold text-rose-800 overflow-hidden">
                             {selectedUser?.avatarUrl ? (
                                 <img src={selectedUser.avatarUrl} alt={selectedContactUsername} className="w-full h-full object-cover" />
                             ) : (
                                 selectedContactUsername.charAt(0).toUpperCase()
                             )}
                        </div>
                        <div>
                            <span className="font-serif font-bold text-rose-900 text-lg block leading-tight">@{selectedContactUsername}</span>
                            <span className="text-xs text-rose-500 font-medium">Online now</span>
                        </div>
                    </div>
                    <div className="flex space-x-2">
                         <button 
                            onClick={() => handleCall(selectedContactUsername)}
                            className="p-3 bg-gradient-to-tr from-rose-500 to-pink-600 text-white rounded-full hover:shadow-lg hover:shadow-rose-500/30 transition transform hover:-translate-y-0.5"
                            title="Start Video Call"
                         >
                            <Phone size={20} fill="currentColor" className="text-rose-50" />
                         </button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-rose-300 opacity-60">
                            <MessageSquare size={56} className="mb-3" />
                            <p className="text-lg font-serif text-rose-800/60">Whisper something sweet...</p>
                        </div>
                    )}
                    {messages.map((msg, i) => {
                        const isMe = msg.fromUsername === currentUser?.username;
                        return (
                            <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[75%] px-5 py-3 rounded-2xl text-[15px] leading-relaxed shadow-sm ${
                                    isMe 
                                    ? 'bg-rose-500 text-white rounded-br-sm' 
                                    : 'bg-white text-rose-950 rounded-bl-sm border border-rose-100'
                                }`}>
                                    {msg.content}
                                    <div className={`text-[10px] mt-1 text-right font-medium ${isMe ? 'text-rose-100' : 'text-rose-300'}`}>
                                        {msg.timestamp}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                    <div ref={chatEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSendMessage} className="p-5 border-t border-rose-100 bg-white/30">
                    <div className="relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type a message..."
                            className="w-full glass-input rounded-2xl py-3.5 pl-5 pr-14 text-rose-900 placeholder-rose-300 border-rose-200 focus:ring-rose-200"
                        />
                        <button 
                            type="submit"
                            disabled={!input.trim()}
                            className="absolute right-2 top-2 p-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600 disabled:opacity-50 disabled:bg-rose-300 transition shadow-md"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </form>
            </>
        ) : (
            <div className="h-full flex flex-col items-center justify-center text-rose-300">
                <div className="w-24 h-24 bg-rose-100 rounded-full flex items-center justify-center mb-6">
                    <UserIcon size={48} className="text-rose-300" />
                </div>
                <h3 className="text-3xl font-serif text-rose-900 mb-2">Select a Soul</h3>
                <p className="text-rose-500/70 text-center max-w-xs">Choose a contact from the left to start a conversation or video call.</p>
            </div>
        )}
      </div>
    </div>
  );
};