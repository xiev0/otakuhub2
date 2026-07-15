const API_BASE = 'https://shikimori.io';

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
    kind: string; // 'tv' | 'movie' | 'ova' | 'ona' | 'special' и т.д.
    score: string; // важно: это СТРОКА, не число!
    status: string; // 'released' | 'ongoing' | 'anons'
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

//Получение фильмов
export async function getMovie(limit = 12): Promise<any[]> {
    try {
        const data = await fetchJson<any>(`${API_BASE}/api/animes`, {
            limit: String(limit),
            kind: 'movie',
        });
        return Array.isArray(data) ? data : (data?.list ?? []);
    } catch (e) {
        console.error('Shikimori getMovie error:', e);
        return [];
    }
}
