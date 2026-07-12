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

/** Find title by Shikimori / MAL ID */
async function getByMalId(malId: number): Promise<any | null> {
  try {
    // AniLibria v3 search endpoint
    const data = await fetchJson<any>(`${API_BASE}/title/search`, {
      search: `shikimori_id:${malId}`,
      filter: 'id,names,player,posters,type,status,description,genres',
    });
    const list = Array.isArray(data) ? data : (data?.list ?? []);
    // Try exact match first
    const exact = list.find((t: any) => t.names?.shikimori_id === malId || t.player?.shikimori_id === malId);
    return exact ?? list[0] ?? null;
  } catch {
    return null;
  }
}

/** Get latest releases (for home page) */
export async function getLatestReleases(limit = 12): Promise<any[]> {
  try {
    const data = await fetchJson<any>(`${API_BASE}/anime/releases/latest?limit=14&include=id%2Ctype.genres&exclude=poster%2Cdescription`, {
      limit: String(limit),
      filter: 'id,names,posters,type,status,season,description,genres,player',
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
    const data = await fetchJson<any>(`${API_BASE}/title/schedule`, {
      filter: 'id,names,posters,type,status,season,player',
    });
    return Array.isArray(data) ? data : (data?.list ?? []);
  } catch {
    return [];
  }
}

/** Get a single title by its AniLibria ID */
export async function getTitleById(id: number | string): Promise<any | null> {
  try {
    return await fetchJson<any>(`${API_BASE}/title`, {
      id: String(id),
      filter: 'id,names,posters,type,status,season,description,genres,player,team,franchise,in_favorites',
    });
  } catch {
    return null;
  }
}

/** Search by text query */
export async function searchTitles(query: string, limit = 10): Promise<any[]> {
  try {
    const data = await fetchJson<any>(`${API_BASE}/title/search`, {
      search: query,
      limit: String(limit),
      filter: 'id,names,posters,type,status,season,genres',
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
      filter: 'id,names,posters,type,status,season,genres,in_favorites',
    });
    return {
      data: Array.isArray(data) ? data : (data?.list ?? []),
      total: data?.pagination?.allItems ?? 0,
    };
  } catch {
    return { data: [], total: 0 };
  }
}

/** Get HLS episode sources for Shikimori ID (main player method) */
export async function getHlsEpisodes(malId: number): Promise<PlayerSource[]> {
  const title = await getByMalId(malId);
  if (!title || !title.player) return [];
  return extractHlsFromPlayer(malId, title.player);
}

/** Get HLS episodes directly from AniLibria title ID */
export async function getHlsEpisodesByAnilibriaId(anilibriaId: number): Promise<PlayerSource[]> {
  const title = await getTitleById(anilibriaId);
  if (!title || !title.player) return [];
  const shikiId = title.names?.shikimori_id ?? anilibriaId;
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
  const poster = r.posters?.original?.url
    ? `https://anilibria.tv${r.posters.original.url}`
    : r.posters?.medium?.url
    ? `https://anilibria.tv${r.posters.medium.url}`
    : null;

  return {
    id: r.id,
    title: r.names?.ru ?? r.names?.en ?? String(r.id),
    titleEnglish: r.names?.en ?? '',
    alias: r.names?.alternative ?? '',
    description: r.description ?? '',
    type: r.type?.full_string ?? r.type?.string ?? 'ТВ Сериал',
    year: r.season?.year ?? null,
    season: r.season?.string ?? '',
    poster,
    isOngoing: r.status?.code === 1,
    episodesTotal: r.type?.episodes ?? null,
    episodesCount: r.type?.episodes ?? 0,
    favorites: r.in_favorites ?? 0,
    ageRating: '',
    genres: (r.genres ?? []).map((g: string, i: number) => ({ id: i, name: g })),
    studios: [],
    shikimoriId: r.names?.shikimori_id ?? null,
    anilibriaId: r.id,
    episodes: [],
    videos: [],
    screenshots: [],
  };
}
