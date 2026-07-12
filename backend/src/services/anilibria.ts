const API_BASE = "https://anilibria.top/api/v1";
const SITE_BASE = 'https://anilibria.top';

interface HlsEpisode {
  episode: number;
  hls_fhd: string | null;
  hls_hd: string | null;
  hls_sd: string | null;
  preview: string | null;
  translation: string;
}

interface PlayerSource {
  id: string;
  shikimoriId: number;
  episodeNumber: number;
  playerUrl: string;
  hls: { fhd: string | null; hd: string | null; sd: string | null };
  quality: string;
  translation: string;
  player_type: 'HLS';
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

/** Get latest releases (for home page) */
export async function getLatestReleases(limit = 12): Promise<any[]> {
  try {
    const data = await fetchJson<any>(
        `${API_BASE}/anime/releases/latest`,
        {
          limit: String(limit),
        }
    );
    return Array.isArray(data) ? data : (data?.list ?? []);
  } catch (e) {
    console.error('AniLibria getLatestReleases error:', e);
    return [];
  }
}

/** Get schedule (for this week) */
export async function getSchedule(): Promise<any[]> {
  try {
    const data = await fetchJson<any>(`${API_BASE}/anime/schedule/now?include=id%2Ctype.genres&exclude=poster%2Cdescription`);
    return Array.isArray(data) ? data : (data?.list ?? []);
  } catch {
    return [];
  }
}

/** Get a single title by its AniLibria ID */
export async function getTitleById(id: number | string): Promise<any | null> {
  try {
    return await fetchJson<any>(`${API_BASE}/anime/releases/${id}`);
  } catch {
    return null;
  }
}

/** Search by text query */
export async function searchTitles(query: string, limit = 10): Promise<any[]> {
  try {
    const data = await fetchJson<any>(`${API_BASE}/app/search/releases?query=query&include=id%2Ctype.genres&exclude=poster%2Cdescription`, {
      search: query,
      limit: String(limit),
    });
    return Array.isArray(data) ? data : (data?.list ?? []);
  } catch {
    return [];
  }
}

/** Get all titles (paginated, for catalog) */
export async function getTitles(page = 1, limit = 12): Promise<{ data: any[]; total: number }> {
  try {
    const data = await fetchJson<any>(`${API_BASE}/title/list`, {
      page: String(page),
      items_per_page: String(limit),
    });
    return {
      data: Array.isArray(data) ? data : (data?.list ?? []),
      total: data?.pagination?.allItems ?? 0,
    };
  } catch {
    return { data: [], total: 0 };
  }
}

/** Get HLS episodes directly from AniLibria title ID */
export async function getHlsEpisodesByAnilibriaId(anilibriaId: number): Promise<PlayerSource[]> {
  const title = await getTitleById(anilibriaId);
  if (!title || !title.player) return [];
  const shikiId = anilibriaId;
  return extractHlsFromPlayer(shikiId, title.player);
}

function extractHlsFromPlayer(malId: number, player: any): PlayerSource[] {
  const host: string = player.host ?? '';
  const playlist: Record<string, any> = player.list ?? {};

  return Object.entries(playlist)
    .map(([epNum, epData]: [string, any]) => {
      const hls = epData.hls ?? {};
      const fhd = hls.fhd ? `https://${host}${hls.fhd}` : null;
      const hd  = hls.hd  ? `https://${host}${hls.hd}` : null;
      const sd  = hls.sd  ? `https://${host}${hls.sd}` : null;
      const bestUrl = fhd ?? hd ?? sd ?? '';
      return {
        id: `anilibria_${malId}_${epNum}`,
        shikimoriId: malId,
        episodeNumber: Number(epNum),
        playerUrl: bestUrl,
        hls: { fhd, hd, sd },
        quality: 'FHD',
        translation: 'AniLibria',
        player_type: 'HLS' as const,
      };
    })
    .filter(s => s.playerUrl)
    .sort((a, b) => a.episodeNumber - b.episodeNumber);
}

/** Map AniLibria release to our standard AnimeRelease shape */
export function mapRelease(r: any) {
  const poster = r.poster?.optimized?.preview
      ? SITE_BASE + r.poster.optimized.preview
      : null;

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
    episodesCount: r.episodes_total ?? 0,
    favorites: r.added_in_users_favorites ?? 0,
    ageRating: '',
    genres: (r.genres ?? []).map(g => ({
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
