const API_BASE = 'https://shikimori.io';
const IMAGE_BASE = 'https://shikimori.io';

// Общий формат для фронта
interface AnimeRelease {
    id: number | string;
    title: string;
    titleRussian: string;
    poster: string | null;
    url: string;
    kind: string;
    score: number;
    status: string;
    isOngoing: boolean;
    episodesTotal: number;
    episodesAired: number;
    airedOn: string | null;
    releasedOn: string | null;
    source: 'shikimori' | 'anilibria';
}

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
    score: string; // строка!
    status: string;
    episodes: number;
    episodes_aired: number;
    aired_on: string | null;
    released_on: string | null;
}

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

export function mapShikimoriRelease(r: RawShikimoriAnime): AnimeRelease {
    return {
        id: r.id,
        title: r.name,
        titleRussian: r.russian ?? '',
        poster: r.image?.original ? `${IMAGE_BASE}${r.image.original}` : null,
        url: r.url ?? '',
        kind: r.kind ?? '',
        score: r.score ? Number(r.score) : 0,
        status: r.status ?? '',
        isOngoing: r.status === 'ongoing',
        episodesTotal: r.episodes ?? 0,
        episodesAired: r.episodes_aired ?? 0,
        airedOn: r.aired_on,
        releasedOn: r.released_on,
        source: 'shikimori',
    };
}

// Получение фильмов
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