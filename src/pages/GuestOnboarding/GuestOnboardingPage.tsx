import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CoverWall } from '../../components/ui/media/CoverWall';
import { LetterReveal } from '../Onboarding/components/LetterReveal';
import type { WatchTarget } from '../Onboarding/hooks/useApplyWatchProgress';
import type { OnboardingItem } from '../Onboarding/hooks/useOnboardingSearch';
import { useOnboardingSearch } from '../Onboarding/hooks/useOnboardingSearch';
import '../Onboarding/onboarding.css';
import { DiscoveryStep } from '../Onboarding/steps/DiscoveryStep';
import { PetHatchStep } from '../Onboarding/steps/PetHatchStep';
import { SubscriptionsStep } from '../Onboarding/steps/SubscriptionsStep';
import { WelcomeStep } from '../Onboarding/steps/WelcomeStep';
import { FocusStep } from '../Onboarding/steps/FocusStep';
import { ReadingStep } from '../Onboarding/steps/ReadingStep';
import { ActsProvider, actsFor } from '../Onboarding/data/acts';
import {
  defaultPickStatus,
  type ReadingItem,
  type ReadingPick,
  type ReadingPickStatus,
} from '../Onboarding/hooks/useReadingPicks';
import type { AppFocus } from '../../services/settings/appFocus';
import { SocialLoginButtons } from '../Auth/SocialLoginButtons';
import {
  addGuestPick,
  clearGuestPicks,
  setGuestPet,
  setGuestReading,
  setGuestSubscriptions,
} from '../../services/account/guestOnboarding';
import { t } from '../../services/i18n';
import type { Pet } from '../../types/pet.types';

type Step =
  | 'intro'
  | 'focus'
  | 'welcome'
  | 'series'
  | 'movies'
  | 'reading'
  | 'subscriptions'
  | 'pet'
  | 'save';
/** Lese-Gäste überspringen Serien, Filme und Abos. */
const coreFor = (focus: AppFocus | null): Step[] =>
  focus === 'read'
    ? ['focus', 'welcome', 'reading', 'pet']
    : ['focus', 'welcome', 'series', 'movies', 'reading', 'subscriptions', 'pet'];

const VALUE = [
  { tag: 'Begleiter', line: 'Ein Begleiter, der mit jeder Folge levelt.' },
  { tag: 'Lesen', line: 'Manga und Bücher mit Lesestand und neuen Kapiteln.' },
  { tag: 'Wrapped', line: 'Dein Jahr in Zahlen — Rekorde, Genres, Binges.' },
  { tag: 'Streaming', line: 'Wo alles läuft — für dein Land.' },
];

const EMPTY_TARGETS = new Map<number, WatchTarget>();

export const GuestOnboardingPage: React.FC = () => {
  const [step, setStep] = useState<Step>('intro');
  const [focus, setFocus] = useState<AppFocus | null>(null);
  const core = useMemo(() => coreFor(focus), [focus]);
  const acts = useMemo(() => actsFor(focus ?? 'watch'), [focus]);
  const goNext = useCallback(
    () => setStep((current) => core[core.indexOf(current) + 1] ?? current),
    [core]
  );
  const goBack = useCallback(
    () => setStep((current) => core[core.indexOf(current) - 1] ?? current),
    [core]
  );
  const [readingPicks, setReadingPicks] = useState<Map<string, ReadingPick>>(new Map());
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [pendingItems, setPendingItems] = useState<Map<string, OnboardingItem>>(new Map());
  const [selectedProviders, setSelectedProviders] = useState<Set<string>>(new Set());
  const [petName, setPetName] = useState('');
  const [petType, setPetType] = useState<Pet['type']>('cat');
  const [authError, setAuthError] = useState('');

  const {
    suggestions,
    searchResults,
    loading,
    searchLoading,
    fetchSuggestions,
    search,
    setSearchResults,
  } = useOnboardingSearch();

  const toggleGenre = useCallback((slug: string) => {
    setSelectedSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug].slice(0, 4)
    );
  }, []);

  const togglePending = useCallback((item: OnboardingItem) => {
    const key = `${item.type}-${item.id}`;
    setPendingItems((prev) => {
      const next = new Map(prev);
      if (next.has(key)) next.delete(key);
      else next.set(key, item);
      return next;
    });
  }, []);

  const removePending = useCallback((item: OnboardingItem) => {
    const key = `${item.type}-${item.id}`;
    setPendingItems((prev) => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const toggleProvider = useCallback((name: string) => {
    setSelectedProviders((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  const handleWelcomeNext = useCallback(() => {
    if (focus !== 'read') fetchSuggestions(selectedSlugs);
    goNext();
  }, [fetchSuggestions, selectedSlugs, focus, goNext]);

  const toggleReading = useCallback((item: ReadingItem) => {
    setReadingPicks((prev) => {
      const next = new Map(prev);
      if (next.has(item.key)) next.delete(item.key);
      else next.set(item.key, { ...item, status: defaultPickStatus(item.kind) });
      return next;
    });
  }, []);

  const setReadingStatus = useCallback((key: string, status: ReadingPickStatus) => {
    setReadingPicks((prev) => {
      const pick = prev.get(key);
      if (!pick) return prev;
      const next = new Map(prev);
      next.set(key, { ...pick, status });
      return next;
    });
  }, []);

  // Vor dem Signup die gesamte Auswahl im Store sichern — nach dem Anmelden
  // übernimmt das große Onboarding sie und fragt nur noch den Fortschritt ab.
  const goToSave = useCallback(
    (skipPet = false) => {
      clearGuestPicks();
      for (const item of pendingItems.values()) addGuestPick(item);
      setGuestReading(Array.from(readingPicks.values()), focus ?? 'watch', selectedSlugs);
      setGuestSubscriptions(Array.from(selectedProviders));
      setGuestPet(skipPet ? null : { name: petName.trim(), type: petType });
      setStep('save');
    },
    [pendingItems, readingPicks, focus, selectedSlugs, selectedProviders, petName, petType]
  );

  const pickCovers = [
    ...Array.from(pendingItems.values()).map((it) => ({
      key: `${it.type}-${it.id}`,
      url: it.poster_path ? `https://image.tmdb.org/t/p/w185${it.poster_path}` : null,
    })),
    ...Array.from(readingPicks.values()).map((pick) => ({
      key: pick.key,
      url: pick.cover ?? null,
    })),
  ];
  const coreIndex = core.indexOf(step);
  const progressPct = coreIndex >= 0 ? ((coreIndex + 1) / core.length) * 100 : 0;

  return (
    <div className="ob-root">
      {(step === 'intro' || step === 'save') && (
        <>
          <CoverWall rows={4} />
          <div className="ob-vignette" />
          {/* Ausstieg zum Login, falls man sich verklickt hat und schon ein Konto hat. */}
          <Link
            to="/login"
            className="ob-link"
            style={{
              position: 'absolute',
              top: 16,
              right: 'clamp(20px, 5vw, 40px)',
              zIndex: 11,
              fontSize: 12,
            }}
          >
            {t('Anmelden')}
          </Link>
        </>
      )}

      {coreIndex >= 0 && (
        <div className="ob-progress" style={{ zIndex: 10 }}>
          <span className="ob-mono" style={{ color: 'rgba(244,237,224,0.85)' }}>
            {String(coreIndex + 1).padStart(2, '0')} / {String(core.length).padStart(2, '0')}
          </span>
          <div className="ob-progress-line">
            <div
              className="ob-progress-line__fill"
              style={{ transform: `scaleX(${progressPct / 100})` }}
            />
          </div>
          {/* Ausstieg zum Login — auf jedem Kern-Schritt erreichbar. */}
          <Link to="/login" className="ob-link" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
            {t('Anmelden')}
          </Link>
        </div>
      )}

      <div style={{ position: 'relative', zIndex: 2, flex: 1, overflow: 'hidden' }}>
        <ActsProvider value={acts}>
          <AnimatePresence mode="wait">
            {step === 'intro' && (
              <motion.div
                key="intro"
                className="ob-step"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                style={{ justifyContent: 'flex-end', padding: 'clamp(24px, 6vw, 72px)', gap: 28 }}
              >
                <div style={{ maxWidth: 640 }}>
                  <span className="ob-mono" style={{ color: 'var(--ob-text-mute)' }}>
                    {t('Serien · Filme · Manga · Bücher')}
                  </span>
                  <h1
                    className="ob-display"
                    style={{
                      fontSize: 'clamp(52px, 13vw, 120px)',
                      margin: '10px 0 0',
                      color: 'var(--ob-paper)',
                    }}
                  >
                    <LetterReveal text={t('Alles, was du schaust und liest.')} stagger={0.045} />
                  </h1>
                </div>
                <div style={{ maxWidth: 520, display: 'flex', flexDirection: 'column' }}>
                  {VALUE.map((v, i) => (
                    <motion.div
                      key={v.tag}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + i * 0.12, duration: 0.5 }}
                      style={{
                        display: 'flex',
                        gap: 18,
                        alignItems: 'baseline',
                        padding: '14px 0',
                        borderTop: '1px solid var(--ob-line)',
                      }}
                    >
                      <span
                        className="ob-mono"
                        style={{ color: 'var(--ob-paper)', width: 84, flexShrink: 0 }}
                      >
                        {t(v.tag)}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--ob-font-display)',
                          fontStyle: 'italic',
                          fontWeight: 500,
                          fontSize: 'clamp(16px, 2.6vw, 20px)',
                          letterSpacing: '-0.01em',
                          color: 'var(--ob-text)',
                          lineHeight: 1.15,
                        }}
                      >
                        {t(v.line)}
                      </span>
                    </motion.div>
                  ))}
                </div>
                <button
                  onClick={() => setStep('focus')}
                  className="ob-cta"
                  style={{ maxWidth: 520 }}
                >
                  <span className="ob-cta__inner">
                    <span>{t('los geht’s')}</span>
                  </span>
                  <span className="ob-cta__arrow">→</span>
                </button>
              </motion.div>
            )}

            {step === 'focus' && (
              <FocusStep key="focus" focus={focus} onChange={setFocus} onNext={goNext} />
            )}

            {step === 'welcome' && (
              <WelcomeStep
                key="welcome"
                reading={focus === 'read'}
                username=""
                hideProgram
                selectedSlugs={selectedSlugs}
                onToggleGenre={toggleGenre}
                onNext={handleWelcomeNext}
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
                pendingId={null}
                watchTargets={EMPTY_TARGETS}
                disableWatchStatus
                hideProgram
                onSearchChange={search}
                onTogglePending={togglePending}
                onRemovePending={removePending}
                onSetWatchTarget={() => {}}
                onClearSearch={() => setSearchResults([])}
                onNext={goNext}
                onBack={goBack}
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
                pendingId={null}
                watchTargets={EMPTY_TARGETS}
                disableWatchStatus
                hideProgram
                onSearchChange={search}
                onTogglePending={togglePending}
                onRemovePending={removePending}
                onSetWatchTarget={() => {}}
                onClearSearch={() => setSearchResults([])}
                onNext={goNext}
                onBack={goBack}
              />
            )}

            {step === 'reading' && (
              <ReadingStep
                key="reading"
                genreSlugs={selectedSlugs}
                picks={readingPicks}
                required={focus !== 'watch'}
                hideProgram
                onToggle={toggleReading}
                onStatus={setReadingStatus}
                onNext={goNext}
                onBack={goBack}
              />
            )}

            {step === 'subscriptions' && (
              <SubscriptionsStep
                key="subscriptions"
                stepNumber={acts.findIndex((act) => act.key === 'subscriptions') + 1}
                selectedProviders={selectedProviders}
                onToggle={toggleProvider}
                hideProgram
                onNext={goNext}
                onBack={goBack}
              />
            )}

            {step === 'pet' && (
              <PetHatchStep
                key="pet"
                name={petName}
                type={petType}
                onNameChange={setPetName}
                onTypeChange={setPetType}
                onNext={() => goToSave(false)}
                onSkip={() => goToSave(true)}
                onBack={goBack}
              />
            )}

            {step === 'save' && (
              <motion.div
                key="save"
                className="ob-step"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                style={{
                  justifyContent: 'center',
                  padding: 'clamp(24px, 6vw, 64px)',
                  gap: 22,
                  maxWidth: 480,
                  margin: '0 auto',
                  width: '100%',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', height: 128 }}>
                  {pickCovers.slice(0, 5).map((it, i, arr) => {
                    const mid = (arr.length - 1) / 2;
                    return (
                      <motion.div
                        key={it.key}
                        initial={{ opacity: 0, y: 20, rotate: 0 }}
                        animate={{ opacity: 1, y: 0, rotate: (i - mid) * 8 }}
                        transition={{
                          delay: i * 0.06,
                          type: 'spring',
                          stiffness: 220,
                          damping: 18,
                        }}
                        style={{
                          width: 84,
                          aspectRatio: '2 / 3',
                          marginLeft: i === 0 ? 0 : -28,
                          borderRadius: 10,
                          border: '1px solid var(--ob-line)',
                          backgroundColor: 'var(--ob-stage-2)',
                          backgroundImage: it.url ? `url(${it.url})` : undefined,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
                          transformOrigin: 'bottom center',
                        }}
                      />
                    );
                  })}
                </div>

                <div>
                  <h1
                    className="ob-display"
                    style={{
                      fontSize: 'clamp(34px, 8vw, 60px)',
                      margin: 0,
                      color: 'var(--ob-paper)',
                    }}
                  >
                    {t('Fast fertig — jetzt sichern.')}
                  </h1>
                  <p
                    style={{
                      marginTop: 10,
                      color: 'var(--ob-text-mute)',
                      fontFamily: 'var(--ob-font-display)',
                      fontStyle: 'italic',
                      fontSize: 15,
                    }}
                  >
                    {t(
                      'Konto anlegen = deine Auswahl & dein Begleiter bleiben — auf allen Geräten. Danach nur noch: wo stehst du?'
                    )}
                  </p>
                </div>

                {authError && <div style={{ color: '#ff6b6b', fontSize: 13 }}>{authError}</div>}

                <SocialLoginButtons onError={setAuthError} hideDivider />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1, height: 1, background: 'var(--ob-line)' }} />
                    <span
                      className="ob-mono"
                      style={{ color: 'var(--ob-text-mute)', fontSize: 11 }}
                    >
                      {t('oder')}
                    </span>
                    <div style={{ flex: 1, height: 1, background: 'var(--ob-line)' }} />
                  </div>
                  <Link to="/register" className="ob-cta" style={{ textDecoration: 'none' }}>
                    <span className="ob-cta__inner">
                      <span>{t('mit e-mail registrieren')}</span>
                    </span>
                    <span className="ob-cta__arrow">→</span>
                  </Link>
                  <Link
                    to="/login"
                    className="ob-link"
                    style={{ fontSize: 12, alignSelf: 'center', textDecoration: 'none' }}
                  >
                    {t('Schon ein Konto? Anmelden')}
                  </Link>
                  <button
                    onClick={() => setStep('pet')}
                    className="ob-link"
                    style={{ fontSize: 11, alignSelf: 'center' }}
                  >
                    {t('← zurück')}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </ActsProvider>
      </div>
    </div>
  );
};
