// components/RoomShapesPanel.js
'use client';
import styles from './RoomShapesPanel.module.scss';

export default function RoomShapesPanel({ onSelectShape, onClose }) {
  const shapes = [
    { id: 'square', label: 'Square Room', icon: '/shapes/square.png' },
    { id: 'rectangle', label: 'Rectangle', icon: '/shapes/rectangle.png' },
    { id: 'l-shape', label: 'L Shape', icon: '/shapes/lshape.png' },
    { id: 't-shape', label: 'T Shape', icon: '/shapes/tshape.png' },
    { id: 'u-shape', label: 'U Shape', icon: '/shapes/ushape.png' },
    { id: 'z-shape', label: 'Z Shape', icon: '/shapes/zshape.png' },
    { id: 'custom', label: 'Custom', icon: '/shapes/custom.png' },
  ];

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2>Rooms</h2>
        <button onClick={onClose} className={styles.close}>✕</button>
      </div>
      <div className={styles.grid}>
        {shapes.map((shape) => (
          <div
            key={shape.id}
            className={styles.shapeItem}
            onClick={() => onSelectShape(shape.id)}
          >
            <img src={shape.icon} alt={shape.label} />
            <span>{shape.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
