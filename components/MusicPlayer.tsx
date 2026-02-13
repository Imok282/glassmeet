import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward, SkipBack, Disc, X, Volume2, Music } from 'lucide-react';
import { useStore } from '../store';
import { socket } from '../utils/socket';

const TRACKS = [
  { title: "Rainy Day", artist: "Lo-Fi Dream", url: "https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3" },
  { title: "Sweet Sorrow", artist: "Chill Beats", url: "https://cdn.pixabay.com/audio/2022/01/18/audio_d0a13f69d2.mp3" },
  { title: "Distance", artist: "Heart Strings", url: "https://cdn.pixabay.com/audio/2021/11/25/audio_4117075c32.mp3" },
  { title: "Night Walk", artist: "Urban Flow", url: "https://cdn.pixabay.com/audio/2022/03/24/audio_34b075e016.mp3" },
];

export const MusicPlayer = () => {
  const { isMusicOpen, toggleMusic, currentTrackIndex, isPlaying, setMusicState, roomId } = useStore();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [volume, setVolume] = useState(0.5);

  // Sync Audio Element with Global State
  useEffect(() => {
    if (audioRef.current) {
        if (isPlaying) {
            audioRef.current.play().catch(e => console.log("Autoplay prevented", e));
        } else {
            audioRef.current.pause();
        }
    }
  }, [isPlaying, currentTrackIndex]);

  // Handle Socket Events (Incoming Sync)
  useEffect(() => {
    const handleSync = (data: { trackIndex: number, isPlaying: boolean, timestamp: number }) => {
        if (audioRef.current) {
            // Only seek if difference is > 2 seconds to prevent jitter
            if (Math.abs(audioRef.current.currentTime - data.timestamp) > 2) {
                audioRef.current.currentTime = data.timestamp;
            }
        }
        setMusicState(data.trackIndex, data.isPlaying);
    };

    socket.on('sync-music', handleSync);
    return () => { socket.off('sync-music', handleSync); };
  }, [setMusicState]);

  const emitSync = (playing: boolean, index: number) => {
    const timestamp = audioRef.current ? audioRef.current.currentTime : 0;
    socket.emit('sync-music', {
        roomId,
        trackIndex: index,
        isPlaying: playing,
        timestamp
    });
  };

  const handlePlayPause = () => {
    const newState = !isPlaying;
    setMusicState(currentTrackIndex, newState);
    emitSync(newState, currentTrackIndex);
  };

  const handleNext = () => {
    const newIndex = (currentTrackIndex + 1) % TRACKS.length;
    setMusicState(newIndex, true);
    emitSync(true, newIndex);
  };

  const handlePrev = () => {
    const newIndex = (currentTrackIndex - 1 + TRACKS.length) % TRACKS.length;
    setMusicState(newIndex, true);
    emitSync(true, newIndex);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) audioRef.current.volume = val;
  };

  return (
    <AnimatePresence>
      {isMusicOpen && (
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-28 right-8 w-80 glass-panel rounded-[2rem] overflow-hidden shadow-2xl z-40 border-rose-200/50 bg-white/70 backdrop-blur-2xl"
        >
            <div className="p-6 relative">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2 text-rose-900">
                        <Music size={18} />
                        <span className="font-serif font-bold text-sm tracking-wider uppercase">Shared Jukebox</span>
                    </div>
                    <button onClick={toggleMusic} className="text-rose-400 hover:text-rose-600 transition">
                        <X size={18} />
                    </button>
                </div>

                {/* Vinyl Animation */}
                <div className="flex justify-center mb-6 relative">
                    <motion.div
                        animate={{ rotate: isPlaying ? 360 : 0 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="relative w-32 h-32 rounded-full bg-black shadow-xl flex items-center justify-center border-4 border-gray-800"
                    >
                         {/* Grooves */}
                         <div className="absolute inset-0 rounded-full border-2 border-gray-800/50 scale-90"></div>
                         <div className="absolute inset-0 rounded-full border-2 border-gray-800/50 scale-75"></div>
                         <div className="absolute inset-0 rounded-full border-2 border-gray-800/50 scale-50"></div>
                         
                         {/* Label */}
                         <div className="w-12 h-12 rounded-full bg-rose-400 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-white"></div>
                         </div>
                    </motion.div>
                    
                    {/* Tonearm Simulation */}
                    <motion.div 
                        animate={{ rotate: isPlaying ? 25 : 0 }}
                        className="absolute top-0 right-4 w-1 h-20 bg-gray-400 origin-top shadow-lg"
                        style={{ borderRadius: '4px' }}
                    ></motion.div>
                </div>

                {/* Track Info */}
                <div className="text-center mb-6">
                    <h3 className="text-rose-950 font-serif font-bold text-xl truncate">{TRACKS[currentTrackIndex].title}</h3>
                    <p className="text-rose-500 text-sm">{TRACKS[currentTrackIndex].artist}</p>
                </div>

                {/* Controls */}
                <div className="flex justify-center items-center gap-6 mb-6">
                    <button onClick={handlePrev} className="text-rose-800 hover:text-rose-500 transition"><SkipBack size={24} /></button>
                    <button 
                        onClick={handlePlayPause}
                        className="w-14 h-14 rounded-full bg-gradient-to-tr from-rose-500 to-pink-600 flex items-center justify-center text-white shadow-lg hover:scale-105 transition active:scale-95"
                    >
                        {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                    </button>
                    <button onClick={handleNext} className="text-rose-800 hover:text-rose-500 transition"><SkipForward size={24} /></button>
                </div>

                {/* Volume */}
                <div className="flex items-center gap-3 px-2">
                    <Volume2 size={16} className="text-rose-400" />
                    <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.01" 
                        value={volume}
                        onChange={handleVolumeChange}
                        className="w-full accent-rose-500 h-1 bg-rose-200 rounded-lg appearance-none cursor-pointer"
                    />
                </div>

                <audio 
                    ref={audioRef} 
                    src={TRACKS[currentTrackIndex].url}
                    onEnded={handleNext}
                    loop={false}
                />
            </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};