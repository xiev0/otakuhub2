import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { animeApi, type AnimeRelease } from '../../services/api';
import AnimeCard from '../../components/AnimeCard/AnimeCard';
import styles from './Home.module.css';

export default function Home() {
  const [latest, setLatest] = useState<AnimeRelease[]>([]);
  const [popular, setPopular] = useState<AnimeRelease[]>([]);
  const [schedule, setSchedule] = useState<AnimeRelease[]>([]);
  const [hero, setHero] = useState<AnimeRelease | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      animeApi.getLatest(6),
      animeApi.getPopular(6),
      animeApi.getSchedule(),
    ]).then(([lat, pop, sch]) => {
      setLatest(lat);
      setPopular(pop);
      setSchedule(sch.slice(0, 7));
      if (pop.length) setHero(pop[0]);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.page}>
      {/* ─── Hero Banner ─── */}
      {hero && (
        <section className={styles.hero}>
          <div
            className={styles.heroBg}
            style={{ backgroundImage: `url(${hero.poster})` }}
          />
          <div className={styles.heroOverlay} />
          <div className={styles.heroContent}>
            <span className={styles.heroType}>{hero.type}</span>
            <h1 className={styles.heroTitle}>{hero.title}</h1>
            {hero.description && (
              <p className={styles.heroDesc}>
                {hero.description.length > 200
                  ? hero.description.slice(0, 200) + '...'
                  : hero.description}
              </p>
            )}
            <div className={styles.heroMeta}>
              {hero.year && <span>{hero.year}</span>}
              {hero.genres.slice(0, 3).map(g => (
                <span key={g.id} className={styles.heroGenre}>{g.name}</span>
              ))}
            </div>
            <div className={styles.heroActions}>
              <Link to={`/anime/${hero.id}`} className={styles.watchBtn}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                Смотреть
              </Link>
              {hero.isOngoing && (
                <span className={styles.ongoingBadge}>● Онгоинг</span>
              )}
            </div>
          </div>
        </section>
      )}

      <div className={styles.container}>
        {/* ─── Schedule ─── */}
        {schedule.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Выходит сейчас
            </h2>
            <div className={styles.scheduleRow}>
              {schedule.map(a => (
                <Link key={a.id} to={`/anime/${a.id}`} className={styles.scheduleItem}>
                  {a.poster && <img src={a.poster} alt={a.title} className={styles.schedulePoster} />}
                  <span className={styles.scheduleTitle}>{a.title}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ─── Popular ─── */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
              </svg>
              Популярное
            </h2>
          </div>
          {loading ? (
            <div className={styles.row}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={styles.skeleton} />
              ))}
            </div>
          ) : (
            <div className={styles.row}>
              {popular.map(a => <AnimeCard key={a.id} anime={a} />)}
            </div>
          )}
        </section>

        {/* ─── Latest ─── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            Последние обновления
          </h2>
          {loading ? (
            <div className={styles.row}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={styles.skeleton} />
              ))}
            </div>
          ) : (
            <div className={styles.row}>
              {latest.map(a => <AnimeCard key={a.id} anime={a} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
