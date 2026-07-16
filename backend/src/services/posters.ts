import { db, schema } from '../db/client';
import { inArray } from 'drizzle-orm';
import { getAniListCovers } from './anilist';

const CACHE_TTL_DAYS = 30;

export async function resolvePosters(malIds: number[]): Promise<Map<number, string | null>> {
    const result = new Map<number, string | null>();
    const uniqueIds = [...new Set(malIds)];
    if (uniqueIds.length === 0) return result;

    const cached = await db.select().from(schema.posterCache)
        .where(inArray(schema.posterCache.malId, uniqueIds));

    const now = Date.now();
    const staleAfter = CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;
    const freshIds = new Set<number>();

    for (const row of cached) {
        const isFresh = now - new Date(row.updatedAt!).getTime() < staleAfter;
        if (isFresh) {
            result.set(row.malId, row.posterUrl);
            freshIds.add(row.malId);
        }
    }

    const missingIds = uniqueIds.filter(id => !freshIds.has(id));
    if (missingIds.length === 0) return result;

    const fresh = await getAniListCovers(missingIds);

    for (const id of missingIds) {
        const url = fresh.get(id) ?? null;
        result.set(id, url);
        await db.insert(schema.posterCache)
            .values({ malId: id, posterUrl: url, updatedAt: new Date() })
            .onConflictDoUpdate({
                target: schema.posterCache.malId,
                set: { posterUrl: url, updatedAt: new Date() },
            });
    }

    return result;
}