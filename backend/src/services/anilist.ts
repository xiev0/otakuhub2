const ANILIST_URL = 'https://graphql.anilist.co';

interface AniListCoverImage {
    extraLarge: string | null;
    large: string | null;
}

interface AniListMediaResponse {
    data: Record<string, { coverImage: AniListCoverImage } | null>;
}

function buildBatchQuery(malIds: number[]): { query: string; variables: Record<string, number> } {
    const variables: Record<string, number> = {};
    const fields = malIds.map((id, i) => {
        const alias = `m${i}`;
        variables[alias] = id;
        return `${alias}: Media(idMal: $${alias}, type: ANIME) { coverImage { extraLarge large } }`;
    });

    const query = `
    query (${malIds.map((_, i) => `$m${i}: Int`).join(', ')}) {
      ${fields.join('\n')}
    }
  `;

    return { query, variables };
}

async function fetchAniListBatch(malIds: number[]): Promise<Map<number, string | null>> {
    const result = new Map<number, string | null>();
    if (malIds.length === 0) return result;

    const { query, variables } = buildBatchQuery(malIds);

    try {
        const res = await fetch(ANILIST_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ query, variables }),
            signal: AbortSignal.timeout(8000),
        });

        if (!res.ok) {
            console.error(`AniList API ${res.status}: ${res.statusText}`);
            return result;
        }

        const json: AniListMediaResponse = await res.json();

        for (const [alias, media] of Object.entries(json.data)) {
            const idx = Number(alias.replace('m', ''));
            const malId = malIds[idx];
            const cover = media?.coverImage?.extraLarge ?? media?.coverImage?.large ?? null;
            result.set(malId, cover);
        }
    } catch (e) {
        console.error('AniList fetchAniListBatch error:', e);
    }

    return result;
}

const CHUNK_SIZE = 25;

export async function getAniListCovers(malIds: number[]): Promise<Map<number, string | null>> {
    const result = new Map<number, string | null>();
    const uniqueIds = [...new Set(malIds)];

    for (let i = 0; i < uniqueIds.length; i += CHUNK_SIZE) {
        const chunk = uniqueIds.slice(i, i + CHUNK_SIZE);
        const chunkResult = await fetchAniListBatch(chunk);
        chunkResult.forEach((v, k) => result.set(k, v));
    }

    return result;
}