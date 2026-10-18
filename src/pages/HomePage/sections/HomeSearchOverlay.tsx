/**
 * HomeSearchOverlay — die Suche klappt als edles Frosted-Glass-Overlay ÜBER dem
 * Homescreen auf (kein Seitenwechsel). Home bleibt durchscheinend dahinter
 * sichtbar. Ambient-Gradient-Glows, prominentes Suchfeld mit Fokus-Glow,
 * Segment-Filter und ein gestaffeltes Poster-Grid.
 *
 * Nutzt den schlanken useHomeQuickSearch (kein ?q= in der Home-URL). Per Portal
 * an document.body, damit kein transformierter Vorfahre das fixe Overlay schiebt.
 */
import { Add, Close, Person, Search, Star, Visibility } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAndroidBack } from '../../../hooks/ui/useAndroidBack';
import { useTheme } from '../../../contexts/ThemeContext';
import { getImageUrl } from '../../../utils/imageUrl';
import {
  pickDisplayRating,
  useCommunityRatingsMap,
} from '../../../hooks/rating/useCommunityRatings';
import { getOptimalTextColor } from '../../../theme/colorUtils';
import { tapScale } from '../../../lib/motion';
import { mediaTargetProps } from '../../../lib/interaction/mediaTarget';
import { Snackbar } from '../../../components/ui';
import { PersonGridSkeleton, PersonSection } from '../../../components/person/PersonSection';
import { QuickRatingSheet } from '../../../components/ui/overlay/QuickRatingSheet';
import { usePopularPeople } from '../../../hooks/person/usePeopleSearch';
import { quickMediaKey, useQuickMediaActions } from '../../../hooks/rating/useQuickMediaActions';
import type { PersonHit } from '../../../lib/person/personSearch';
import { formatRatingShort } from '../../../lib/rating/rating';
import { useHomeQuickSearch, type QuickResult } from './useHomeQuickSearch';
import { t } from '../../../services/i18n';
import {
  addRecentSearch,
  removeRecentSearch,
  useRecentSearches,
  type RecentSearchScope,
} from '../../../services/settings/recentSearches';
import { BookOverlayIdle, BookQuickResults } from '../../Books/components/BookQuickResults';
import { MangaOverlayIdle, MangaQuickResults } from '../../Manga/components/MangaQuickResults';
import { IsbnScanButton } from '../../../components/scanner/IsbnScanButton';
import { usesArea, type ReadingAreas } from '../../../lib/reading/readingMedium';
import './HomeSearchOverlay.css';

export type SearchFilter = 'all' | 'series' | 'movies' | 'people' | 'manga' | 'books';
type Filter = SearchFilter;

// Das Bewertungs-Sheet muss über dem Overlay liegen (.hso: z-index 1400).
const OVERLAY_SHEET_Z = 1450;

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: t('Alle') },
  { key: 'series', label: t('Serien') },
  { key: 'movies', label: t('Filme') },
  { key: 'people', label: t('Personen') },
  { key: 'manga', label: t('Manga') },
  { key: 'books', label: t('Bücher') },
];

/** Lesen-Suche: nur Bücher und Manga, je nach genutzten Lesebereichen. */
const readingFilters = (areas: ReadingAreas): { key: Filter; label: string }[] =>
  [
    { key: 'all' as const, label: t('Alle') },
    { key: 'books' as const, label: t('Bücher') },
    { key: 'manga' as const, label: t('Manga') },
  ].filter((f) => (f.key === 'all' ? areas === 'both' : usesArea(areas, f.key)));

const foundAt = (path: string): RecentSearchScope =>
  path.startsWith('/books/') ? 'books' : path.startsWith('/manga/') ? 'manga' : 'media';

interface HomeSearchOverlayProps {
  open: boolean;
  onClose: () => void;
  /** Seite, auf der das Overlay lebt (Home oder Lesen). */
  homePath?: string;
  initialFilter?: Filter;
  /** Suchbegriff beim Öffnen, z. B. das Werk eines Lese-Grußes. */
  initialQuery?: string;
  /** `reading`: nur Bücher und Manga, ohne Serien, Filme und Personen. */
  scope?: 'media' | 'reading';
  /** Genutzte Lesebereiche — blenden in der Lesen-Suche Filter aus. */
  areas?: ReadingAreas;
}

export const HomeSearchOverlay = memo(
  ({
    open,
    onClose,
    homePath = '/',
    initialFilter,
    initialQuery,
    scope = 'media',
    areas = 'both',
  }: HomeSearchOverlayProps) => {
    const reading = scope === 'reading';
    const navigate = useNavigate();
    const { pathname, key } = useLocation();
    // Home bleibt beim Sprung auf eine Detailseite gemountet (MainTabs-Keep-Alive),
    // also wird das Overlay dort nur geparkt statt geschlossen — Zurück landet
    // wieder in den Suchergebnissen. Jede andere Route schließt es.
    const parked = /^\/(series|movie|books|person|manga)\//.test(pathname);
    // Zurueck stellt per POP denselben History-Eintrag wieder her; der Home-Button
    // der Detailseite pusht dagegen einen neuen. Nur der Eintrag, auf dem die Suche
    // geoeffnet wurde, bekommt sie zurueck — sonst landet man ueber Home wieder
    // ungewollt in der Suche.
    const homeKey = useRef<string | null>(null);
    const visible =
      open && pathname === homePath && (homeKey.current === null || homeKey.current === key);

    useEffect(() => {
      if (!open) {
        homeKey.current = null;
        return;
      }
      if (pathname === homePath && homeKey.current === null) homeKey.current = key;
    }, [open, pathname, key, homePath]);
    const { currentTheme } = useTheme();
    const communityMap = useCommunityRatingsMap();
    const { query, setQuery, results, people, peopleFirst, loading, popular, popularItems } =
      useHomeQuickSearch(open && !reading, !reading);
    const [filter, setFilter] = useState<Filter>(initialFilter ?? 'all');
    const filters = reading ? readingFilters(areas) : FILTERS;

    // Bücher und Manga haben eigene Verläufe; Funde aus „Alle" landen zusätzlich dort.
    const recentScope: RecentSearchScope =
      filter === 'books' || filter === 'manga' ? filter : reading ? 'reading' : 'media';
    const recent = useRecentSearches(recentScope);
    const remember = useCallback(
      (found: RecentSearchScope) => {
        addRecentSearch(recentScope, query);
        if (found !== recentScope && found !== 'media') addRecentSearch(found, query);
      },
      [recentScope, query]
    );

    useEffect(() => {
      if (open && initialQuery) setQuery(initialQuery);
    }, [open, initialQuery, setQuery]);

    // Wer aus den Treffern auf eine Detailseite springt, hat gefunden, was er suchte —
    // gilt auch für Bücher und Manga, deren Karten selbst navigieren.
    const wasParked = useRef(false);
    useEffect(() => {
      if (open && parked && !wasParked.current) remember(foundAt(pathname));
      wasParked.current = parked;
    }, [open, parked, pathname, remember]);
    const filtersRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
      if (!open || !initialFilter) return;
      setFilter(initialFilter);
      const frame = requestAnimationFrame(() => {
        const row = filtersRef.current;
        const chip = row?.querySelector('[aria-pressed="true"]');
        if (!row || !chip) return;
        const rowBox = row.getBoundingClientRect();
        const chipBox = chip.getBoundingClientRect();
        row.scrollLeft += chipBox.left - rowBox.left - (rowBox.width - chipBox.width) / 2;
      });
      return () => cancelAnimationFrame(frame);
    }, [open, initialFilter]);
    const popularPeople = usePopularPeople(open && filter === 'people');
    const onPrimary = getOptimalTextColor(currentTheme.primary);
    const onSuccess = getOptimalTextColor(currentTheme.status.success);
    const [snack, setSnack] = useState<{ open: boolean; message: string }>({
      open: false,
      message: '',
    });

    const showSnack = useCallback((message: string) => {
      setSnack({ open: true, message });
      setTimeout(() => setSnack({ open: false, message: '' }), 2500);
    }, []);

    const {
      statusOf,
      add: addToList,
      markWatched,
      rate: rateFromCard,
      quickRating,
      closeQuickRating,
      saveQuickRating,
    } = useQuickMediaActions({ source: 'search', notify: showSnack });

    useEffect(() => {
      if (open && !visible && !parked) onClose();
    }, [open, visible, parked, onClose]);

    useAndroidBack(visible, onClose);

    // Scrollposition des Ergebnis-Grids über den Detail-Ausflug retten:
    // display:none verwirft scrollTop.
    const contentRef = useRef<HTMLDivElement>(null);
    const contentScroll = useRef(0);
    const inputRef = useRef<HTMLInputElement>(null);
    useLayoutEffect(() => {
      if (visible && contentRef.current) contentRef.current.scrollTop = contentScroll.current;
    }, [visible]);

    useEffect(() => {
      if (!visible) return;
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !quickRating.open) onClose();
      };
      document.addEventListener('keydown', onKey);
      return () => {
        document.body.style.overflow = prev;
        document.removeEventListener('keydown', onKey);
      };
    }, [visible, onClose, quickRating.open]);

    // Beim Schließen zurücksetzen, damit das nächste Öffnen frisch startet —
    // inklusive Scrollstand, der sonst aus der vorigen Suche stehen bliebe.
    useEffect(() => {
      if (!open) {
        if (query) setQuery('');
        setFilter('all');
        contentScroll.current = 0;
      }
    }, [open, query, setQuery]);

    const lastQueryFilter = useRef(`${query}|${filter}`);
    useEffect(() => {
      const sig = `${query}|${filter}`;
      if (lastQueryFilter.current === sig) return;
      lastQueryFilter.current = sig;
      contentScroll.current = 0;
      if (contentRef.current) contentRef.current.scrollTop = 0;
    }, [query, filter]);

    const shown = useMemo(
      () =>
        filter === 'all'
          ? results
          : filter === 'series' || filter === 'movies'
            ? results.filter((r) =>
                filter === 'series' ? r.type === 'series' : r.type === 'movie'
              )
            : [],
      [results, filter]
    );
    const shownPeople = filter === 'all' || filter === 'people' ? people : [];
    // Die Reihen melden ihren Stand erst nach dem Rendern; die Query dazu merken,
    // damit „Keine Treffer" in der Lesen-Suche nicht vor der ersten Meldung aufblitzt.
    const queryRef = useRef(query);
    useLayoutEffect(() => {
      queryRef.current = query;
    }, [query]);
    const [bookHits, setBookHits] = useState({ count: 0, loading: false, q: '' });
    const onBookCount = useCallback(
      (count: number, isLoading: boolean) =>
        setBookHits({ count, loading: isLoading, q: queryRef.current }),
      []
    );
    const [mangaHits, setMangaHits] = useState({ count: 0, loading: false, q: '' });
    const onMangaCount = useCallback(
      (count: number, isLoading: boolean) =>
        setMangaHits({ count, loading: isLoading, q: queryRef.current }),
      []
    );
    const [mangaRowIds, setMangaRowIds] = useState<number[]>([]);
    const otherHits = bookHits.count + mangaHits.count;
    const otherLoading = bookHits.loading || mangaHits.loading;
    const readingSettled = !otherLoading && bookHits.q === query && mangaHits.q === query;

    // Der Segment-Filter gilt für ALLES Sichtbare — auch für „Beliebt".
    const shownPopular = useMemo(
      () =>
        filter === 'all'
          ? popularItems
          : popularItems.filter((r) =>
              filter === 'series' ? r.type === 'series' : r.type === 'movie'
            ),
      [popularItems, filter]
    );

    const hasQuery = query.trim().length >= 2;

    // Klick auf freie Fläche schließt. Interaktive Elemente (Suchfeld, Karten,
    // Chips, Buttons) sind ausgenommen — deren Klicks bubbeln zwar hierher,
    // treffen aber per closest() auf ein interaktives Ziel.
    const onBackdropClick = useCallback(
      (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('button, input, [role="button"], .hso__field')) return;
        onClose();
      },
      [onClose]
    );

    const goTo = (item: QuickResult) => {
      remember('media');
      // Nur navigieren, nicht schliessen: das Overlay parkt sich selbst (siehe
      // `parked`) und ist beim Zurueck mit Query, Treffern und Scrollstand da.
      navigate(`/${item.type === 'series' ? 'series' : 'movie'}/${item.id}`);
    };

    const goToPerson = useCallback(
      (person: PersonHit) => {
        remember('media');
        navigate(`/person/${person.id}`);
      },
      [remember, navigate]
    );

    const onEnter = () => {
      const personLeads = filter === 'people' || (filter === 'all' && peopleFirst);
      if (personLeads && shownPeople.length > 0) goToPerson(shownPeople[0]);
      else if (shown.length > 0) goTo(shown[0]);
      else if (shownPeople.length > 0) goToPerson(shownPeople[0]);
    };

    const renderPeople = (list: PersonHit[], asRow: boolean) => (
      <PersonSection
        className="hso__people"
        people={list}
        onSelect={goToPerson}
        onSeeAll={asRow ? () => setFilter('people') : undefined}
      />
    );

    // Eine Poster-Karte — identisch für Suchergebnisse und „Beliebt" (inkl.
    // Rating-Badge und Zur-Liste-Button), damit beide Grids gleich mächtig sind.
    const renderCard = (item: QuickResult, idx: number, delayStep: number) => {
      const { added, ownRating, watched, busyAction } = statusOf(item);
      const showWatched = item.type === 'movie' && !watched;
      const busy = busyAction !== null;
      // Community-Rating der TV-Rank-Nutzer führt (ab 5 Bewertungen), sonst TMDB.
      const displayRating = pickDisplayRating(
        communityMap,
        item.type === 'series' ? 'series' : 'movies',
        item.id,
        item.vote_average
      );
      return (
        <motion.div
          key={quickMediaKey(item)}
          {...mediaTargetProps({
            type: item.type,
            id: item.id,
            title: item.title,
            poster: item.poster_path,
          })}
          className="hso__card"
          role="button"
          tabIndex={0}
          whileTap={tapScale}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(idx * delayStep, 0.35), duration: 0.28 }}
          onClick={() => goTo(item)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              goTo(item);
            }
          }}
        >
          <div className="hso__poster-wrap">
            {item.poster_path ? (
              <img
                className="hso__poster"
                src={getImageUrl(item.poster_path, 'w342')}
                alt=""
                loading="lazy"
              />
            ) : (
              <div
                className="hso__poster hso__poster--empty"
                style={{ background: `${currentTheme.text.muted}22` }}
              >
                <Search style={{ fontSize: '28px', opacity: 0.4 }} />
              </div>
            )}
            {displayRating ? (
              <span
                className="hso__rating"
                style={{ background: `${currentTheme.background.default}d9` }}
              >
                <Star
                  style={{
                    fontSize: '12px',
                    color: displayRating.isCommunity ? currentTheme.primary : currentTheme.accent,
                  }}
                />
                {displayRating.value.toFixed(1)}
              </span>
            ) : null}
            <span
              className="hso__type"
              style={{ background: `${currentTheme.primary}e6`, color: onPrimary }}
            >
              {item.type === 'series' ? t('Serie') : t('Film')}
            </span>

            {showWatched && (
              <button
                type="button"
                className="hso__watched"
                aria-label={
                  added
                    ? t('„{title}" als gesehen markieren', { title: item.title })
                    : t('„{title}" hinzufügen und als gesehen markieren', { title: item.title })
                }
                disabled={busy}
                onClick={(e) => markWatched(item, added, e)}
                style={{
                  border: `1px solid ${currentTheme.status.success}99`,
                  color: currentTheme.status.success,
                  cursor: busy ? 'wait' : 'pointer',
                  opacity: busyAction === 'watched' ? 0.7 : 1,
                }}
              >
                <Visibility style={{ fontSize: '18px' }} />
              </button>
            )}
            {added ? (
              <button
                type="button"
                className="hso__rate"
                aria-label={
                  ownRating > 0
                    ? t('„{title}" ist mit {rating} bewertet. Bewertung ändern', {
                        title: item.title,
                        rating: formatRatingShort(ownRating),
                      })
                    : t('„{title}" bewerten', { title: item.title })
                }
                onClick={(e) => rateFromCard(item, ownRating, e)}
                style={{ background: currentTheme.status.success, color: onSuccess }}
              >
                {ownRating > 0 ? (
                  <span className="hso__rate-value">{formatRatingShort(ownRating)}</span>
                ) : (
                  <Star style={{ fontSize: '20px' }} />
                )}
              </button>
            ) : (
              <button
                type="button"
                className="hso__add"
                aria-label={t('„{title}" zur Liste hinzufügen', { title: item.title })}
                disabled={busy}
                onClick={(e) => addToList(item, e)}
                style={{
                  background:
                    busyAction === 'add'
                      ? 'var(--glass-heavy)'
                      : `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                  color: onPrimary,
                  cursor: busy ? 'wait' : 'pointer',
                  opacity: busyAction === 'add' ? 0.7 : 1,
                }}
              >
                <Add style={{ fontSize: '20px' }} />
              </button>
            )}
          </div>
          <span className="hso__card-title" style={{ color: currentTheme.text.primary }}>
            {item.title}
          </span>
          {item.year && (
            <span className="hso__card-year" style={{ color: currentTheme.text.muted }}>
              {item.year}
            </span>
          )}
        </motion.div>
      );
    };

    return createPortal(
      <AnimatePresence>
        {open && (
          <motion.div
            key="home-search-overlay"
            className="hso noise-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={onBackdropClick}
            // Fast deckender Tint statt Blur (der kostete ~25 ms pro Frame). Die
            // Orbs darueber halten die Flaeche lebendig, damit es auf dunklen
            // Themes nicht wie eine schwarze Wand wirkt.
            style={{
              background: `${currentTheme.background.default}eb`,
              display: visible ? undefined : 'none',
            }}
          >
            {/* Ambient-Licht unter dem Glas — eigene Lichtquelle, damit das Overlay
              lebendig aussieht, egal wie dunkel/leer der Home-Inhalt dahinter ist. */}
            <motion.div
              className="hso__orb hso__orb--1"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              style={{
                // Intensität via --hso-orb-strength (CSS), weil framer die
                // Element-Opacity inline auf 1 animiert und CSS-opacity schluckt.
                background: `radial-gradient(circle, color-mix(in srgb, ${currentTheme.primary} var(--hso-orb-strength, 40%), transparent), transparent 70%)`,
              }}
            />
            <motion.div
              className="hso__orb hso__orb--2"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, delay: 0.08 }}
              style={{
                background:
                  'radial-gradient(circle, color-mix(in srgb, var(--theme-secondary-gradient) var(--hso-orb-strength, 40%), transparent), transparent 70%)',
              }}
            />
            <motion.div
              className="hso__orb hso__orb--3"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              style={{
                background: `radial-gradient(circle, color-mix(in srgb, ${currentTheme.accent} calc(var(--hso-orb-strength, 40%) * 0.75), transparent), transparent 70%)`,
              }}
            />

            {/* Spotlight-Panel: auf Mobile full-bleed, auf Desktop zentrierte Palette. */}
            <div className="hso__panel">
              {/* Kopf */}
              <motion.div
                className="hso__head"
                initial={{ y: -26, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -18, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 440, damping: 34 }}
              >
                <div className="hso__bar-row">
                  <div
                    className="hso__field"
                    style={{
                      background: `linear-gradient(135deg, ${currentTheme.primary}1f, transparent 45%), var(--glass-medium)`,
                      borderColor: `${currentTheme.primary}59`,
                      boxShadow: `0 10px 40px -10px ${currentTheme.primary}55, inset 0 1px 0 rgba(255,255,255,0.16), inset 0 0 0 1px ${currentTheme.primary}14`,
                    }}
                  >
                    <Search
                      style={{ fontSize: '22px', color: currentTheme.primary, flexShrink: 0 }}
                    />
                    <input
                      ref={inputRef}
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') onEnter();
                      }}
                      placeholder={
                        filter === 'books' || (reading && filter === 'all')
                          ? t('Titel, Autor oder ISBN')
                          : filter === 'manga'
                            ? t('Titel oder ISBN')
                            : t('Titel oder Schauspieler')
                      }
                      aria-label={
                        reading
                          ? t('Bücher und Manga suchen')
                          : t('Serien, Filme und Personen suchen')
                      }
                      autoFocus
                      className="hso__input"
                      style={{ color: currentTheme.text.primary, outline: 'none' }}
                    />
                    {query && (
                      <button
                        type="button"
                        className="hso__clear"
                        aria-label={t('Suche leeren')}
                        onClick={() => setQuery('')}
                        style={{
                          color: currentTheme.text.muted,
                          background: `${currentTheme.text.muted}22`,
                        }}
                      >
                        <Close style={{ fontSize: '15px' }} />
                      </button>
                    )}
                    <IsbnScanButton
                      hidden={!!query || (!reading && filter !== 'books' && filter !== 'manga')}
                      className="hso__scan"
                      style={{ color: currentTheme.primary }}
                      onIsbn={setQuery}
                      onManual={() => inputRef.current?.focus()}
                    />
                  </div>
                  <button
                    type="button"
                    className="hso__done"
                    onClick={onClose}
                    aria-label={t('Suche schließen')}
                    style={{ color: currentTheme.text.secondary }}
                  >
                    {t('Fertig')}
                  </button>
                </div>

                {/* Segment-Filter */}
                {filters.length > 1 && (
                  <div className="hso__filters" ref={filtersRef}>
                    {filters.map((f) => {
                      const active = filter === f.key;
                      return (
                        <button
                          key={f.key}
                          type="button"
                          className="hso__filter"
                          onClick={(e) => {
                            setFilter(f.key);
                            e.currentTarget.scrollIntoView?.({
                              behavior: 'smooth',
                              block: 'nearest',
                              inline: 'nearest',
                            });
                          }}
                          aria-pressed={active}
                          style={{
                            background: active
                              ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`
                              : 'var(--glass-medium)',
                            border: active ? 'none' : '1px solid var(--glass-border-light)',
                            color: active ? onPrimary : currentTheme.text.muted,
                            boxShadow: active
                              ? `0 6px 18px -4px ${currentTheme.primary}66`
                              : 'var(--glass-specular)',
                            backdropFilter: active ? undefined : 'var(--glass-filter-sm)',
                            WebkitBackdropFilter: active ? undefined : 'var(--glass-filter-sm)',
                          }}
                        >
                          {f.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </motion.div>

              {/* Inhalt */}
              <div
                className="hso__content"
                ref={contentRef}
                onScroll={(e) => {
                  contentScroll.current = e.currentTarget.scrollTop;
                }}
              >
                {/* Bewusst KEIN AnimatePresence mode="wait" hier: die Keys wechseln bei
                jedem Tastendruck (loading/empty/results), und mode="wait" kann bei
                schnellem Tippen im Exit hängen bleiben — dann klebt eine veraltete
                „Keine Treffer"-Meldung fest. Einblenden reicht. */}
                {hasQuery && filter === 'books' ? (
                  <motion.div key="books" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <BookQuickResults
                      query={query}
                      variant="grid"
                      sheetZIndex={OVERLAY_SHEET_Z}
                      onAdded={remember}
                    />
                  </motion.div>
                ) : hasQuery && filter === 'manga' ? (
                  <motion.div key="manga" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <MangaQuickResults
                      query={query}
                      variant="grid"
                      onAdded={() => remember('manga')}
                    />
                  </motion.div>
                ) : hasQuery && filter === 'people' ? (
                  loading && people.length === 0 ? (
                    <motion.div
                      key="people-loading"
                      className="hso__people"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <PersonGridSkeleton />
                    </motion.div>
                  ) : people.length === 0 ? (
                    <motion.div
                      key="people-empty"
                      className="hso__msg"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{ color: currentTheme.text.muted }}
                    >
                      <Person style={{ fontSize: '40px', opacity: 0.5 }} />
                      <p>{t('Keine Personen für „{query}“', { query })}</p>
                    </motion.div>
                  ) : (
                    renderPeople(people, false)
                  )
                ) : hasQuery && reading ? (
                  readingSettled && otherHits === 0 ? (
                    <motion.div
                      key="reading-empty"
                      className="hso__msg"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{ color: currentTheme.text.muted }}
                    >
                      <Search style={{ fontSize: '40px', opacity: 0.5 }} />
                      <p>{t('Keine Treffer für „{query}“', { query })}</p>
                    </motion.div>
                  ) : null
                ) : hasQuery ? (
                  loading && shown.length === 0 && shownPeople.length === 0 && otherHits === 0 ? (
                    <motion.div
                      key="loading"
                      className="hso__grid"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div
                          key={i}
                          className="hso__skeleton"
                          style={{ background: `${currentTheme.text.muted}18` }}
                        />
                      ))}
                    </motion.div>
                  ) : shown.length === 0 &&
                    shownPeople.length === 0 &&
                    otherHits === 0 &&
                    !otherLoading ? (
                    <motion.div
                      key="empty"
                      className="hso__msg"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{ color: currentTheme.text.muted }}
                    >
                      <Search style={{ fontSize: '40px', opacity: 0.5 }} />
                      <p>{t('Keine Treffer für „{query}“', { query })}</p>
                    </motion.div>
                  ) : (
                    <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      {peopleFirst &&
                        shownPeople.length > 0 &&
                        renderPeople(shownPeople, shown.length > 0)}
                      {shown.length > 0 && (
                        <div className="hso__grid">
                          {shown.map((item, idx) => renderCard(item, idx, 0.03))}
                        </div>
                      )}
                      {!peopleFirst && shownPeople.length > 0 && renderPeople(shownPeople, true)}
                    </motion.div>
                  )
                ) : null}
                {hasQuery && filter === 'all' && (
                  <MangaQuickResults
                    query={query}
                    variant="row"
                    onCount={onMangaCount}
                    onIds={setMangaRowIds}
                    onSeeAll={() => setFilter('manga')}
                    onAdded={() => remember('manga')}
                  />
                )}
                {hasQuery && filter === 'all' && (
                  <BookQuickResults
                    query={query}
                    variant="row"
                    sheetZIndex={OVERLAY_SHEET_Z}
                    hideMangaIds={mangaRowIds}
                    onCount={onBookCount}
                    onSeeAll={() => setFilter('books')}
                    onAdded={remember}
                  />
                )}
                {hasQuery ? null : (
                  <motion.div
                    key="suggest"
                    className="hso__suggest"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {recent.length > 0 && (
                      <div className="hso__group">
                        <div
                          className="hso__group-title"
                          style={{ color: currentTheme.text.muted }}
                        >
                          {t('Zuletzt gesucht')}
                        </div>
                        {recent.map((term) => (
                          <div key={term} className="hso__recent-row">
                            <button
                              type="button"
                              className="hso__recent"
                              onClick={() => setQuery(term)}
                              style={{ color: currentTheme.text.secondary }}
                            >
                              <Search
                                style={{ fontSize: '18px', color: currentTheme.text.muted }}
                              />
                              {term}
                            </button>
                            <button
                              type="button"
                              className="hso__recent-remove"
                              aria-label={t('„{term}" entfernen', { term })}
                              onClick={() => removeRecentSearch(recentScope, term)}
                              style={{ color: currentTheme.text.muted }}
                            >
                              <Close style={{ fontSize: '15px' }} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {(filter === 'books' || (reading && filter === 'all')) && (
                      <BookOverlayIdle sheetZIndex={OVERLAY_SHEET_Z} />
                    )}
                    {(filter === 'manga' || (reading && filter === 'all')) && <MangaOverlayIdle />}
                    {filter === 'people' && (
                      <div className="hso__group">
                        <div
                          className="hso__group-title"
                          style={{ color: currentTheme.text.muted }}
                        >
                          {t('Gerade gefragt')}
                        </div>
                        {popularPeople === null ? (
                          <PersonGridSkeleton />
                        ) : (
                          renderPeople(popularPeople, false)
                        )}
                      </div>
                    )}
                    {!reading &&
                      (filter === 'all' || filter === 'series' || filter === 'movies') && (
                        <div className="hso__group">
                          <div
                            className="hso__group-title"
                            style={{ color: currentTheme.text.muted }}
                          >
                            {t('Beliebt')}
                          </div>
                          {shownPopular.length > 0 ? (
                            <div className="hso__pop-row">
                              {shownPopular.map((item, i) => renderCard(item, i, 0.02))}
                            </div>
                          ) : (
                            <div className="hso__chips">
                              {popular.map((term, i) => (
                                <motion.button
                                  key={term}
                                  type="button"
                                  className="hso__chip"
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: 0.05 + i * 0.04 }}
                                  whileTap={tapScale}
                                  onClick={() => setQuery(term)}
                                  style={{
                                    color: currentTheme.text.secondary,
                                    background: `linear-gradient(135deg, ${currentTheme.primary}18, ${currentTheme.accent}14)`,
                                    border: `1px solid ${currentTheme.primary}33`,
                                  }}
                                >
                                  {term}
                                </motion.button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                  </motion.div>
                )}
              </div>
            </div>

            <div onClick={(e) => e.stopPropagation()}>
              <Snackbar open={snack.open} message={snack.message} />
            </div>

            {/* Portal-Klicks bubbeln im React-Baum bis zum Backdrop-Handler — daher der Wrapper. */}
            <div onClick={(e) => e.stopPropagation()}>
              <QuickRatingSheet
                isOpen={quickRating.open}
                onClose={closeQuickRating}
                seriesTitle={quickRating.title}
                eyebrow={
                  quickRating.afterWatched ? t('Als gesehen markiert') : t('In deiner Liste')
                }
                initialRating={quickRating.initialRating}
                genres={quickRating.genres}
                mediaType={quickRating.mediaType}
                itemId={quickRating.itemId}
                initialGenreRatings={quickRating.genreRatings}
                onRate={saveQuickRating}
                zIndex={OVERLAY_SHEET_Z}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    );
  }
);

HomeSearchOverlay.displayName = 'HomeSearchOverlay';
