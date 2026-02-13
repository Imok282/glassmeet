
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { socket } from '../utils/socket';
import { X, Telescope, Map } from 'lucide-react';

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
}

export const Stargazing = () => {
  const { isStargazingOpen, toggleStargazing, roomId } = useStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const starsRef = useRef<Star[]>([]);
  const shootingStarsRef = useRef<{x: number, y: number, vx: number, vy: number, life: number}[]>([]);

  // Initialize stars once
  useEffect(() => {
    if (starsRef.current.length === 0) {
        for (let i = 0; i < 800; i++) {
            starsRef.current.push({
                x: Math.random() * 3000,
                y: Math.random() * 3000,
                size: Math.random() * 2 + 0.5,
                opacity: Math.random(),
                speed: Math.random() * 0.02 + 0.01
            });
        }
    }
  }, []);

  // Socket sync
  useEffect(() => {
    const handleSync = (newOffset: { x: number, y: number }) => {
        setOffset(newOffset);
    };

    const handleShootingStar = () => {
        shootingStarsRef.current.push({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight * 0.5,
            vx: 15 + Math.random() * 10,
            vy: 5 + Math.random() * 5,
            life: 1.0
        });
    };

    socket.on('sync-stars', handleSync);
    socket.on('shooting-star', handleShootingStar);
    return () => {
        socket.off('sync-stars', handleSync);
        socket.off('shooting-star', handleShootingStar);
    };
  }, []);

  // Drawing Loop
  useEffect(() => {
    if (!isStargazingOpen) return;
    
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const render = () => {
        if (!ctx || !canvas) return;
        
        // Clear with transparent black to create trails? No, just solid clear for now
        ctx.fillStyle = '#050a14'; // Dark cosmic blue
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw Gradients/Nebula
        const gradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 0,
            canvas.width / 2, canvas.height / 2, canvas.width
        );
        gradient.addColorStop(0, '#0f172a');
        gradient.addColorStop(1, '#020617');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw Static Stars based on Offset
        starsRef.current.forEach(star => {
            // Parallax wrap logic
            let drawX = (star.x - offset.x) % 3000;
            let drawY = (star.y - offset.y) % 3000;
            if (drawX < 0) drawX += 3000;
            if (drawY < 0) drawY += 3000;

            // Twinkle
            const twinkle = Math.sin(Date.now() * star.speed) * 0.3 + 0.7;
            
            ctx.beginPath();
            ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * twinkle})`;
            ctx.arc(drawX, drawY, star.size, 0, Math.PI * 2);
            ctx.fill();
        });

        // Update and Draw Shooting Stars
        for (let i = shootingStarsRef.current.length - 1; i >= 0; i--) {
            const s = shootingStarsRef.current[i];
            
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255, 255, 255, ${s.life})`;
            ctx.lineWidth = 2;
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(s.x - s.vx * 3, s.y - s.vy * 3); // Tail
            ctx.stroke();

            // Head
            ctx.beginPath();
            ctx.fillStyle = `rgba(255, 255, 255, ${s.life})`;
            ctx.arc(s.x, s.y, 2, 0, Math.PI * 2);
            ctx.fill();

            s.x += s.vx;
            s.y += s.vy;
            s.life -= 0.02;

            if (s.life <= 0) shootingStarsRef.current.splice(i, 1);
        }

        animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => {
        window.removeEventListener('resize', resize);
        cancelAnimationFrame(animationFrameId);
    };
  }, [isStargazingOpen, offset]);

  // Interaction Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    
    const newOffset = {
        x: offset.x - dx,
        y: offset.y - dy
    };

    setOffset(newOffset);
    socket.emit('sync-stars', { roomId, offset: newOffset });
    
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleDoubleClick = () => {
      socket.emit('shooting-star', { roomId });
      // Also trigger locally
      shootingStarsRef.current.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight * 0.5,
        vx: 15 + Math.random() * 10,
        vy: 5 + Math.random() * 5,
        life: 1.0
    });
  };

  return (
    <AnimatePresence>
        {isStargazingOpen && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5 }}
                className="fixed inset-0 z-[5] cursor-move"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onDoubleClick={handleDoubleClick}
            >
                <canvas ref={canvasRef} className="block w-full h-full" />
                
                {/* UI Overlay */}
                <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-4 pointer-events-none">
                    <div className="glass-panel px-6 py-3 rounded-full flex items-center gap-3">
                        <Telescope size={20} className="text-purple-300" />
                        <span className="text-purple-100 font-serif tracking-widest text-sm">OBSERVATORY</span>
                    </div>
                </div>
                
                <div className="absolute bottom-32 left-1/2 -translate-x-1/2 text-white/20 text-xs tracking-[0.2em] pointer-events-none animate-pulse">
                    DRAG TO EXPLORE • DOUBLE CLICK TO WISH
                </div>
            </motion.div>
        )}
    </AnimatePresence>
  );
};
