'use client';

import Link from 'next/link';
import styles from './page.module.scss';

export default function Home() {
  return (
    <div className={styles.landing}>
      <h1>FURNOV Interior Design Studio</h1>
      <p>Start designing your dream interior space. Upload your home plan or explore a shared design.</p>
      <div className={styles.actions}>
        <Link href="/upload">
          <button>Upload Home Plan</button>
        </Link>
        <Link href="/viewer/sample123">
          <button>View Shared Design</button>
        </Link>
      </div>
    </div>
  );
}
