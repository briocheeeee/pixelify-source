import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useStore } from '../store';
import { Users } from 'lucide-react';

const CANVAS_SIZE = 100;
const PIXEL_SIZE = 10;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 10;
const CHUNK_SIZE = 100;

// Chunk class to manage independent chunks
class Chunk {
  pixels: Map<string, { color: string; lastUpdated: number }>;
  dirty: boolean;
  canvas: OffscreenCanvas;
  ctx: OffscreenCanvasRenderingContext2D;

  constructor() {
    this.pixels = new Map();
    this.dirty = true;
    this.canvas = new OffscreenCanvas(CHUNK_SIZE * PIXEL_SIZE, CHUNK_SIZE * PIXEL_SIZE);
    this.ctx = this.canvas.getContext('2d')!;
  }

  addPixel(x: number, y: number, color: string, lastUpdated: number) {
    const key = `${x},${y}`;
    this.pixels.set(key, { color, lastUpdated });
    this.dirty = true;
  }

  render(showGrid: boolean) {
    if (!this.dirty) return this.canvas;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw pixels
    this.pixels.forEach(({ color }, key) => {
      const [x, y] = key.split(',').map(n => parseInt(n));
      this.ctx.fillStyle = color;
      this.ctx.fillRect(
        (x % CHUNK_SIZE) * PIXEL_SIZE,
        (y % CHUNK_SIZE) * PIXEL_SIZE,
        PIXEL_SIZE,
        PIXEL_SIZE
      );
    });

    // Draw grid
    if (showGrid) {
      this.ctx.strokeStyle = '#CCCCCC';
      this.ctx.lineWidth = 0.5;
      for (let i = 0; i <= CHUNK_SIZE * PIXEL_SIZE; i += PIXEL_SIZE) {
        this.ctx.beginPath();
        this.ctx.moveTo(i, 0);
        this.ctx.lineTo(i, CHUNK_SIZE * PIXEL_SIZE);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(0, i);
        this.ctx.lineTo(CHUNK_SIZE * PIXEL_SIZE, i);
        this.ctx.stroke();
      }
    }

    this.dirty = false;
    return this.canvas;
  }
}

export const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chunksRef = useRef<Map<string, Chunk>>(new Map());
  const { 
    pixels, 
    selectedColor, 
    setPixel, 
    cooldown,
    zoom,
    setZoom,
    pan,
    setPan,
    onlineUsers,
    previewPixel,
    setPreviewPixel,
    showGrid,
    toggleGrid,
    setSelectedColorFromPixel
  } = useStore();
  
  const [coordinates, setCoordinates] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Update chunks when pixels change
  useEffect(() => {
    Object.entries(pixels).forEach(([key, pixel]) => {
      const [x, y] = key.split(',').map(Number);
      const chunkKey = `${Math.floor(x / CHUNK_SIZE)},${Math.floor(y / CHUNK_SIZE)}`;
      
      if (!chunksRef.current.has(chunkKey)) {
        chunksRef.current.set(chunkKey, new Chunk());
      }
      
      const chunk = chunksRef.current.get(chunkKey)!;
      chunk.addPixel(x, y, pixel.color, pixel.lastUpdated);
    });
  }, [pixels]);

  // Resize handler
  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };

    window.addEventListener('resize', updateCanvasSize);
    updateCanvasSize();
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  // Get visible chunks
  const getVisibleChunks = useCallback(() => {
    if (!canvasRef.current) return [];
    
    const canvas = canvasRef.current;
    const viewportLeft = -pan.x / zoom;
    const viewportTop = -pan.y / zoom;
    const viewportRight = (canvas.width - pan.x) / zoom;
    const viewportBottom = (canvas.height - pan.y) / zoom;

    const startChunkX = Math.floor(viewportLeft / (CHUNK_SIZE * PIXEL_SIZE));
    const startChunkY = Math.floor(viewportTop / (CHUNK_SIZE * PIXEL_SIZE));
    const endChunkX = Math.ceil(viewportRight / (CHUNK_SIZE * PIXEL_SIZE));
    const endChunkY = Math.ceil(viewportBottom / (CHUNK_SIZE * PIXEL_SIZE));

    const chunks: { x: number; y: number }[] = [];
    for (let x = startChunkX; x <= endChunkX; x++) {
      for (let y = startChunkY; y <= endChunkY; y++) {
        chunks.push({ x, y });
      }
    }
    return chunks;
  }, [pan, zoom]);

  // Draw canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw visible chunks
    const visibleChunks = getVisibleChunks();
    visibleChunks.forEach(({ x, y }) => {
      const chunkKey = `${x},${y}`;
      let chunk = chunksRef.current.get(chunkKey);
      
      if (!chunk) {
        chunk = new Chunk();
        chunksRef.current.set(chunkKey, chunk);
      }

      const chunkCanvas = chunk.render(showGrid);
      ctx.drawImage(
        chunkCanvas,
        x * CHUNK_SIZE * PIXEL_SIZE,
        y * CHUNK_SIZE * PIXEL_SIZE
      );
    });

    // Draw preview pixel
    if (previewPixel) {
      const now = Date.now();
      const alpha = (Math.sin(now / 200) + 1) / 2 * 0.5 + 0.5;
      ctx.fillStyle = previewPixel.color;
      ctx.globalAlpha = alpha;
      ctx.fillRect(
        previewPixel.x * PIXEL_SIZE,
        previewPixel.y * PIXEL_SIZE,
        PIXEL_SIZE,
        PIXEL_SIZE
      );
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }, [pixels, zoom, pan, previewPixel, showGrid, getVisibleChunks]);

  // Animation loop
  useEffect(() => {
    let animationFrame: number;
    const animate = () => {
      drawCanvas();
      animationFrame = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationFrame);
  }, [drawCanvas]);

  // Input handlers
  const screenToCanvas = useCallback((screenX: number, screenY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((screenX - rect.left) / zoom - pan.x / zoom) / PIXEL_SIZE);
    const y = Math.floor(((screenY - rect.top) / zoom - pan.y / zoom) / PIXEL_SIZE);
    return { x, y };
  }, [zoom, pan]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) return;
    
    const { x, y } = screenToCanvas(e.clientX, e.clientY);
    if (x >= 0 && x < CANVAS_SIZE && y >= 0 && y < CANVAS_SIZE) {
      setPixel(x, y, selectedColor);
    }
  }, [isDragging, screenToCanvas, selectedColor, setPixel]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = screenToCanvas(e.clientX, e.clientY);
    setCoordinates({ x, y });
    
    if (isDragging) {
      setPan({
        x: pan.x + (e.clientX - dragStart.x),
        y: pan.y + (e.clientY - dragStart.y)
      });
      setDragStart({ x: e.clientX, y: e.clientY });
    } else {
      setPreviewPixel({ x, y });
    }
  }, [isDragging, screenToCanvas, dragStart, pan, setPan, setPreviewPixel]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom * (1 + delta)));
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const newPan = {
      x: mouseX - (mouseX - pan.x) * (newZoom / zoom),
      y: mouseY - (mouseY - pan.y) * (newZoom / zoom)
    };
    
    setZoom(newZoom);
    setPan(newPan);
  }, [zoom, pan, setZoom, setPan]);

  return (
    <div className="w-full h-screen overflow-hidden">
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onWheel={handleWheel}
        onMouseDown={(e) => {
          if (e.button === 1 || e.button === 2) {
            setIsDragging(true);
            setDragStart({ x: e.clientX, y: e.clientY });
            setPreviewPixel(null);
          }
        }}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => {
          setIsDragging(false);
          setPreviewPixel(null);
        }}
        onContextMenu={(e) => e.preventDefault()}
        className="cursor-crosshair"
      />

      {/* Timer */}
      <div className="h-10 rounded-xl border-2 border-solid border-black bg-white/75 text-center align-middle leading-10 text-neutral-950 font-number fixed inset-x-0 top-4 mx-auto w-28 px-6 py-0 block">
        {cooldown > Date.now() ? 
          `${Math.floor((cooldown - Date.now()) / 1000 / 60)}:${String(Math.floor((cooldown - Date.now()) / 1000 % 60)).padStart(2, '0')}` : 
          '00:00'}
      </div>

      {/* User Counter */}
      <div className="xs:bottom-16 fixed bottom-36 right-4">
        <div className="h-10 w-auto rounded-xl border-2 border-solid border-black bg-white/75 px-6 py-0 text-center align-middle leading-10 text-neutral-950 font-number whitespace-nowrap">
          {onlineUsers} <Users className="inline-block align-middle" size={20} />
        </div>
      </div>

      {/* Coordinates */}
      <div className="xs:bottom-4 fixed bottom-24 right-4">
        <div className="h-10 w-auto rounded-xl border-2 border-solid border-black bg-white/75 px-6 py-0 text-center align-middle leading-10 text-neutral-950 font-number">
          ({coordinates.x}, {coordinates.y})
        </div>
      </div>
    </div>
  );
};