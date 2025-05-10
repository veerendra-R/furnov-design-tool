'use client';

import { useEffect, useState } from 'react';
import styles from './Sidebar.module.scss';

export default function Sidebar() {
  const [models, setModels] = useState([]);

  useEffect(() => {
    // Ideally this should come from an API or pre-defined config.
    // For now, use static list
    setModels([
      { name: 'Chair', file: 'chair.glb' },
      { name: 'Sofa', file: 'sofa.glb' },
      { name: 'Lamp', file: 'lamp.glb' },
    ]);
  }, []);

  return (
    <div className={styles.sidebar}>
      <h3>Assets</h3>
      <div className={styles.assetList}>
        {models.map((model, index) => (
          <div
            key={index}
            className={styles.assetItem}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('model-file', model.file);
            }}
          >
            <span>{model.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
