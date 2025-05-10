'use client';

import { useState } from 'react';
import DesignCanvas2D from '@/app/components/DesignCanvas2D';
import dynamic from 'next/dynamic';

// Load 3D canvas only on client
const CanvasArea3D = dynamic(() => import('@/app/components/CanvasArea3D'), { ssr: false });

export default function Draw2DPage() {
  const [walls, setWalls] = useState([]);
  const [view3D, setView3D] = useState(false);

  return (
    <div>
      <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between' }}>
        <h2>Design Your Floor Plan</h2>
        <button onClick={() => setView3D(!view3D)}>
          {view3D ? 'Back to 2D' : 'View in 3D'}
        </button>
      </div>

      {!view3D ? (
        <DesignCanvas2D
          onWallsUpdate={setWalls}
          initialWalls={walls} // ✅ pass walls to reuse them
        />
      ) : (
        <CanvasArea3D walls={walls} />
      )}

    </div>
  );
}
