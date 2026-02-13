import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eraser, Trash2, Download } from 'lucide-react';
import { useStore } from '../store';
import { socket } from '../utils/socket';

const COLORS = ['#000000', '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#FFFFFF'];

export const Whiteboard = () => {
  const { isWhiteboardOpen, toggleWhiteboard, roomId } = useStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(3);
  const lastPos = useRef<{ x: number, y: number } | null>(null);

  // We only set up canvas logic when the component is actually mounted (open)
  useEffect(() => {
    if (!isWhiteboardOpen) return;
    
    // Short delay to allow animation to render element before sizing
    const timer = setTimeout(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Resize handling
        const resize = () => {
          const parent = canvas.parentElement;
          if (parent) {
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
          }
        };
        resize();
        window.addEventListener('resize', resize);
        
        return () => window.removeEventListener('resize', resize);
    }, 100);

    return () => clearTimeout(timer);
  }, [isWhiteboardOpen]);

  useEffect(() => {
    if (!isWhiteboardOpen) return;

    const handleDraw = (data: { x0: number, y0: number, x1: number, y1: number, color: string, width: number }) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const w = canvas.width;
        const h = canvas.height;
        
        ctx.beginPath();
        ctx.moveTo(data.x0 * w, data.y0 * h);
        ctx.lineTo(data.x1 * w, data.y1 * h);
        ctx.strokeStyle = data.color;
        ctx.lineWidth = data.width;
        ctx.lineCap = 'round';
        ctx.stroke();
    };

    const handleClear = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
    };

    socket.on('draw', handleDraw);
    socket.on('clear-board', handleClear);

    return () => {
        socket.off('draw', handleDraw);
        socket.off('clear-board', handleClear);
    };
  }, [isWhiteboardOpen]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    lastPos.current = {
        x: (clientX - rect.left) / canvas.width,
        y: (clientY - rect.top) / canvas.height
    };
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !lastPos.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const x = (clientX - rect.left) / canvas.width;
    const y = (clientY - rect.top) / canvas.height;

    // Local draw
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x * canvas.width, lastPos.current.y * canvas.height);
    ctx.lineTo(x * canvas.width, y * canvas.height);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Emit
    socket.emit('draw', {
        roomId,
        data: {
            x0: lastPos.current.x,
            y0: lastPos.current.y,
            x1: x,
            y1: y,
            color,
            width: lineWidth
        }
    });

    lastPos.current = { x, y };
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPos.current = null;
  };

  const clearBoard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    socket.emit('clear-board', { roomId });
  };

  const downloadBoard = () => {
      const link = document.createElement('a');
      link.download = `whiteboard-${Date.now()}.png`;
      link.href = canvasRef.current?.toDataURL() || '';
      link.click();
  };

  return (
    <AnimatePresence>
      {isWhiteboardOpen && (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[80] flex items-center justify-center p-8 pointer-events-none"
        >
            <div className="w-full h-full max-w-6xl max-h-[85vh] glass-panel bg-white/95 rounded-3xl overflow-hidden relative shadow-2xl flex flex-col pointer-events-auto border border-white/20">
                {/* Header */}
                <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-gray-50/50 relative z-20">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <span>🎨</span> Collaborative Board
                    </h2>
                    <div className="flex items-center gap-2">
                        <button onClick={downloadBoard} className="p-2 hover:bg-gray-200 rounded-full text-gray-600 transition" title="Save Image">
                            <Download size={20} />
                        </button>
                        <button 
                            onClick={toggleWhiteboard} 
                            className="p-2 hover:bg-red-100 hover:text-red-600 rounded-full text-gray-500 transition cursor-pointer relative z-50"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Canvas Area */}
                <div className="flex-1 relative bg-white cursor-crosshair touch-none">
                    <canvas 
                        ref={canvasRef}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="absolute inset-0 w-full h-full block"
                    />
                </div>

                {/* Toolbar */}
                <div className="h-20 border-t border-gray-200 bg-gray-50/50 flex items-center justify-center gap-6 relative z-20">
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
                        {COLORS.map(c => (
                            <button
                                key={c}
                                onClick={() => setColor(c)}
                                className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${color === c ? 'border-gray-400 scale-110' : 'border-transparent'}`}
                                style={{ backgroundColor: c === '#FFFFFF' ? '#f0f0f0' : c }}
                                title={c === '#FFFFFF' ? 'Eraser' : 'Color'}
                            >
                                {c === '#FFFFFF' && <Eraser size={14} className="mx-auto text-gray-500" />}
                            </button>
                        ))}
                    </div>

                    <div className="w-px h-10 bg-gray-300"></div>

                    <div className="flex items-center gap-4">
                         <input 
                            type="range" 
                            min="1" 
                            max="20" 
                            value={lineWidth} 
                            onChange={(e) => setLineWidth(parseInt(e.target.value))}
                            className="w-24 accent-blue-500 cursor-pointer"
                            title="Brush Size"
                         />
                         <button onClick={clearBoard} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition text-sm font-medium">
                            <Trash2 size={16} /> Clear
                         </button>
                    </div>
                </div>
            </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};