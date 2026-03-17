import {
  Add,
  ChevronLeft,
  ChevronRight,
  Delete,
  Devices,
  Movie,
  PhoneAndroid,
  PlayArrow,
  Star,
  Today,
  Tv,
  Undo,
  Visibility,
} from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { useTheme } from '../../../contexts/ThemeContext';
import type { useAdminDashboardData } from '../useAdminDashboardData';

interface ActivityTabProps {
  data: ReturnType<typeof useAdminDashboardData>;
  theme: ReturnType<typeof useTheme>['currentTheme'];
}

interface RawEvent {
  e: string;
  p?: Record<string, unknown>;
  t: number;
  uid: string;
}

const EVENT_CONFIG: Record<
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

function getSourceBadge(ev: RawEvent): { label: string; color: string } | null {
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

type FilterType = 'all' | 'watched' | 'library' | 'ratings' | 'visits' | 'extension';

const FILTERS: Array<{ id: FilterType; label: string; events: string[] }> = [
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

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDateTime(ts: number): { date: string; time: string } {
  const d = new Date(ts);
  return {
    date: d.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' }),
    time: d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };
}

function formatDateLabel(dateKey: string): string {
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

export const ActivityTab = React.memo<ActivityTabProps>(({ data, theme }) => {
  const cardBg = `${theme.background.surface}cc`;
  const borderColor = theme.border.default;
  const [rawEvents, setRawEvents] = useState<RawEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [showPageViews, setShowPageViews] = useState(false);
  const [daysBack, setDaysBack] = useState(0);
  const [range, setRange] = useState(1);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const selectedDateKey = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - daysBack);
    return toDateKey(d);
  }, [daysBack]);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    const allEvents: RawEvent[] = [];
    for (let i = 0; i < range; i++) {
      const d = new Date();
      d.setDate(d.getDate() - daysBack - i);
      const dk = toDateKey(d);
      const events = await data.loadAllRawEvents(dk);
      allEvents.push(...events);
    }
    allEvents.sort((a, b) => b.t - a.t);
    setRawEvents(allEvents);
    setLoading(false);
  }, [data, daysBack, range]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Unique users in current events (for user filter)
  const activeUsers = useMemo(() => {
    const userMap = new Map<string, { uid: string; count: number }>();
    for (const ev of rawEvents) {
      if (ev.e === 'page_view' && !showPageViews) continue;
      const existing = userMap.get(ev.uid);
      if (existing) {
        existing.count++;
      } else {
        userMap.set(ev.uid, { uid: ev.uid, count: 1 });
      }
    }
    return [...userMap.values()].sort((a, b) => b.count - a.count);
  }, [rawEvents, showPageViews]);

  const filteredEvents = useMemo(() => {
    let events = rawEvents;

    if (!showPageViews && filter !== 'visits') {
      events = events.filter((ev) => ev.e !== 'page_view');
    }

    if (filter !== 'all') {
      const filterConfig = FILTERS.find((f) => f.id === filter);
      if (filterConfig) {
        events = events.filter((ev) => filterConfig.events.includes(ev.e));
      }
    }

    if (selectedUser) {
      events = events.filter((ev) => ev.uid === selectedUser);
    }

    return events.slice(0, 500);
  }, [rawEvents, filter, showPageViews, selectedUser]);

  // Group events by date
  const groupedEvents = useMemo(() => {
    const groups: Map<string, RawEvent[]> = new Map();
    for (const ev of filteredEvents) {
      const dk = toDateKey(new Date(ev.t));
      if (!groups.has(dk)) groups.set(dk, []);
      groups.get(dk)!.push(ev);
    }
    return groups;
  }, [filteredEvents]);

  // Summary stats
  const stats = useMemo(() => {
    const appEpisodes = rawEvents.filter((e) => e.e === 'episode_watched').length;
    const extEpisodes = rawEvents.filter((e) => e.e === 'ext_episode_marked').length;
    const seriesAdded = rawEvents.filter((e) => e.e === 'series_added').length;
    const seriesDeleted = rawEvents.filter((e) => e.e === 'series_deleted').length;
    const ratingsGiven = rawEvents.filter((e) => e.e === 'rating_saved').length;
    const uniqueUsers = new Set(rawEvents.map((e) => e.uid)).size;
    const extSessions = rawEvents.filter((e) => e.e === 'ext_watch_session_started').length;
    return {
      appEpisodes,
      extEpisodes,
      seriesAdded,
      seriesDeleted,
      ratingsGiven,
      uniqueUsers,
      extSessions,
    };
  }, [rawEvents]);

  const isToday = daysBack === 0 && range === 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Date Navigation */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          justifyContent: 'center',
        }}
      >
        <button
          onClick={() => setDaysBack((d) => d + 1)}
          style={{
            background: 'none',
            border: `1px solid ${borderColor}`,
            borderRadius: 10,
            padding: '6px 8px',
            cursor: 'pointer',
            color: theme.text.secondary,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <ChevronLeft style={{ fontSize: 18 }} />
        </button>

        <motion.div
          key={selectedDateKey + range}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '8px 20px',
            borderRadius: 12,
            background: `${theme.primary}10`,
            border: `1px solid ${theme.primary}25`,
            color: theme.text.primary,
            fontSize: 14,
            fontWeight: 700,
            minWidth: 180,
            textAlign: 'center',
          }}
        >
          {range === 1 ? formatDateLabel(selectedDateKey) : `Letzte ${range} Tage`}
        </motion.div>

        <button
          onClick={() => setDaysBack((d) => Math.max(0, d - 1))}
          disabled={daysBack === 0}
          style={{
            background: 'none',
            border: `1px solid ${daysBack === 0 ? `${borderColor}40` : borderColor}`,
            borderRadius: 10,
            padding: '6px 8px',
            cursor: daysBack === 0 ? 'default' : 'pointer',
            color: daysBack === 0 ? `${theme.text.muted}40` : theme.text.secondary,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <ChevronRight style={{ fontSize: 18 }} />
        </button>

        {!isToday && (
          <button
            onClick={() => {
              setDaysBack(0);
              setRange(1);
            }}
            style={{
              background: `${theme.primary}15`,
              border: `1px solid ${theme.primary}30`,
              borderRadius: 10,
              padding: '6px 10px',
              cursor: 'pointer',
              color: theme.primary,
              fontSize: 11,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Today style={{ fontSize: 14 }} />
            Heute
          </button>
        )}

        {/* Range selector */}
        <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
          {[1, 3, 7].map((r) => (
            <button
              key={r}
              onClick={() => {
                setRange(r);
                setDaysBack(0);
              }}
              style={{
                padding: '4px 10px',
                borderRadius: 8,
                border: `1px solid ${range === r ? theme.primary : borderColor}`,
                background: range === r ? `${theme.primary}18` : 'transparent',
                color: range === r ? theme.primary : theme.text.muted,
                fontSize: 11,
                fontWeight: range === r ? 700 : 500,
                cursor: 'pointer',
              }}
            >
              {r === 1 ? '1T' : `${r}T`}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {[
          { label: 'App Episoden', value: stats.appEpisodes, color: '#0984e3' },
          { label: 'Ext Episoden', value: stats.extEpisodes, color: '#e17055' },
          { label: 'Ext Sessions', value: stats.extSessions, color: '#00b894' },
          { label: 'Hinzugefuegt', value: stats.seriesAdded, color: '#00b894' },
          { label: 'Geloescht', value: stats.seriesDeleted, color: '#ff6b6b' },
          { label: 'Ratings', value: stats.ratingsGiven, color: '#fdcb6e' },
          { label: 'User aktiv', value: stats.uniqueUsers, color: '#7c6ef0' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05, type: 'spring', stiffness: 200 }}
            style={{
              flex: '1 1 80px',
              textAlign: 'center',
              padding: '14px 8px',
              borderRadius: 14,
              background: `linear-gradient(135deg, ${s.color}12, ${s.color}06)`,
              border: `1px solid ${s.color}25`,
              backdropFilter: 'blur(20px)',
            }}
          >
            <div
              style={{
                fontSize: 24,
                fontWeight: 900,
                color: s.color,
                letterSpacing: '-0.04em',
                lineHeight: 1,
              }}
            >
              {s.value}
            </div>
            <div
              style={{
                fontSize: 9,
                color: theme.text.muted,
                fontWeight: 600,
                marginTop: 4,
              }}
            >
              {s.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* User Filter */}
      {activeUsers.length > 1 && (
        <div
          style={{
            display: 'flex',
            gap: 6,
            alignItems: 'center',
            overflowX: 'auto',
            padding: '2px 0',
          }}
        >
          <button
            onClick={() => setSelectedUser(null)}
            style={{
              padding: '4px 12px',
              borderRadius: 20,
              border: `1px solid ${!selectedUser ? theme.primary : borderColor}`,
              background: !selectedUser ? `${theme.primary}18` : 'transparent',
              color: !selectedUser ? theme.primary : theme.text.muted,
              fontSize: 11,
              fontWeight: !selectedUser ? 700 : 500,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            Alle User
          </button>
          {activeUsers.map((u) => {
            const profile = data.userProfiles[u.uid];
            const name =
              profile?.displayName ||
              profile?.username ||
              (u.uid === 'undefined' ? 'Unbekannt' : u.uid.slice(0, 8));
            const photo = profile?.photoURL;
            const isSelected = selectedUser === u.uid;

            return (
              <button
                key={u.uid}
                onClick={() => setSelectedUser(isSelected ? null : u.uid)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '3px 10px 3px 3px',
                  borderRadius: 20,
                  border: `1px solid ${isSelected ? theme.primary : borderColor}`,
                  background: isSelected ? `${theme.primary}18` : 'transparent',
                  color: isSelected ? theme.primary : theme.text.secondary,
                  fontSize: 11,
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.2s',
                }}
              >
                {photo ? (
                  <img
                    src={photo}
                    alt=""
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: `${theme.primary}25`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 8,
                      fontWeight: 700,
                      color: theme.primary,
                    }}
                  >
                    {name.charAt(0).toUpperCase()}
                  </div>
                )}
                {name}
                <span
                  style={{
                    fontSize: 9,
                    color: isSelected ? theme.primary : theme.text.muted,
                    fontWeight: 600,
                  }}
                >
                  {u.count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Filter Pills */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              border: `1px solid ${filter === f.id ? theme.primary : borderColor}`,
              background: filter === f.id ? `${theme.primary}18` : 'transparent',
              color: filter === f.id ? theme.primary : theme.text.secondary,
              fontSize: 12,
              fontWeight: filter === f.id ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {f.label}
          </button>
        ))}
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 11,
            color: theme.text.muted,
            marginLeft: 'auto',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={showPageViews}
            onChange={(e) => setShowPageViews(e.target.checked)}
            style={{ accentColor: theme.primary }}
          />
          Page Views
        </label>
      </div>

      {/* Activity Feed */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: theme.text.muted }}>
          Lade Activity-Feed...
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: cardBg,
            backdropFilter: 'blur(28px)',
            border: `1px solid ${borderColor}`,
            borderRadius: 16,
            padding: '8px 0',
            maxHeight: 650,
            overflowY: 'auto',
          }}
        >
          {filteredEvents.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: 40,
                color: theme.text.muted,
                fontSize: 13,
              }}
            >
              Keine Events fuer diesen Zeitraum
            </div>
          ) : (
            <>
              {[...groupedEvents.entries()].map(([dateKey, events]) => (
                <div key={dateKey}>
                  {/* Date header */}
                  <div
                    style={{
                      padding: '10px 20px 6px',
                      fontSize: 11,
                      fontWeight: 700,
                      color: theme.text.muted,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      borderBottom: `1px solid ${borderColor}20`,
                      position: 'sticky',
                      top: 0,
                      background: cardBg,
                      backdropFilter: 'blur(28px)',
                      zIndex: 1,
                    }}
                  >
                    {formatDateLabel(dateKey)}
                    <span
                      style={{
                        marginLeft: 8,
                        fontSize: 10,
                        fontWeight: 500,
                        color: `${theme.text.muted}80`,
                      }}
                    >
                      {events.length} Events
                    </span>
                  </div>

                  <AnimatePresence initial={false}>
                    {events.map((ev, i) => {
                      const config = EVENT_CONFIG[ev.e];
                      if (!config) return null;
                      const detail = config.getDetail(ev.p);
                      const userName =
                        data.userProfiles[ev.uid]?.displayName ||
                        data.userProfiles[ev.uid]?.username ||
                        (ev.uid === 'undefined' ? 'Unbekannt' : ev.uid.slice(0, 8));
                      const photoURL = data.userProfiles[ev.uid]?.photoURL;
                      const sourceBadge = getSourceBadge(ev);
                      const dt = formatDateTime(ev.t);

                      return (
                        <motion.div
                          key={`${ev.t}-${ev.uid}-${i}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: Math.min(i * 0.015, 0.4) }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '9px 20px',
                            borderBottom: `1px solid ${borderColor}10`,
                            transition: 'background 0.15s',
                          }}
                          whileHover={{
                            backgroundColor: `${theme.background.default}40`,
                          }}
                        >
                          {/* Time */}
                          <div
                            style={{
                              flexShrink: 0,
                              width: 58,
                              textAlign: 'right',
                            }}
                          >
                            <div
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: theme.text.secondary,
                                fontFamily: 'monospace',
                                letterSpacing: '-0.02em',
                              }}
                            >
                              {dt.time}
                            </div>
                            {range > 1 && (
                              <div
                                style={{
                                  fontSize: 8,
                                  color: `${theme.text.muted}90`,
                                  fontFamily: 'monospace',
                                }}
                              >
                                {dt.date}
                              </div>
                            )}
                          </div>

                          {/* Icon */}
                          <div
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: 8,
                              background: `${config.color}15`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: config.color,
                              flexShrink: 0,
                            }}
                          >
                            {config.icon}
                          </div>

                          {/* Content */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: theme.text.primary,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                              }}
                            >
                              <span
                                style={{
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {detail || config.label}
                              </span>
                              {sourceBadge && (
                                <span
                                  style={{
                                    fontSize: 9,
                                    fontWeight: 700,
                                    padding: '1px 6px',
                                    borderRadius: 6,
                                    background: `${sourceBadge.color}18`,
                                    color: sourceBadge.color,
                                    border: `1px solid ${sourceBadge.color}30`,
                                    flexShrink: 0,
                                    letterSpacing: '0.02em',
                                  }}
                                >
                                  {sourceBadge.label}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 10, color: theme.text.muted }}>
                              {config.label}
                            </div>
                          </div>

                          {/* User */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              flexShrink: 0,
                            }}
                          >
                            {photoURL ? (
                              <img
                                src={photoURL}
                                alt=""
                                style={{
                                  width: 20,
                                  height: 20,
                                  borderRadius: '50%',
                                  objectFit: 'cover',
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: 20,
                                  height: 20,
                                  borderRadius: '50%',
                                  background: `${theme.primary}25`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 9,
                                  fontWeight: 700,
                                  color: theme.primary,
                                }}
                              >
                                {userName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span
                              style={{
                                fontSize: 11,
                                color: theme.text.secondary,
                                fontWeight: 500,
                              }}
                            >
                              {userName}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              ))}
            </>
          )}
        </motion.div>
      )}
    </div>
  );
});

ActivityTab.displayName = 'ActivityTab';
