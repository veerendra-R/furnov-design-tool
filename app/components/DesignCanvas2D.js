'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './DesignCanvas2D.module.scss';

const gridSize = 20;

export default function DesignCanvas2D({ onWallsUpdate,initialWalls = [] }) {
  const [walls, setWalls] = useState(initialWalls);
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [currentPoint, setCurrentPoint] = useState(null);

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

    // Draw walls
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 4;
    walls.forEach(({ start, end }) => {
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    });

    // Draw preview wall
    if (drawing && startPoint && currentPoint) {
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(startPoint.x, startPoint.y);
      ctx.lineTo(currentPoint.x, currentPoint.y);
      ctx.stroke();
      ctx.setLineDash([]);
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
    const newWall = { start: startPoint, end: currentPoint };
    const updatedWalls = [...walls, newWall];
    setWalls(updatedWalls);
    setStartPoint(null);
    setCurrentPoint(null);
    setDrawing(false);
    if (onWallsUpdate) onWallsUpdate(updatedWalls);
  };

  const handleUndo = () => {
    const updated = walls.slice(0, -1);
    setWalls(updated);
    if (onWallsUpdate) onWallsUpdate(updated);
  };
  
  const handleClear = () => {
    setWalls([]);
    if (onWallsUpdate) onWallsUpdate([]);
  };
  

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <button onClick={handleUndo}>Undo</button>
        <button onClick={handleClear}>Clear</button>
      </div>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
    </div>
  );
  
}
