'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './DesignCanvas2D.module.scss';

const gridSize = 20;

export default function DesignCanvas2D({ onWallsUpdate,initialWalls = [] }) {
  const [walls, setWalls] = useState(initialWalls);

  const [drawing, setDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [currentPoint, setCurrentPoint] = useState(null);
  const [tool, setTool] = useState('wall'); // default to wall tool
  const [selectedWallIndex, setSelectedWallIndex] = useState(null);
  const canvasRef = useRef(null);

  const snap = (val) => Math.round(val / gridSize) * gridSize;

  const draw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
  
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  
    // Draw grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  
    // Draw walls, doors, and windows
    walls.forEach(({ start, end, type }, i) => {
      // Set styles based on type
      if (type === 'door') {
        ctx.strokeStyle = '#2a9d8f';
        ctx.setLineDash([4, 2]);
      } else if (type === 'window') {
        ctx.strokeStyle = '#0077cc';
        ctx.setLineDash([2, 6]);
      } else {
        ctx.strokeStyle = '#222';
        ctx.setLineDash([]);
      }
  
      // Highlight selected wall
      if (i === selectedWallIndex) {
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 5;
      } else {
        ctx.lineWidth = 4;
      }
  
      // Draw the line
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
      ctx.setLineDash([]);
  
      // Wall length label
      const length = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2) / 20;
      const label = `${length.toFixed(2)}m`;
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
  
      ctx.fillStyle = '#333';
      ctx.font = '12px sans-serif';
      ctx.fillText(label, midX + 5, midY - 5);
    });
  
    // Draw preview wall (dashed)
    if (drawing && startPoint && currentPoint) {
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(startPoint.x, startPoint.y);
      ctx.lineTo(currentPoint.x, currentPoint.y);
      ctx.stroke();
      ctx.setLineDash([]);
  
      // Live measurement
      const dx = currentPoint.x - startPoint.x;
      const dy = currentPoint.y - startPoint.y;
      const length = Math.sqrt(dx * dx + dy * dy) / 20;
      const label = `${length.toFixed(2)}m`;
  
      const midX = (startPoint.x + currentPoint.x) / 2;
      const midY = (startPoint.y + currentPoint.y) / 2;
  
      ctx.fillStyle = '#666';
      ctx.font = '12px sans-serif';
      ctx.fillText(label, midX + 5, midY - 5);
    }
  };
  

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    draw();
  }, [walls, startPoint, currentPoint]);

  const handleMouseDown = (e) => {
    setDrawing(true);
    const rect = canvasRef.current.getBoundingClientRect();
    const x = snap(e.clientX - rect.left);
    const y = snap(e.clientY - rect.top);
    setStartPoint({ x, y });
  };

  const handleMouseMove = (e) => {
    if (!drawing) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = snap(e.clientX - rect.left);
    const y = snap(e.clientY - rect.top);
  
    if (startPoint) {
      const dx = Math.abs(x - startPoint.x);
      const dy = Math.abs(y - startPoint.y);
  
      if (dx > dy) {
        setCurrentPoint({ x, y: startPoint.y }); // snap to horizontal
      } else {
        setCurrentPoint({ x: startPoint.x, y }); // snap to vertical
      }
    }
  };
  

  const handleMouseUp = (e) => {
    if (!drawing || !startPoint || !currentPoint) return;
    const newWall = {
      start: startPoint,
      end: currentPoint,
      type: tool // ← 'wall', 'door', or 'window'
    };
    const updatedWalls = [...walls, newWall];
    localStorage.setItem('floorplan-walls', JSON.stringify(updatedWalls));
    setWalls(updatedWalls);
    setDrawing(false);
    setStartPoint(null);
    setCurrentPoint(null);
    localStorage.setItem('floorplan-walls', JSON.stringify(updatedWalls));
    if (onWallsUpdate) onWallsUpdate(updatedWalls);
  };

  const handleUndo = () => {
    const updated = walls.slice(0, -1);
    setWalls(updated);
    localStorage.setItem('floorplan-walls', JSON.stringify(updated))
    if (onWallsUpdate) onWallsUpdate(updated);
  };
  
  const handleClear = () => {
    setWalls([]);
    if (onWallsUpdate) onWallsUpdate([]);
  };
  
  const handleWallClick = (x, y) => {
    const tolerance = 10;
  
    for (let i = 0; i < walls.length; i++) {
      const { start, end } = walls[i];
      const dist =
        Math.abs((end.y - start.y) * x - (end.x - start.x) * y + end.x * start.y - end.y * start.x) /
        Math.sqrt(Math.pow(end.y - start.y, 2) + Math.pow(end.x - start.x, 2));
  
      if (dist < tolerance) {
        setSelectedWallIndex(i);
        return;
      }
    }
  
    setSelectedWallIndex(null);
  };
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' && selectedWallIndex !== null) {
        const updatedWalls = walls.filter((_, i) => i !== selectedWallIndex);
        setWalls(updatedWalls);
        setSelectedWallIndex(null);
        if (onWallsUpdate) onWallsUpdate(updatedWalls);
      }
    };
  
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [walls, selectedWallIndex]);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('floorplan-walls');
      if (stored) {
        const parsed = JSON.parse(stored);
        setWalls(parsed);
        if (onWallsUpdate) onWallsUpdate(parsed);
      }
    }
  }, []);
  

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <span>Tool:</span>
        <button onClick={() => setTool('wall')}>Wall</button>
        <button onClick={() => setTool('door')}>Door</button>
        <button onClick={() => setTool('window')}>Window</button>
        <button onClick={handleUndo}>Undo</button>
        <button onClick={handleClear}>Clear</button>
        <button onClick={() => {
          localStorage.removeItem('floorplan-walls');
          setWalls([]);
          if (onWallsUpdate) onWallsUpdate([]);
        }}>Reset Plan</button>

      </div>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={(e) => {
          const rect = canvasRef.current.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          handleWallClick(x, y);
        }}
      />
    </div>
  );
  
}
