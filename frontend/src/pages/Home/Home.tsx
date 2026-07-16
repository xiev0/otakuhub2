import { useEffect, useState } from 'react';
import { animeApi, type AnimeRelease } from '../../services/api';
import AnimeCard from '../../components/AnimeCard/AnimeCard';
import styles from './Home.module.css';
import openingVideo from '../../assets/opening.mp4';

export default function Home() {
  const [popular, setPopular] = useState<AnimeRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [random, setRandom] = useState<AnimeRelease[]>([]);
  const [movies, setMovies] = useState<AnimeRelease[]>([]);

  useEffect(() => {
    Promise.allSettled([
      animeApi.getPopular(6),
      animeApi.getRandom(6),
      animeApi.getMovie(6),
    ]).then(([pop, ran, mov]) => {
      if (pop.status === 'fulfilled') setPopular(pop.value);
      if (ran.status === 'fulfilled') setRandom(ran.value);
      if (mov.status === 'fulfilled') setMovies(mov.value);

      [pop, ran, mov].forEach(r => {
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