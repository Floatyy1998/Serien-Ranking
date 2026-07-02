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

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useNavigationType } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Animation,
  ArrowDownward,
  Autorenew,
  CalendarMonth,
  InfoOutlined,
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
import { useTheme } from '../../contexts/ThemeContextDef';
import { tmdbLogoUrl } from '../../hooks/useProviderLogos';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useScrollRestore } from '../../hooks/useScrollRestore';
import { normalizeProviderName } from '../../lib/validation/providerChangeDetection';
import { hapticSelect, hapticTap } from '../../lib/haptics';
import { showToast } from '../../lib/toast';
import { tapScaleSmall } from '../../lib/motion';
import { getOptimalTextColor, lightenColor } from '../../theme/colorUtils';
import { getEpisodeAirDate } from '../../utils/episodeDate';
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

export const AnimeSeasonPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
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

  const [items, setItems] = useState<SeasonAnime[]>([]);
  const [continuing, setContinuing] = useState<ContinuingAnime[]>([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  /** AniList-Id, für die gerade eine KLICK-Auflösung läuft (sperrt Klicks). */
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  /** Progressiv aufgelöste TMDB-Infos, keyed by AniList-Id. */
  const [resolved, setResolved] = useState<Record<number, ResolvedTmdbInfo>>({});
  /** SessionStorage-Cache einmal synchron eingelesen — bereits aufgelöste
   *  Einträge zeigen deutsche Beschreibung + Provider sofort beim Mount
   *  (kein EN→DE-Flash beim Zurücknavigieren). */
  const [cachedResolved] = useState<Record<string, ResolvedTmdbInfo>>(() => readResolveCacheSync());
  /** Ids, für die die Hintergrund-Auflösung bereits angestoßen wurde. */
  const startedRef = useRef<Set<number>>(new Set());
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
    if (loading || lateRestoreRef.current) return;
    lateRestoreRef.current = true;
    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (!saved) return;
    requestAnimationFrame(() => {
      const container = document.querySelector('.mobile-content');
      if (container) container.scrollTop = parseInt(saved, 10);
    });
  }, [loading]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setItems([]);
    setContinuing([]);
    setPage(1);
    setHasNextPage(false);

    fetchSeasonAnime(selected, 1)
      .then((result) => {
        if (cancelled) return;
        setItems(result.media);
        setHasNextPage(result.hasNextPage);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'AniList ist gerade nicht erreichbar.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

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

  const loadMore = async () => {
    hapticTap();
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const result = await fetchSeasonAnime(selected, nextPage);
      setItems((prev) => {
        const seen = new Set(prev.map((a) => a.id));
        return [...prev, ...result.media.filter((a) => !seen.has(a.id))];
      });
      setHasNextPage(result.hasNextPage);
      setPage(nextPage);
    } catch (err) {
      console.warn('[animeSeason] Nachladen fehlgeschlagen', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // ── Hero + Sektionen ───────────────────────────────────────────────────────
  // ── Basis-Entries (STABIL — ohne Datums-Korrekturen) ───────────────────────
  // Bewusst getrennt vom Display-Memo: die Hydration-Pipeline hängt an
  // allEntries und darf nicht bei jeder eintreffenden Auflösung neu starten.
  const { newThisSeason, continuingEntries, finishedEntries, allEntries, totalCount, inListCount } =
    useMemo(() => {
      const seasonEntries: DecoratedAnime[] = items.map((anime) => ({
        anime,
        match: matchAnime(anime),
      }));

      const fresh = seasonEntries.filter((entry) => entry.anime.status !== 'FINISHED');
      const finished = seasonEntries.filter((entry) => entry.anime.status === 'FINISHED');

      const seasonIds = new Set(items.map((anime) => anime.id));
      const cont: DecoratedAnime[] = continuing
        .filter((entry) => !seasonIds.has(entry.anime.id))
        .map((entry) => ({
          anime: entry.anime,
          match: matchAnime(entry.anime),
          sinceLabel: seasonLabel(entry.origin),
        }));

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
    }, [items, continuing, matchAnime]);

  // ── Hero + Timeline (reaktiv — Datums-Priorität: Liste → TVMaze → AniList) ─
  const { hero, dayGroups } = useMemo(() => {
    const corrected = newThisSeason.map((entry) => {
      let anime = entry.anime;
      if (entry.match) {
        // Serien aus der Liste: Kalender-Datum (Katalog/TVMaze) schlägt AniList.
        anime = withCalendarDate(anime, entry.match);
      } else {
        // Rest: TVMaze-geprüfter Termin aus der progressiven Auflösung.
        const info = resolved[anime.id] ?? cachedResolved[String(anime.id)];
        if (info?.premiereDate) anime = withPremiereDate(anime, info.premiereDate);
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
    return { hero: heroEntry, dayGroups: buildDayGroups(rest, now) };
  }, [newThisSeason, resolved, cachedResolved, now]);

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
  useEffect(() => {
    if (loading) return;
    const started = startedRef.current;
    const pending = allEntries.filter((entry) => !entry.match && !started.has(entry.anime.id));
    if (!pending.length) return;
    for (const entry of pending) started.add(entry.anime.id);

    let cancelled = false;
    let next = 0;
    const worker = async () => {
      while (!cancelled) {
        const index = next++;
        if (index >= pending.length) return;
        const entry = pending[index];
        try {
          const info = await resolveTmdbInfo(entry.anime, selected.year);
          if (!cancelled) setResolved((prev) => ({ ...prev, [entry.anime.id]: info }));
        } catch {
          // Netzwerkfehler → wieder freigeben (Klick/nächster Lauf versucht erneut)
          started.delete(entry.anime.id);
        }
      }
    };
    void Promise.all(
      Array.from({ length: Math.min(RESOLVE_CONCURRENCY, pending.length) }, () => worker())
    );

    return () => {
      cancelled = true;
      // Abgebrochene (noch nicht aufgelöste) Einträge wieder freigeben —
      // bereits gecachte lösen beim nächsten Lauf ohne Request auf.
      for (const entry of pending) started.delete(entry.anime.id);
    };
  }, [allEntries, loading, selected.year]);

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
    // Bereits progressiv aufgelöst → kein Doppel-Request.
    const known = resolved[entry.anime.id];
    if (known) {
      if (known.tmdbId) navigate(`/series/${known.tmdbId}`);
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
        navigate(`/series/${info.tmdbId}`);
      } else {
        showToast('Auf TMDB nicht gefunden', 2000, 'info');
      }
    } catch {
      showToast('Auf TMDB nicht gefunden', 2000, 'error');
    } finally {
      setResolvingId(null);
    }
  };

  /** Hydration-Daten (deutsche Beschreibung + Provider-Logos) pro Eintrag. */
  const hydrationFor = (entry: DecoratedAnime) => {
    const info = resolved[entry.anime.id] ?? cachedResolved[String(entry.anime.id)];
    const overviewDe = entry.match
      ? entry.match.beschreibung?.trim() || null
      : (info?.overviewDe ?? null);
    const tmdbProviders = entry.match
      ? seriesProviders(entry.match)
      : info
        ? (info.providers ?? [])
        : undefined;
    return { overviewDe, tmdbProviders };
  };

  const renderCard = (entry: DecoratedAnime) => {
    const { overviewDe, tmdbProviders } = hydrationFor(entry);
    return (
      <AnimeSeasonCard
        key={entry.anime.id}
        anime={entry.anime}
        inList={!!entry.match}
        sinceLabel={entry.sinceLabel}
        resolving={resolvingId === entry.anime.id}
        overviewDe={overviewDe}
        tmdbProviders={tmdbProviders}
        staggerIndex={staggerIndexById.get(entry.anime.id) ?? 0}
        onOpen={() => void openEntry(entry)}
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
        style={{ maxWidth: '560px', width: 'calc(100% - 40px)', margin: '0 auto 20px' }}
      />

      <div
        style={{
          padding: '0 20px calc(100px + env(safe-area-inset-bottom))',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {loading && (
          <div role="status" aria-label="Anime-Season wird geladen">
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

        {!loading && !error && totalCount > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
            {/* ── 0. Hero-Spotlight (volle Breite) ── */}
            {hero &&
              (() => {
                const { overviewDe, tmdbProviders } = hydrationFor(hero);
                return (
                  <AnimeSeasonHero
                    anime={hero.anime}
                    eyebrow={heroIsFuture ? 'Nächste große Premiere' : 'Season-Highlight'}
                    inList={!!hero.match}
                    resolving={resolvingId === hero.anime.id}
                    overviewDe={overviewDe}
                    tmdbProviders={tmdbProviders}
                    onOpen={() => void openEntry(hero)}
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
                  continuingEntries.length > 0 ? (
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
            {continuingEntries.length > 0 && (
              <section ref={continuingRef} className="as-continuing">
                {renderSectionTitle(
                  <Autorenew style={sectionIconStyle} />,
                  `Fortlaufend (${continuingEntries.length})`
                )}
                {renderGrid(continuingEntries)}
              </section>
            )}

            {/* ── 3. Bereits beendet ── */}
            {finishedEntries.length > 0 && (
              <section>
                {renderSectionTitle(
                  <TaskAlt style={sectionIconStyle} />,
                  `Bereits beendet (${finishedEntries.length})`
                )}
                {renderGrid(finishedEntries)}
              </section>
            )}

            {hasNextPage && (
              <motion.button
                type="button"
                whileTap={tapScaleSmall}
                onClick={loadMore}
                disabled={loadingMore}
                style={{
                  width: '100%',
                  minHeight: '48px',
                  borderRadius: 'var(--radius-lg)',
                  border: `1px solid ${currentTheme.border.default}`,
                  background: currentTheme.background.surface,
                  color: currentTheme.text.secondary,
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: loadingMore ? 'wait' : 'pointer',
                  opacity: loadingMore ? 0.6 : 1,
                }}
              >
                {loadingMore ? 'Lädt …' : 'Mehr laden'}
              </motion.button>
            )}
          </div>
        )}
      </div>

      {/* Scroll-to-top wie auf WatchNext/Ratings — Shell-Container scrollt. */}
      <ScrollToTopButton scrollContainerSelector=".mobile-content" />
    </PageLayout>
  );
};
