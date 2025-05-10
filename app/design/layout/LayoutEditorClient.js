'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import styles from './LayoutEditor.module.scss';

const CanvasArea = dynamic(() => import('@/app/components/CanvasArea3D'), { ssr: false });

export default function LayoutEditorPage() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get('template');
  const [templateData, setTemplateData] = useState(null);

  useEffect(() => {
    if (templateId) {
      fetch(`/templates/${templateId}GridTemplate.json`)
        .then((res) => res.json())
        .then((data) => setTemplateData(data));
    }
  }, [templateId]);

  if (!templateData) return <p className={styles.loading}>Loading floor plan...</p>;

  return (
    <div className={styles.editorWrapper}>
      <CanvasArea layout={templateData} />
    </div>
  );
}
