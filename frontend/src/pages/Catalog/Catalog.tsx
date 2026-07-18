import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { animeApi, type AnimeRelease, type CatalogParams } from '../../services/api';
import styles from './Catalog.module.css';

export default function Catalog() {
  const [items, setItems] = useState<AnimeRelease[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [params, setParams] = useState<CatalogParams>({
    page: 1,
    limit: 24,
    order: 'popularity',
    kind: '',
    search: '',
  });

  const fetchItems = async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setItems([]); // Clear previous items when filters change
      }

      const data = await animeApi.getCatalog(params);
      
      if (data.length < (params.limit || 24)) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      setItems(prev => isLoadMore ? [...prev, ...data] : data);
    } catch (err) {
      console.error('Failed to fetch catalog', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchItems(params.page !== 1);
  }, [params]);

  const handleFilterChange = (key: keyof CatalogParams, value: string) => {
    setParams(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleLoadMore = () => {
    setParams(prev => ({ ...prev, page: (prev.page || 1) + 1 }));
  };

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.sidebar}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Поиск</label>
            <input 
              type="text" 
              className={styles.filterInput}
              placeholder="Название..."
              value={params.search || ''}
              onChange={e => handleFilterChange('search', e.target.value)}
            />
          </div>
          
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Сортировка</label>
            <select 
              className={styles.filterSelect}
              value={params.order || 'popularity'}
              onChange={e => handleFilterChange('order', e.target.value)}
            >
              <option value="popularity">По популярности</option>
              <option value="name">По алфавиту</option>
              <option value="aired_on">По дате выхода</option>
              <option value="random">Случайно</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Тип</label>
            <select 
              className={styles.filterSelect}
              value={params.kind || ''}
              onChange={e => handleFilterChange('kind', e.target.value)}
            >
              <option value="">Все типы</option>
              <option value="tv">TV Сериал</option>
              <option value="movie">Фильм</option>
              <option value="ova">OVA</option>
              <option value="ona">ONA</option>
              <option value="special">Спешл</option>
            </select>
          </div>
        </div>

        <div className={styles.content}>
          <h1 className={styles.title}>Каталог аниме</h1>
          
          {loading ? (
            <div className={styles.grid}>
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className={styles.skeletonCard} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className={styles.empty}>Ничего не найдено</div>
          ) : (
            <>
              <div className={styles.grid}>
                {items.map(r => (
                  <Link key={r.id} to={`/anime/${r.id}`} className={styles.card}>
                    <div className={styles.posterWrap}>
                      {r.poster ? (
                        <img src={r.poster} alt={r.title} className={styles.poster} />
                      ) : (
                        <div className={styles.noPoster} />
                      )}
                      <div className={styles.metaBadge}>{r.type} {r.year ? `· ${r.year}` : ''}</div>
                    </div>
                    <h3 className={styles.cardTitle}>{r.title}</h3>
                  </Link>
                ))}
              </div>
              
              {hasMore && (
                <button 
                  className={styles.loadMoreBtn} 
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? 'Загрузка...' : 'Показать еще'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
