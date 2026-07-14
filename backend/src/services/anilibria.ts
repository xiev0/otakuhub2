const API_BASE = "https://anilibria.top/api/v1";
const SITE_BASE = 'https://anilibria.top';

interface RawEpisode {
  id: string;
  name: string | null;
  name_english: string | null;
  ordinal: number;
  duration: number | null;
  opening: { start: number; stop: number } | null;
  ending: { start: number; stop: number } | null;
  preview: {
    src: string;
    optimized?: { preview?: string };
  } | null;
  hls_480: string | null;
  hls_720: string | null;
  hls_1080: string | null;
}

interface PlayerSource {
  id: string;
  shikimoriId: number;
  episodeNumber: number;
  name: string | null;
  playerUrl: string;
  hls: { fhd: string | null; hd: string | null; sd: string | null };
  preview: string | null;
  duration: number | null;
  skips: {
    opening?: [number, number];
    ending?: [number, number];
  };
  quality: string;
  translation: string;
  player_type: 'HLS';
}

interface Genre {
  id: number;
  name: string;
}

async function fetchJson<T>(url: string, params?: Record<string, string>): Promise<T> {
  const u = new URL(url);
  if (params) Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v));
  const res = await fetch(u.toString(), {
    headers: { 'User-Agent': 'OtakuHub/2.0' },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`AniLibria API ${res.status}: ${res.statusText}`);
  return res.json() as Promise<T>;
}

/** Последние релизы */
export async function getLatestReleases(limit = 12): Promise<any[]> {
  try {
    const data = await fetchJson<any>(`${API_BASE}/anime/releases/latest`, {
      limit: String(limit),
    });
    return Array.isArray(data) ? data : (data?.list ?? []);
  } catch (e) {
    console.error('AniLibria getLatestReleases error:', e);
    return [];
  }
}

/** Рекомендованные релизы */
export async function getRecommendedReleases(limit = 12): Promise<any[]> {
  try {
    const data = await fetchJson<any>(`${API_BASE}/anime/releases/recommended`, {
      limit: String(limit),
    });
    return Array.isArray(data) ? data : (data?.list ?? []);
  } catch (e) {
    console.error('AniLibria getLatestReleases error:', e);
    return [];
  }
}

/** Рандомные релизы */
export async function getRandomReleases(limit = 12): Promise<any[]> {
  try {
    const data = await fetchJson<any>(`${API_BASE}/anime/releases/random`, {
      limit: String(limit),
    });
    return Array.isArray(data) ? data : (data?.list ?? []);
  } catch (e) {
    console.error('AniLibria getLatestReleases error:', e);
    return [];
  }
}

/** Get schedule (for this week) */
export async function getSchedule(): Promise<any[]> {
  try {
    const data = await fetchJson<any>(
      `${API_BASE}/anime/schedule/now?include=id%2Ctype.genres&exclude=poster%2Cdescription`
    );
    return Array.isArray(data) ? data : (data?.list ?? []);
  } catch (e) {
    console.error('AniLibria getSchedule error:', e);
    return [];
  }
}

/** Get a single title by its AniLibria ID */
export async function getTitleById(id: number | string): Promise<any | null> {
  try {
    return await fetchJson<any>(`${API_BASE}/anime/releases/${id}`);
  } catch (e) {
    console.error('AniLibria getTitleById error:', e);
    return null;
  }
}

/** Search by text query */
export async function searchTitles(query: string, limit = 10): Promise<any[]> {
  try {
    const data = await fetchJson<any>(`${API_BASE}/app/search/releases`, {
      query,
      limit: String(limit),
    });
    return Array.isArray(data) ? data : (data?.list ?? []);
  } catch (e) {
    console.error('AniLibria searchTitles error:', e);
    return [];
  }
}

/** Get all titles (paginated, for catalog) */
export async function getTitles(page = 1, limit = 12): Promise<{ data: any[]; total: number }> {
  try {
    const data = await fetchJson<any>(`${API_BASE}/anime/releases`, {
      page: String(page),
      limit: String(limit),
    });
    return {
      data: Array.isArray(data) ? data : (data?.list ?? []),
      total: data?.pagination?.total ?? data?.meta?.total ?? 0,
    };
  } catch (e) {
    console.error('AniLibria getTitles error:', e);
    return { data: [], total: 0 };
  }
}

/** Get HLS episodes directly from AniLibria title ID */
export async function getHlsEpisodesByAnilibriaId(releaseId: number): Promise<PlayerSource[]> {
  const title = await getTitleById(releaseId);
  if (!title || !Array.isArray(title.episodes)) return [];

  const rawEpisodes = title.episodes as RawEpisode[];

  return rawEpisodes
    .map((ep) => {
      const fhd = ep.hls_1080 ?? null;
      const hd = ep.hls_720 ?? null;
      const sd = ep.hls_480 ?? null;
      const bestUrl = fhd ?? hd ?? sd ?? '';

      const previewPath = ep.preview?.optimized?.preview ?? ep.preview?.src ?? null;

      return {
        id: `anilibria_${releaseId}_${ep.ordinal}`,
        shikimoriId: releaseId,
        episodeNumber: Number(ep.ordinal),
        name: ep.name,
        playerUrl: bestUrl,
        hls: { fhd, hd, sd },
        preview: previewPath ? `${SITE_BASE}${previewPath}` : null,
        duration: ep.duration,
        skips: {
          opening: ep.opening ? ([ep.opening.start, ep.opening.stop] as [number, number]) : undefined,
          ending: ep.ending ? ([ep.ending.start, ep.ending.stop] as [number, number]) : undefined,
        },
        quality: 'FHD',
        translation: 'AniLibria',
        player_type: 'HLS' as const,
      };
    })
    .filter((s) => s.playerUrl)
    .sort((a, b) => a.episodeNumber - b.episodeNumber);
}

/** Map AniLibria release to our standard AnimeRelease shape */
export function mapRelease(r: any) {
  const poster = r.poster?.optimized?.preview ? SITE_BASE + r.poster.optimized.preview : null;

  return {
    id: r.id,
    title: r.name?.main ?? r.name?.english ?? String(r.id),
    titleEnglish: r.name?.english ?? '',
    alias: r.alias ?? '',
    description: r.description ?? '',
    type: r.type?.description ?? r.type?.string ?? 'ТВ Сериал',
    year: r.year ?? null,
    season: r.season?.description ?? '',
    poster,
    isOngoing: r.is_ongoing,
    episodesTotal: r.episodes_total ?? null,
    episodesCount: r.episodes_total ?? (Array.isArray(r.episodes) ? r.episodes.length : 0),
    favorites: r.added_in_users_favorites ?? 0,
    ageRating: r.age_rating?.label ?? '',
    genres: ((r.genres ?? []) as Genre[]).map((g) => ({
      id: g.id,
      name: g.name,
    })),
    studios: [],
    shikimoriId: null,
    anilibriaId: r.id,
    episodes: [],
    videos: [],
    screenshots: [],
  };
}