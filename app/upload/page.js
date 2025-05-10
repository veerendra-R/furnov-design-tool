'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './UploadPage.module.scss';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const router = useRouter();

  const handleUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
    }
  };

  const handleStartDesign = () => {
    if (!file) return;
    router.push('/design/hall'); // Placeholder routing
  };

  return (
    <div className={styles.uploadContainer}>
      <h2>Upload Your 2D Home Plan</h2>
      <input type="file" accept="image/*" onChange={handleUpload} />
      {file && (
        <div className={styles.fileInfo}>
          <p>Uploaded: {file.name}</p>
          <button onClick={handleStartDesign}>Start Designing</button>
        </div>
      )}
    </div>
  );
}
