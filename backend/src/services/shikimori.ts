// ---------- Конфигурация ----------
const API_BASE = 'https://shikimori.io';
const IMAGE_BASE = 'https://shikimori.io';

// ---------- Общий формат для фронта (должен совпадать с AnimeRelease из api.ts) ----------
import type { AnimeRelease } from '../types'; // путь подставь свой реальный

// ---------- Сырые типы: список (/api/animes) ----------
interface ShikimoriImage {
    original: string;
    preview: string;
    x96: string;
    x48: string;
}

interface RawShikimoriAnime {
    id: number;
    name: string;
    russian: string;
    image: ShikimoriImage;
    url: string;
    kind: string;
    score: string;
    status: string;
    episodes: number;
    episodes_aired: number;
    aired_on: string | null;
    released_on: string | null;
}

// ---------- Сырые типы: детальная карточка (/api/animes/:id) ----------
interface RawShikimoriGenre {
    id: number;
    name: string;
    russian: string;
    kind: string;
}

interface RawShikimoriStudio {
    id: number;
    name: string;
    filtered_name: string;
    real: boolean;
    image: string | null;
}

interface RawShikimoriAnimeDetail extends RawShikimoriAnime {
    rating: string;
    description: string | null;
    genres: RawShikimoriGenre[];
    studios: RawShikimoriStudio[];
    duration: number;
    franchise: string | null;
}

// ---------- Обёртка над fetch ----------
async function fetchJson<T>(url: string, params?: Record<string, string>): Promise<T> {
    const u = new URL(url);
    if (params) Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v));
    const res = await fetch(u.toString(), {
        headers: { 'User-Agent': 'OtakuHub/2.0' },
        signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Shikimori API ${res.status}: ${res.statusText}`);
    return res.json() as Promise<T>;
}

// ---------- Мапперы ----------
function mapShikimoriRelease(r: RawShikimoriAnime): AnimeRelease {
    return {
        id: r.id,
        title: r.russian || r.name,
        titleEnglish: r.name ?? '',
        alias: r.url?.split('/').pop() ?? '',
        description: '',
        type: r.kind ?? '',
        year: r.aired_on ? new Date(r.aired_on).getFullYear() : null,
        season: '',
        poster: r.image?.original ? `${IMAGE_BASE}${r.image.original}` : null,
        isOngoing: r.status === 'ongoing',
        episodesTotal: r.episodes || null,
        episodesCount: r.episodes_aired ?? 0,
        favorites: 0,
        ageRating: '',
        genres: [],
        studios: [],
        shikimoriId: r.id,
        anilibriaId: undefined,
        episodes: [],
        videos: [],
        screenshots: [],
    };
}

function mapShikimoriDetail(r: RawShikimoriAnimeDetail): AnimeRelease {
    return {
        id: r.id,
        title: r.russian || r.name,
        titleEnglish: r.name ?? '',
        alias: r.url?.split('/').pop() ?? '',
        description: r.description ?? '',
        type: r.kind ?? '',
        year: r.aired_on ? new Date(r.aired_on).getFullYear() : null,
        season: '',
        poster: r.image?.original ? `${IMAGE_BASE}${r.image.original}` : null,
        isOngoing: r.status === 'ongoing',
        episodesTotal: r.episodes || null,
        episodesCount: r.episodes_aired ?? 0,
        favorites: 0,
        ageRating: r.rating ?? '',
        genres: (r.genres ?? []).map(g => ({ id: g.id, name: g.russian || g.name })),
        studios: (r.studios ?? []).map(s => ({ id: s.id, name: s.name })),
        shikimoriId: r.id,
        anilibriaId: undefined,
        episodes: [],
        videos: [],
        screenshots: [],
    };
}

// ---------- Публичные функции ----------
export async function getMovie(limit = 12): Promise<AnimeRelease[]> {
    try {
        const data = await fetchJson<RawShikimoriAnime[]>(`${API_BASE}/api/animes`, {
            limit: String(limit),
            kind: 'movie',
        });
        return Array.isArray(data) ? data.map(mapShikimoriRelease) : [];
    } catch (e) {
        console.error('Shikimori getMovie error:', e);
        return [];
    }
}

export async function getRandom(limit = 12): Promise<AnimeRelease[]> {
    try {
        const data = await fetchJson<RawShikimoriAnime[]>(`${API_BASE}/api/animes`, {
            limit: String(limit),
            order: 'random',
        });
        return Array.isArray(data) ? data.map(mapShikimoriRelease) : [];
    } catch (e) {
        console.error('Shikimori getRandom error:', e);
        return [];
    }
}

export async function getTitleById(id: number | string): Promise<AnimeRelease | null> {
    try {
        const data = await fetchJson<RawShikimoriAnimeDetail>(`${API_BASE}/api/animes/${id}`);
        return mapShikimoriDetail(data);
    } catch (e) {
        console.error('Shikimori getTitleById error:', e);
        return null;
    }
}