import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  animeApi, userApi,
  type AnimeRelease, type PlayerSource, type KodikSource, type Comment,
} from '../../services/api';
import { useAppSelector } from '../../store/hooks';
import HlsPlayer from '../../components/player/HlsPlayer';
import styles from './AnimeDetail.module.css';

type SourceType = 'anilibria' | 'kodik';

export default function AnimeDetail() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAppSelector(s => s.auth);
  const [anime, setAnime] = useState<AnimeRelease | null>(null);

  // AniLibria
  const [anilibriaSources, setAnilibriaSources] = useState<PlayerSource[]>([]);
  const [selectedEp, setSelectedEp] = useState<number>(1);
  const [currentAnilibriaSource, setCurrentAnilibriaSource] = useState<PlayerSource | null>(null);

  // Kodik
  const [kodikSources, setKodikSources] = useState<KodikSource[]>([]);
  const [currentKodikSource, setCurrentKodikSource] = useState<KodikSource | null>(null);

  // какой источник сейчас активен
  const [activeSource, setActiveSource] = useState<SourceType | null>(null);

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [listStatus, setListStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [savedTime, setSavedTime] = useState(0);
  const playerRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!id) return;
    window.scrollTo(0, 0);
    setLoading(true);
    setAnime(null);
    setAnilibriaSources([]);
    setKodikSources([]);
    setCurrentAnilibriaSource(null);
    setCurrentKodikSource(null);
    setActiveSource(null);

    animeApi.getRelease(id).then(data => {
      setAnime(data);
      setLoading(false);

      setEpisodesLoading(true);
      animeApi.getEpisodes(data.id).then(res => {
        const ani = res.anilibria ?? [];
        const kod = res.kodik ?? [];
        setAnilibriaSources(ani);
        setKodikSources(kod);

        // приоритет: AniLibria, если есть, иначе Kodik — источник по умолчанию
        if (ani.length) {
          setActiveSource('anilibria');
          setSelectedEp(ani[0].episodeNumber);
          setCurrentAnilibriaSource(ani[0]);
        } else if (kod.length) {
          setActiveSource('kodik');
          setCurrentKodikSource(kod[0]);
        }
      }).catch(console.error)
          .finally(() => setEpisodesLoading(false));

      animeApi.getComments(data.id).then(setComments).catch(console.error);
    }).catch(e => {
      console.error(e);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (!isAuthenticated || !anime) return;
    userApi.getLists().then(lists => {
      const entry = lists.find(e => e.releaseId === anime.id);
      if (entry) setListStatus(entry.status);
    }).catch(console.error);
  }, [isAuthenticated, anime]);

  const handleEpisodeSelect = (ep: number) => {
    const src = anilibriaSources.find(s => s.episodeNumber === ep);
    if (src) {
      setSelectedEp(ep);
      setCurrentAnilibriaSource(src);
      setSavedTime(0);
      playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleKodikTranslationSelect = (source: KodikSource) => {
    setCurrentKodikSource(source);
  };

  const handleTimeUpdate = useCallback((currentTime: number, duration: number) => {
    if (!isAuthenticated || !anime || !currentAnilibriaSource) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      userApi.updateProgress({
        release_id: anime.id,
        release_title: anime.title,
        release_poster: anime.poster,
        episode_id: currentAnilibriaSource.id,
        episode_ordinal: currentAnilibriaSource.episodeNumber,
        current_time: currentTime,
        duration,
      }).catch(console.error);
    }, 5000);
  }, [isAuthenticated, anime, currentAnilibriaSource]);

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

  const episodes = [...new Set(anilibriaSources.map(s => s.episodeNumber))].sort((a, b) => a - b);
  const hasAnilibria = anilibriaSources.length > 0;
  const hasKodik = kodikSources.length > 0;

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
            <div className={styles.posterWrap}>
              {anime.poster
                  ? <img src={anime.poster} alt={anime.title} className={styles.poster} />
                  : <div className={styles.noPoster} />
              }
            </div>
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
            ) : !hasAnilibria && !hasKodik ? (
                <div className={styles.noPlayer}>
                  Видео не найдено. Попробуйте позже.
                </div>
            ) : (
                <>
                  {/* Переключатель источников — только если оба доступны */}
                  {hasAnilibria && hasKodik && (
                      <div className={styles.sourceSwitch}>
                        <button
                            className={`${styles.sourceBtn} ${activeSource === 'anilibria' ? styles.sourceActive : ''}`}
                            onClick={() => setActiveSource('anilibria')}
                        >
                          AniLibria
                        </button>
                        <button
                            className={`${styles.sourceBtn} ${activeSource === 'kodik' ? styles.sourceActive : ''}`}
                            onClick={() => setActiveSource('kodik')}
                        >
                          Kodik
                        </button>
                      </div>
                  )}

                  {activeSource === 'anilibria' && (
                      <div className={styles.playerLayout}>
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
                        <div className={styles.videoWrap}>
                          {currentAnilibriaSource && (
                              <>
                                <div className={styles.nowPlaying}>
                                  Серия {selectedEp} · AniLibria
                                </div>
                                <HlsPlayer
                                    src={currentAnilibriaSource.playerUrl}
                                    onTimeUpdate={handleTimeUpdate}
                                    initialTime={savedTime}
                                />
                              </>
                          )}
                        </div>
                      </div>
                  )}

                  {activeSource === 'kodik' && (
                      <div className={styles.playerLayout}>
                        <div className={styles.episodes}>
                          <div className={styles.episodesTitle}>Озвучки ({kodikSources.length})</div>
                          <div className={styles.translationList}>
                            {kodikSources.map(s => (
                                <button
                                    key={s.id}
                                    className={`${styles.translationBtn} ${currentKodikSource?.id === s.id ? styles.epActive : ''}`}
                                    onClick={() => handleKodikTranslationSelect(s)}
                                >
                                  {s.translation}
                                  {s.translationType === 'subtitles' && ' (суб.)'}
                                </button>
                            ))}
                          </div>
                        </div>
                        <div className={styles.videoWrap}>
                          {currentKodikSource && (
                              <>
                                <div className={styles.nowPlaying}>
                                  {currentKodikSource.translation} · Kodik · {currentKodikSource.quality}
                                </div>
                                <iframe
                                    key={currentKodikSource.id}
                                    src={currentKodikSource.playerUrl}
                                    className={styles.kodikFrame}
                                    allow="autoplay; fullscreen"
                                    allowFullScreen
                                    frameBorder={0}
                                />
                              </>
                          )}
                        </div>
                      </div>
                  )}
                </>
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