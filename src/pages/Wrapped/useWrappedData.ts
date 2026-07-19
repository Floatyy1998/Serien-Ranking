import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type firebase from 'firebase/compat/app';
import { showToast } from '../../lib/toast';
import { useAuth } from '../../contexts/AuthContext';
import { useWrappedConfig } from '../../hooks/useWrappedConfig';
import type { WrappedStats, WrappedSlideConfig } from '../../types/Wrapped';
import { DEFAULT_SLIDE_CONFIG } from '../../types/Wrapped';
import { calculateWrappedStats } from '../../services/wrappedCalculator';
import { getTmdbApiKey, tmdbFetch } from '../../services/tmdbClient';
import { WatchActivityService } from '../../services/watchActivityService';
import { t } from '../../services/i18n';

// Standard-Jahr (jedes Jahr hier ändern)
const DEFAULT_YEAR = 2025;

async function fetchPosterForSeries(seriesId: number): Promise<string | undefined> {
  if (!getTmdbApiKey()) return undefined;
  try {
    const data = await tmdbFetch<{ poster_path?: string | null }>(`tv/${seriesId}`);
    return data.poster_path || undefined;
  } catch (error) {
    console.error(`Failed to fetch poster for series ${seriesId}:`, error);
  }
  return undefined;
}

async function fetchPosterForMovie(movieId: number): Promise<string | undefined> {
  if (!getTmdbApiKey()) return undefined;
  try {
    const data = await tmdbFetch<{ poster_path?: string | null }>(`movie/${movieId}`);
    return data.poster_path || undefined;
  } catch (error) {
    console.error(`Failed to fetch poster for movie ${movieId}:`, error);
  }
  return undefined;
}

async function enrichStatsWithPosters(stats: WrappedStats): Promise<WrappedStats> {
  const enrichedSeries = await Promise.all(
    stats.topSeries.map(async (series) => {
      if (!series.poster) {
        const poster = await fetchPosterForSeries(series.id);
        return { ...series, poster };
      }
      return series;
    })
  );

  const enrichedMovies = await Promise.all(
    stats.topMovies.map(async (movie) => {
      if (!movie.poster) {
        const poster = await fetchPosterForMovie(movie.id);
        return { ...movie, poster };
      }
      return movie;
    })
  );

  return {
    ...stats,
    topSeries: enrichedSeries,
    topMovies: enrichedMovies,
  };
}

export interface UseWrappedDataResult {
  // Config
  year: number;
  wrappedConfig: { enabled: boolean; year: number; loading: boolean };
  user: firebase.User | null | undefined;
  navigate: ReturnType<typeof useNavigate>;

  // Data state
  stats: WrappedStats | null;
  loading: boolean;
  error: string | null;

  // Slide navigation
  currentSlide: number;
  enabledSlides: WrappedSlideConfig[];
  nextSlide: () => void;
  prevSlide: () => void;

  // Event handlers
  containerRef: React.RefObject<HTMLDivElement | null>;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchEnd: (e: React.TouchEvent) => void;

  // Share
  handleShare: () => Promise<void>;
}

export const useWrappedData = (): UseWrappedDataResult => {
  const { year: yearParam } = useParams<{ year?: string }>();
  const navigate = useNavigate();
  const authContext = useAuth();
  const user = authContext?.user;
  const wrappedConfig = useWrappedConfig();

  const [stats, setStats] = useState<WrappedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);

  const year = yearParam ? parseInt(yearParam) : wrappedConfig.year || DEFAULT_YEAR;

  // Aktivierte Slides basierend auf Konfiguration. Memoisiert, sonst wechselt die
  // Referenz bei jedem Render → goToSlide/next/prev bekommen neue Identität → die
  // Keyboard-/Wheel-Listener-Effekte hängen sich bei jedem Render neu ein/aus.
  const enabledSlides = useMemo(
    () => DEFAULT_SLIDE_CONFIG.filter((s) => s.enabled).sort((a, b) => a.order - b.order),
    []
  );

  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setError(t('Bitte melde dich an, um deinen Jahresrückblick zu sehen.'));
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const events = await WatchActivityService.getEventsForYear(user.uid, year);
        const bingeSessions = await WatchActivityService.getBingeSessionsForYear(user.uid, year);

        if (events.length === 0) {
          setError(t('Keine Daten für {year} gefunden. Schau mehr Serien und Filme!', { year }));
          setLoading(false);
          return;
        }

        let calculatedStats = calculateWrappedStats(events, bingeSessions, year);
        calculatedStats = await enrichStatsWithPosters(calculatedStats);

        setStats(calculatedStats);
        setError(null);
      } catch (err) {
        console.error('Error loading wrapped data:', err);
        setError(t('Fehler beim Laden der Daten.'));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, year]);

  const goToSlide = useCallback(
    (index: number) => {
      const maxIndex = enabledSlides.length - 1;
      const newIndex = Math.max(0, Math.min(index, maxIndex));
      setCurrentSlide(newIndex);
    },
    [enabledSlides]
  );

  const nextSlide = useCallback(() => {
    goToSlide(currentSlide + 1);
  }, [currentSlide, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide(currentSlide - 1);
  }, [currentSlide, goToSlide]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'Escape') {
        navigate(-1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide, navigate]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
  };

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY > 0) {
        nextSlide();
      } else if (e.deltaY < 0) {
        prevSlide();
      }
    },
    [nextSlide, prevSlide]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  const handleShare = async () => {
    if (!stats) return;

    const shareText =
      t('Mein {year} in Zahlen:', { year }) +
      '\n' +
      t('{n} Episoden', { n: stats.totalEpisodesWatched }) +
      '\n' +
      t('{n} Filme', { n: stats.totalMoviesWatched }) +
      '\n' +
      t('{n} Stunden', { n: Math.round(stats.totalHoursWatched) }) +
      '\n' +
      `${stats.achievements.filter((a) => a.unlocked).length} Achievements`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: t('Mein Jahresrückblick {year}', { year }),
          text: shareText,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        showToast(t('In die Zwischenablage kopiert!'), 2500, 'success');
      } catch {
        showToast(t('Kopieren fehlgeschlagen'), 2500, 'error');
      }
    }
  };

  return {
    year,
    wrappedConfig,
    user,
    navigate,
    stats,
    loading,
    error,
    currentSlide,
    enabledSlides,
    nextSlide,
    prevSlide,
    containerRef,
    handleTouchStart,
    handleTouchEnd,
    handleShare,
  };
};
