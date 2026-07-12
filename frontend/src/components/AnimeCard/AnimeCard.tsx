import { Link } from 'react-router-dom';
import type { AnimeRelease } from '../../services/api';
import styles from './AnimeCard.module.css';

interface Props {
  anime: AnimeRelease;
}

export default function AnimeCard({ anime }: Props) {
  return (
    <Link to={`/anime/${anime.id}`} className={styles.card}>
      <div className={styles.poster}>
        {anime.poster
          ? <img src={anime.poster} alt={anime.title} loading="lazy" />
          : <div className={styles.noPoster}>Нет постера</div>
        }
        {anime.isOngoing && <span className={styles.ongoing}>Онгоинг</span>}
        <div className={styles.overlay}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
      </div>
      <div className={styles.info}>
        <h3 className={styles.title}>{anime.title}</h3>
        <div className={styles.meta}>
          {anime.year && <span>{anime.year}</span>}
          {anime.type && <span>{anime.type}</span>}
        </div>
      </div>
    </Link>
  );
}
