import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { logout } from '../../store/authSlice';
import { animeApi, type AnimeRelease } from '../../services/api';
import styles from './Header.module.css';

export default function Header() {
  const { user, isAuthenticated } = useAppSelector(s => s.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AnimeRelease[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    if (!query.trim()) { setResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      try {
        const data = await animeApi.search(query, 6);
        setResults(data);
      } catch {}
    }, 300);
  }, [query]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false);
        setResults([]);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const handleSearchSelect = (id: number) => {
    navigate(`/anime/${id}`);
    setQuery('');
    setResults([]);
    setShowSearch(false);
  };

  return (
      <header className={styles.header}>
        <div className={styles.inner}>
          {/* Logo */}
          <Link to="/" className={styles.logo}>
            Ani<span className={styles.logoAccent}>ki</span>
          </Link>

          {/* Search */}
          <div className={styles.searchWrap} ref={searchRef}>
            <div className={`${styles.searchBox} ${showSearch ? styles.searchActive : ''}`}>
              <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Поиск аниме..."
                  value={query}
                  onChange={e => { setQuery(e.target.value); setShowSearch(true); }}
                  onFocus={() => setShowSearch(true)}
              />
              {query && (
                  <button className={styles.searchClear} onClick={() => { setQuery(''); setResults([]); }}>✕</button>
              )}
            </div>

            {showSearch && results.length > 0 && (
                <div className={styles.searchDropdown}>
                  {results.map(r => (
                      <button key={r.id} className={styles.searchItem} onClick={() => handleSearchSelect(r.id)}>
                        {r.poster && <img src={r.poster} alt={r.title} className={styles.searchPoster} />}
                        <div className={styles.searchInfo}>
                          <span className={styles.searchTitle}>{r.title}</span>
                          <span className={styles.searchMeta}>{r.type} · {r.year ?? '—'}</span>
                        </div>
                      </button>
                  ))}
                </div>
            )}
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            {isAuthenticated && user ? (
                <div className={styles.userMenu} ref={userMenuRef}>
                  <button className={styles.avatarBtn} onClick={() => setUserMenuOpen(v => !v)}>
                    {user.avatar
                        ? <img src={user.avatar} alt={user.username} className={styles.avatar} />
                        : <div className={styles.avatarFallback}>{user.username[0].toUpperCase()}</div>
                    }
                    <span className={styles.username}>{user.username}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>

                  {userMenuOpen && (
                      <div className={styles.dropdown}>
                        <Link to="/profile" className={styles.dropItem} onClick={() => setUserMenuOpen(false)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                          </svg>
                          Профиль
                        </Link>
                        <button className={styles.dropItem} onClick={handleLogout}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                          </svg>
                          Выйти
                        </button>
                      </div>
                  )}
                </div>
            ) : (
                <>
                  <Link to="/login" className={styles.loginBtn}>Войти</Link>
                  <Link to="/register" className={styles.registerBtn}>Регистрация</Link>
                </>
            )}
          </div>
        </div>
      </header>
  );
}