import { Link } from 'react-router-dom';
import type { AnimeRelease } from '../../services/api';
import styles from './AnimeCard.module.css';

interface Props {
    anime: AnimeRelease;
}

function isPlaceholderPoster(url: string | null): boolean {
    return !url || url.includes('missing_') || url.includes('/assets/globals/');
}

export default function AnimeCard({ anime }: Props) {
    const showPoster = anime.poster && !isPlaceholderPoster(anime.poster);

    return (
        <Link to={`/anime/${anime.id}`} className={styles.card}>
            <div className={styles.poster}>
                {showPoster
                    ? <img src={anime.poster!} alt={anime.title} loading="lazy" />
                    : (
                        <div className={styles.noPoster}>
                            <span className={styles.noPosterTitle}>{anime.title}</span>
                        </div>
                    )
                }
                {anime.isOngoing && <div className={styles.badge}><span className={styles.ongoing}>Онгоинг</span></div>}
                <div className={styles.overlay}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z"/>
                    </svg>
                </div>
            </div>
            <div className={styles.info}>
                <h3 className={styles.title} title={anime.title}>{anime.title}</h3>
                <div className={styles.meta}>
                    {anime.episodesCount ? <span className={styles.metaItem}>{anime.episodesCount} эп.</span> : (anime.type && <span className={styles.metaItem}>{anime.type}</span>)}
                    {anime.year && <span className={styles.metaItem}>{anime.year}</span>}
                </div>
            </div>
        </Link>
    );
}