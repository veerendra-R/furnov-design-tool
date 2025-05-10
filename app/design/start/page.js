'use client';

import { useRouter } from 'next/navigation';
import styles from './TemplateSelection.module.scss';

const templates = [
  { name: '2BHK Plan', id: '2bhk', description: '2 bedrooms, kitchen, hall, bathroom' },
  { name: '3BHK Plan', id: '3bhk', description: '3 bedrooms, kitchen, hall, 2 bathrooms' },
  { name: 'Studio Apartment', id: 'studio', description: 'Open layout studio design' }
];

export default function TemplateSelection() {
  const router = useRouter();

  const handleSelect = (templateId) => {
    router.push(`/design/layout?template=${templateId}`);
  };

  return (
    <div className={styles.selectionContainer}>
      <h2>Select a House Plan Template</h2>
      <div className={styles.templateGrid}>
        {templates.map((template) => (
          <div
            key={template.id}
            className={styles.templateCard}
            onClick={() => handleSelect(template.id)}
          >
            <h3>{template.name}</h3>
            <p>{template.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
