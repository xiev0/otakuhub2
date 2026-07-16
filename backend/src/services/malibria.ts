interface MalibriaEntry {
    anilibria_id: number;
    myanimelist_id: number;
}

const MALIBRIA_URL = 'https://raw.githubusercontent.com/qt-kaneko/MALibria/db/mapped.json';
const CACHE_TTL = 1000 * 60 * 60 * 24; // сутки

let cache: MalibriaEntry[] | null = null;
let cacheTimestamp = 0;

async function getDb(): Promise<MalibriaEntry[]> {
    const now = Date.now();
    if (cache && now - cacheTimestamp < CACHE_TTL) return cache;

    const res = await fetch(MALIBRIA_URL, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`MALibria DB fetch failed: ${res.status}`);

    cache = await res.json();
    cacheTimestamp = now;
    return cache!;
}

/** Возвращает AniLibria id по Шикимори/MAL id, либо null, если тайтла нет на AniLibria */
export async function getAnilibriaIdByShikimori(shikimoriId: number): Promise<number | null> {
    try {
        const db = await getDb();
        const entry = db.find(e => e.myanimelist_id === shikimoriId);
        return entry?.anilibria_id ?? null;
    } catch (e) {
        console.error('MALibria getAnilibriaIdByShikimori error:', e);
        return null; // если база недоступна — просто считаем, что AniLibria не резолвится
    }
}