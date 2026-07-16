import { resolvePosters } from './posters';

const API_BASE = 'https://shikimori.io';
const IMAGE_BASE = 'https://shikimori.io';

// ---------- Общий формат (должен быть идентичен AnimeRelease из frontend/src/services/api.ts) ----------
export interface AnimeRelease {
    id: number;
    title: string;
    titleEnglish: string;
    alias: string;
    description: string;
    type: string;
    year: number | null;
    season: string;
    poster: string | null;
    isOngoing: boolean;
    episodesTotal: number | null;
    episodesCount: number;
    favorites: number;
    ageRating: string;
    genres: { id: number; name: string }[];
    studios: { id: number; name: string }[];
    shikimoriId?: number | null;
    anilibriaId?: number;
    episodes: any[];
    videos: any[];
    screenshots: any[];
}

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

// ---------- fetch-обёртка ----------
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

/** Общий шаг: смапить список + подтянуть постеры с AniList поверх */
async function mapListWithPosters(raw: RawShikimoriAnime[]): Promise<AnimeRelease[]> {
    const releases = raw.map(mapShikimoriRelease);
    const posters = await resolvePosters(raw.map(r => r.id));
    return releases.map(r => ({
        ...r,
        poster: posters.get(r.id as number) ?? r.poster,
    }));
}

// ---------- Публичные функции ----------
export async function getMovie(limit = 12): Promise<AnimeRelease[]> {
    try {
        const raw = await fetchJson<RawShikimoriAnime[]>(`${API_BASE}/api/animes`, {
            limit: String(limit),
            kind: 'movie',
        });
        return Array.isArray(raw) ? await mapListWithPosters(raw) : [];
    } catch (e) {
        console.error('Shikimori getMovie error:', e);
        return [];
    }
}

export async function getPopular(limit = 12): Promise<AnimeRelease[]> {
    try {
        const raw = await fetchJson<RawShikimoriAnime[]>(`${API_BASE}/api/animes`, {
            limit: String(limit),
            order: 'popularity',
        });
        return Array.isArray(raw) ? await mapListWithPosters(raw) : [];
    } catch (e) {
        console.error('Shikimori getPopular error:', e);
        return [];
    }
}

export async function getRandom(limit = 12): Promise<AnimeRelease[]> {
    try {
        const raw = await fetchJson<RawShikimoriAnime[]>(`${API_BASE}/api/animes`, {
            limit: String(limit),
            order: 'random',
        });
        return Array.isArray(raw) ? await mapListWithPosters(raw) : [];
    } catch (e) {
        console.error('Shikimori getRandom error:', e);
        return [];
    }
}

export async function getLatest(limit = 12): Promise<AnimeRelease[]> {
    try {
        const raw = await fetchJson<RawShikimoriAnime[]>(`${API_BASE}/api/animes`, {
            limit: String(limit),
            order: 'updated_at', // проверь через curl — возможно "recently" или другое имя
            status: 'ongoing',
        });
        return Array.isArray(raw) ? await mapListWithPosters(raw) : [];
    } catch (e) {
        console.error('Shikimori getLatest error:', e);
        return [];
    }
}

export async function getSchedule(): Promise<AnimeRelease[]> {
    try {
        const raw = await fetchJson<any[]>(`${API_BASE}/api/calendar`);
        // /api/calendar отдаёт другой формат — { next_episode_at, anime: {...} }[], а не список Anime напрямую
        // нужно свериться через curl прежде чем писать маппинг
        const animeList = raw.map(item => item.anime).filter(Boolean);
        return await mapListWithPosters(animeList);
    } catch (e) {
        console.error('Shikimori getSchedule error:', e);
        return [];
    }
}

export async function searchTitles(query: string, limit = 10): Promise<AnimeRelease[]> {
    try {
        const raw = await fetchJson<RawShikimoriAnime[]>(`${API_BASE}/api/animes`, {
            search: query,
            limit: String(limit),
        });
        return Array.isArray(raw) ? await mapListWithPosters(raw) : [];
    } catch (e) {
        console.error('Shikimori searchTitles error:', e);
        return [];
    }
}

export async function getTitleById(id: number | string): Promise<AnimeRelease | null> {
    try {
        const raw = await fetchJson<RawShikimoriAnimeDetail>(`${API_BASE}/api/animes/${id}`);
        const release = mapShikimoriDetail(raw);
        const posters = await resolvePosters([raw.id]);
        return { ...release, poster: posters.get(raw.id) ?? release.poster };
    } catch (e) {
        console.error('Shikimori getTitleById error:', e);
        return null;
    }
}