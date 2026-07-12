import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { animeApi, userApi, type AnimeRelease, type PlayerSource, type Comment } from '../../services/api';
import { useAppSelector } from '../../store/hooks';
import HlsPlayer from '../../components/player/HlsPlayer';
import styles from './AnimeDetail.module.css';

export default function AnimeDetail() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAppSelector(s => s.auth);

  const [anime, setAnime] = useState<AnimeRelease | null>(null);
  const [sources, setSources] = useState<PlayerSource[]>([]);
  const [selectedEp, setSelectedEp] = useState<number>(1);
  const [currentSource, setCurrentSource] = useState<PlayerSource | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [listStatus, setListStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [savedTime, setSavedTime] = useState(0);

  const playerRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Load anime data
  useEffect(() => {
    if (!id) return;
    window.scrollTo(0, 0);
    setLoading(true);
    setAnime(null);
    setSources([]);
    setCurrentSource(null);

    animeApi.getRelease(id).then(data => {
      setAnime(data);
      setLoading(false);

      // Load episodes from AniLibria
      setEpisodesLoading(true);
      animeApi.getEpisodes(data.id).then(eps => {
        setSources(eps);
        if (eps.length) {
          setSelectedEp(eps[0].episodeNumber);
          setCurrentSource(eps[0]);
        }
      }).catch(console.error)
        .finally(() => setEpisodesLoading(false));

      // Load comments
      animeApi.getComments(data.id).then(setComments).catch(console.error);
    }).catch(e => {
      console.error(e);
      setLoading(false);
    });
  }, [id]);

  // Load user's list status
  useEffect(() => {
    if (!isAuthenticated || !anime) return;
    userApi.getLists().then(lists => {
      const entry = lists.find(e => e.releaseId === anime.id);
      if (entry) setListStatus(entry.status);
    }).catch(console.error);
  }, [isAuthenticated, anime]);

  const handleEpisodeSelect = (ep: number) => {
    const src = sources.find(s => s.episodeNumber === ep);
    if (src) {
      setSelectedEp(ep);
      setCurrentSource(src);
      setSavedTime(0);
      playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleTimeUpdate = useCallback((currentTime: number, duration: number) => {
    if (!isAuthenticated || !anime || !currentSource) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      userApi.updateProgress({
        release_id: anime.id,
        release_title: anime.title,
        release_poster: anime.poster,
        episode_id: currentSource.id,
        episode_ordinal: currentSource.episodeNumber,
        current_time: currentTime,
        duration,
      }).catch(console.error);
    }, 5000);
  }, [isAuthenticated, anime, currentSource]);

  const handleListChange = async (status: string) => {
    if (!isAuthenticated || !anime) return;
    try {
      if (status === '') {
        await userApi.removeFromList(anime.id);
        setListStatus('');
      } else {
        await userApi.addToList({
          release_id: anime.id,
          status,
          release_title: anime.title,
          release_poster: anime.poster,
        });
        setListStatus(status);
      }
    } catch (e: any) { alert(e.message); }
  };

  const handleCommentSubmit = async () => {
    if (!isAuthenticated) return alert('Войдите, чтобы оставить комментарий');
    if (!commentText.trim() || !anime) return;
    try {
      const c = await animeApi.addComment(anime.id, commentText.trim());
      setComments(prev => [c, ...prev]);
      setCommentText('');
    } catch (e: any) { alert(e.message); }
  };

  const episodes = [...new Set(sources.map(s => s.episodeNumber))].sort((a, b) => a - b);

  const LIST_OPTIONS = [
    { value: 'watching', label: 'Смотрю' },
    { value: 'planned', label: 'Запланировано' },
    { value: 'completed', label: 'Просмотрено' },
    { value: 'on_hold', label: 'Отложено' },
    { value: 'dropped', label: 'Брошено' },
  ];

  if (loading) return (
    <div className={styles.skeletonPage}>
      <div className={styles.skeletonHero} />
      <div className={styles.skeletonContent}>
        <div className={styles.skeletonPoster} />
        <div className={styles.skeletonText}>
          {[1,2,3,4].map(i => <div key={i} className={styles.skeletonLine} />)}
        </div>
      </div>
    </div>
  );

  if (!anime) return <div className={styles.error}>Аниме не найдено</div>;

  const descParagraphs = anime.description?.split('\n').filter(p => p.trim()) ?? [];

  return (
    <div className={styles.page}>
      {/* ─── Hero Banner ─── */}
      <div className={styles.heroBanner}>
        {anime.poster && <div className={styles.heroBg} style={{ backgroundImage: `url(${anime.poster})` }} />}
        <div className={styles.heroOverlay} />
      </div>

      {/* ─── Info Section ─── */}
      <div className={styles.infoSection}>
        <div className={styles.infoInner}>
          {/* Poster */}
          <div className={styles.posterWrap}>
            {anime.poster
              ? <img src={anime.poster} alt={anime.title} className={styles.poster} />
              : <div className={styles.noPoster} />
            }
          </div>

          {/* Meta */}
          <div className={styles.meta}>
            <span className={styles.typeBadge}>{anime.type}</span>
            <h1 className={styles.title}>{anime.title}</h1>
            {anime.titleEnglish && <p className={styles.titleEn}>{anime.titleEnglish}</p>}

            <div className={styles.badges}>
              {anime.year && <span className={styles.badge}>{anime.year}</span>}
              {anime.isOngoing && <span className={`${styles.badge} ${styles.badgeGreen}`}>Онгоинг</span>}
              {anime.episodesTotal && <span className={styles.badge}>{anime.episodesTotal} эп.</span>}
            </div>

            {anime.genres.length > 0 && (
              <div className={styles.genres}>
                {anime.genres.map(g => (
                  <span key={g.id} className={styles.genre}>{g.name}</span>
                ))}
              </div>
            )}

            {/* List status */}
            {isAuthenticated && (
              <div className={styles.listControl}>
                <select
                  className={styles.listSelect}
                  value={listStatus}
                  onChange={e => handleListChange(e.target.value)}
                >
                  <option value="">— Добавить в список —</option>
                  {LIST_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Description */}
            {descParagraphs.length > 0 && (
              <div className={styles.descWrap}>
                <div className={`${styles.desc} ${showFullDesc ? styles.descFull : ''}`}>
                  {descParagraphs.map((p, i) => <p key={i}>{p}</p>)}
                </div>
                {anime.description && anime.description.length > 300 && (
                  <button className={styles.descToggle} onClick={() => setShowFullDesc(v => !v)}>
                    {showFullDesc ? 'Скрыть ↑' : 'Показать полностью ↓'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Player Section ─── */}
      <div className={styles.playerSection} ref={playerRef}>
        <div className={styles.playerInner}>
          <h2 className={styles.sectionTitle}>Смотреть онлайн</h2>

          {episodesLoading ? (
            <div className={styles.playerSkeleton}>
              <div className={styles.skeletonPlayer} />
            </div>
          ) : sources.length === 0 ? (
            <div className={styles.noPlayer}>
              Видео не найдено. Попробуйте позже.
            </div>
          ) : (
            <div className={styles.playerLayout}>
              {/* Episode list */}
              <div className={styles.episodes}>
                <div className={styles.episodesTitle}>Серии ({episodes.length})</div>
                <div className={styles.episodeGrid}>
                  {episodes.map(ep => (
                    <button
                      key={ep}
                      className={`${styles.epBtn} ${ep === selectedEp ? styles.epActive : ''}`}
                      onClick={() => handleEpisodeSelect(ep)}
                    >
                      {ep}
                    </button>
                  ))}
                </div>
              </div>

              {/* Video */}
              <div className={styles.videoWrap}>
                {currentSource && (
                  <>
                    <div className={styles.nowPlaying}>
                      Серия {selectedEp} · AniLibria
                    </div>
                    <HlsPlayer
                      src={currentSource.playerUrl}
                      onTimeUpdate={handleTimeUpdate}
                      initialTime={savedTime}
                    />
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Comments ─── */}
      <div className={styles.commentsSection}>
        <div className={styles.commentsInner}>
          <h2 className={styles.sectionTitle}>Комментарии ({comments.length})</h2>

          {isAuthenticated ? (
            <div className={styles.commentForm}>
              <textarea
                className={styles.commentInput}
                placeholder="Напишите комментарий..."
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                rows={3}
              />
              <button
                className={styles.commentSubmit}
                onClick={handleCommentSubmit}
                disabled={!commentText.trim()}
              >
                Отправить
              </button>
            </div>
          ) : (
            <p className={styles.loginPrompt}>
              <a href="/login">Войдите</a>, чтобы оставить комментарий
            </p>
          )}

          <div className={styles.commentList}>
            {comments.map(c => (
              <div key={c.id} className={styles.comment}>
                <div className={styles.commentAvatar}>
                  {c.avatar
                    ? <img src={c.avatar} alt={c.username} />
                    : <span>{c.username?.[0]?.toUpperCase()}</span>
                  }
                </div>
                <div className={styles.commentBody}>
                  <div className={styles.commentMeta}>
                    <span className={styles.commentUser}>{c.username}</span>
                    <span className={styles.commentDate}>
                      {new Date(c.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <p className={styles.commentText}>{c.text}</p>
                </div>
              </div>
            ))}
            {comments.length === 0 && (
              <p className={styles.noComments}>Комментариев пока нет. Будьте первым!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
