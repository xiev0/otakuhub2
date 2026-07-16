import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { animeApi, type AnimeRelease } from '../../services/api';
import AnimeCard from '../../components/AnimeCard/AnimeCard';
import styles from './Home.module.css';
import openingVideo from '../../assets/opening.mp4';

export default function Home() {
  const [popular, setPopular] = useState<AnimeRelease[]>([]);
  const [schedule, setSchedule] = useState<AnimeRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [random, setRandom] = useState<AnimeRelease[]>([]);
  const [movies, setMovies] = useState<AnimeRelease[]>([]);

  useEffect(() => {
    Promise.allSettled([
      animeApi.getPopular(6),
      animeApi.getSchedule(),
      animeApi.getRandom(6),
      animeApi.getMovie(6),
    ]).then(([pop, rec, sch, ran, mov]) => {
      if (pop.status === 'fulfilled') setPopular(pop.value);
      if (sch.status === 'fulfilled') setSchedule(sch.value.slice(0, 7));
      if (ran.status === 'fulfilled') setRandom(ran.value);
      if (mov.status === 'fulfilled') setMovies(mov.value);

      [pop, rec, sch, ran, mov].forEach(r => {
        if (r.status === 'rejected') console.error(r.reason);
      });
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.page}>
      {/* ─── Hero Banner ─── */}
      <div className={styles.heroBanner}>
        <video
            className={styles.heroVideo}
            src={openingVideo}
            autoPlay
            muted
            loop
            playsInline
        />
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Aniki</h1>
          <p className={styles.heroSubtitle}>Твоя вселенная аниме</p>
        </div>
      </div>

      <div className={styles.container}>
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

        {/* random */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
              </svg>
              Случайные аниме
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
                {random.map(a => <AnimeCard key={a.id} anime={a} />)}
              </div>
          )}
        </section>

        {/* ─── Фильмы ─── */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
              Фильмы
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
                {movies.map(a => <AnimeCard key={a.id} anime={a} />)}
              </div>
          )}
        </section>
      </div>
    </div>
  );
}
