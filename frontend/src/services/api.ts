const API_BASE =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:8000/api'
    : '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('access_token');
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string> || {}),
  };
  if (!(options?.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    const msg = err?.error ?? err?.detail ?? `Error ${res.status}`;
    throw new Error(msg);
  }
  if (res.status === 204) return null as T;
  return res.json();
}

// ─── Types ─────────────────────────────────────────────────────────────
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

export interface PlayerSource {
  id: string;
  shikimoriId: number;
  episodeNumber: number;
  playerUrl: string;
  hls: { fhd: string | null; hd: string | null; sd: string | null };
  quality: string;
  translation: string;
  player_type: 'HLS';
}

export interface User {
  id: number;
  displayId: number;
  username: string;
  email: string;
  avatar?: string | null;
  banner?: string | null;
  bio?: string;
  gender?: string;
  isStaff?: boolean;
  isPrivate?: boolean;
  createdAt?: string;
  lastSeen?: string;
  telegram?: string;
  discord?: string;
  youtube?: string;
  twitch?: string;
}

export interface AnimeListEntry {
  id: number;
  userId: number;
  releaseId: number;
  releaseTitle: string;
  releasePoster: string | null;
  status: string;
  episodesWatched: number;
  score: number | null;
  addedAt: string;
  updatedAt: string;
}

export interface WatchHistoryEntry {
  id: number;
  releaseId: number;
  releaseTitle: string;
  releasePoster: string | null;
  episodeId: string;
  episodeOrdinal: number;
  currentTime: number;
  duration: number;
  updatedAt: string;
}

export interface Comment {
  id: number;
  releaseId: number;
  userId: number;
  username: string;
  avatar?: string | null;
  text: string;
  parentId?: number | null;
  createdAt: string;
}

// ─── Anime API ─────────────────────────────────────────────────────────
export const animeApi = {
  getLatest: (limit = 6) =>
    request<AnimeRelease[]>(`/anime/latest?limit=${limit}`),

  getRecommended: (limit = 6) =>
      request<AnimeRelease[]>(`/anime/recommended?limit=${limit}`),

  getRandom: (limit = 6) =>
      request<AnimeRelease[]>(`/anime/random?limit=${limit}`),

  getPopular: (limit = 6) =>
    request<AnimeRelease[]>(`/anime/popular?limit=${limit}`),

  getSchedule: () =>
    request<AnimeRelease[]>('/anime/schedule'),

  search: (q: string, limit = 10) =>
    request<AnimeRelease[]>(`/anime/search?q=${encodeURIComponent(q)}&limit=${limit}`),

  getRelease: (id: string | number) =>
    request<AnimeRelease>(`/anime/${id}`),

  getEpisodes: (id: string | number, shikimori = false) =>
    request<PlayerSource[]>(`/anime/${id}/episodes${shikimori ? '?shikimori=1' : ''}`),

  getComments: (id: number) =>
    request<Comment[]>(`/anime/${id}/comments`),

  addComment: (id: number, text: string, parentId?: number) =>
    request<Comment>(`/anime/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text, parentId }),
    }),

  getRatings: (id: number) =>
    request<{ average: number; count: number; userScore: number | null }>(`/anime/${id}/ratings`),

  setRating: (id: number, score: number) =>
    request<{ success: boolean }>(`/anime/${id}/ratings`, {
      method: 'POST',
      body: JSON.stringify({ score }),
    }),
};

// ─── Auth API ──────────────────────────────────────────────────────────
export const authApi = {
  register: (username: string, email: string, password: string) =>
    request<{ user: User; tokens: { access: string; refresh: string } }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    }),

  login: (username: string, password: string) =>
    request<{ user: User; tokens: { access: string; refresh: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  getProfile: () =>
    request<User>('/auth/me'),

  updateProfile: (data: Partial<User>) =>
    request<User>('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  changePassword: (oldPassword: string, newPassword: string) =>
    request<{ message: string }>('/auth/me/password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword }),
    }),

  forgotPassword: (email: string) =>
    request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, password: string) =>
    request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }),
};

// ─── User API ──────────────────────────────────────────────────────────
export const userApi = {
  getLists: (status?: string) =>
    request<AnimeListEntry[]>(`/user/lists${status ? `?status=${status}` : ''}`),

  addToList: (data: {
    release_id: number;
    status: string;
    release_title?: string;
    release_poster?: string | null;
    score?: number;
  }) =>
    request<AnimeListEntry>('/user/lists', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  removeFromList: (releaseId: number) =>
    request<null>('/user/lists', {
      method: 'POST',
      body: JSON.stringify({ release_id: releaseId, status: '' }),
    }),

  deleteEntry: (entryId: number) =>
    request<null>(`/user/lists/${entryId}`, { method: 'DELETE' }),

  getHistory: () =>
    request<WatchHistoryEntry[]>('/user/history'),

  updateProgress: (data: {
    release_id: number;
    release_title: string;
    release_poster?: string | null;
    episode_id: string;
    episode_ordinal: number;
    current_time: number;
    duration: number;
  }) =>
    request<WatchHistoryEntry>('/user/history', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteHistory: (entryId: number) =>
    request<null>(`/user/history/${entryId}`, { method: 'DELETE' }),
};
