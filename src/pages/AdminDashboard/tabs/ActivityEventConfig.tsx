import {
  Add,
  Delete,
  Devices,
  Movie,
  PhoneAndroid,
  PlayArrow,
  Star,
  Tv,
  Undo,
  Visibility,
} from '@mui/icons-material';
import React from 'react';

export interface RawEvent {
  e: string;
  p?: Record<string, unknown>;
  t: number;
  uid: string;
}

export const EVENT_CONFIG: Record<
  string,
  {
    icon: React.ReactNode;
    color: string;
    label: string;
    getDetail: (p?: Record<string, unknown>) => string;
  }
> = {
  episode_watched: {
    icon: <PlayArrow style={{ fontSize: 16 }} />,
    color: '#00cec9',
    label: 'Episode geschaut',
    getDetail: (p) => {
      const name = p?.series_name || '';
      const s = p?.season || '?';
      const e = p?.episode || '?';
      return `${name} — S${s}E${e}`;
    },
  },
  episode_unwatched: {
    icon: <Undo style={{ fontSize: 16 }} />,
    color: '#a29bfe',
    label: 'Episode ungeschaut',
    getDetail: (p) => {
      const name = p?.series_name || '';
      const s = p?.season || '?';
      const e = p?.episode || '?';
      return `${name} — S${s}E${e}`;
    },
  },
  ext_episode_marked: {
    icon: <PlayArrow style={{ fontSize: 16 }} />,
    color: '#00cec9',
    label: 'Episode geschaut (Extension)',
    getDetail: (p) => {
      const name = p?.series_name || '';
      const s = p?.season || '?';
      const e = p?.episode || '?';
      return `${name} — S${s}E${e}`;
    },
  },
  ext_watch_session_started: {
    icon: <Tv style={{ fontSize: 16 }} />,
    color: '#0984e3',
    label: 'Watch-Session gestartet',
    getDetail: (p) => {
      const name = p?.series_name || '';
      const s = p?.season || '?';
      const e = p?.episode || '?';
      const platform = p?.platform || '';
      return `${name} — S${s}E${e}${platform ? ` (${platform})` : ''}`;
    },
  },
  ext_watch_completed: {
    icon: <Tv style={{ fontSize: 16 }} />,
    color: '#00b894',
    label: 'Watch-Session beendet',
    getDetail: (p) => {
      const name = p?.series_name || '';
      const dur = p?.watch_duration_sec
        ? `${Math.round(Number(p.watch_duration_sec) / 60)}min`
        : '';
      const platform = p?.platform || '';
      return `${name}${dur ? ` — ${dur}` : ''}${platform ? ` (${platform})` : ''}`;
    },
  },
  ext_series_added_to_tvrank: {
    icon: <Add style={{ fontSize: 16 }} />,
    color: '#00b894',
    label: 'Serie via Extension hinzugefuegt',
    getDetail: (p) => String(p?.series_name || ''),
  },
  ext_login: {
    icon: <Devices style={{ fontSize: 16 }} />,
    color: '#6c5ce7',
    label: 'Extension Login',
    getDetail: () => '',
  },
  ext_logout: {
    icon: <Devices style={{ fontSize: 16 }} />,
    color: '#636e72',
    label: 'Extension Logout',
    getDetail: () => '',
  },
  series_added: {
    icon: <Add style={{ fontSize: 16 }} />,
    color: '#00b894',
    label: 'Serie hinzugefuegt',
    getDetail: (p) => String(p?.series_name || ''),
  },
  series_deleted: {
    icon: <Delete style={{ fontSize: 16 }} />,
    color: '#ff6b6b',
    label: 'Serie geloescht',
    getDetail: (p) => String(p?.series_name || ''),
  },
  movie_added: {
    icon: <Movie style={{ fontSize: 16 }} />,
    color: '#00b894',
    label: 'Film hinzugefuegt',
    getDetail: (p) => String(p?.movie_name || ''),
  },
  movie_deleted: {
    icon: <Movie style={{ fontSize: 16 }} />,
    color: '#ff6b6b',
    label: 'Film geloescht',
    getDetail: (p) => String(p?.movie_name || ''),
  },
  rating_saved: {
    icon: <Star style={{ fontSize: 16 }} />,
    color: '#fdcb6e',
    label: 'Bewertung',
    getDetail: (p) => `${p?.item_type || ''} — ${p?.rating}/10`,
  },
  rating_deleted: {
    icon: <Star style={{ fontSize: 16 }} />,
    color: '#636e72',
    label: 'Bewertung geloescht',
    getDetail: (p) => String(p?.item_type || ''),
  },
  page_view: {
    icon: <Visibility style={{ fontSize: 16 }} />,
    color: '#7c6ef0',
    label: 'Seite besucht',
    getDetail: (p) => String(p?.page || ''),
  },
  login: {
    icon: <PhoneAndroid style={{ fontSize: 16 }} />,
    color: '#6c5ce7',
    label: 'Login',
    getDetail: () => '',
  },
  logout: {
    icon: <PhoneAndroid style={{ fontSize: 16 }} />,
    color: '#636e72',
    label: 'Logout',
    getDetail: () => '',
  },
};

export function getSourceBadge(ev: RawEvent): { label: string; color: string } | null {
  const source = ev.p?.source as string | undefined;
  const platform = ev.p?.platform as string | undefined;

  if (ev.e.startsWith('ext_') || source === 'extension') {
    return { label: platform ? `Extension · ${platform}` : 'Extension', color: '#e17055' };
  }

  if (ev.e === 'episode_watched' || ev.e === 'episode_unwatched') {
    return { label: 'App', color: '#0984e3' };
  }

  return null;
}

export type FilterType = 'all' | 'watched' | 'library' | 'ratings' | 'visits' | 'extension';

export const FILTERS: Array<{ id: FilterType; label: string; events: string[] }> = [
  { id: 'all', label: 'Alle', events: [] },
  {
    id: 'watched',
    label: 'Geschaut',
    events: ['episode_watched', 'episode_unwatched', 'ext_episode_marked'],
  },
  {
    id: 'library',
    label: 'Bibliothek',
    events: [
      'series_added',
      'series_deleted',
      'movie_added',
      'movie_deleted',
      'ext_series_added_to_tvrank',
    ],
  },
  { id: 'ratings', label: 'Bewertungen', events: ['rating_saved', 'rating_deleted'] },
  { id: 'visits', label: 'Besuche', events: ['page_view', 'login', 'logout'] },
  {
    id: 'extension',
    label: 'Extension',
    events: [
      'ext_episode_marked',
      'ext_watch_session_started',
      'ext_watch_completed',
      'ext_series_added_to_tvrank',
      'ext_login',
      'ext_logout',
    ],
  },
];

export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatDateTime(ts: number): { date: string; time: string } {
  const d = new Date(ts);
  return {
    date: d.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' }),
    time: d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };
}

export function formatDateLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (toDateKey(today) === dateKey) return 'Heute';
  if (toDateKey(yesterday) === dateKey) return 'Gestern';

  return date.toLocaleDateString('de-DE', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
