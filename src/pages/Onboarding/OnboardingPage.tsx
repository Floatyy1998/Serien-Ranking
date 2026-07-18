import { AnimatePresence } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { CURATED_GENRES } from './genres';
import type { WatchTarget } from './hooks/useApplyWatchProgress';
import { useApplyWatchProgress } from './hooks/useApplyWatchProgress';
import type { OnboardingItem } from './hooks/useOnboardingSearch';
import { useOnboardingSearch } from './hooks/useOnboardingSearch';
import { useWaitForBackendItem } from './hooks/useWaitForBackendItem';
import './onboarding.css';
import { CompletionStep } from './steps/CompletionStep';
import { DiscoveryStep } from './steps/DiscoveryStep';
import { SubscriptionsStep } from './steps/SubscriptionsStep';
import { WelcomeStep } from './steps/WelcomeStep';
import { invalidateActiveSubscriptions } from '../../hooks/useActiveSubscriptions';
import { dbGet, dbRef, userPath } from '../../services/db/ref';
import { syncUserSearchIndex } from '../../services/firebase/userSearchIndex';

type Step = 'welcome' | 'series' | 'movies' | 'subscriptions' | 'done';
const STEPS: Step[] = ['welcome', 'series', 'movies', 'subscriptions', 'done'];
const STEP_LABELS: Record<Step, string> = {
  welcome: 'Kuration',
  series: 'Serien',
  movies: 'Filme',
  subscriptions: 'Abos',
  done: 'Premiere',
};

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, onboardingComplete, setOnboardingComplete } = useAuth() || {};

  useEffect(() => {
    if (onboardingComplete === true) navigate('/', { replace: true });
  }, [onboardingComplete, navigate]);

  const [step, setStep] = useState<Step>('welcome');
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  // Social-Sign-ups (Google/Apple) haben keinen selbst gewählten Namen —
  // der Welcome-Step fragt ihn dann ab, statt das Mail-Kürzel stehen zu lassen.
  const [nameEditable, setNameEditable] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [pendingItems, setPendingItems] = useState<Map<string, OnboardingItem>>(new Map());
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [watchTargets, setWatchTargets] = useState<Map<number, WatchTarget>>(new Map());
  const [selectedProviders, setSelectedProviders] = useState<Set<string>>(new Set());
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionProgress, setCompletionProgress] = useState(0);

  const toggleProvider = useCallback((name: string) => {
    setSelectedProviders((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  const {
    suggestions,
    searchResults,
    loading,
    searchLoading,
    fetchSuggestions,
    search,
    addToList,
    setSearchResults,
  } = useOnboardingSearch();

  const waitForBackendItem = useWaitForBackendItem();
  const applyWatchProgress = useApplyWatchProgress();

  const toggleGenre = useCallback((slug: string) => {
    setSelectedSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug].slice(0, 4)
    );
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    let cancelled = false;
    dbGet<string>(userPath(user.uid, 'username'))
      .then((existing) => {
        if (cancelled || existing) return;
        setNameEditable(true);
        setNameValue(user.displayName || user.email?.split('@')[0] || '');
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user]);

  const persistName = useCallback(async () => {
    const uid = user?.uid;
    const name = nameValue.trim();
    if (!uid || !nameEditable || name.length < 3) return;
    try {
      await dbRef(userPath(uid)).update({
        displayName: name,
        displayNameLower: name.toLowerCase(),
        username: name,
        usernameLower: name.toLowerCase(),
      });
      void syncUserSearchIndex(uid, { username: name, displayName: name });
      void user?.updateProfile({ displayName: name }).catch(() => {});
    } catch {
      /* best-effort — Name lässt sich später in den Einstellungen setzen */
    }
  }, [user, nameValue, nameEditable]);

  const handleWelcomeNext = useCallback(() => {
    void persistName();
    fetchSuggestions(selectedSlugs);
    setStep('series');
  }, [persistName, selectedSlugs, fetchSuggestions]);

  const togglePending = useCallback((item: OnboardingItem) => {
    const key = `${item.type}-${item.id}`;
    setPendingItems((prev) => {
      const next = new Map(prev);
      if (next.has(key)) next.delete(key);
      else next.set(key, item);
      return next;
    });
    if (item.type === 'series') {
      setWatchTargets((prev) => {
        const next = new Map(prev);
        if (!prev.has(item.id)) next.set(item.id, { kind: 'none' });
        return next;
      });
    }
  }, []);

  const removePending = useCallback((item: OnboardingItem) => {
    const key = `${item.type}-${item.id}`;
    setPendingItems((prev) => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
    if (item.type === 'series') {
      setWatchTargets((prev) => {
        const next = new Map(prev);
        next.delete(item.id);
        return next;
      });
    }
  }, []);

  const setWatchTarget = useCallback((tmdbId: number, target: WatchTarget) => {
    setWatchTargets((prev) => {
      const next = new Map(prev);
      next.set(tmdbId, target);
      return next;
    });
  }, []);

  const seriesCount = useMemo(
    () => Array.from(pendingItems.values()).filter((i) => i.type === 'series').length,
    [pendingItems]
  );
  const movieCount = useMemo(
    () => Array.from(pendingItems.values()).filter((i) => i.type === 'movie').length,
    [pendingItems]
  );
  const watchedSeriesCount = useMemo(
    () => Array.from(watchTargets.values()).filter((t) => t.kind !== 'none').length,
    [watchTargets]
  );
  const completionPosters = useMemo(
    () =>
      Array.from(pendingItems.values())
        .map((it) => it.poster_path)
        .filter((p): p is string => !!p),
    [pendingItems]
  );

  // Picked genres become the cover wall hue for the welcome step
  const tvGenreIds = useMemo(
    () => CURATED_GENRES.filter((g) => selectedSlugs.includes(g.slug)).map((g) => g.tvId),
    [selectedSlugs]
  );
  void tvGenreIds; // CoverWall fetched inside step from selected genres

  const finish = useCallback(async () => {
    const uid = user?.uid;
    if (!uid) return;
    setIsCompleting(true);
    setCompletionProgress(0);

    const items = Array.from(pendingItems.values());
    const totalAdds = items.length;
    const totalWatch = Array.from(watchTargets.values()).filter((t) => t.kind !== 'none').length;
    const totalUnits = Math.max(totalAdds + totalWatch + 1, 1);
    let unitsDone = 0;
    const tick = () => {
      unitsDone++;
      setCompletionProgress(Math.min(99, Math.round((unitsDone / totalUnits) * 100)));
    };

    try {
      setPendingId(null);
      await Promise.all(
        items.map(async (item) => {
          setPendingId(`${item.type}-${item.id}`);
          const ok = await addToList(item);
          if (ok) await waitForBackendItem(item.type, item.id, 60_000);
          tick();
        })
      );
      setPendingId(null);

      const targetsObj: Record<number, WatchTarget> = {};
      for (const [id, t] of watchTargets.entries()) targetsObj[id] = t;
      await applyWatchProgress(targetsObj, () => tick());

      if (selectedProviders.size > 0) {
        const providersConfig: Record<string, { active: boolean }> = {};
        for (const name of selectedProviders) providersConfig[name] = { active: true };
        await dbRef(userPath(uid, 'subscriptions', 'providers')).set(providersConfig);
        invalidateActiveSubscriptions(uid);
      }

      await dbRef(userPath(uid, 'onboardingComplete')).set(true);
      setOnboardingComplete?.(true);
      setCompletionProgress(100);
      setTimeout(() => navigate('/', { replace: true }), 500);
    } catch (e) {
      console.error('[onboarding] finish error', e);
      await dbRef(userPath(uid, 'onboardingComplete')).set(true);
      setOnboardingComplete?.(true);
      navigate('/', { replace: true });
    }
  }, [
    user?.uid,
    pendingItems,
    watchTargets,
    selectedProviders,
    addToList,
    waitForBackendItem,
    applyWatchProgress,
    setOnboardingComplete,
    navigate,
  ]);

  const handleSkip = useCallback(async () => {
    if (!user?.uid) return;
    await persistName();
    await dbRef(userPath(user.uid, 'onboardingComplete')).set(true);
    setOnboardingComplete?.(true);
    navigate('/', { replace: true });
  }, [user?.uid, persistName, setOnboardingComplete, navigate]);

  const currentStepIndex = STEPS.indexOf(step);
  const totalSteps = STEPS.length;
  const progressPct = ((currentStepIndex + 1) / totalSteps) * 100;

  return (
    <div className="ob-root">
      {/* Editorial progress header */}
      <div className="ob-progress">
        <span className="ob-mono" style={{ color: 'rgba(244,237,224,0.85)' }}>
          {String(currentStepIndex + 1).padStart(2, '0')} / {String(totalSteps).padStart(2, '0')}
        </span>
        <div className="ob-progress-line">
          <div
            className="ob-progress-line__fill"
            style={{ transform: `scaleX(${progressPct / 100})` }}
          />
        </div>
        <div className="ob-progress-meta">
          <span className="ob-mono" style={{ color: 'rgba(244,237,224,0.4)' }}>
            {STEP_LABELS[step]}
          </span>
        </div>
      </div>

      {/* Stage */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          {step === 'welcome' && (
            <WelcomeStep
              key="welcome"
              username={user?.displayName || 'Stranger'}
              nameEditable={nameEditable}
              nameValue={nameValue}
              onNameChange={setNameValue}
              selectedSlugs={selectedSlugs}
              onToggleGenre={toggleGenre}
              onNext={handleWelcomeNext}
              onSkip={handleSkip}
            />
          )}
          {step === 'series' && (
            <DiscoveryStep
              key="series"
              contentType="series"
              stepNumber={2}
              suggestions={suggestions}
              searchResults={searchResults}
              loading={loading}
              searchLoading={searchLoading}
              pendingMap={pendingItems}
              pendingId={pendingId}
              watchTargets={watchTargets}
              onSearchChange={search}
              onTogglePending={togglePending}
              onRemovePending={removePending}
              onSetWatchTarget={setWatchTarget}
              onClearSearch={() => setSearchResults([])}
              onNext={() => setStep('movies')}
              onBack={() => setStep('welcome')}
            />
          )}
          {step === 'movies' && (
            <DiscoveryStep
              key="movies"
              contentType="movie"
              stepNumber={3}
              suggestions={suggestions}
              searchResults={searchResults}
              loading={loading}
              searchLoading={searchLoading}
              pendingMap={pendingItems}
              pendingId={pendingId}
              watchTargets={watchTargets}
              onSearchChange={search}
              onTogglePending={togglePending}
              onRemovePending={removePending}
              onSetWatchTarget={setWatchTarget}
              onClearSearch={() => setSearchResults([])}
              onNext={() => setStep('subscriptions')}
              onBack={() => setStep('series')}
            />
          )}
          {step === 'subscriptions' && (
            <SubscriptionsStep
              key="subscriptions"
              stepNumber={4}
              selectedProviders={selectedProviders}
              onToggle={toggleProvider}
              onNext={() => setStep('done')}
              onBack={() => setStep('movies')}
            />
          )}
          {step === 'done' && (
            <CompletionStep
              key="done"
              seriesCount={seriesCount}
              movieCount={movieCount}
              watchedSeriesCount={watchedSeriesCount}
              posters={completionPosters}
              isCompleting={isCompleting}
              completionProgress={completionProgress}
              onFinish={finish}
              onBack={() => setStep('subscriptions')}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
