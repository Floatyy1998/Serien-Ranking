/**
 * WrappedPage - Hauptseite für den Jahresrückblick
 *
 * Diese Seite ist Jahr-agnostisch und kann jedes Jahr recycelt werden.
 * Einfach das Jahr im URL-Parameter oder als Default ändern.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { useWrappedConfig } from '../hooks/useWrappedConfig';
import {
  IntroSlide,
  TotalTimeSlide,
  TopSeriesSlide,
  TopMoviesSlide,
  TopGenresSlide,
  TopProvidersSlide,
  TimePatternSlide,
  BingeStatsSlide,
  AchievementsSlide,
  MonthlyBreakdownSlide,
  SummarySlide,
  FirstLastSlide,
  RecordDaySlide,
  LateNightSlide,
  HeatmapSlide,
  WrappedNotAvailablePage,
} from '../components/wrapped';
import { WrappedStats, DEFAULT_SLIDE_CONFIG, WrappedSlideType } from '../types/Wrapped';
import { calculateWrappedStats } from '../services/wrappedCalculator';
import { WatchActivityService } from '../services/watchActivityService';

// Standard-Jahr (jedes Jahr hier ändern)
const DEFAULT_YEAR = 2025;

// TMDB API Key (aus Umgebungsvariable)
const TMDB_API_KEY = import.meta.env.VITE_API_TMDB;

// Poster von TMDB laden
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

// Enriche Stats mit Poster-Daten
async function enrichStatsWithPosters(stats: WrappedStats): Promise<WrappedStats> {
  // Top Serien mit Postern anreichern
  const enrichedSeries = await Promise.all(
    stats.topSeries.map(async (series) => {
      if (!series.poster) {
        const poster = await fetchPosterForSeries(series.id);
        return { ...series, poster };
      }
      return series;
    })
  );

  // Top Filme mit Postern anreichern
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

export const WrappedPage: React.FC = () => {
  const { year: yearParam } = useParams<{ year?: string }>();
  const navigate = useNavigate();
  const authContext = useAuth();
  const user = authContext?.user;
  const wrappedConfig = useWrappedConfig();

  // Alle Hooks MÜSSEN vor conditional returns kommen
  const [stats, setStats] = useState<WrappedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);

  const year = yearParam ? parseInt(yearParam) : (wrappedConfig.year || DEFAULT_YEAR);

  // Aktivierte Slides basierend auf Konfiguration
  const enabledSlides = DEFAULT_SLIDE_CONFIG.filter(s => s.enabled).sort((a, b) => a.order - b.order);

  // Daten laden
  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setError('Bitte melde dich an, um deinen Jahresrückblick zu sehen.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Aktivitätsdaten laden
        const events = await WatchActivityService.getEventsForYear(user.uid, year);
        const bingeSessions = await WatchActivityService.getBingeSessionsForYear(user.uid, year);

        if (events.length === 0) {
          setError(`Keine Daten für ${year} gefunden. Schau mehr Serien und Filme!`);
          setLoading(false);
          return;
        }

        // Debug: Log events
        console.log('[Wrapped Debug] Total events loaded:', events.length);
        const movieEvts = events.filter((e: any) => e.type === 'movie_watch' || e.type === 'movie_rating');
        const episodeEvts = events.filter((e: any) => e.type === 'episode_watch');
        console.log('[Wrapped Debug] Movie events:', movieEvts.length, movieEvts);
        console.log('[Wrapped Debug] Episode events:', episodeEvts.length);
        console.log('[Wrapped Debug] All event types:', [...new Set(events.map((e: any) => e.type))]);

        // Statistiken berechnen
        let calculatedStats = calculateWrappedStats(events, bingeSessions, year);

        // Poster laden
        calculatedStats = await enrichStatsWithPosters(calculatedStats);

        setStats(calculatedStats);
        setError(null);
      } catch (err) {
        console.error('Error loading wrapped data:', err);
        setError('Fehler beim Laden der Daten.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, year]);

  // Navigation zwischen Slides
  const goToSlide = useCallback((index: number) => {
    const maxIndex = enabledSlides.length - 1;
    const newIndex = Math.max(0, Math.min(index, maxIndex));
    setCurrentSlide(newIndex);
  }, [enabledSlides.length]);

  const nextSlide = useCallback(() => {
    goToSlide(currentSlide + 1);
  }, [currentSlide, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide(currentSlide - 1);
  }, [currentSlide, goToSlide]);

  // Keyboard Navigation
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

  // Touch/Swipe Navigation
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

  // Wheel Navigation
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    if (e.deltaY > 0) {
      nextSlide();
    } else if (e.deltaY < 0) {
      prevSlide();
    }
  }, [nextSlide, prevSlide]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  // Share Funktion
  const handleShare = async () => {
    if (!stats) return;

    const shareText = `Mein ${year} in Zahlen:\n` +
      `${stats.totalEpisodesWatched} Episoden\n` +
      `${stats.totalMoviesWatched} Filme\n` +
      `${Math.round(stats.totalHoursWatched)} Stunden\n` +
      `${stats.achievements.filter(a => a.unlocked).length} Achievements`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Mein Jahresrückblick ${year}`,
          text: shareText,
        });
      } catch (err) {
        // User cancelled or share failed
        console.log('Share cancelled');
      }
    } else {
      // Fallback: Copy to clipboard
      await navigator.clipboard.writeText(shareText);
      alert('In die Zwischenablage kopiert!');
    }
  };

  // Wrapped deaktiviert - "Noch nicht verfügbar" Seite
  if (!wrappedConfig.loading && !wrappedConfig.enabled) {
    return <WrappedNotAvailablePage year={wrappedConfig.year} onBack={() => navigate('/')} />;
  }

  // Render Slide basierend auf Typ
  const renderSlide = (slideType: WrappedSlideType) => {
    if (!stats) return null;

    switch (slideType) {
      case 'intro':
        return <IntroSlide year={year} username={user?.displayName || user?.email?.split('@')[0]} />;
      case 'total_time':
        return (
          <TotalTimeSlide
            totalMinutes={stats.totalMinutesWatched}
            totalHours={stats.totalHoursWatched}
            totalDays={stats.totalDaysEquivalent}
            totalEpisodes={stats.totalEpisodesWatched}
            totalMovies={stats.totalMoviesWatched}
          />
        );
      case 'top_series':
        return <TopSeriesSlide topSeries={stats.topSeries} />;
      case 'top_movies':
        return <TopMoviesSlide topMovies={stats.topMovies} />;
      case 'top_genres':
        return <TopGenresSlide topGenres={stats.topGenres} />;
      case 'top_providers':
        return <TopProvidersSlide topProviders={stats.topProviders} />;
      case 'time_pattern':
        return (
          <TimePatternSlide
            favoriteTimeOfDay={stats.favoriteTimeOfDay}
            favoriteDayOfWeek={stats.favoriteDayOfWeek}
          />
        );
      case 'binge_stats':
        return (
          <BingeStatsSlide
            totalBingeSessions={stats.totalBingeSessions}
            longestBinge={stats.longestBingeSession}
            averageBingeLength={stats.averageBingeLength}
          />
        );
      case 'achievements':
        return <AchievementsSlide achievements={stats.achievements} />;
      case 'monthly_breakdown':
        return (
          <MonthlyBreakdownSlide
            monthlyBreakdown={stats.monthlyBreakdown}
            mostActiveMonth={stats.mostActiveMonth}
          />
        );
      case 'summary':
        return <SummarySlide stats={stats} onShare={handleShare} />;
      case 'first_last':
        return (
          <FirstLastSlide
            firstWatch={stats.firstWatch}
            lastWatch={stats.lastWatch}
            year={year}
          />
        );
      case 'record_day':
        return <RecordDaySlide mostActiveDay={stats.mostActiveDay} />;
      case 'late_night':
        return <LateNightSlide lateNightStats={stats.lateNightStats} />;
      case 'heatmap':
        return <HeatmapSlide heatmapData={stats.heatmapData} />;
      default:
        return null;
    }
  };

  // Loading State
  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              border: '3px solid rgba(255,255,255,0.3)',
              borderTop: '3px solid white',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px',
            }}
          />
          <p>Lade deinen Jahresrückblick...</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '20px',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 style={{ marginBottom: '20px' }}>{error}</h2>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '12px 30px',
              fontSize: '1rem',
              color: '#667eea',
              background: 'white',
              border: 'none',
              borderRadius: '25px',
              cursor: 'pointer',
            }}
          >
            Zurück zur Startseite
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
      }}
    >
      {/* Slide Container */}
      <div
        style={{
          height: '100%',
          transition: 'transform 0.5s ease-out',
          transform: `translateY(-${currentSlide * 100}%)`,
        }}
      >
        {enabledSlides.map((slide) => (
          <div key={slide.type} style={{ height: '100vh' }}>
            {renderSlide(slide.type)}
          </div>
        ))}
      </div>

      {/* Progress Bar - Bottom on mobile */}
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem' }}>
          {currentSlide + 1}/{enabledSlides.length}
        </span>
        <div
          style={{
            width: '80px',
            height: '3px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${((currentSlide + 1) / enabledSlides.length) * 100}%`,
              height: '100%',
              background: 'white',
              borderRadius: '2px',
              transition: 'width 0.3s ease-out',
            }}
          />
        </div>
      </div>

      {/* Close Button */}
      <button
        onClick={() => navigate(-1)}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: 'none',
          background: 'rgba(0,0,0,0.3)',
          color: 'white',
          fontSize: '1.5rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
        }}
        aria-label="Schließen"
      >
        ×
      </button>

      {/* Navigation Hints (nur auf erstem Slide) */}
      {currentSlide === 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: '50px',
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'white',
            textAlign: 'center',
            opacity: 0.6,
            zIndex: 100,
          }}
        >
          <p style={{ fontSize: '0.75rem', margin: 0 }}>
            Wischen zum Navigieren
          </p>
        </div>
      )}

      {/* CSS Animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
};

export default WrappedPage;
