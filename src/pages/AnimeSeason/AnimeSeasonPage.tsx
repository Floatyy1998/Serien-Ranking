/**
 * Feature „Anime-Season-Kalender" — „Was läuft diese Anime-Season?"
 *
 * Aufbau „Premieren-Countdown-Board" (volle Breite auf jedem Viewport):
 *   0. Hero — Cinematic Spotlight der nächsten großen Premiere in voller
 *      Breite (frühestes zukünftiges Startdatum, Popularität als Tie-Break;
 *      Fallback: populärster laufender Neustart) mit Live-Countdown-Tiles.
 *   1. „Premieren-Kalender" — DIE Timeline der ganzen Season: vertikale
 *      Glow-Spine mit einem Datums-Node pro Tag, beginnend beim Season-Start
 *      (vergangene Tage gedimmt, Karten sagen „LÄUFT"), „HEUTE" pulsiert,
 *      Zukunft mit relativer Pill („Morgen"/„in 5 Tagen"). Daneben ein
 *      EINHEITLICHES Querformat-Karten-Grid (auto-fill). Einträge ohne
 *      volles Datum: „Start noch offen" (dashed Node) am Ende.
 *   2. „Fortlaufend" — RELEASING aus den letzten zwei Seasons.
 *   3. „Bereits beendet" — klein am Ende.
 *
 * Serien UND Filme: die AniList-Query liefert alle Formate. Jede Karte trägt
 * ein Format-Badge („Serie" [inkl. TV/ONA] / „Film" / OVA / Special / …);
 * im FILTER zählt alles außer MOVIE als Serie. Oben: Segmented-Control
 * „Alle · Serien · Filme" (TabSwitcher) + „Mit Provider"-Toggle (blendet
 * Einträge ohne DE-Provider aus, sobald ihre Hydration das meldet) — beides
 * sticky pro Session. Filme werden über die TMDB-Movie-Suche aufgelöst
 * (→ /movie/), nicht gegen die Serienliste gematcht und vom TVMaze-
 * Datums-Check ausgenommen.
 *
 * Progressive TMDB-Hydration: nach dem Season-Fetch werden unmatched
 * Einträge throttled (max. 5 parallel) via resolveTmdbInfo aufgelöst —
 * deutsches overview + DE-Provider-Logos (normalisiert wie überall in der
 * App) + TVMaze-geprüfter Premierentermin wandern nachträglich in Hero +
 * Karten (sessionStorage-gecacht). Einträge aus der eigenen Liste
 * hydratisieren ohne Request direkt aus dem Series-Objekt.
 * Datums-Priorität: eigener Kalender (Liste) → TVMaze → AniList (AniList
 * führt den japanischen TV-Termin, der vom DE-Release abweichen kann).
 * Klick → SeriesDetail über die bereits aufgelöste tmdbId.
 */

import React, {
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate, useNavigationType } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Animation,
  ArrowDownward,
  Autorenew,
  CalendarMonth,
  InfoOutlined,
  SmartDisplay,
  TaskAlt,
} from '@mui/icons-material';
import {
  EmptyState,
  PageHeader,
  PageLayout,
  PageState,
  ScrollToTopButton,
  Skeleton,
  TabSwitcher,
} from '../../components/ui';
import { useAuth } from '../../AuthContext';
import { trackMovieAdded, trackSeriesAdded } from '../../firebase/analytics';
import { logMovieAdded, logSeriesAdded } from '../../features/badges/minimalActivityLogger';
import { backendFetch } from '../../lib/backendApi';
import { useTheme } from '../../contexts/ThemeContextDef';
import { tmdbLogoUrl } from '../../hooks/useProviderLogos';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useScrollRestore } from '../../hooks/useScrollRestore';
import { normalizeProviderName } from '../../lib/validation/providerChangeDetection';
import { hapticSelect, hapticSuccess, hapticTap } from '../../lib/haptics';
import { showToast } from '../../lib/toast';
import { tapScaleSmall } from '../../lib/motion';
import { getOptimalTextColor, lightenColor } from '../../theme/colorUtils';
import { getEpisodeAirDate } from '../../utils/episodeDate';
import { fetchStaticCatalogSeasonsBulk, fetchStaticSeasonalAnime } from '../../lib/staticCatalog';
import type { SeasonalAnimeStaticEntry } from '../../lib/staticCatalog';
import { getProviderLogoUrl } from '../../lib/providerMerge';
import type { CatalogEpisode, CatalogSeason } from '../../types/CatalogTypes';
import {
  fetchContinuingAnime,
  fetchSeasonAnime,
  getCurrentSeason,
  seasonKey,
  seasonLabel,
  shiftSeason,
} from '../../services/anilistSeasonService';
import type { ContinuingAnime, SeasonAnime, SeasonRef } from '../../services/anilistSeasonService';
import type { Series } from '../../types/Series';
import { AnimeSeasonCard } from './AnimeSeasonCard';
import { AnimeSeasonHero } from './AnimeSeasonHero';
import { AnimeSeasonStudioFilter } from './AnimeSeasonStudioFilter';
import { dayLabel, isSameDay, relativeDayLabel, startDateToDate } from './animeFormat';
import { readResolveCacheSync, resolveTmdbInfo } from './resolveTmdbId';
import type { ResolvedTmdbInfo, TmdbProviderInfo } from './resolveTmdbId';
import { useAnimeListMatch } from './useAnimeListMatch';
import './AnimeSeasonPage.css';

/** Max. parallele TMDB-Auflösungen der progressiven Hydration. */
const RESOLVE_CONCURRENCY = 5;

interface DecoratedAnime {
  anime: SeasonAnime;
  match?: Series;
  /** Nur „Fortlaufend": Label der Ursprungs-Season („Frühling 2026"). */
  sinceLabel?: string;
}

/** Tages-Gruppe der Premieren-Timeline. */
interface DayGroup {
  key: string;
  /** „FREITAG · 3. JULI" bzw. „Start noch offen". */
  label: string;
  /** „Heute" / „Morgen" / „in 5 Tagen" — null außerhalb der nahen Zukunft. */
  relative: string | null;
  isToday: boolean;
  /** Premiere liegt in der Vergangenheit — gedimmter Node/Label. */
  isPast: boolean;
  /** Kein volles Startdatum — dashed Node am Timeline-Ende. */
  isTba: boolean;
  items: DecoratedAnime[];
}

/** Volles Startdatum (Jahr+Monat+Tag) — sonst null → „Start noch offen". */
function fullStartDate(anime: SeasonAnime): Date | null {
  const sd = anime.startDate;
  if (!sd?.year || !sd.month || !sd.day) return null;
  return new Date(sd.year, sd.month - 1, sd.day);
}

const byPopularity = (a: DecoratedAnime, b: DecoratedAnime) =>
  (b.anime.popularity ?? 0) - (a.anime.popularity ?? 0);

/** Braucht der Eintrag eine TMDB-Auflösung? Listen-Matches nur, wenn ihnen
 *  Katalog-Daten fehlen (vote_average führt der Katalog nicht, beschreibung
 *  teils nicht) — Provider kommen für Matches weiter aus der Liste. */
const needsResolveEntry = (entry: DecoratedAnime) =>
  !entry.match ||
  !(typeof entry.match.vote_average === 'number' && entry.match.vote_average > 0) ||
  !entry.match.beschreibung?.trim();

/** Fenster, in dem eine Katalog-Episode als „dieselbe Premiere" gilt. */
const CALENDAR_MATCH_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

/**
 * Premierentermin aus dem eigenen Kalender (Katalog/TVMaze, inkl.
 * Midnight-Quirk-Korrektur): die Episode der gematchten Serie, deren
 * Sendetermin dem AniList-Startdatum am nächsten liegt (±3 Tage).
 * AniList liefert den japanischen TV-Termin — der DE-Simulcast im eigenen
 * Kalender kann davon abweichen; für Serien in der Liste soll der
 * Season-Kalender exakt dasselbe Datum zeigen wie der Serien-Kalender.
 */
function calendarPremiereDate(match: Series, anilistDate: Date): Date | null {
  let best: Date | null = null;
  let bestDiff = CALENDAR_MATCH_WINDOW_MS + 1;
  for (const season of match.seasons ?? []) {
    for (const episode of season.episodes ?? []) {
      const date = getEpisodeAirDate(episode);
      if (!date) continue;
      const diff = Math.abs(date.getTime() - anilistDate.getTime());
      if (diff <= CALENDAR_MATCH_WINDOW_MS && diff < bestDiff) {
        best = date;
        bestDiff = diff;
      }
    }
  }
  return best;
}

/** AniList-Eintrag mit dem Kalender-Datum der eigenen Liste überschreiben
 *  (nur wenn eine Katalog-Episode im ±3-Tage-Fenster existiert). */
function withCalendarDate(anime: SeasonAnime, match: Series): SeasonAnime {
  const anilistDate = fullStartDate(anime);
  if (!anilistDate) return anime;
  const calendarDate = calendarPremiereDate(match, anilistDate);
  if (!calendarDate) return anime;
  const corrected = {
    year: calendarDate.getFullYear(),
    month: calendarDate.getMonth() + 1,
    day: calendarDate.getDate(),
  };
  const sd = anime.startDate;
  if (sd?.year === corrected.year && sd.month === corrected.month && sd.day === corrected.day) {
    return anime;
  }
  return { ...anime, startDate: corrected };
}

/** Premierentermin aus dem STATISCHEN Katalog (Bulk-Seasons, alle Serien —
 *  auch die ohne Listen-Eintrag; der Backend-Cron nimmt Seasonal-Anime mit
 *  DE-Provider automatisch auf): Episode im ±3-Tage-Fenster ums
 *  AniList-Datum, gleiche Quelle wie der Serien-Kalender. */
function catalogBulkPremiereDate(
  seasons: Record<string, CatalogSeason>,
  anilistDate: Date
): Date | null {
  let best: Date | null = null;
  let bestDiff = CALENDAR_MATCH_WINDOW_MS + 1;
  for (const season of Object.values(seasons)) {
    // Sparse-Object-Quirk: episodes kann bei manchen Katalog-Einträgen als
    // Objekt statt Array serialisiert sein (vgl. seriesAdapter.ensureArray).
    const rawEpisodes = season?.episodes;
    const episodes: CatalogEpisode[] = Array.isArray(rawEpisodes)
      ? rawEpisodes
      : rawEpisodes && typeof rawEpisodes === 'object'
        ? (Object.values(rawEpisodes) as CatalogEpisode[])
        : [];
    for (const episode of episodes) {
      if (!episode) continue; // sparse Arrays: Index 0 kann fehlen
      const date = getEpisodeAirDate({
        airstamp: episode.airstamp ?? undefined,
        airDate: episode.airDate ?? undefined,
      });
      if (!date) continue;
      const diff = Math.abs(date.getTime() - anilistDate.getTime());
      if (diff <= CALENDAR_MATCH_WINDOW_MS && diff < bestDiff) {
        best = date;
        bestDiff = diff;
      }
    }
  }
  return best;
}

/** AniList-Eintrag mit einem Date-Objekt überschreiben (Tag-Genauigkeit). */
function withDate(anime: SeasonAnime, date: Date): SeasonAnime {
  const corrected = {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
  const sd = anime.startDate;
  if (sd?.year === corrected.year && sd.month === corrected.month && sd.day === corrected.day) {
    return anime;
  }
  return { ...anime, startDate: corrected };
}

/** AniList-Startdatum mit dem TVMaze-geprüften Termin („YYYY-MM-DD") aus der
 *  progressiven Auflösung überschreiben. */
function withPremiereDate(anime: SeasonAnime, iso: string): SeasonAnime {
  const [year, month, day] = iso.split('-').map(Number);
  if (!year || !month || !day) return anime;
  const sd = anime.startDate;
  if (sd?.year === year && sd.month === month && sd.day === day) return anime;
  return { ...anime, startDate: { year, month, day } };
}

/** ALLE Season-Neustarts nach Premieren-TAG gruppieren — die Timeline
 *  beginnt beim Season-Start (Vergangenheit gedimmt), Datum-lose ans Ende. */
function buildDayGroups(entries: DecoratedAnime[], now: Date): DayGroup[] {
  const byDay = new Map<number, { date: Date; items: DecoratedAnime[] }>();
  const tba: DecoratedAnime[] = [];
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  for (const entry of entries) {
    const date = fullStartDate(entry.anime);
    if (!date) {
      tba.push(entry);
      continue;
    }
    const bucket = byDay.get(date.getTime());
    if (bucket) bucket.items.push(entry);
    else byDay.set(date.getTime(), { date, items: [entry] });
  }

  const groups: DayGroup[] = [...byDay.values()]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map(({ date, items }) => ({
      key: `d-${date.getTime()}`,
      label: dayLabel(date),
      relative: relativeDayLabel(date, now),
      isToday: isSameDay(date, now),
      isPast: date.getTime() < startOfToday,
      isTba: false,
      items: items.sort(byPopularity),
    }));

  if (tba.length) {
    groups.push({
      key: 'tba',
      label: 'Start noch offen',
      relative: null,
      isToday: false,
      isPast: false,
      isTba: true,
      items: tba.sort(byPopularity),
    });
  }
  return groups;
}

/** Hero-Kandidat: früheste zukünftige Premiere, sonst populärster Neustart. */
function pickHero(entries: DecoratedAnime[], now: Date): DecoratedAnime | null {
  const future = entries
    .filter((entry) => {
      const date = fullStartDate(entry.anime);
      return !!date && date.getTime() > now.getTime();
    })
    .sort(
      (a, b) =>
        (fullStartDate(a.anime)?.getTime() ?? 0) - (fullStartDate(b.anime)?.getTime() ?? 0) ||
        (b.anime.popularity ?? 0) - (a.anime.popularity ?? 0)
    );
  if (future.length) return future[0];

  const running = entries.filter((entry) => entry.anime.status === 'RELEASING');
  if (!running.length) return null;
  return running.reduce((best, entry) =>
    (entry.anime.popularity ?? 0) > (best.anime.popularity ?? 0) ? entry : best
  );
}

/** Provider-Logos aus dem eigenen Series-Objekt — dieselbe Normalisierung
 *  (normalizeProviderName) wie Detail-Seiten/Home, dedupliziert. */
function seriesProviders(series: Series): TmdbProviderInfo[] {
  const list = series.provider?.provider;
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  const result: TmdbProviderInfo[] = [];
  for (const entry of list) {
    if (!entry?.name) continue;
    const normalized = normalizeProviderName(entry.name);
    if (!normalized || seen.has(normalized)) continue;
    const logo = tmdbLogoUrl(entry.logo, 'w92');
    if (!logo) continue;
    seen.add(normalized);
    result.push({ name: normalized, logo });
  }
  return result;
}

const SCROLL_KEY = 'animeSeason-scroll';
const SEASON_STORAGE_KEY = 'animeSeason-selected';
const FILTER_STORAGE_KEY = 'animeSeason-filter';

/** Format-Auswahl (exklusiv, Segmented-Control): alles außer MOVIE = Serie. */
type FormatMode = 'all' | 'series' | 'movies';

interface SeasonFilter {
  mode: FormatMode;
  /** Nur Einträge mit mindestens einem DE-Provider (nach Hydration). */
  providerOnly: boolean;
  /** Studio-Name (AniList) — '' = alle Studios. */
  studio: string;
}

/** Studios eines AniList-Eintrags (alle Nodes, leere raus). */
function animeStudios(anime: SeasonAnime): string[] {
  return (anime.studios?.nodes ?? []).map((n) => n?.name).filter((n): n is string => !!n);
}

const FORMAT_TABS = [
  { id: 'all', label: 'Alle' },
  { id: 'series', label: 'Serien' },
  { id: 'movies', label: 'Filme' },
];

export const AnimeSeasonPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const { matchAnime } = useAnimeListMatch();
  const reducedMotion = useReducedMotion();
  // „Jetzt" einmalig einfrieren (react-hooks/purity: kein Date.now() im Render).
  const [now] = useState(() => new Date());

  // Aktuelle Season als Default, ±1 navigierbar. Die Tabs rotieren mit der
  // echten Jahreszeit (getCurrentSeason) — shiftSeason trägt den
  // Jahresübergang (Herbst 2026 → Winter 2027).
  const currentSeason = useMemo(() => getCurrentSeason(now), [now]);
  const seasonTabs = useMemo(
    () => [shiftSeason(currentSeason, -1), currentSeason, shiftSeason(currentSeason, 1)],
    [currentSeason]
  );
  const navigationType = useNavigationType();
  const [selected, setSelected] = useState<SeasonRef>(() => {
    // Zurück-Navigation (Detailseite → back): zuletzt gewählten Tab
    // wiederherstellen — sonst sprang z. B. „Herbst" auf „Sommer" zurück.
    if (navigationType === 'POP') {
      try {
        const saved = sessionStorage.getItem(SEASON_STORAGE_KEY);
        const restored = saved ? seasonTabs.find((tab) => seasonKey(tab) === saved) : undefined;
        if (restored) return restored;
      } catch {
        /* sessionStorage nicht verfügbar — Default reicht */
      }
    }
    return currentSeason;
  });

  // Auswahl fortlaufend merken (auch den Default beim frischen Besuch —
  // sonst würde ein POP später eine stale Auswahl aus einem früheren
  // Seitenbesuch derselben Session wiederbeleben).
  useEffect(() => {
    try {
      sessionStorage.setItem(SEASON_STORAGE_KEY, seasonKey(selected));
    } catch {
      /* quota — ignorieren */
    }
  }, [selected]);

  // Serien/Filme-Auswahl + Provider-Filter — sticky pro Session.
  const [filter, setFilter] = useState<SeasonFilter>(() => {
    try {
      const raw = sessionStorage.getItem(FILTER_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SeasonFilter;
        if (
          (parsed?.mode === 'all' || parsed?.mode === 'series' || parsed?.mode === 'movies') &&
          typeof parsed?.providerOnly === 'boolean'
        ) {
          return {
            mode: parsed.mode,
            providerOnly: parsed.providerOnly,
            studio: typeof parsed.studio === 'string' ? parsed.studio : '',
          };
        }
      }
    } catch {
      /* kaputter Eintrag — Default reicht */
    }
    return { mode: 'all', providerOnly: false, studio: '' };
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filter));
    } catch {
      /* quota — ignorieren */
    }
  }, [filter]);

  const handleFormatMode = (id: string) => {
    if (id === filter.mode) return;
    hapticSelect();
    setFilter((prev) => ({ ...prev, mode: id as FormatMode }));
  };

  const toggleProviderOnly = () => {
    hapticSelect();
    setFilter((prev) => ({ ...prev, providerOnly: !prev.providerOnly }));
  };

  const handleStudioChange = (studio: string) => {
    hapticSelect();
    setFilter((prev) => ({ ...prev, studio }));
  };

  // Die Filterleiste liest `filter` (Farbe togglet SOFORT); die teuren
  // Memos (Timeline/Grids, ~100 Karten) hängen am deferred Wert — sonst
  // färbt der Button erst um, wenn der komplette Re-Render durch ist.
  const deferredFilter = useDeferredValue(filter);

  const [items, setItems] = useState<SeasonAnime[]>([]);
  const [continuing, setContinuing] = useState<ContinuingAnime[]>([]);

  // Studio-Optionen: alle in der Season vorkommenden Studios, alphabetisch.
  const studioOptions = useMemo(() => {
    const set = new Set<string>();
    for (const anime of items) for (const s of animeStudios(anime)) set.add(s);
    for (const entry of continuing) for (const s of animeStudios(entry.anime)) set.add(s);
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [items, continuing]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  /** AniList-Id, für die gerade eine KLICK-Auflösung läuft (sperrt Klicks). */
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  /** AniList-Id, für die gerade ein „Zur Liste"-Add läuft. */
  const [addingId, setAddingId] = useState<number | null>(null);
  /** Progressiv aufgelöste TMDB-Infos, keyed by AniList-Id. */
  const [resolved, setResolved] = useState<Record<number, ResolvedTmdbInfo>>({});
  /** SessionStorage-Cache einmal synchron eingelesen — bereits aufgelöste
   *  Einträge zeigen deutsche Beschreibung + Provider sofort beim Mount
   *  (kein EN→DE-Flash beim Zurücknavigieren). */
  const [cachedResolved] = useState<Record<string, ResolvedTmdbInfo>>(() => readResolveCacheSync());
  /** Bulk-Seasons des statischen Katalogs (IDB-gecacht, kein Extra-Egress) —
   *  Termin-Quelle auch für Anime OHNE Listen-Eintrag: der Backend-Cron
   *  nimmt Seasonal-Anime mit DE-Provider automatisch in den Katalog auf. */
  const [catalogSeasons, setCatalogSeasons] = useState<Record<
    string,
    Record<string, CatalogSeason>
  > | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchStaticCatalogSeasonsBulk()
      .then((data) => {
        if (!cancelled) setCatalogSeasons(data);
      })
      .catch(() => {
        /* best-effort — ohne Bulk-Daten bleibt TVMaze/AniList */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /** Server-Export (catalog/seasonal-anime.json): täglich vorgerechnete
   *  TMDB-Daten pro AniList-Id — erspart die Client-Hydration fast komplett.
   *  ready gated die Hydration, damit sie nicht losläuft, bevor klar ist,
   *  was der Server schon abdeckt. */
  const [serverSeasonal, setServerSeasonal] = useState<Record<
    string,
    SeasonalAnimeStaticEntry
  > | null>(null);
  const [serverSeasonalReady, setServerSeasonalReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchStaticSeasonalAnime()
      .then((data) => {
        if (!cancelled) setServerSeasonal(data);
      })
      .catch(() => {
        /* best-effort — ohne Export volle Client-Hydration */
      })
      .finally(() => {
        if (!cancelled) setServerSeasonalReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /** Server-Export → ResolvedTmdbInfo-Shape (Provider App-normalisiert,
   *  Logos aus TMDB bzw. lokaler Provider-Map). */
  const serverResolved = useMemo(() => {
    const map: Record<number, ResolvedTmdbInfo> = {};
    if (!serverSeasonal) return map;
    for (const [anilistId, entry] of Object.entries(serverSeasonal)) {
      if (!entry?.tmdbId) continue;
      const seen = new Set<string>();
      const providers: TmdbProviderInfo[] = [];
      for (const provider of entry.providers ?? []) {
        const normalized = normalizeProviderName(provider.name);
        if (!normalized || seen.has(normalized)) continue;
        const logo = provider.logo || getProviderLogoUrl(normalized);
        if (!logo) continue;
        seen.add(normalized);
        providers.push({ name: normalized, logo });
      }
      map[Number(anilistId)] = {
        tmdbId: entry.tmdbId,
        mediaType: 'tv',
        overviewDe: entry.overviewDe,
        providers,
        premiereDate: null,
        tmdbRating: entry.rating,
        genres: entry.genres ?? [],
      };
    }
    return map;
  }, [serverSeasonal]);

  /** Ids, für die die Hintergrund-Auflösung bereits angestoßen wurde. */
  const startedRef = useRef<Set<number>>(new Set());
  /** Puffer der Hintergrund-Auflösungen — GEBÜNDELT geflusht: pro Eintrag
   *  einzeln committet wanderten Karten sichtbar einzeln durch die Timeline
   *  („Nachrendern"); so gibt es wenige ruhige Wellen statt Dauergeruckel. */
  const pendingResolvedRef = useRef<Record<number, ResolvedTmdbInfo>>({});
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const queueResolved = React.useCallback((id: number, info: ResolvedTmdbInfo) => {
    pendingResolvedRef.current[id] = info;
    if (flushTimerRef.current) return;
    flushTimerRef.current = setTimeout(() => {
      flushTimerRef.current = null;
      const batch = pendingResolvedRef.current;
      pendingResolvedRef.current = {};
      setResolved((prev) => ({ ...prev, ...batch }));
    }, 1200);
  }, []);

  useEffect(
    () => () => {
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
    },
    []
  );

  /** Hydration-Status: solange aktiv, zeigt die Seite ein Skeleton mit
   *  Fortschritt — erst wenn ALLE Auflösungen da sind, rendert der Inhalt
   *  (kein sichtbares Nachrendern/Umsortieren mehr). Mit warmem Session-
   *  Cache ist pending leer → Seite erscheint sofort. */
  const [hydration, setHydration] = useState<{ active: boolean; done: number; total: number }>({
    active: false,
    done: 0,
    total: 0,
  });
  /** „Fortlaufend"-Sektion — Ziel des Schnell-Scroll-Chips. */
  const continuingRef = useRef<HTMLElement | null>(null);
  /** Spät-Restore nur einmal (nicht bei jedem Season-Wechsel). */
  const lateRestoreRef = useRef(false);

  // Scroll-Position merken (wie Ratings/Activity): Save + POP-Erkennung über
  // den Hook; dessen Mount-Restore läuft hier aber ins Leere, weil die Season
  // asynchron lädt (Seite noch leer → scrollTop klemmt auf 0).
  useScrollRestore(SCROLL_KEY, '.mobile-content', { restoreOnPop: true });

  // … deshalb EIN Spät-Restore, sobald der Inhalt steht. Auf Nicht-POP-
  // Navigation hat der Hook den Key schon entfernt → no-op.
  useEffect(() => {
    if (loading || !serverSeasonalReady || hydration.active || lateRestoreRef.current) return;
    lateRestoreRef.current = true;
    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (!saved) return;
    requestAnimationFrame(() => {
      const container = document.querySelector('.mobile-content');
      if (container) container.scrollTop = parseInt(saved, 10);
    });
  }, [loading, serverSeasonalReady, hydration.active]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setItems([]);
    setContinuing([]);

    // ALLE relevanten Seiten sofort laden (kein „Mehr laden"-Button mehr —
    // das Nachrendern beim Klick war störend). Cap bei 3 Seiten/150
    // Einträgen: AniList sortiert nach Popularität, dahinter kommen nur
    // noch Recaps/Kurz-ONAs. Fehler ab Seite 2 sind best-effort.
    (async () => {
      const MAX_SEASON_PAGES = 3;
      const collected: SeasonAnime[] = [];
      const seen = new Set<number>();
      try {
        for (let pageNo = 1; pageNo <= MAX_SEASON_PAGES; pageNo++) {
          const result = await fetchSeasonAnime(selected, pageNo);
          for (const anime of result.media) {
            if (!seen.has(anime.id)) {
              seen.add(anime.id);
              collected.push(anime);
            }
          }
          if (!result.hasNextPage) break;
        }
        if (!cancelled) setItems(collected);
      } catch (err: unknown) {
        if (cancelled) return;
        if (collected.length) {
          // Seite 1 war da — zeigen, was wir haben.
          setItems(collected);
        } else {
          setError(err instanceof Error ? err.message : 'AniList ist gerade nicht erreichbar.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    // „Fortlaufend" ist best-effort — ein Fehler hier reißt die Seite nicht um.
    fetchContinuingAnime(selected)
      .then((result) => {
        if (!cancelled) setContinuing(result);
      })
      .catch((err: unknown) => {
        console.warn('[animeSeason] Fortlaufend-Query fehlgeschlagen', err);
        if (!cancelled) setContinuing([]);
      });

    return () => {
      cancelled = true;
    };
  }, [selected, reloadKey]);

  // ── Hero + Sektionen ───────────────────────────────────────────────────────
  // ── Basis-Entries (ohne Datums-Korrekturen) ────────────────────────────────
  // Getrennt vom Display-Memo. Recomputes durch eintreffende Auflösungen sind
  // ok: die Hydration-Pipeline hängt am pendingKey-Fingerprint + Refs, nicht
  // an der Array-Identität von allEntries.
  const { newThisSeason, continuingEntries, finishedEntries, allEntries, totalCount, inListCount } =
    useMemo(() => {
      // Filme NICHT gegen die Serienliste matchen — Basistitel-/Franchise-
      // Heuristiken würden den Film sonst auf die gleichnamige Serie mappen.
      // Bereits aufgelöste TMDB-Ids (Server-Export/Hydration) matchen exakt —
      // faengt Eintraege, deren Titel-Heuristik am deutschen Katalog-Titel
      // scheitert (AniList liefert english/romaji). Die Hydration-Pipeline
      // vertraegt die Recomputes: sie haengt am pendingKey-Fingerprint, nicht
      // an der Array-Identitaet von allEntries.
      const decorate = (anime: SeasonAnime): DecoratedAnime => {
        const info =
          resolved[anime.id] ?? cachedResolved[String(anime.id)] ?? serverResolved[anime.id];
        return {
          anime,
          match:
            anime.format === 'MOVIE'
              ? undefined
              : matchAnime(anime, info?.mediaType === 'movie' ? null : info?.tmdbId),
        };
      };

      const seasonEntries = items.map(decorate);
      const seasonIds = new Set(items.map((anime) => anime.id));
      const contAll: DecoratedAnime[] = continuing
        .filter((entry) => !seasonIds.has(entry.anime.id))
        .map((entry) => ({
          ...decorate(entry.anime),
          sinceLabel: seasonLabel(entry.origin),
        }));

      // Format-Auswahl anwenden (alles außer MOVIE zählt als Serie).
      const passesFilter = (entry: DecoratedAnime) =>
        deferredFilter.mode === 'all' ||
        (entry.anime.format === 'MOVIE'
          ? deferredFilter.mode === 'movies'
          : deferredFilter.mode === 'series');
      const filtered = seasonEntries.filter(passesFilter);
      const cont = contAll.filter(passesFilter);

      const fresh = filtered.filter((entry) => entry.anime.status !== 'FINISHED');
      const finished = filtered.filter((entry) => entry.anime.status === 'FINISHED');

      // Anzeige-/Resolve-Reihenfolge (AniList liefert popularitätssortiert).
      const all = [...fresh, ...cont, ...finished];
      return {
        newThisSeason: fresh,
        continuingEntries: cont,
        finishedEntries: finished,
        allEntries: all,
        totalCount: all.length,
        inListCount: all.filter((entry) => entry.match).length,
      };
    }, [
      items,
      continuing,
      matchAnime,
      deferredFilter.mode,
      resolved,
      cachedResolved,
      serverResolved,
    ]);

  // ── Hero + Timeline (reaktiv — Datums-Priorität: Liste → TVMaze → AniList,
  //    plus optionaler „Mit Provider"-Filter über die Hydration) ─────────────
  const { hero, dayGroups, visibleContinuing, visibleFinished } = useMemo(() => {
    // Sichtbarkeit: (1) Einträge, deren Auflösung KEINEN TMDB-Treffer ergab,
    // fliegen komplett raus — nicht öffenbar, nicht addbar. Unaufgelöste
    // bleiben sichtbar. (2) „Mit Provider": nur Einträge mit mind. einem
    // BESTÄTIGTEN DE-Provider — unaufgelöste sind hier sofort raus und
    // POPPEN EIN, sobald die Hydration Provider meldet.
    const passesProvider = (entry: DecoratedAnime): boolean => {
      const info = entry.match
        ? undefined
        : (resolved[entry.anime.id] ??
          cachedResolved[String(entry.anime.id)] ??
          serverResolved[entry.anime.id]);
      if (info && info.tmdbId === null) return false;
      // Studio-Filter (Single-Select, '' = alle).
      if (deferredFilter.studio && !animeStudios(entry.anime).includes(deferredFilter.studio)) {
        return false;
      }
      if (!deferredFilter.providerOnly) return true;
      if (entry.match) return seriesProviders(entry.match).length > 0;
      return !!info?.providers && info.providers.length > 0;
    };

    // Datums-Priorität: Liste (eigener Kalender) → statischer Katalog
    // (Seasonal-Anime mit Provider, gleiche Quelle wie der Kalender) →
    // TVMaze-Check → AniList (japanischer TV-Termin).
    const corrected = newThisSeason.filter(passesProvider).map((entry) => {
      let anime = entry.anime;
      if (entry.match) {
        anime = withCalendarDate(anime, entry.match);
      } else {
        const info =
          resolved[anime.id] ?? cachedResolved[String(anime.id)] ?? serverResolved[anime.id];
        let catalogApplied = false;
        const anilistDate = fullStartDate(anime);
        if (info?.tmdbId && anilistDate && catalogSeasons) {
          const seasons = catalogSeasons[String(info.tmdbId)];
          if (seasons) {
            const date = catalogBulkPremiereDate(seasons, anilistDate);
            if (date) {
              anime = withDate(anime, date);
              catalogApplied = true;
            }
          }
        }
        if (!catalogApplied && info?.premiereDate) {
          anime = withPremiereDate(anime, info.premiereDate);
        }
      }
      return anime === entry.anime ? entry : { ...entry, anime };
    });

    // Hero herausziehen, damit er nicht doppelt (Spotlight + Timeline) auftaucht.
    const heroEntry = pickHero(corrected, now);
    const rest = heroEntry
      ? corrected.filter((entry) => entry.anime.id !== heroEntry.anime.id)
      : corrected;

    // EINE Timeline für die ganze Season — beginnt beim Season-Start
    // (vergangene Tage gedimmt), Datum-lose am Ende („Start noch offen").
    return {
      hero: heroEntry,
      dayGroups: buildDayGroups(rest, now),
      visibleContinuing: continuingEntries.filter(passesProvider),
      visibleFinished: finishedEntries.filter(passesProvider),
    };
  }, [
    newThisSeason,
    continuingEntries,
    finishedEntries,
    resolved,
    cachedResolved,
    serverResolved,
    catalogSeasons,
    now,
    deferredFilter.providerOnly,
    deferredFilter.studio,
  ]);

  const timelineCount = useMemo(
    () => dayGroups.reduce((sum, group) => sum + group.items.length, 0),
    [dayGroups]
  );

  /** Entry-Stagger-Index (Anzeige-Reihenfolge, in der Karte gedeckelt). */
  const staggerIndexById = useMemo(
    () => new Map(allEntries.map((entry, index) => [entry.anime.id, index])),
    [allEntries]
  );

  // ── Progressive TMDB-Hydration (deutsches overview + Provider-Logos) ──────
  // Der Effekt darf NICHT an der Array-Identität von allEntries hängen:
  // jedes Firebase-Listen-Update erzeugt neue Objekte → Cleanup/Re-Run ließ
  // das Skeleton wild flackern und startete die Worker neu. Deshalb ein
  // stabiler Fingerprint der tatsächlich aufzulösenden IDs + Ref-Zugriff.
  const allEntriesRef = useRef<DecoratedAnime[]>(allEntries);
  useLayoutEffect(() => {
    allEntriesRef.current = allEntries;
  }, [allEntries]);

  /** Vollständiger Info-Lookup: Live-Auflösung → Session-Cache → Server-Export. */
  const infoFor = React.useCallback(
    (id: number): ResolvedTmdbInfo | undefined =>
      resolved[id] ?? cachedResolved[String(id)] ?? serverResolved[id],
    [resolved, cachedResolved, serverResolved]
  );

  const pendingKey = useMemo(
    () =>
      allEntries
        .filter(
          (entry) =>
            needsResolveEntry(entry) &&
            cachedResolved[String(entry.anime.id)] === undefined &&
            serverResolved[entry.anime.id] === undefined
        )
        .map((entry) => entry.anime.id)
        .sort((a, b) => a - b)
        .join(','),
    [allEntries, cachedResolved, serverResolved]
  );

  // useLayoutEffect: hydration.active MUSS vor dem ersten Paint stehen —
  // mit useEffect blitzte ein Frame unhydratisierter Content vor dem Skeleton.
  useLayoutEffect(() => {
    // serverSeasonalReady: erst starten, wenn klar ist, was der Server-Export
    // abdeckt — sonst würden alle Einträge unnötig client-seitig aufgelöst.
    if (loading || !serverSeasonalReady) return;
    const started = startedRef.current;
    // Bereits gecachte (sessionStorage) oder server-abgedeckte Einträge
    // überspringen den Worker komplett.
    const pending = allEntriesRef.current.filter(
      (entry) =>
        needsResolveEntry(entry) &&
        cachedResolved[String(entry.anime.id)] === undefined &&
        serverResolved[entry.anime.id] === undefined &&
        !started.has(entry.anime.id)
    );
    if (!pending.length) {
      // Nichts (mehr) aufzulösen — falls ein abgebrochener Vorgänger das
      // Skeleton anließ, hier beenden.
      setHydration((h) => (h.active ? { ...h, active: false } : h));
      return;
    }
    for (const entry of pending) started.add(entry.anime.id);

    let cancelled = false;
    let next = 0;
    setHydration({ active: true, done: 0, total: pending.length });

    const worker = async () => {
      while (!cancelled) {
        const index = next++;
        if (index >= pending.length) return;
        const entry = pending[index];
        try {
          const info = await resolveTmdbInfo(entry.anime, selected.year);
          if (!cancelled) queueResolved(entry.anime.id, info);
        } catch {
          // Netzwerkfehler → wieder freigeben (Klick/nächster Lauf versucht erneut)
          started.delete(entry.anime.id);
        } finally {
          if (!cancelled) setHydration((h) => ({ ...h, done: h.done + 1 }));
        }
      }
    };
    void Promise.all(
      Array.from({ length: Math.min(RESOLVE_CONCURRENCY, pending.length) }, () => worker())
    ).then(() => {
      if (cancelled) return;
      // Rest-Puffer sofort committen, dann die FERTIGE Seite zeigen.
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }
      const batch = pendingResolvedRef.current;
      pendingResolvedRef.current = {};
      setResolved((prev) => ({ ...prev, ...batch }));
      setHydration((h) => ({ ...h, active: false }));
    });

    // Sicherheitsnetz: hängt eine Auflösung (Netzwerk), zeigen wir nach 30 s
    // trotzdem, was da ist — besser als ein endloses Skeleton.
    const capTimer = setTimeout(() => {
      if (!cancelled) setHydration((h) => (h.active ? { ...h, active: false } : h));
    }, 30000);

    return () => {
      cancelled = true;
      clearTimeout(capTimer);
      // BEWUSST kein setHydration(active: false) hier: das Cleanup läuft bei
      // jedem legitimen Re-Run (Liste lädt nach → ID-Menge ändert sich) und
      // ließ das Skeleton für einen Frame aus/anblitzen. Der Nachfolger-Lauf
      // hält den Status nahtlos bzw. beendet ihn, wenn nichts mehr aussteht.
      // Abgebrochene (noch nicht aufgelöste) Einträge wieder freigeben —
      // bereits gecachte lösen beim nächsten Lauf ohne Request auf.
      for (const entry of pending) started.delete(entry.anime.id);
    };
    // allEntries kommt bewusst über die Ref — pendingKey deckt echte
    // Änderungen der aufzulösenden ID-Menge ab (Identitäts-Rauschen nicht).
  }, [
    pendingKey,
    loading,
    selected.year,
    queueResolved,
    cachedResolved,
    serverResolved,
    serverSeasonalReady,
  ]);

  const handleSeasonChange = (id: string) => {
    const next = seasonTabs.find((tab) => seasonKey(tab) === id);
    if (!next || seasonKey(next) === seasonKey(selected)) return;
    hapticSelect();
    setSelected(next);
  };

  const openEntry = async (entry: DecoratedAnime) => {
    // tmdbId aus der eigenen Liste bekannt → direkt zur SeriesDetail-Seite.
    if (entry.match?.id) {
      navigate(`/series/${entry.match.id}`);
      return;
    }
    // Filme → /movie/, Serien → /series/ (mediaType aus der Auflösung).
    const detailPath = (info: ResolvedTmdbInfo) =>
      info.mediaType === 'movie' ? `/movie/${info.tmdbId}` : `/series/${info.tmdbId}`;

    // Bereits aufgelöst (live/Cache/Server-Export) → kein Doppel-Request.
    const known = infoFor(entry.anime.id);
    if (known) {
      if (known.tmdbId) navigate(detailPath(known));
      else showToast('Auf TMDB nicht gefunden', 2000, 'info');
      return;
    }
    // Noch nicht aufgelöst → on-demand (Spinner-Overlay, Klicksperre).
    if (resolvingId !== null) return;
    setResolvingId(entry.anime.id);
    try {
      const info = await resolveTmdbInfo(entry.anime, selected.year);
      setResolved((prev) => ({ ...prev, [entry.anime.id]: info }));
      if (info.tmdbId) {
        navigate(detailPath(info));
      } else {
        showToast('Auf TMDB nicht gefunden', 2000, 'info');
      }
    } catch {
      showToast('Auf TMDB nicht gefunden', 2000, 'error');
    } finally {
      setResolvingId(null);
    }
  };

  /** Specials/Musikvideos sind nicht addbar (kein sinnvoller Listen-Eintrag) —
   *  ohne onAdd rendert die Karte keinen „+"-Button. */
  const canAdd = (anime: SeasonAnime) => anime.format !== 'SPECIAL' && anime.format !== 'MUSIC';

  /** „+"-Button auf der Karte: direkt in die Liste adden — derselbe Flow wie
   *  Discover/Search (/add bzw. /addMovie via backendFetch). Die Liste
   *  aktualisiert sich über den RTDB-Listener, Match + Badge folgen
   *  automatisch; State wird NICHT manuell gesetzt (Write-Rule). */
  const addEntry = async (entry: DecoratedAnime) => {
    if (!user) {
      showToast('Bitte einloggen, um Inhalte hinzuzufügen', 2500, 'info');
      return;
    }
    if (addingId !== null) return;
    setAddingId(entry.anime.id);
    try {
      // tmdbId sicherstellen (Cache/Server bzw. On-Demand wie beim Öffnen).
      let info = infoFor(entry.anime.id);
      if (!info) {
        const fresh = await resolveTmdbInfo(entry.anime, selected.year);
        setResolved((prev) => ({ ...prev, [entry.anime.id]: fresh }));
        info = fresh;
      }
      if (!info.tmdbId) {
        showToast('Auf TMDB nicht gefunden', 2000, 'info');
        return;
      }
      const isMovie = info.mediaType === 'movie';
      const response = await backendFetch(isMovie ? '/addMovie' : '/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: import.meta.env.VITE_USER, id: info.tmdbId, uuid: user.uid }),
      });
      if (!response.ok) throw new Error(`add failed: ${response.status}`);

      const title = entry.anime.title.english || entry.anime.title.romaji || 'Unbekannter Titel';
      hapticSuccess();
      showToast(`„${title}" hinzugefügt`, 2500, 'success');
      if (isMovie) {
        trackMovieAdded(String(info.tmdbId), title, 'anime-season');
        await logMovieAdded(user.uid, title, info.tmdbId);
      } else {
        trackSeriesAdded(String(info.tmdbId), title, 'anime-season');
        await logSeriesAdded(user.uid, title, info.tmdbId);
      }
    } catch {
      showToast('Hinzufügen fehlgeschlagen', 2500, 'error');
    } finally {
      setAddingId(null);
    }
  };

  /** Hydration-Daten (deutsche Beschreibung + Provider-Logos) pro Eintrag. */
  const hydrationFor = (entry: DecoratedAnime) => {
    const info = infoFor(entry.anime.id);
    // Beschreibung: Liste zuerst, sonst TMDB-Auflösung (auch für Matches —
    // nicht jede Listen-Serie hat eine Katalog-Beschreibung).
    const overviewDe = (entry.match?.beschreibung?.trim() || info?.overviewDe) ?? null;
    const tmdbProviders = entry.match
      ? seriesProviders(entry.match)
      : info
        ? (info.providers ?? [])
        : undefined;
    // Rating: vote_average aus dem Series-Objekt, falls vorhanden — der
    // Katalog führt das Feld aber (noch) nicht, deshalb resolvt die
    // Hydration auch Listen-Serien ohne Rating und liefert es via info nach.
    const matchRating =
      entry.match && typeof entry.match.vote_average === 'number' && entry.match.vote_average > 0
        ? entry.match.vote_average
        : null;
    const tmdbRating = matchRating ?? info?.tmdbRating ?? null;
    // Genres: Listen-Serien aus dem Katalog (ohne 'All'/'Animation'), sonst
    // aus der Auflösung — beides bereits App-Vokabular.
    const matchGenres = entry.match?.genre?.genres?.filter(
      (genre) => typeof genre === 'string' && genre !== 'All' && genre !== 'Animation'
    );
    const genres = matchGenres?.length ? matchGenres : (info?.genres ?? []);
    return { overviewDe, tmdbProviders, tmdbRating, genres };
  };

  const renderCard = (entry: DecoratedAnime) => {
    const { overviewDe, tmdbProviders, tmdbRating, genres } = hydrationFor(entry);
    return (
      <AnimeSeasonCard
        key={entry.anime.id}
        anime={entry.anime}
        inList={!!entry.match}
        sinceLabel={entry.sinceLabel}
        resolving={resolvingId === entry.anime.id}
        overviewDe={overviewDe}
        tmdbProviders={tmdbProviders}
        tmdbRating={tmdbRating}
        genres={genres}
        staggerIndex={staggerIndexById.get(entry.anime.id) ?? 0}
        onOpen={() => void openEntry(entry)}
        adding={addingId === entry.anime.id}
        onAdd={canAdd(entry.anime) ? () => void addEntry(entry) : undefined}
      />
    );
  };

  /** Einheitliches Poster-Grid (auto-fill) — volle Breite, keine Löcher. */
  const renderGrid = (entries: DecoratedAnime[]) => (
    <div className="as-grid">{entries.map((entry) => renderCard(entry))}</div>
  );

  /** Schnell-Scroll zur „Fortlaufend"-Sektion (Chip im Timeline-Header). */
  const scrollToContinuing = () => {
    hapticTap();
    continuingRef.current?.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  /** Section-Header: solider Titel + Glow-Icon (Farbe trägt das Icon);
   *  optionale Action rechts (z. B. der „Fortlaufend"-Sprung-Chip). */
  const renderSectionTitle = (
    icon: React.ReactNode,
    title: string,
    iconColor?: string,
    action?: React.ReactNode
  ) => (
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
          color: iconColor || currentTheme.primary,
          filter: `drop-shadow(0 0 6px ${iconColor || currentTheme.primary}60)`,
        }}
      >
        {icon}
      </span>
      {/* BEWUSST solid statt GradientText — die Farbe trägt das Glow-Icon,
          der Text bleibt auf jedem Theme voll lesbar. */}
      <span style={{ color: currentTheme.text.secondary }}>{title}</span>
      {action && <span style={{ marginLeft: 'auto' }}>{action}</span>}
    </h2>
  );

  const heroIsFuture = hero
    ? (() => {
        const date = hero ? startDateToDate(hero.anime.startDate) : null;
        return !!date && date.getTime() > now.getTime();
      })()
    : false;

  const subtitle = loading
    ? 'Was läuft diese Anime-Season?'
    : `${seasonLabel(selected)} · ${totalCount} Anime${
        inListCount > 0 ? ` · ${inListCount} in deiner Liste` : ''
      }`;

  const sectionIconStyle = { fontSize: '20px' } as const;

  return (
    <PageLayout>
      {/* Titel solid in aufgehelltem Primary (from = to) — der Default-
          Gradient lief in den dunklen Accent aus und war schlecht lesbar. */}
      <PageHeader
        title="Anime-Season"
        subtitle={subtitle}
        gradientFrom={lightenColor(currentTheme.primary, 0.2)}
        gradientTo={lightenColor(currentTheme.primary, 0.2)}
        icon={<Animation style={{ fontSize: '28px' }} />}
      />

      {/* Kompakter Season-Switcher — kein Vollbreite-Balken. */}
      <TabSwitcher
        tabs={seasonTabs.map((tab) => ({ id: seasonKey(tab), label: seasonLabel(tab) }))}
        activeTab={seasonKey(selected)}
        onTabChange={handleSeasonChange}
        style={{ maxWidth: '560px', width: 'calc(100% - 40px)', margin: '0 auto 12px' }}
      />

      {/* Filterleiste: Format-Auswahl als Segmented-Control (App-Signature-
          Morphing wie der Season-Switcher) + „Mit Provider"-Toggle. */}
      <div className="as-filterbar">
        {/* margin: 0 — der TabSwitcher-Default (20px unten) würde die Leiste
            gegen den Provider-Toggle vertikal verschieben. */}
        <TabSwitcher
          tabs={FORMAT_TABS}
          activeTab={filter.mode}
          onTabChange={handleFormatMode}
          style={{ width: '280px', flexShrink: 0, margin: 0 }}
        />
        {/* Baugleich zum TabSwitcher (Gehäuse + Active-Pill-Gradient), damit
            der Toggle zur Leiste gehört und an/aus sofort erkennbar ist. */}
        <div
          style={{
            display: 'flex',
            background: `${currentTheme.text.muted}08`,
            borderRadius: '18px',
            padding: '4px',
            border: `1px solid ${currentTheme.border.default}`,
            backdropFilter: 'var(--blur-md)',
            WebkitBackdropFilter: 'var(--blur-md)',
          }}
        >
          <motion.button
            type="button"
            whileTap={tapScaleSmall}
            aria-pressed={filter.providerOnly}
            onClick={toggleProviderOnly}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '11px 16px',
              background: filter.providerOnly
                ? `linear-gradient(135deg, ${currentTheme.primary}, color-mix(in srgb, ${currentTheme.primary} 55%, ${currentTheme.accent}))`
                : 'transparent',
              border: 'none',
              borderRadius: '14px',
              color: filter.providerOnly ? currentTheme.text.secondary : currentTheme.text.muted,
              fontSize: '13.5px',
              fontWeight: filter.providerOnly ? 700 : 600,
              boxShadow: filter.providerOnly
                ? `0 4px 24px ${currentTheme.primary}35, inset 0 1px 0 rgba(255, 255, 255, 0.1)`
                : 'none',
              cursor: 'pointer',
              // Nur color animieren — Gradient-Hintergründe interpolieren
              // nicht, eine background-Transition macht den Wechsel schwammig.
              transition: 'color 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <SmartDisplay style={{ fontSize: '18px' }} />
            Mit Provider
          </motion.button>
        </div>

        {/* Studio-Filter — eigenes Glass-Dropdown (kein natives Select). */}
        {studioOptions.length > 0 && (
          <AnimeSeasonStudioFilter
            studios={studioOptions}
            value={filter.studio}
            onChange={handleStudioChange}
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
        {(loading || !serverSeasonalReady || hydration.active) && (
          <div className="as-skeletons" role="status" aria-label="Anime-Season wird geladen">
            <Skeleton
              width="100%"
              shape="card"
              style={{ height: 'clamp(300px, 32vw, 400px)', marginBottom: '24px' }}
            />
            {hydration.active && (
              <p
                style={{
                  textAlign: 'center',
                  margin: '0 0 16px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: currentTheme.text.muted,
                }}
              >
                Termine, Provider & Bewertungen werden geladen … {hydration.done}/{hydration.total}
              </p>
            )}
            <div className="as-grid">
              {Array.from({ length: 10 }, (_, i) => (
                <Skeleton key={i} width="100%" shape="card" style={{ height: '176px' }} />
              ))}
            </div>
          </div>
        )}

        {!loading && error && (
          <PageState
            mode="error"
            error={{
              icon: <Animation style={{ fontSize: '48px' }} />,
              title: 'AniList nicht erreichbar',
              description: error,
              onRetry: () => setReloadKey((key) => key + 1),
            }}
          />
        )}

        {!loading && !error && totalCount === 0 && (
          <EmptyState
            icon={<Animation style={{ fontSize: '48px' }} />}
            title="Keine Anime gefunden"
            description={`Für ${seasonLabel(selected)} liegen bei AniList noch keine Einträge vor.`}
          />
        )}

        {!loading && serverSeasonalReady && !hydration.active && !error && totalCount > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
            {/* ── 0. Hero-Spotlight (volle Breite) ── */}
            {hero &&
              (() => {
                const { overviewDe, tmdbProviders, tmdbRating } = hydrationFor(hero);
                return (
                  <AnimeSeasonHero
                    anime={hero.anime}
                    eyebrow={heroIsFuture ? 'Nächste große Premiere' : 'Season-Highlight'}
                    inList={!!hero.match}
                    resolving={resolvingId === hero.anime.id}
                    overviewDe={overviewDe}
                    tmdbProviders={tmdbProviders}
                    tmdbRating={tmdbRating}
                    onOpen={() => void openEntry(hero)}
                    adding={addingId === hero.anime.id}
                    onAdd={canAdd(hero.anime) ? () => void addEntry(hero) : undefined}
                  />
                );
              })()}

            {/* ── 1. Premieren-Kalender: EINE Timeline für die ganze Season ── */}
            {timelineCount > 0 && (
              <section>
                {renderSectionTitle(
                  <CalendarMonth style={sectionIconStyle} />,
                  `Premieren-Kalender (${timelineCount})`,
                  undefined,
                  visibleContinuing.length > 0 ? (
                    <button
                      type="button"
                      className="as-jump"
                      onClick={scrollToContinuing}
                      style={{ color: currentTheme.text.secondary }}
                    >
                      <Autorenew style={{ fontSize: '14px' }} />
                      Fortlaufend
                      <ArrowDownward style={{ fontSize: '14px' }} />
                    </button>
                  ) : undefined
                )}
                <div className="as-timeline">
                  {dayGroups.map((group) => (
                    <div key={group.key} className="as-day">
                      <div className="as-day-header">
                        <span
                          className={
                            group.isToday
                              ? 'as-day-node as-day-node--today'
                              : group.isTba
                                ? 'as-day-node as-day-node--tba'
                                : group.isPast
                                  ? 'as-day-node as-day-node--past'
                                  : 'as-day-node'
                          }
                          style={
                            group.isToday
                              ? {
                                  background: currentTheme.accent,
                                  borderColor: currentTheme.accent,
                                }
                              : group.isTba
                                ? { borderColor: currentTheme.text.muted }
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
                {/* Fußnote: Datums-Priorität Liste → TVMaze → AniList. */}
                <p className="as-source-hint" style={{ color: currentTheme.text.muted }}>
                  <InfoOutlined style={{ fontSize: '14px', flexShrink: 0 }} />
                  Termine aus deinem Kalender bzw. TVMaze — ohne Treffer: japanische
                  Erstausstrahlung (AniList)
                </p>
              </section>
            )}

            {/* ── 2. Fortlaufend ── */}
            {visibleContinuing.length > 0 && (
              <section ref={continuingRef} className="as-continuing">
                {renderSectionTitle(
                  <Autorenew style={sectionIconStyle} />,
                  `Fortlaufend (${visibleContinuing.length})`
                )}
                {renderGrid(visibleContinuing)}
              </section>
            )}

            {/* ── 3. Bereits beendet ── */}
            {visibleFinished.length > 0 && (
              <section>
                {renderSectionTitle(
                  <TaskAlt style={sectionIconStyle} />,
                  `Bereits beendet (${visibleFinished.length})`
                )}
                {renderGrid(visibleFinished)}
              </section>
            )}
          </div>
        )}
      </div>

      {/* Scroll-to-top wie auf WatchNext/Ratings — Shell-Container scrollt. */}
      <ScrollToTopButton scrollContainerSelector=".mobile-content" />
    </PageLayout>
  );
};
