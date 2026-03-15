/**
 * useWrappedData - Custom Hook for Wrapped page business logic
 *
 * Handles: data loading, slide navigation, keyboard/touch/wheel input, sharing.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import firebase from 'firebase/compat/app';
import { useAuth } from '../../App';
import { useWrappedConfig } from '../../hooks/useWrappedConfig';
import { WrappedStats, DEFAULT_SLIDE_CONFIG, WrappedSlideConfig } from '../../types/Wrapped';
import { calculateWrappedStats } from '../../services/wrappedCalculator';
import { WatchActivityService } from '../../services/watchActivityService';
import {
  trackWrappedSlideNavigated,
  trackContentShared,
  trackWrappedViewed,
  trackWrappedShared,
} from '../../firebase/analytics';

// Standard-Jahr (jedes Jahr hier ändern)
const DEFAULT_YEAR = 2025;

// TMDB API Key (aus Umgebungsvariable)
const TMDB_API_KEY = import.meta.env.VITE_API_TMDB;

// --- Poster fetching helpers ---

async function fetchPosterForSeries(seriesId: number): Promise<string | undefined> {
  if (!TMDB_API_KEY) return undefined;
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/tv/${seriesId}?api_key=${TMDB_API_KEY}&language=de-DE`
    );
    if (response.ok) {
      const data = await response.json();
      return data.poster_path || undefined;
    }
  } catch (error) {
    console.error(`Failed to fetch poster for series ${seriesId}:`, error);
  }
  return undefined;
}

async function fetchPosterForMovie(movieId: number): Promise<string | undefined> {
  if (!TMDB_API_KEY) return undefined;
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}&language=de-DE`
    );
    if (response.ok) {
      const data = await response.json();
      return data.poster_path || undefined;
    }
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

// --- Hook return type ---

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

  // Aktivierte Slides basierend auf Konfiguration
  const enabledSlides = DEFAULT_SLIDE_CONFIG.filter((s) => s.enabled).sort(
    (a, b) => a.order - b.order
  );

  // --- Data loading ---

  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setError('Bitte melde dich an, um deinen Jahresrückblick zu sehen.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const events = await WatchActivityService.getEventsForYear(user.uid, year);
        const bingeSessions = await WatchActivityService.getBingeSessionsForYear(user.uid, year);

        if (events.length === 0) {
          setError(`Keine Daten für ${year} gefunden. Schau mehr Serien und Filme!`);
          setLoading(false);
          return;
        }

        let calculatedStats = calculateWrappedStats(events, bingeSessions, year);
        calculatedStats = await enrichStatsWithPosters(calculatedStats);

        setStats(calculatedStats);
        setError(null);
        trackWrappedViewed(0);
      } catch (err) {
        console.error('Error loading wrapped data:', err);
        setError('Fehler beim Laden der Daten.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, year]);

  // --- Slide navigation ---

  const goToSlide = useCallback(
    (index: number) => {
      const maxIndex = enabledSlides.length - 1;
      const newIndex = Math.max(0, Math.min(index, maxIndex));
      setCurrentSlide(newIndex);
      const slideConfig = enabledSlides[newIndex];
      if (slideConfig) {
        trackWrappedSlideNavigated(slideConfig.type, newIndex);
      }
    },
    [enabledSlides]
  );

  const nextSlide = useCallback(() => {
    goToSlide(currentSlide + 1);
  }, [currentSlide, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide(currentSlide - 1);
  }, [currentSlide, goToSlide]);

  // --- Keyboard navigation ---

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

  // --- Touch/Swipe navigation ---

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

  // --- Wheel navigation ---

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

  // --- Share ---

  const handleShare = async () => {
    if (!stats) return;

    const shareText =
      `Mein ${year} in Zahlen:\n` +
      `${stats.totalEpisodesWatched} Episoden\n` +
      `${stats.totalMoviesWatched} Filme\n` +
      `${Math.round(stats.totalHoursWatched)} Stunden\n` +
      `${stats.achievements.filter((a) => a.unlocked).length} Achievements`;

    trackWrappedShared();
    trackContentShared('wrapped', `wrapped-${year}`);

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Mein Jahresrückblick ${year}`,
          text: shareText,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      alert('In die Zwischenablage kopiert!');
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
