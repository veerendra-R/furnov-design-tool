'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './DesignCanvas2D.module.scss';

const gridSize = 20;

export default function DesignCanvas2D({ onWallsUpdate,initialWalls = [] }) {
  const [walls, setWalls] = useState(initialWalls);
  const [roomLabels, setRoomLabels] = useState([]);
  const [selectedLabelIndex, setSelectedLabelIndex] = useState(null);

  const [drawing, setDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [currentPoint, setCurrentPoint] = useState(null);
  const [tool, setTool] = useState('wall');
  const [selectedWallIndex, setSelectedWallIndex] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [shapes, setShapes] = useState([]); // line 18
  const [selectedShapeIndex, setSelectedShapeIndex] = useState(null); // line 19
  const [shapeDragOffset, setShapeDragOffset] = useState({ x: 0, y: 0 });

  
  const panStartRef = useRef(null);
  const canvasRef = useRef(null);

  const snap = (val, isX = true) => {
    const pan = isX ? offset.x : offset.y;
    return Math.round((val / zoom - pan) / gridSize) * gridSize;
  };
  const getCanvasCenter = () => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const centerX = (rect.width / 2) / zoom - offset.x;
    const centerY = (rect.height / 2) / zoom - offset.y;
    return { x: snap(centerX), y: snap(centerY, false) };
  };
   
  const { x, y } = getCanvasCenter();

  const addPredefinedRoom = (shape) => {
    const { x, y } = getCanvasCenter();
    let newWalls = [];

    if (shape === 'square') {
      newWalls = [
        { start: { x, y }, end: { x: x + 100, y } },
        { start: { x: x + 100, y }, end: { x: x + 100, y: y + 100 } },
        { start: { x: x + 100, y: y + 100 }, end: { x, y: y + 100 } },
        { start: { x, y: y + 100 }, end: { x, y } },
      ];
    } else if (shape === 'rectangle') {
      newWalls = [
        { start: { x, y }, end: { x: x + 150, y } },
        { start: { x: x + 150, y }, end: { x: x + 150, y: y + 100 } },
        { start: { x: x + 150, y: y + 100 }, end: { x, y: y + 100 } },
        { start: { x, y: y + 100 }, end: { x, y } },
      ];
    } else if (shape === 'lshape') {
      newWalls = [
        { start: { x, y }, end: { x: x + 100, y } },
        { start: { x: x + 100, y }, end: { x: x + 100, y: y + 50 } },
        { start: { x: x + 100, y: y + 50 }, end: { x: x + 150, y: y + 50 } },
        { start: { x: x + 150, y: y + 50 }, end: { x: x + 150, y: y + 150 } },
        { start: { x: x + 150, y: y + 150 }, end: { x, y: y + 150 } },
        { start: { x, y: y + 150 }, end: { x, y } },
      ];
    }

    const shapeWalls = [...newWalls];
    const updatedShapes = [...shapes, shapeWalls];
    setShapes(updatedShapes);
    
    const updated = [...walls, ...shapeWalls];
    setWalls(updated);
    localStorage.setItem('floorplan-walls', JSON.stringify(updated));
    localStorage.setItem('floorplan-shapes', JSON.stringify(updatedShapes));
    if (onWallsUpdate) onWallsUpdate(updated);
    setShowRoomModal(false);
    
  };

  const renderShapeButton = (src, label, shape) => (
    <div className={styles.shapeButton} onClick={() => addPredefinedRoom(shape)}>
      <img src={src} alt={label} />
      <span>{label}</span>
    </div>
  );

  const draw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
  
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw room labels
    roomLabels.forEach(({ x, y, name }, i) => {
      ctx.fillStyle = i === selectedLabelIndex ? '#d62828' : '#000';
      ctx.font = 'bold 14px sans-serif';
      ctx.save();
      ctx.scale(zoom, zoom);
      ctx.translate(offset.x, offset.y);
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill(); // point marker
      ctx.fillText(name, x + 8, y - 8); // better offset: avoids overlapping measurement
    });
    
    

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
    ctx.restore();
  
  };
  

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    draw();
  }, [walls, startPoint, currentPoint]);

  const handleMouseDown = (e) => {
    if (!['wall', 'door', 'window'].includes(tool)) return; // ⛔ block drawing for select-label/label
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
        setCurrentPoint({ x, y: startPoint.y });
      } else {
        setCurrentPoint({ x: startPoint.x, y });
      } 
      setCurrentPoint({ x, y });  // allow free line drawing
    
    }
  };
  

  const handleMouseUp = (e) => {
    if (!drawing || !startPoint || !currentPoint) return;
    if (!['wall', 'door', 'window'].includes(tool)) return; // ✅ add this check  
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
  
    // Update shapes state accordingly
    const flatShapes = shapes.flat();
    const shapeCount = flatShapes.length;
    const wallCount = updated.length;
  
    if (shapeCount > 0 && wallCount < shapeCount) {
      const newFlatShapes = flatShapes.slice(0, wallCount);
      const rebuiltShapes = [];
  
      let index = 0;
      for (const group of shapes) {
        const next = newFlatShapes.slice(index, index + group.length);
        if (next.length > 0) rebuiltShapes.push(next);
        index += group.length;
      }
  
      setShapes(rebuiltShapes);
      localStorage.setItem('floorplan-shapes', JSON.stringify(rebuiltShapes));
    }
  
    localStorage.setItem('floorplan-walls', JSON.stringify(updated));
    if (onWallsUpdate) onWallsUpdate(updated);
  };
  
  
  const handleClear = () => {
    setWalls([]);
    setShapes([]); // ← Add this
    localStorage.removeItem('floorplan-walls'); // optional but safer
    localStorage.removeItem('floorplan-shapes'); // ← Add this
    localStorage.removeItem('floorplan-shapes'); 
    setShapes([]); // ✅ Clear runtime shape state

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

  const handleShapeClick = (x, y) => {
    const tolerance = 10;
    for (let s = shapes.length - 1; s >= 0; s--) {
      const shape = shapes[s];
      for (let w of shape) {
        const { start, end } = w;
        const dist = Math.abs((end.y - start.y) * x - (end.x - start.x) * y + end.x * start.y - end.y * start.x) /
                     Math.sqrt(Math.pow(end.y - start.y, 2) + Math.pow(end.x - start.x, 2));
        if (dist < tolerance) {
          setSelectedShapeIndex(s);
          return;
        }
      }
    }
    setSelectedShapeIndex(null);
  };
  


  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete') {
        if (selectedWallIndex !== null) {
          const updatedWalls = walls.filter((_, i) => i !== selectedWallIndex);
          setWalls(updatedWalls);
          setSelectedWallIndex(null);
          localStorage.setItem('floorplan-walls', JSON.stringify(updatedWalls));
          if (onWallsUpdate) onWallsUpdate(updatedWalls);
        }
      
        if (selectedLabelIndex !== null) {
          const updatedLabels = roomLabels.filter((_, i) => i !== selectedLabelIndex);
          setRoomLabels(updatedLabels);
          setSelectedLabelIndex(null);
          localStorage.setItem('floorplan-labels', JSON.stringify(updatedLabels));
        }
      }      
    
    };
  
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [walls, selectedWallIndex, roomLabels, selectedLabelIndex]);
  useEffect(() => {
    draw();
  }, [walls, startPoint, currentPoint, roomLabels, selectedLabelIndex]);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedWalls = localStorage.getItem('floorplan-walls');
      const storedShapes = localStorage.getItem('floorplan-shapes');
      if (storedShapes) {
        setShapes(JSON.parse(storedShapes));
      }
      if (storedWalls) {
        const parsed = JSON.parse(storedWalls);
        setWalls(parsed);
        if (onWallsUpdate) onWallsUpdate(parsed);
      }
  
      const storedLabels = localStorage.getItem('floorplan-labels');
      if (storedLabels) {
        setRoomLabels(JSON.parse(storedLabels));
      }
    }
  }, []);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
  
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      draw();
    };
  
    resizeCanvas(); // set on mount
  
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [draw]);
  
  const handleTouchStart = (e) => {
    if (!['wall', 'door', 'window'].includes(tool)) return;
    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    const x = snap(touch.clientX - rect.left, true);
    const y = snap(touch.clientY - rect.top, false);
    setStartPoint({ x, y });
    setDrawing(true);
  };

  const handleTouchMove = (e) => {
    if (!drawing) return;
    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    const x = snap(touch.clientX - rect.left, true);
    const y = snap(touch.clientY - rect.top, false);

    if (startPoint) {
      const dx = Math.abs(x - startPoint.x);
      const dy = Math.abs(y - startPoint.y);
      setCurrentPoint({ x, y });
    }
    // e.preventDefault();
    
  };

  const handleTouchEnd = () => {
    if (!drawing || !startPoint || !currentPoint) return;
    const newWall = {
      start: startPoint,
      end: currentPoint,
      type: tool
    };
    const updatedWalls = [...walls, newWall];
    setWalls(updatedWalls);
    localStorage.setItem('floorplan-walls', JSON.stringify(updatedWalls));
    if (onWallsUpdate) onWallsUpdate(updatedWalls);
    setDrawing(false);
    setStartPoint(null);
    setCurrentPoint(null);
  };
  const areWallsEqual = (a, b) =>
    a.start.x === b.start.x &&
    a.start.y === b.start.y &&
    a.end.x === b.end.x &&
    a.end.y === b.end.y &&
    a.type === b.type;
  const preservedWalls = walls.filter(w => !shapes.flat().some(sw =>
    sw.start.x === w.start.x &&
    sw.start.y === w.start.y &&
    sw.end.x === w.end.x &&
    sw.end.y === w.end.y
  ));
    
    
  useEffect(() => {
    const canvas = canvasRef.current;
  
    const disableScroll = (e) => e.preventDefault();
  
    canvas.removeEventListener('touchstart', disableScroll, { passive: false });
    canvas.removeEventListener('touchmove', disableScroll, { passive: false });
    canvas.removeEventListener('gesturestart', disableScroll, { passive: false });
    canvas.removeEventListener('gesturechange', disableScroll, { passive: false });
    canvas.removeEventListener('wheel', disableScroll, { passive: false });
    

    
    return () => {
      canvas.removeEventListener('touchstart', disableScroll);
      canvas.removeEventListener('touchmove', disableScroll);
      canvas.removeEventListener('wheel', disableScroll);
    };
    
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
        <button onClick={() => setTool('label')}>Label</button>
        <button onClick={() => setTool('select-label')}>Select Label</button>
        <button onClick={() => setShowRoomModal(true)}>➕ Add Room</button>
        <button onClick={() => {
          localStorage.removeItem('floorplan-walls');
          localStorage.removeItem('floorplan-labels');
          localStorage.removeItem('floorplan-shapes'); // ← Add this
          setWalls([]);
          setRoomLabels([]);
          setShapes([]); // ← Add this
          setSelectedWallIndex(null);
          setSelectedLabelIndex(null);
          if (onWallsUpdate) onWallsUpdate([]);
        }}>Reset Plan</button>

      <button onClick={() => setTool('select-shape')}>Select Shape</button>


      </div>
      {showRoomModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Select Room Shape</h3>
            <div className={styles.shapesGrid}>
              {renderShapeButton('/shapes/square.png', 'Square', 'square')}
              {renderShapeButton('/shapes/rectangle.png', 'Rectangle', 'rectangle')}
              {renderShapeButton('/shapes/lshape.png', 'L-Shape', 'lshape')}
            </div>
            <button onClick={() => setShowRoomModal(false)} className={styles.cancelButton}>Cancel</button>
          </div>
        </div>
      )}
      <canvas
        ref={canvasRef}
        style={{
          cursor: tool === 'select-label' ? 'pointer' : drawing ? 'crosshair' : 'default',
          width: '100%',
          height: '100%',
          display: 'block'
        }}
        className={styles.canvas}
        onMouseDown={(e) => {
          if (e.button === 1 || (e.button === 0 && e.altKey)) {
            // middle-click or alt+left-click
            setIsPanning(true);
            panStartRef.current = { x: e.clientX, y: e.clientY };
          } else {
            handleMouseDown(e);
          }
          if (tool === 'select-shape') {
            const rect = canvasRef.current.getBoundingClientRect();
            const x = snap(e.clientX - rect.left);
            const y = snap(e.clientY - rect.top);
            handleShapeClick(x, y);
            panStartRef.current = { x, y };
            return;
          }
          
        }}
        
        onMouseMove={(e) => {
          if (isPanning && panStartRef.current) {
            const dx = (e.clientX - panStartRef.current.x) / zoom;
            const dy = (e.clientY - panStartRef.current.y) / zoom;
            setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
            panStartRef.current = { x: e.clientX, y: e.clientY };
          } else {
            handleMouseMove(e);
          }
          if (tool === 'select-shape' && selectedShapeIndex !== null && panStartRef.current) {
            const dx = x - panStartRef.current.x;
            const dy = y - panStartRef.current.y;
            const updatedShapes = [...shapes];
            const shape = updatedShapes[selectedShapeIndex].map(w => ({
              start: { x: w.start.x + dx, y: w.start.y + dy },
              end: { x: w.end.x + dx, y: w.end.y + dy },
              type: w.type
            }));
            updatedShapes[selectedShapeIndex] = shape;
            setShapes(updatedShapes);
            const preservedWalls = walls.filter(w => !shapes.flat().some(sw =>
              sw.start.x === w.start.x &&
              sw.start.y === w.start.y &&
              sw.end.x === w.end.x &&
              sw.end.y === w.end.y
            ));
            setWalls([...preservedWalls, ...updatedShapes.flat()]);
            if (tool === 'select-shape') {
              panStartRef.current = { x, y };
              return;
            }
            
            return;
          }
          
          
        }}
        
        onMouseUp={(e) => {
          setIsPanning(false);
          handleMouseUp(e);
          if (tool === 'select-shape' && selectedShapeIndex !== null) {
            const preservedWalls = walls.filter(w => !shapes.flat().some(sw => sw.start.x === w.start.x && sw.start.y === w.start.y && sw.end.x === w.end.x && sw.end.y === w.end.y));
            const updated = [...preservedWalls, ...shapes.flat()];
            setWalls(updated);
            localStorage.setItem('floorplan-shapes', JSON.stringify(shapes));
            localStorage.setItem('floorplan-walls', JSON.stringify(updated));
            if (onWallsUpdate) onWallsUpdate(updated);
            setTimeout(() => setSelectedShapeIndex(null), 100);

          }
          
        }}
        
        onWheel={(e) => {
          // e.preventDefault();
          const factor = e.deltaY < 0 ? 1.1 : 0.9;
          setZoom((prev) => Math.max(0.5, Math.min(4, prev * factor)));
        }}
        
        onClick={(e) => {
          const rect = canvasRef.current.getBoundingClientRect();
          const x = snap(e.clientX - rect.left);
          const y = snap(e.clientY - rect.top);
        
          setDrawing(false);
          setStartPoint(null);
          setCurrentPoint(null);
          setSelectedWallIndex(null);
        
        if (tool === 'label') {
          const name = prompt('Enter room name:');
          if (name) {
            const newLabels = [...roomLabels, { x, y, name }];
            setRoomLabels(newLabels);
            localStorage.setItem('floorplan-labels', JSON.stringify(newLabels));
          }
        } else if (tool === 'select-label') {
          const tolerance = 12;
          let found = false;
          for (let i = 0; i < roomLabels.length; i++) {
            const label = roomLabels[i];
            const dist = Math.sqrt((x - label.x) ** 2 + (y - label.y) ** 2);
            if (dist < tolerance) {
              setSelectedLabelIndex(i);
              found = true;
              break;
            }
          }
          if (!found) setSelectedLabelIndex(null);
        } else {
          // default: try to select a wall
          handleWallClick(x, y);
        }

        
          if (tool === 'select-label') {
            const tolerance = 12;
            let found = false;
        
            for (let i = 0; i < roomLabels.length; i++) {
              const label = roomLabels[i];
              const dist = Math.sqrt((x - label.x) ** 2 + (y - label.y) ** 2);
              if (dist < tolerance) {
                setSelectedLabelIndex(i);
                found = true;
                break;
              }
            }
        
            if (!found) setSelectedLabelIndex(null);
          }
        }}
        
        
        onDoubleClick={(e) => {
          if (tool !== 'select-label') return;
        
          const rect = canvasRef.current.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const tolerance = 12;
        
          for (let i = 0; i < roomLabels.length; i++) {
            const label = roomLabels[i];
            const dist = Math.sqrt((x - label.x) ** 2 + (y - label.y) ** 2);
            if (dist < tolerance) {
              const newName = prompt('Rename label:', label.name);
              if (newName) {
                const updated = [...roomLabels];
                updated[i].name = newName;
                setRoomLabels(updated);
                localStorage.setItem('floorplan-labels', JSON.stringify(updated));
                setSelectedLabelIndex(i);
              }
              break;
            }
          }
        }}
        
        onTouchStart={(e) => {
          const touch = e.touches[0];
          const rect = canvasRef.current.getBoundingClientRect();
          const x = snap(touch.clientX - rect.left);
          const y = snap(touch.clientY - rect.top);
        
          if (tool === 'select-shape') {
            handleShapeClick(x, y);
            panStartRef.current = { x, y };
            return;
          }
          if (tool === 'select-label') {
            handleWallClick(x, y);
          }          
          if (!['wall', 'door', 'window'].includes(tool)) return;
          setStartPoint({ x, y });
          setDrawing(true);
        }}
        
        onTouchMove={(e) => {
          const touch = e.touches[0];
          const rect = canvasRef.current.getBoundingClientRect();
          const x = snap(touch.clientX - rect.left);
          const y = snap(touch.clientY - rect.top);
        
          if (tool === 'select-shape' && selectedShapeIndex !== null) {
            const dx = x - panStartRef.current.x;
            const dy = y - panStartRef.current.y;
        
            const updatedShapes = [...shapes];
            const shape = updatedShapes[selectedShapeIndex].map(w => ({
              start: { x: w.start.x + dx, y: w.start.y + dy },
              end: { x: w.end.x + dx, y: w.end.y + dy },
              type: w.type
            }));
            updatedShapes[selectedShapeIndex] = shape;
        
            const preservedWalls = walls.filter(w => !shapes.flat().some(sw =>
              sw.start.x === w.start.x &&
              sw.start.y === w.start.y &&
              sw.end.x === w.end.x &&
              sw.end.y === w.end.y
            ));
            setWalls([...preservedWalls, ...updatedShapes.flat()]);
            setShapes(updatedShapes);
            panStartRef.current = { x, y };
            return;
          }
        
          handleTouchMove(e); // fallback to normal touch drawing
        }}
        
        onTouchEnd={() => {
          if (tool === 'select-shape' && selectedShapeIndex !== null) {
            const preservedWalls = walls.filter(w => !shapes.flat().some(sw =>
              sw.start.x === w.start.x &&
              sw.start.y === w.start.y &&
              sw.end.x === w.end.x &&
              sw.end.y === w.end.y
            ));
            const updated = [...preservedWalls, ...shapes.flat()];
            setWalls(updated);
            localStorage.setItem('floorplan-shapes', JSON.stringify(shapes));
            localStorage.setItem('floorplan-walls', JSON.stringify(updated));
            if (onWallsUpdate) onWallsUpdate(updated);
            setSelectedShapeIndex(null);
            return;
          }
          if ((tool === 'select-label' || tool === 'wall') && selectedWallIndex !== null) {
            const updatedWalls = walls.filter((_, i) => i !== selectedWallIndex);
            setWalls(updatedWalls);
            localStorage.setItem('floorplan-walls', JSON.stringify(updatedWalls));
            if (onWallsUpdate) onWallsUpdate(updatedWalls);
            setSelectedWallIndex(null);
          }
          
          handleTouchEnd(); // fallback to wall drawing
        }}
        
        
  
        
        
      />
    </div>
  );
  
}