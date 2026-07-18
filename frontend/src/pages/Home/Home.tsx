import { useState, useEffect, useRef } from 'react';
import { CATEGORIES } from './categories';
import RecommendationRow from '../../components/RecommendationRow/RecommendationRow';
import styles from './Home.module.css';
import openingVideo from '../../assets/opening.mp4';

export default function Home() {
  const [loadedCount, setLoadedCount] = useState(2);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setLoadedCount((prev) => Math.min(prev + 2, CATEGORIES.length));
        }
      },
      { rootMargin: '400px' }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, []);

  const visibleCategories = CATEGORIES.slice(0, loadedCount);

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
          {visibleCategories.map((config, i) => (
            <RecommendationRow key={i} config={config} />
          ))}
          
          {/* Intersection Observer Target */}
          {loadedCount < CATEGORIES.length && (
            <div ref={observerTarget} className={styles.loadingTrigger}>
              <div className={styles.spinner} />
            </div>
          )}
        </div>
      </div>
  );
}