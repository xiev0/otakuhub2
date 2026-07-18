import { useEffect, useState } from 'react';
import { animeApi, type AnimeRelease } from '../../services/api';
import AnimeCard from '../AnimeCard/AnimeCard';
import type { CategoryConfig } from '../../pages/Home/categories';
import styles from './RecommendationRow.module.css';

interface Props {
  config: CategoryConfig;
}

export default function RecommendationRow({ config }: Props) {
  const [items, setItems] = useState<AnimeRelease[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    animeApi.getCatalog({ ...config.params, limit: 6 })
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [config]);

  if (!loading && items.length === 0) {
    return null;
  }

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{config.title}</h2>
      </div>
      {loading ? (
        <div className={styles.row}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.skeleton} />
          ))}
        </div>
      ) : (
        <div className={styles.row}>
          {items.map(a => <AnimeCard key={a.id} anime={a} />)}
        </div>
      )}
    </section>
  );
}
