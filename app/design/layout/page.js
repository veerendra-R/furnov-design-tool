import { Suspense } from 'react';
import LayoutEditorPage from './LayoutEditorClient';

export default function DesignLayoutPage() {
  return (
    <Suspense fallback={<div>Loading design editor...</div>}>
      <LayoutEditorPage />
    </Suspense>
  );
}
