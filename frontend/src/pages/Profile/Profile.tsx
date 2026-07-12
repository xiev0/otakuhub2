import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setUser, logout } from '../../store/authSlice';
import { authApi, userApi, type AnimeListEntry, type WatchHistoryEntry } from '../../services/api';
import styles from './Profile.module.css';

const LIST_LABELS: Record<string, string> = {
  watching: 'Смотрю',
  planned: 'Запланировано',
  completed: 'Просмотрено',
  on_hold: 'Отложено',
  dropped: 'Брошено',
};

type Tab = 'lists' | 'history' | 'settings';

export default function Profile() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAppSelector(s => s.auth);

  const [tab, setTab] = useState<Tab>('lists');
  const [listFilter, setListFilter] = useState('watching');
  const [lists, setLists] = useState<AnimeListEntry[]>([]);
  const [history, setHistory] = useState<WatchHistoryEntry[]>([]);
  const [listsLoading, setListsLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Settings state
  const [bio, setBio] = useState(user?.bio ?? '');
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState('');
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [pwdMsg, setPwdMsg] = useState('');

  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
  }, [isAuthenticated]);

  useEffect(() => {
    if (!user) return;
    setBio(user.bio ?? '');
  }, [user]);

  useEffect(() => {
    if (tab !== 'lists') return;
    setListsLoading(true);
    userApi.getLists(listFilter)
      .then(setLists)
      .catch(console.error)
      .finally(() => setListsLoading(false));
  }, [tab, listFilter]);

  useEffect(() => {
    if (tab !== 'history') return;
    setHistoryLoading(true);
    userApi.getHistory()
      .then(setHistory)
      .catch(console.error)
      .finally(() => setHistoryLoading(false));
  }, [tab]);

  const handleSaveProfile = async () => {
    setSettingsSaving(true);
    setSettingsMsg('');
    try {
      const updated = await authApi.updateProfile({ bio });
      dispatch(setUser(updated));
      setSettingsMsg('✓ Профиль сохранён');
    } catch (e: any) {
      setSettingsMsg(`✗ ${e.message}`);
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPwd || !newPwd) return;
    setPwdMsg('');
    try {
      await authApi.changePassword(oldPwd, newPwd);
      setPwdMsg('✓ Пароль успешно изменён');
      setOldPwd('');
      setNewPwd('');
    } catch (e: any) {
      setPwdMsg(`✗ ${e.message}`);
    }
  };

  const handleDeleteHistory = async (id: number) => {
    await userApi.deleteHistory(id).catch(console.error);
    setHistory(prev => prev.filter(h => h.id !== id));
  };

  if (!user) return null;

  const progressPercent = (h: WatchHistoryEntry) =>
    h.duration > 0 ? Math.round((h.currentTime / h.duration) * 100) : 0;

  return (
    <div className={styles.page}>
      {/* ─── Profile Header ─── */}
      <div className={styles.profileHeader}>
        <div className={styles.profileHeaderInner}>
          <div className={styles.avatarWrap}>
            {user.avatar
              ? <img src={user.avatar} alt={user.username} className={styles.avatar} />
              : <div className={styles.avatarFallback}>{user.username[0].toUpperCase()}</div>
            }
          </div>
          <div className={styles.profileInfo}>
            <h1 className={styles.username}>{user.username}</h1>
            {user.bio && <p className={styles.bio}>{user.bio}</p>}
            <div className={styles.profileMeta}>
              {user.createdAt && (
                <span>На сайте с {new Date(user.createdAt).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}</span>
              )}
              {user.isStaff && <span className={styles.staffBadge}>Администратор</span>}
            </div>
          </div>
          <button className={styles.logoutBtn} onClick={() => { dispatch(logout()); navigate('/'); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Выйти
          </button>
        </div>
      </div>

      {/* ─── Tabs ─── */}
      <div className={styles.tabsBar}>
        <div className={styles.tabsInner}>
          {(['lists', 'history', 'settings'] as Tab[]).map(t => (
            <button
              key={t}
              className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
              onClick={() => setTab(t)}
            >
              {t === 'lists' ? 'Список аниме' : t === 'history' ? 'История просмотра' : 'Настройки'}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Content ─── */}
      <div className={styles.content}>

        {/* LISTS TAB */}
        {tab === 'lists' && (
          <div className={styles.listsTab}>
            <div className={styles.filterRow}>
              {Object.entries(LIST_LABELS).map(([val, label]) => (
                <button
                  key={val}
                  className={`${styles.filterBtn} ${listFilter === val ? styles.filterActive : ''}`}
                  onClick={() => setListFilter(val)}
                >
                  {label}
                </button>
              ))}
            </div>

            {listsLoading ? (
              <div className={styles.listGrid}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className={styles.skeletonCard} />
                ))}
              </div>
            ) : lists.length === 0 ? (
              <div className={styles.empty}>
                Список «{LIST_LABELS[listFilter]}» пуст
              </div>
            ) : (
              <div className={styles.listGrid}>
                {lists.map(entry => (
                  <a key={entry.id} href={`/anime/${entry.releaseId}`} className={styles.listCard}>
                    {entry.releasePoster
                      ? <img src={entry.releasePoster} alt={entry.releaseTitle} className={styles.listPoster} />
                      : <div className={styles.listNoPoster} />
                    }
                    <div className={styles.listInfo}>
                      <span className={styles.listTitle}>{entry.releaseTitle || `Аниме #${entry.releaseId}`}</span>
                      {entry.score && (
                        <span className={styles.listScore}>★ {entry.score}</span>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* HISTORY TAB */}
        {tab === 'history' && (
          <div className={styles.historyTab}>
            {historyLoading ? (
              <div className={styles.historyList}>
                {Array.from({ length: 6 }).map((_, i) => <div key={i} className={styles.skeletonRow} />)}
              </div>
            ) : history.length === 0 ? (
              <div className={styles.empty}>История просмотра пуста</div>
            ) : (
              <div className={styles.historyList}>
                {history.map(h => (
                  <div key={h.id} className={styles.historyItem}>
                    <a href={`/anime/${h.releaseId}`} className={styles.historyLeft}>
                      {h.releasePoster
                        ? <img src={h.releasePoster} alt={h.releaseTitle} className={styles.historyPoster} />
                        : <div className={styles.historyNoPoster} />
                      }
                      <div className={styles.historyInfo}>
                        <span className={styles.historyTitle}>{h.releaseTitle || `Аниме #${h.releaseId}`}</span>
                        <span className={styles.historyMeta}>
                          Серия {h.episodeOrdinal} · {Math.floor(h.currentTime / 60)}:{String(Math.floor(h.currentTime % 60)).padStart(2, '0')}
                        </span>
                        <div className={styles.progressBar}>
                          <div className={styles.progressFill} style={{ width: `${progressPercent(h)}%` }} />
                        </div>
                        <span className={styles.historyDate}>
                          {new Date(h.updatedAt).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                    </a>
                    <button className={styles.deleteBtn} onClick={() => handleDeleteHistory(h.id)} title="Удалить">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SETTINGS TAB */}
        {tab === 'settings' && (
          <div className={styles.settingsTab}>
            <div className={styles.settingsBlock}>
              <h2 className={styles.settingsTitle}>Профиль</h2>
              <div className={styles.settingsField}>
                <label className={styles.settingsLabel}>Биография</label>
                <textarea
                  className={styles.settingsTextarea}
                  rows={4}
                  placeholder="Расскажите о себе..."
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  maxLength={500}
                />
                <span className={styles.charCount}>{bio.length}/500</span>
              </div>
              {settingsMsg && (
                <p className={settingsMsg.startsWith('✓') ? styles.successText : styles.errorText}>
                  {settingsMsg}
                </p>
              )}
              <button className={styles.saveBtn} onClick={handleSaveProfile} disabled={settingsSaving}>
                {settingsSaving ? 'Сохраняем...' : 'Сохранить'}
              </button>
            </div>

            <div className={styles.settingsBlock}>
              <h2 className={styles.settingsTitle}>Смена пароля</h2>
              <div className={styles.settingsField}>
                <label className={styles.settingsLabel}>Текущий пароль</label>
                <input type="password" className={styles.settingsInput} value={oldPwd}
                  onChange={e => setOldPwd(e.target.value)} placeholder="Текущий пароль" />
              </div>
              <div className={styles.settingsField}>
                <label className={styles.settingsLabel}>Новый пароль</label>
                <input type="password" className={styles.settingsInput} value={newPwd}
                  onChange={e => setNewPwd(e.target.value)} placeholder="Минимум 8 символов" />
              </div>
              {pwdMsg && (
                <p className={pwdMsg.startsWith('✓') ? styles.successText : styles.errorText}>
                  {pwdMsg}
                </p>
              )}
              <button className={styles.saveBtn} onClick={handleChangePassword} disabled={!oldPwd || !newPwd}>
                Изменить пароль
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
