'use client';

import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Sidebar from '@/app/components/Sidebar';
import Toolbar from '@/app/components/Toolbar';
import RoomSelector from '@/app/components/RoomSelector';
import styles from './Editor.module.scss';

// Dynamically load CanvasArea only on client side
const CanvasArea = dynamic(() => import('@/app/components/CanvasArea3D'), {
  ssr: false
});

export default function RoomEditorPage() {
  const { room } = useParams(); // e.g., 'hall', 'kitchen'

  return (
    <div className={styles.editorLayout}>
      <Sidebar />
      <div className={styles.canvasArea}>
        <Toolbar />
        <CanvasArea room={room} />
      </div>
      <RoomSelector />
    </div>
  );
}
