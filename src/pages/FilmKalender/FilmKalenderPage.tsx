/**
 * Feature „Film-Kalender" — „Was startet wann?" für FILME (TMDB-Discover,
 * Watch-Region des Users). Gegenstück zum Serien-Kalender, teilt dessen
 * Design (`as-*`-Klassen):
 *   Tabs = MONATE (Vormonat · aktueller · nächster).
 *   Modus: KINO (Kinostarts) · STREAMING (Digital-Releases).
 *   Timeline mit Tages-Nodes, „Aus deiner Liste"-Badge + „+"-Add-Button
 *   (backendFetch('/addMovie'), wie Discover).
 * Datenquelle: clientseitig TMDB (discover + release_dates pro Film für das
 * exakte regionale Datum), Session-Cache in filmReleaseData.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarMonth, InfoOutlined, LocalMovies } from '@mui/icons-material';
import {
  EmptyState,
  PageHeader,
  PageLayout,
  PageState,
  ScrollToTopButton,
  Skeleton,
  TabSwitcher,
} from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useMovieList } from '../../contexts/MovieListContext';
import { useTheme } from '../../contexts/ThemeContext';
import { trackMovieAdded } from '../../services/firebase/analytics';
import { logMovieAdded } from '../../features/badges/minimalActivityLogger';
import { backendFetch } from '../../services/backendApi';
import { hapticSelect, hapticSuccess } from '../../lib/haptics';
import { showToast } from '../../lib/toast';
import { isMovieWatched } from '../../lib/rating/rating';
import { getOptimalTextColor, lightenColor } from '../../theme/colorUtils';
import { t } from '../../services/i18n';
import {
  dayLabel,
  parsePremiereDate,
  parseQuarterKey,
  quarterKey,
  quarterLabel,
  quarterRangeShort,
  relativeDayLabel,
  shiftQuarter,
} from '../SerienKalender/tvPremiereFormat';
import { fetchFilmReleases, type FilmReleaseEntry, type ReleaseMode } from './filmReleaseData';
import { FilmKalenderCard } from './FilmKalenderCard';
// Geteiltes CSS mit Anime-Season-/Serien-Kalender (`as-*`-Klassen).
import '../AnimeSeason/AnimeSeasonPage.css';

const SELECTED_KEY = 'filmKalender-selected';
const MODE_KEY = 'filmKalender-mode';

interface DayGroup {
  key: string;
  label: string;
  relative: string | null;
  isToday: boolean;
  isPast: boolean;
  items: FilmReleaseEntry[];
}

export const FilmKalenderPage: React.FC = () => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth() || {};
  const { movieList } = useMovieList();

  // „Jetzt" + Basis-Quartal einmalig einfrieren — Tabs sind 3-Monats-Blöcke
  // (Vorquartal · aktuelles · nächstes), exakt wie beim Serien-Kalender.
  const [now] = useState(() => Date.now());
  const [baseQuarter] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1);
  });

  const quarterTabs = useMemo(
    () => [shiftQuarter(baseQuarter, -1), baseQuarter, shiftQuarter(baseQuarter, 1)],
    [baseQuarter]
  );
  const validQuarterKeys = useMemo(() => quarterTabs.map((d) => quarterKey(d)), [quarterTabs]);

  const [selected, setSelected] = useState<string>(() => {
    try {
      const stored = sessionStorage.getItem(SELECTED_KEY);
      if (stored && validQuarterKeys.includes(stored)) return stored;
    } catch {
      // ignore
    }
    return quarterKey(baseQuarter);
  });

  const [mode, setMode] = useState<ReleaseMode>(() => {
    try {
      const stored = sessionStorage.getItem(MODE_KEY);
      if (stored === 'cinema' || stored === 'digital') return stored;
    } catch {
      // ignore
    }
    return 'cinema';
  });

  const [entries, setEntries] = useState<FilmReleaseEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [addingId, setAddingId] = useState<number | null>(null);

  const selectedDate = useMemo(() => parseQuarterKey(selected), [selected]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    fetchFilmReleases(selectedDate, mode)
      .then((data) => {
        if (!cancelled) setEntries(data);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedDate, mode, reloadKey]);

  useEffect(() => {
    try {
      sessionStorage.setItem(SELECTED_KEY, selected);
      sessionStorage.setItem(MODE_KEY, mode);
    } catch {
      // ignore
    }
  }, [selected, mode]);

  const listById = useMemo(() => {
    const map = new Map<number, { watched: boolean }>();
    for (const m of movieList || []) map.set(Number(m.id), { watched: isMovieWatched(m) });
    return map;
  }, [movieList]);

  const visible = useMemo(() => entries || [], [entries]);
  const inListCount = useMemo(
    () => visible.filter((e) => listById.has(e.tmdbId)).length,
    [visible, listById]
  );

  const startOfToday = useMemo(() => {
    const d = new Date(now);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  }, [now]);

  const dayGroups = useMemo<DayGroup[]>(() => {
    const nowDate = new Date(now);
    const byDay = new Map<string, DayGroup>();
    for (const entry of visible) {
      const date = parsePremiereDate(entry.releaseDate);
      const key = entry.releaseDate;
      let group = byDay.get(key);
      if (!group) {
        group = {
          key,
          label: date ? dayLabel(date) : t('Termin offen'),
          relative: date ? relativeDayLabel(date, nowDate) : null,
          isToday: !!date && date.toDateString() === nowDate.toDateString(),
          isPast: !!date && date.getTime() < startOfToday,
          items: [],
        };
        byDay.set(key, group);
      }
      group.items.push(entry);
    }
    return [...byDay.values()];
  }, [visible, now, startOfToday]);

  const addEntry = async (entry: FilmReleaseEntry) => {
    if (!user) {
      showToast(t('Bitte einloggen, um Inhalte hinzuzufügen'), 2500, 'info');
      return;
    }
    if (addingId !== null) return;
    setAddingId(entry.tmdbId);
    try {
      const response = await backendFetch('/addMovie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: import.meta.env.VITE_USER, id: entry.tmdbId, uuid: user.uid }),
      });
      if (!response.ok) throw new Error(`addMovie failed: ${response.status}`);
      hapticSuccess();
      showToast(t('„{title}" hinzugefügt', { title: entry.title }), 2500, 'success');
      trackMovieAdded(String(entry.tmdbId), entry.title, 'film-kalender');
      await logMovieAdded(user.uid, entry.title, entry.tmdbId);
    } catch {
      showToast(t('Hinzufügen fehlgeschlagen'), 2500, 'error');
    } finally {
      setAddingId(null);
    }
  };

  const subtitle = loading
    ? t('Kinostarts & Streaming-Releases')
    : `${quarterLabel(selectedDate)} · ${
        visible.length === 1
          ? t('{n} Release', { n: visible.length })
          : t('{n} Releases', { n: visible.length })
      }${inListCount > 0 ? ` · ${t('{n} in deiner Liste', { n: inListCount })}` : ''}`;

  return (
    <PageLayout>
      <PageHeader
        title={t('Film-Kalender')}
        subtitle={subtitle}
        gradientFrom={lightenColor(currentTheme.primary, 0.2)}
        gradientTo={lightenColor(currentTheme.primary, 0.2)}
        icon={<LocalMovies style={{ fontSize: '28px' }} />}
      />

      <TabSwitcher
        tabs={quarterTabs.map((tab) => ({ id: quarterKey(tab), label: quarterRangeShort(tab) }))}
        activeTab={selected}
        onTabChange={(id) => {
          hapticSelect();
          setSelected(id);
        }}
        className="ui-tabs--center"
        style={{ marginBottom: '12px' }}
      />

      <div className="as-filterbar">
        <TabSwitcher
          tabs={[
            { id: 'cinema', label: t('Kino') },
            { id: 'digital', label: t('Streaming') },
          ]}
          activeTab={mode}
          onTabChange={(id) => {
            hapticSelect();
            setMode(id as ReleaseMode);
          }}
          style={{ flexShrink: 0, margin: 0 }}
        />
      </div>

      <div
        style={{
          padding: '0 20px calc(100px + env(safe-area-inset-bottom))',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {loading && (
          <div className="as-skeletons" role="status" aria-label={t('Film-Kalender wird geladen')}>
            <div className="as-grid">
              {Array.from({ length: 10 }, (_, i) => (
                <Skeleton key={i} width="100%" shape="card" style={{ height: '176px' }} />
              ))}
            </div>
          </div>
        )}

        {!loading && failed && (
          <PageState
            mode="error"
            error={{
              icon: <LocalMovies style={{ fontSize: '48px' }} />,
              title: t('Releases nicht erreichbar'),
              description: t('Die Release-Daten konnten nicht geladen werden.'),
              onRetry: () => setReloadKey((key) => key + 1),
            }}
          />
        )}

        {!loading && !failed && visible.length === 0 && (
          <EmptyState
            icon={<CalendarMonth style={{ fontSize: '48px' }} />}
            title={t('Keine Releases')}
            description={t('Für {q} sind in diesem Modus keine Releases gelistet.', {
              q: quarterLabel(selectedDate),
            })}
          />
        )}

        {!loading && !failed && visible.length > 0 && (
          <section>
            <div className="as-timeline">
              {dayGroups.map((group) => (
                <div key={group.key} className="as-day">
                  <div className="as-day-header">
                    <span
                      className={
                        group.isToday
                          ? 'as-day-node as-day-node--today'
                          : group.isPast
                            ? 'as-day-node as-day-node--past'
                            : 'as-day-node'
                      }
                      style={
                        group.isToday
                          ? { background: currentTheme.accent, borderColor: currentTheme.accent }
                          : group.isPast
                            ? {
                                background: currentTheme.background.surfaceElevated,
                                borderColor: currentTheme.text.muted,
                              }
                            : {
                                background: currentTheme.background.default,
                                borderColor: currentTheme.primary,
                              }
                      }
                      aria-hidden
                    />
                    <h3
                      className="as-day-label"
                      style={{
                        color: group.isPast ? currentTheme.text.muted : currentTheme.text.secondary,
                      }}
                    >
                      {group.label}
                    </h3>
                    {group.relative && (
                      <span
                        className="as-day-relative"
                        style={
                          group.isToday
                            ? {
                                background: currentTheme.accent,
                                color: getOptimalTextColor(currentTheme.accent),
                              }
                            : {
                                background: `${currentTheme.primary}1a`,
                                color: currentTheme.text.secondary,
                              }
                        }
                      >
                        {group.relative}
                      </span>
                    )}
                  </div>
                  <div className="as-grid">
                    {group.items.map((entry, index) => {
                      const listEntry = listById.get(entry.tmdbId);
                      return (
                        <FilmKalenderCard
                          key={`${entry.tmdbId}-${entry.mode}`}
                          entry={entry}
                          inList={!!listEntry}
                          watched={listEntry?.watched === true}
                          now={now}
                          staggerIndex={index}
                          onOpen={() => navigate(`/movie/${entry.tmdbId}`)}
                          onAdd={listEntry ? undefined : () => void addEntry(entry)}
                          adding={addingId === entry.tmdbId}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <p className="as-source-hint" style={{ color: currentTheme.text.muted }}>
              <InfoOutlined style={{ fontSize: '14px', flexShrink: 0 }} />
              {mode === 'cinema'
                ? t('Kinostarts in deiner Region (TMDB)')
                : t('Digital-/Streaming-Releases in deiner Region (TMDB)')}
            </p>
          </section>
        )}
      </div>

      <ScrollToTopButton scrollContainerSelector=".mobile-content" />
    </PageLayout>
  );
};

export default FilmKalenderPage;
