/**
 * Feature „Serien-Kalender" — „Was startet neu?" für NORMALE Serien (TMDB).
 *
 * Discovery-Gegenstück zum Anime-Season-Kalender und bewusst abgegrenzt vom
 * bestehenden Kalender (Episoden getrackter Serien) + Countdown: hier stehen
 * Serien, die man NOCH NICHT trackt — ganz neue Serien UND neue Staffeln von
 * Rückkehrern.
 *
 * Aufbau „Premieren-Countdown-Board" (volle Breite, Port der AnimeSeasonPage,
 * teilt sich deren CSS):
 *   Tabs = MONATE (Vormonat · aktueller · nächster, rollierend) — Western-TV
 *     ist übers Jahr verteilt, keine Quartals-Seasons.
 *   0. Hero — Spotlight der nächsten Premiere des Monats mit Live-Countdown.
 *   1. „Premieren-Kalender" — Timeline mit Tages-Nodes (Vergangenheit gedimmt,
 *      HEUTE pulsiert), Querformat-Karten (auto-fill).
 *   Filterleiste: „Alle · Serien · Staffeln" + Genre-Dropdown (der Export
 *   enthält nur Titel mit großem DE-Provider, daher kein „Mit Provider"-Toggle).
 *   „Aus deiner Liste"-Badge + „+"-Add-Button.
 *
 * Datenquelle: EINE fertig hydratisierte Datei (catalog/tv-premieres.json,
 * Backend-Cron) — keine Client-Auflösung. Karten-Klick → SeriesDetail über die
 * bekannte tmdbId; „+" added via backendFetch('/add') wie Discover/Search.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarMonth, Category, InfoOutlined, LiveTv } from '@mui/icons-material';
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
import { useSeriesList } from '../../contexts/SeriesListContext';
import { useTheme } from '../../contexts/ThemeContext';
import { trackSeriesAdded } from '../../services/firebase/analytics';
import { logSeriesAdded } from '../../features/badges/minimalActivityLogger';
import { backendFetch } from '../../services/backendApi';
import { hapticSelect, hapticSuccess } from '../../lib/haptics';
import { showToast } from '../../lib/toast';
import { getOptimalTextColor, lightenColor } from '../../theme/colorUtils';
import {
  fetchStaticTvPremieres,
  subscribeCatalogChange,
  type TvPremiereStaticEntry,
} from '../../services/staticCatalog';
import { SerienKalenderCard } from './SerienKalenderCard';
import { SerienKalenderHero } from './SerienKalenderHero';
import { SerienKalenderFilter } from './SerienKalenderFilter';
import {
  dayLabel,
  parsePremiereDate,
  parseQuarterKey,
  quarterKey,
  quarterLabel,
  quarterRangeShort,
  relativeDayLabel,
  shiftQuarter,
} from './tvPremiereFormat';
import { t } from '../../services/i18n';
// Geteiltes CSS mit dem Anime-Season-Kalender (`as-*`-Klassen).
import '../AnimeSeason/AnimeSeasonPage.css';

type FilterMode = 'all' | 'new' | 'season';

interface Filter {
  mode: FilterMode;
  genre: string;
}

const MODE_TABS: { id: FilterMode; label: string }[] = [
  { id: 'all', label: t('Alle') },
  { id: 'new', label: t('Serien') },
  { id: 'season', label: t('Staffeln') },
];

const SELECTED_KEY = 'serienKalender-selected';
const FILTER_KEY = 'serienKalender-filter';

interface DayGroup {
  key: string;
  label: string;
  relative: string | null;
  isToday: boolean;
  isPast: boolean;
  items: TvPremiereStaticEntry[];
}

function readSessionJson<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? { ...fallback, ...(JSON.parse(raw) as Partial<T>) } : fallback;
  } catch {
    return fallback;
  }
}

export const SerienKalenderPage: React.FC = () => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth() || {};
  const { seriesList } = useSeriesList();

  // „Jetzt" + Basis-Quartal einmalig einfrieren (stabile Datums-/Tab-Berechnung).
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

  const [entries, setEntries] = useState<TvPremiereStaticEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [selected, setSelected] = useState<string>(() => {
    const stored = (() => {
      try {
        return sessionStorage.getItem(SELECTED_KEY);
      } catch {
        return null;
      }
    })();
    return stored && validQuarterKeys.includes(stored) ? stored : quarterKey(baseQuarter);
  });

  const [filter, setFilter] = useState<Filter>(() =>
    readSessionJson<Filter>(FILTER_KEY, { mode: 'all', genre: '' })
  );

  const [addingId, setAddingId] = useState<number | null>(null);

  // Premieren laden (fertig hydratisiert, EINE Datei).
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    fetchStaticTvPremieres()
      .then((data) => {
        if (cancelled) return;
        if (data) setEntries(data);
        else setFailed(true);
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
  }, [reloadKey]);

  // Silent-Refresh: sobald der zentrale Watcher eine neue Catalog-Version
  // erkennt, die Premieren frisch nachladen — ohne Loading-Flag/Reload, der
  // bestehende Stand bleibt bis die neuen Daten da sind.
  useEffect(() => {
    const unsubscribe = subscribeCatalogChange(() => {
      fetchStaticTvPremieres()
        .then((data) => {
          if (data) setEntries(data);
        })
        .catch(() => {
          // silent — bestehenden Stand behalten
        });
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(SELECTED_KEY, selected);
    } catch {
      // ignore
    }
  }, [selected]);

  useEffect(() => {
    try {
      sessionStorage.setItem(FILTER_KEY, JSON.stringify(filter));
    } catch {
      // ignore
    }
  }, [filter]);

  const inListIds = useMemo(() => new Set((seriesList || []).map((s) => s.id)), [seriesList]);

  const selectedDate = useMemo(() => parseQuarterKey(selected), [selected]);

  // Auf das gewählte Quartal begrenzen (vor dem Genre-Filter — die Genre-
  // Optionen sollen das ganze Quartal abdecken).
  const quarterEntries = useMemo(
    () =>
      (entries || []).filter(
        (e) => quarterKey(parsePremiereDate(e.premiereDate) || baseQuarter) === selected
      ),
    [entries, selected, baseQuarter]
  );

  const genreOptions = useMemo(() => {
    const set = new Set<string>();
    for (const e of quarterEntries) for (const g of e.genres || []) set.add(g);
    return [...set].sort((a, b) => a.localeCompare(b, 'de'));
  }, [quarterEntries]);

  // Voll gefilterte, sichtbare Liste (Modus + Provider + Genre), datiert sortiert.
  const visible = useMemo(() => {
    const list = quarterEntries.filter((e) => {
      if (filter.mode === 'new' && e.type !== 'new') return false;
      if (filter.mode === 'season' && e.type !== 'season') return false;
      if (filter.genre && !(e.genres || []).includes(filter.genre)) return false;
      return true;
    });
    return list.sort((a, b) =>
      a.premiereDate < b.premiereDate ? -1 : a.premiereDate > b.premiereDate ? 1 : 0
    );
  }, [quarterEntries, filter]);

  const inListCount = useMemo(
    () => visible.filter((e) => inListIds.has(e.tmdbId)).length,
    [visible, inListIds]
  );

  // Hero: nächste Premiere ab HEUTE (frühestes zukünftiges Datum), sonst die
  // früheste des Monats.
  const startOfToday = useMemo(() => {
    const d = new Date(now);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  }, [now]);

  const hero = useMemo(() => {
    if (!visible.length) return null;
    const upcoming = visible.find((e) => {
      const d = parsePremiereDate(e.premiereDate);
      return d && d.getTime() >= startOfToday;
    });
    return upcoming || visible[0];
  }, [visible, startOfToday]);

  const heroIsFuture = useMemo(() => {
    if (!hero) return false;
    const d = parsePremiereDate(hero.premiereDate);
    return !!d && d.getTime() >= startOfToday;
  }, [hero, startOfToday]);

  // Timeline nach Tag gruppieren.
  const dayGroups = useMemo<DayGroup[]>(() => {
    const nowDate = new Date(now);
    const byDay = new Map<string, DayGroup>();
    for (const entry of visible) {
      const date = parsePremiereDate(entry.premiereDate);
      const key = entry.premiereDate;
      let group = byDay.get(key);
      if (!group) {
        group = {
          key,
          label: date ? dayLabel(date) : t('Termin offen'),
          relative: date ? relativeDayLabel(date, nowDate) : null,
          isToday: !!date && sameYmd(date, nowDate),
          isPast: !!date && date.getTime() < startOfToday,
          items: [],
        };
        byDay.set(key, group);
      }
      group.items.push(entry);
    }
    return [...byDay.values()];
  }, [visible, now, startOfToday]);

  const openEntry = (entry: TvPremiereStaticEntry) => {
    navigate(`/series/${entry.tmdbId}`);
  };

  /** „+"-Button: direkt in die Liste adden (/add via backendFetch, wie
   *  Discover/Search). Liste aktualisiert sich über den RTDB-Listener — kein
   *  manuelles State-Setzen (Write-Rule). */
  const addEntry = async (entry: TvPremiereStaticEntry) => {
    if (!user) {
      showToast(t('Bitte einloggen, um Inhalte hinzuzufügen'), 2500, 'info');
      return;
    }
    if (addingId !== null) return;
    setAddingId(entry.tmdbId);
    try {
      const response = await backendFetch('/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: import.meta.env.VITE_USER, id: entry.tmdbId, uuid: user.uid }),
      });
      if (!response.ok) throw new Error(`add failed: ${response.status}`);
      hapticSuccess();
      showToast(t('„{title}" hinzugefügt', { title: entry.title }), 2500, 'success');
      trackSeriesAdded(String(entry.tmdbId), entry.title, 'serien-kalender');
      await logSeriesAdded(user.uid, entry.title, entry.tmdbId);
    } catch {
      showToast(t('Hinzufügen fehlgeschlagen'), 2500, 'error');
    } finally {
      setAddingId(null);
    }
  };

  const handleQuarterChange = (id: string) => {
    hapticSelect();
    setSelected(id);
  };

  const renderGrid = (items: TvPremiereStaticEntry[]) => (
    <div className="as-grid">
      {items.map((entry, index) => {
        const inList = inListIds.has(entry.tmdbId);
        return (
          <SerienKalenderCard
            key={`${entry.tmdbId}-${entry.type}-${entry.seasonNumber ?? 0}`}
            entry={entry}
            inList={inList}
            now={now}
            staggerIndex={index}
            onOpen={() => openEntry(entry)}
            onAdd={inList ? undefined : () => void addEntry(entry)}
            adding={addingId === entry.tmdbId}
          />
        );
      })}
    </div>
  );

  // Angeglichen an AnimeSeasonPage.renderSectionTitle (Design-Konsistenz:
  // gleiche Display-Font, Gaps und Margins über beide Kalender-Seiten).
  const renderSectionTitle = (icon: React.ReactNode, title: string) => (
    <h2
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        margin: '0 0 var(--space-3)',
        fontSize: '20px',
        fontFamily: 'var(--font-display)',
        fontWeight: 800,
        letterSpacing: '-0.01em',
      }}
    >
      <span
        style={{
          display: 'flex',
          color: currentTheme.primary,
          filter: `drop-shadow(0 0 6px ${currentTheme.primary}60)`,
        }}
      >
        {icon}
      </span>
      <span style={{ color: currentTheme.text.secondary }}>{title}</span>
    </h2>
  );

  const subtitle = loading
    ? t('Neue Serien & Staffeln entdecken')
    : `${quarterLabel(selectedDate)} · ${
        visible.length === 1
          ? t('{n} Premiere', { n: visible.length })
          : t('{n} Premieren', { n: visible.length })
      }${inListCount > 0 ? ` · ${t('{n} in deiner Liste', { n: inListCount })}` : ''}`;

  const sectionIconStyle = { fontSize: '20px' } as const;

  return (
    <PageLayout>
      <PageHeader
        title={t('Serien-Kalender')}
        subtitle={subtitle}
        gradientFrom={lightenColor(currentTheme.primary, 0.2)}
        gradientTo={lightenColor(currentTheme.primary, 0.2)}
        icon={<CalendarMonth style={{ fontSize: '28px' }} />}
      />

      {/* Monats-Switcher (Vormonat · aktuell · nächster). */}
      <TabSwitcher
        tabs={quarterTabs.map((tab) => ({ id: quarterKey(tab), label: quarterRangeShort(tab) }))}
        activeTab={selected}
        onTabChange={handleQuarterChange}
        className="ui-tabs--center"
        style={{ marginBottom: '12px' }}
      />

      {/* Filterleiste: Modus-Segmented + Genre-Dropdown. (Kein „Mit Provider"-
          Toggle mehr — der Backend-Export enthält ohnehin nur Titel mit einem
          großen DE-Provider, der Toggle wäre wirkungslos.) */}
      <div className="as-filterbar">
        <TabSwitcher
          tabs={MODE_TABS}
          activeTab={filter.mode}
          onTabChange={(id) => {
            hapticSelect();
            setFilter((f) => ({ ...f, mode: id as FilterMode }));
          }}
          style={{ flexShrink: 0, margin: 0 }}
        />

        {genreOptions.length > 0 && (
          <SerienKalenderFilter
            options={genreOptions}
            value={filter.genre}
            onChange={(genre) => setFilter((f) => ({ ...f, genre }))}
            icon={<Category style={{ fontSize: '18px' }} />}
            allLabel={t('Alle Genres')}
            searchPlaceholder={t('Genre suchen …')}
          />
        )}
      </div>

      <div
        style={{
          padding: '0 20px calc(100px + env(safe-area-inset-bottom))',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {loading && (
          <div
            className="as-skeletons"
            role="status"
            aria-label={t('Serien-Kalender wird geladen')}
          >
            <Skeleton
              width="100%"
              shape="card"
              style={{ height: 'clamp(300px, 32vw, 400px)', marginBottom: '24px' }}
            />
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
              icon: <LiveTv style={{ fontSize: '48px' }} />,
              title: t('Premieren nicht erreichbar'),
              description: t('Die Premieren-Daten konnten nicht geladen werden.'),
              onRetry: () => setReloadKey((key) => key + 1),
            }}
          />
        )}

        {!loading && !failed && visible.length === 0 && (
          <EmptyState
            icon={<CalendarMonth style={{ fontSize: '48px' }} />}
            title={t('Keine Premieren')}
            description={t('Für {q} sind mit diesen Filtern keine Premieren gelistet.', {
              q: quarterLabel(selectedDate),
            })}
          />
        )}

        {!loading && !failed && visible.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
            {/* Hero-Spotlight */}
            {hero && (
              <SerienKalenderHero
                entry={hero}
                eyebrow={heroIsFuture ? t('Nächste Premiere') : t('Highlight des Monats')}
                inList={inListIds.has(hero.tmdbId)}
                onOpen={() => openEntry(hero)}
                adding={addingId === hero.tmdbId}
                onAdd={inListIds.has(hero.tmdbId) ? undefined : () => void addEntry(hero)}
              />
            )}

            {/* Premieren-Kalender: Timeline */}
            <section>
              {renderSectionTitle(
                <CalendarMonth style={sectionIconStyle} />,
                t('Premieren-Kalender ({n})', { n: visible.length })
              )}
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
                          color: group.isPast
                            ? currentTheme.text.muted
                            : currentTheme.text.secondary,
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
                    {renderGrid(group.items)}
                  </div>
                ))}
              </div>
              <p className="as-source-hint" style={{ color: currentTheme.text.muted }}>
                <InfoOutlined style={{ fontSize: '14px', flexShrink: 0 }} />
                {t(
                  'Neue Serien & Staffeln mit deutscher Verfügbarkeit (TMDB) — täglich aktualisiert'
                )}
              </p>
            </section>
          </div>
        )}
      </div>

      <ScrollToTopButton scrollContainerSelector=".mobile-content" />
    </PageLayout>
  );
};

/** Tag-genauer Vergleich (lokal). */
function sameYmd(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
