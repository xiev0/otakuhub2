// services/kodik.ts
const KODIK_API_BASE = 'https://kodik-api.com';
const KODIK_TOKEN = process.env.KODIK_TOKEN!; // положи токен в .env, не хардкодь в код

interface KodikTranslation {
    id: number;
    title: string;
    type: 'voice' | 'subtitles';
}

interface RawKodikResult {
    id: string;
    type: string; // 'anime-serial' | 'anime' | 'foreign-serial' и т.д.
    link: string; // протокол-независимая ссылка //kodikplayer.com/...
    title: string;
    title_orig: string;
    other_title?: string;
    translation: KodikTranslation;
    year: number;
    last_season?: number;
    last_episode?: number;
    episodes_count?: number;
    shikimori_id?: string;
    kinopoisk_id?: string;
    imdb_id?: string;
    quality: string;
    screenshots: string[];
}

interface KodikSearchResponse {
    time: string;
    total: number;
    results: RawKodikResult[];
}

export interface KodikSource {
    id: string;
    playerUrl: string; // уже с https:, готово для iframe src
    translation: string;
    translationType: 'voice' | 'subtitles';
    episodesCount: number;
    quality: string;
    screenshots: string[];
}

function mapKodikResult(r: RawKodikResult): KodikSource {
    return {
        id: r.id,
        playerUrl: r.link.startsWith('//') ? `https:${r.link}` : r.link,
        translation: r.translation?.title ?? '',
        translationType: r.translation?.type ?? 'voice',
        episodesCount: r.episodes_count ?? 0,
        quality: r.quality ?? '',
        screenshots: r.screenshots ?? [],
    };
}

/** Возвращает все доступные озвучки/варианты плеера для тайтла по Шикимори id */
export async function getKodikSourcesByShikimoriId(shikimoriId: number | string): Promise<KodikSource[]> {
    try {
        const u = new URL(`${KODIK_API_BASE}/search`);
        u.searchParams.set('token', KODIK_TOKEN);
        u.searchParams.set('shikimori_id', String(shikimoriId));

        const res = await fetch(u.toString(), { signal: AbortSignal.timeout(8000) });
        if (!res.ok) throw new Error(`Kodik API ${res.status}: ${res.statusText}`);

        const data: KodikSearchResponse = await res.json();
        return (data.results ?? []).map(mapKodikResult);
    } catch (e) {
        console.error('Kodik getKodikSourcesByShikimoriId error:', e);
        return [];
    }
}

/** Удобный шорткат — просто первый доступный источник, если не важен выбор озвучки */
export async function getKodikPlayerUrl(shikimoriId: number | string): Promise<string | null> {
    const sources = await getKodikSourcesByShikimoriId(shikimoriId);
    return sources[0]?.playerUrl ?? null;
}