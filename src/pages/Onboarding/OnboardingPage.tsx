import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { AnimatePresence } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { useTheme } from '../../contexts/ThemeContextDef';
import type { OnboardingItem } from './hooks/useOnboardingSearch';
import { useOnboardingSearch } from './hooks/useOnboardingSearch';
import { AddContentStep } from './steps/AddContentStep';
import { CompletionStep } from './steps/CompletionStep';
import { WelcomeStep } from './steps/WelcomeStep';

type Step = 'welcome' | 'addSeries' | 'addMovies' | 'done';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const { user, onboardingComplete, setOnboardingComplete } = useAuth() || {};

  // Redirect to home if onboarding is already complete
  useEffect(() => {
    if (onboardingComplete === true) {
      navigate('/', { replace: true });
    }
  }, [onboardingComplete, navigate]);

  const [step, setStep] = useState<Step>('welcome');
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);

  // Track pending items (not yet added to backend)
  const [pendingItems, setPendingItems] = useState<Map<string, OnboardingItem>>(new Map());
  const [addingId, setAddingId] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionProgress, setCompletionProgress] = useState(0);

  // Track season selections for batch processing
  const [seasonSelections, setSeasonSelections] = useState<Map<number, number | 'all' | 'none'>>(
    new Map()
  );

  const {
    genres,
    suggestions,
    searchResults,
    loading,
    searchLoading,
    fetchSuggestions,
    search,
    addToList,
    setSearchResults,
  } = useOnboardingSearch();

  // Derived counts from pendingItems
  const seriesCount = Array.from(pendingItems.values()).filter(
    (item) => item.type === 'series'
  ).length;
  const movieCount = Array.from(pendingItems.values()).filter(
    (item) => item.type === 'movie'
  ).length;
  const addedIds = new Set(pendingItems.keys());

  const toggleGenre = useCallback((id: number) => {
    setSelectedGenres((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));
  }, []);

  const handleWelcomeNext = useCallback(() => {
    fetchSuggestions(selectedGenres);
    setStep('addSeries');
  }, [selectedGenres, fetchSuggestions]);

  const handleAdd = useCallback(async (item: OnboardingItem): Promise<boolean> => {
    const itemKey = `${item.type}-${item.id}`;
    setAddingId(itemKey);

    // Simulate slight delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 300));

    setPendingItems((prev) => {
      const next = new Map(prev);
      next.set(itemKey, item);
      return next;
    });

    setAddingId(null);
    return true;
  }, []);

  const handleRemove = useCallback((item: OnboardingItem) => {
    const itemKey = `${item.type}-${item.id}`;
    setPendingItems((prev) => {
      const next = new Map(prev);
      next.delete(itemKey);
      return next;
    });

    // Clear season selection if it's a series
    if (item.type === 'series') {
      setSeasonSelections((prev) => {
        const next = new Map(prev);
        next.delete(item.id);
        return next;
      });
    }
  }, []);

  const handleSeasonSelect = useCallback(
    (item: OnboardingItem, season: number | 'all' | 'none') => {
      setSeasonSelections((prev) => {
        const next = new Map(prev);
        next.set(item.id, season);
        return next;
      });
    },
    []
  );

  // Apply watch progress to series in Firebase (parallel processing)
  const applyWatchProgress = useCallback(
    async (onProgress?: (progress: number) => void) => {
      if (!user?.uid || seasonSelections.size === 0) return;

      const now = new Date().toISOString();
      const API_KEY = import.meta.env.VITE_API_TMDB;

      // Filter out 'none' selections
      const seriesToProcess = Array.from(seasonSelections.entries()).filter(
        ([_, sel]) => sel !== 'none'
      );
      const totalSeries = seriesToProcess.length;
      let completedSeries = 0;

      // Process all series in parallel
      const processPromises = seriesToProcess.map(async ([tmdbId, selection]) => {
        try {
          // Wait and retry to find the series in Firebase (up to 25 times with 1 second delay)
          let seriesNmr: number | null = null;
          let retries = 0;

          while (!seriesNmr && retries < 30) {
            // Only wait if this is not the first attempt
            if (retries > 0) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }

            // Read directly from Firebase to find the series
            const snapshot = await firebase
              .database()
              .ref(`users/${user.uid}/series`)
              .once('value');
            const allSeries = snapshot.val();

            if (allSeries) {
              // Find the series by TMDB ID
              for (const [nmr, seriesData] of Object.entries(allSeries)) {
                if ((seriesData as { id?: number }).id === tmdbId) {
                  seriesNmr = parseInt(nmr);
                  break;
                }
              }
            }

            retries++;
          }

          if (!seriesNmr) {
            console.warn(
              `⚠️ Serie ${tmdbId} nicht in Firebase gefunden nach ${retries} Versuchen - überspringe diese Serie`
            );
            return;
          }

          // Set watchlist: true only for partially watched series (not "all")
          const shouldBeOnWatchlist = selection !== 'all';
          await firebase
            .database()
            .ref(`users/${user.uid}/series/${tmdbId}/watchlist`)
            .set(shouldBeOnWatchlist);

          // Fetch full series details from TMDB to get season count
          const detailsRes = await fetch(
            `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${API_KEY}&language=de-DE`
          );
          if (!detailsRes.ok) {
            console.warn(`TMDB Details für Serie ${tmdbId} konnten nicht geladen werden`);
            return;
          }
          const details = await detailsRes.json();
          const numberOfSeasons = details.number_of_seasons || 0;

          if (numberOfSeasons === 0) {
            console.warn(`Serie ${tmdbId} hat keine Staffeln`);
            return;
          }

          // Determine which seasons to mark as watched
          const maxSeason = selection === 'all' ? numberOfSeasons : (selection as number);

          // Fetch episodes for each season and build the structure
          // Neues Format: seasons/{sn-1}/eps/{epId}: {w,c,f,l}
          // Nur Seasons mit gesehenen Eps schreiben, leere Seasons weglassen.
          const seasonsObj: Record<
            string,
            { eps: Record<string, { w: 1; c: 1; f: number; l: number }> }
          > = {};
          const nowUnix = Math.floor(new Date(now).getTime() / 1000);
          for (let seasonNum = 1; seasonNum <= numberOfSeasons; seasonNum++) {
            const seasonRes = await fetch(
              `https://api.themoviedb.org/3/tv/${tmdbId}/season/${seasonNum}?api_key=${API_KEY}&language=de-DE`
            );
            if (!seasonRes.ok) {
              console.warn(`Staffel ${seasonNum} von Serie ${tmdbId} konnte nicht geladen werden`);
              continue;
            }
            if (seasonNum > maxSeason) continue; // nicht gesehen, skippen

            const seasonData = await seasonRes.json();
            const epsMap: Record<string, { w: 1; c: 1; f: number; l: number }> = {};
            for (const ep of seasonData.episodes || []) {
              if (typeof ep.id !== 'number') continue;
              epsMap[String(ep.id)] = { w: 1, c: 1, f: nowUnix, l: nowUnix };
            }
            if (Object.keys(epsMap).length > 0) {
              seasonsObj[String(seasonNum - 1)] = { eps: epsMap };
            }
          }

          // Write seasons to Firebase (neues ID-basiertes Format)
          if (Object.keys(seasonsObj).length > 0) {
            await firebase
              .database()
              .ref(`users/${user.uid}/seriesWatch/${tmdbId}/seasons`)
              .set(seasonsObj);
          }

          // Update progress
          completedSeries++;
          if (onProgress && totalSeries > 0) {
            onProgress(completedSeries / totalSeries);
          }
        } catch (error) {
          console.error(`❌ Fehler beim Setzen des Watch-Progress für Serie ${tmdbId}:`, error);
          completedSeries++;
          if (onProgress && totalSeries > 0) {
            onProgress(completedSeries / totalSeries);
          }
        }
      });

      // Wait for all series to be processed
      await Promise.all(processPromises);
    },
    [user?.uid, seasonSelections]
  );

  const completeOnboarding = useCallback(async () => {
    if (!user?.uid) return;

    setIsCompleting(true);
    setCompletionProgress(0);

    try {
      const totalItems = pendingItems.size;
      const watchProgressCount = Array.from(seasonSelections.values()).filter(
        (sel) => sel !== 'none'
      ).length;
      const totalSteps = totalItems + 1 + watchProgressCount; // items + wait + watch progress

      let currentStep = 0;

      // First: Add all pending items to backend
      for (const item of pendingItems.values()) {
        try {
          await addToList(item);
          currentStep++;
          setCompletionProgress(Math.round((currentStep / totalSteps) * 100));
        } catch (error) {
          console.error(`Fehler beim Hinzufügen von ${item.type} ${item.id}:`, error);
          currentStep++;
          setCompletionProgress(Math.round((currentStep / totalSteps) * 100));
        }
      }

      // Wait longer for backend to process ALL items and write to Firebase
      await new Promise((resolve) => setTimeout(resolve, 10000));
      currentStep++;
      setCompletionProgress(Math.round((currentStep / totalSteps) * 100));

      // Second: Apply watch progress to series
      await applyWatchProgress((seriesProgress) => {
        const progressFromWatchProgress = seriesProgress * watchProgressCount;
        setCompletionProgress(
          Math.round(((currentStep + progressFromWatchProgress) / totalSteps) * 100)
        );
      });

      // Finally: Set onboarding complete flag
      setCompletionProgress(100);
      await firebase.database().ref(`users/${user.uid}/onboardingComplete`).set(true);
      setOnboardingComplete?.(true);

      navigate('/', { replace: true });
    } catch (error) {
      console.error('Fehler beim Abschließen des Onboardings:', error);
      // Even on error, mark onboarding as complete to avoid getting stuck
      await firebase.database().ref(`users/${user.uid}/onboardingComplete`).set(true);
      setOnboardingComplete?.(true);
      navigate('/', { replace: true });
    }
  }, [
    user?.uid,
    pendingItems,
    addToList,
    applyWatchProgress,
    setOnboardingComplete,
    navigate,
    seasonSelections,
  ]);

  const handleSkip = useCallback(async () => {
    if (!user?.uid) return;
    await firebase.database().ref(`users/${user.uid}/onboardingComplete`).set(true);
    setOnboardingComplete?.(true);
    navigate('/', { replace: true });
  }, [user?.uid, setOnboardingComplete, navigate]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: currentTheme.background.default,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Decorative gradient */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(ellipse at 20% 10%, ${currentTheme.primary}12 0%, transparent 50%),
                       radial-gradient(ellipse at 80% 90%, ${currentTheme.accent}12 0%, transparent 50%)`,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Step dots */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 8,
          padding: '16px 0',
          paddingTop: 'calc(16px + env(safe-area-inset-top))',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {(['welcome', 'addSeries', 'addMovies', 'done'] as Step[]).map((s) => (
          <div
            key={s}
            style={{
              width: s === step ? 24 : 8,
              height: 8,
              borderRadius: 4,
              background:
                s === step
                  ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`
                  : `${currentTheme.text.muted}30`,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', position: 'relative', zIndex: 1 }}>
        <AnimatePresence mode="wait">
          {step === 'welcome' && (
            <WelcomeStep
              key="welcome"
              username={user?.displayName || 'User'}
              genres={genres}
              selectedGenres={selectedGenres}
              onToggleGenre={toggleGenre}
              onNext={handleWelcomeNext}
              onSkip={handleSkip}
            />
          )}
          {step === 'addSeries' && (
            <AddContentStep
              key="addSeries"
              suggestions={suggestions}
              searchResults={searchResults}
              loading={loading}
              searchLoading={searchLoading}
              addedIds={addedIds}
              addingId={addingId}
              addedCount={seriesCount}
              contentType="series"
              onSearch={search}
              onAdd={handleAdd}
              onRemove={handleRemove}
              onSeasonSelect={handleSeasonSelect}
              onClearSearch={() => setSearchResults([])}
              onNext={() => {
                setStep('addMovies');
              }}
              onSkip={() => {
                setStep('addMovies');
              }}
            />
          )}
          {step === 'addMovies' && (
            <AddContentStep
              key="addMovies"
              suggestions={suggestions}
              searchResults={searchResults}
              loading={loading}
              searchLoading={searchLoading}
              addedIds={addedIds}
              addingId={addingId}
              addedCount={movieCount}
              contentType="movie"
              onSearch={search}
              onAdd={handleAdd}
              onRemove={handleRemove}
              onSeasonSelect={handleSeasonSelect}
              onClearSearch={() => setSearchResults([])}
              onNext={() => {
                setStep('done');
              }}
              onSkip={() => {
                setStep('done');
              }}
            />
          )}
          {step === 'done' && (
            <CompletionStep
              key="done"
              seriesCount={seriesCount}
              movieCount={movieCount}
              isCompleting={isCompleting}
              completionProgress={completionProgress}
              onFinish={completeOnboarding}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
