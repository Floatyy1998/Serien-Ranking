import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { CoverWall } from '../../components/ui/CoverWall';
import { LetterReveal } from '../Onboarding/components/LetterReveal';
import type { WatchTarget } from '../Onboarding/hooks/useApplyWatchProgress';
import type { OnboardingItem } from '../Onboarding/hooks/useOnboardingSearch';
import { useOnboardingSearch } from '../Onboarding/hooks/useOnboardingSearch';
import '../Onboarding/onboarding.css';
import { DiscoveryStep } from '../Onboarding/steps/DiscoveryStep';
import { PetHatchStep } from '../Onboarding/steps/PetHatchStep';
import { SubscriptionsStep } from '../Onboarding/steps/SubscriptionsStep';
import { WelcomeStep } from '../Onboarding/steps/WelcomeStep';
import { SocialLoginButtons } from '../Auth/SocialLoginButtons';
import {
  addGuestPick,
  clearGuestPicks,
  setGuestPet,
  setGuestSubscriptions,
} from '../../services/guestOnboarding';
import { t } from '../../services/i18n';
import type { Pet } from '../../types/pet.types';

type Step = 'intro' | 'welcome' | 'series' | 'movies' | 'subscriptions' | 'pet' | 'save';
const CORE: Step[] = ['welcome', 'series', 'movies', 'subscriptions', 'pet'];

const VALUE = [
  { tag: 'Begleiter', line: 'Ein Begleiter, der mit jeder Folge levelt.' },
  { tag: 'Wrapped', line: 'Dein Jahr in Zahlen — Rekorde, Genres, Binges.' },
  { tag: 'Streaming', line: 'Wo alles läuft — für dein Land.' },
];

const EMPTY_TARGETS = new Map<number, WatchTarget>();

export const GuestOnboardingPage: React.FC = () => {
  const [step, setStep] = useState<Step>('intro');
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
    fetchSuggestions(selectedSlugs);
    setStep('series');
  }, [fetchSuggestions, selectedSlugs]);

  // Vor dem Signup die gesamte Auswahl im Store sichern — nach dem Anmelden
  // übernimmt das große Onboarding sie und fragt nur noch den Fortschritt ab.
  const goToSave = useCallback(() => {
    clearGuestPicks();
    for (const item of pendingItems.values()) addGuestPick(item);
    setGuestSubscriptions(Array.from(selectedProviders));
    setGuestPet(petName.trim() || petType ? { name: petName.trim(), type: petType } : null);
    setStep('save');
  }, [pendingItems, selectedProviders, petName, petType]);

  const pickList = Array.from(pendingItems.values());
  const coreIndex = CORE.indexOf(step);
  const progressPct = coreIndex >= 0 ? ((coreIndex + 1) / CORE.length) * 100 : 0;

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
              top: 'calc(env(safe-area-inset-top) + 16px)',
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
            {String(coreIndex + 1).padStart(2, '0')} / {String(CORE.length).padStart(2, '0')}
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
                  {t('Serien · Filme · Manga')}
                </span>
                <h1
                  className="ob-display"
                  style={{
                    fontSize: 'clamp(52px, 13vw, 120px)',
                    margin: '10px 0 0',
                    color: 'var(--ob-paper)',
                  }}
                >
                  <LetterReveal text={t('Alles, was du schaust.')} stagger={0.045} />
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
                onClick={() => setStep('welcome')}
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

          {step === 'welcome' && (
            <WelcomeStep
              key="welcome"
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
              pendingId={null}
              watchTargets={EMPTY_TARGETS}
              disableWatchStatus
              hideProgram
              onSearchChange={search}
              onTogglePending={togglePending}
              onRemovePending={removePending}
              onSetWatchTarget={() => {}}
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
              hideProgram
              onNext={() => setStep('pet')}
              onBack={() => setStep('movies')}
            />
          )}

          {step === 'pet' && (
            <PetHatchStep
              key="pet"
              name={petName}
              type={petType}
              onNameChange={setPetName}
              onTypeChange={setPetType}
              onNext={goToSave}
              onBack={() => setStep('subscriptions')}
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
                {pickList.slice(0, 5).map((it, i, arr) => {
                  const mid = (arr.length - 1) / 2;
                  return (
                    <motion.div
                      key={`${it.type}-${it.id}`}
                      initial={{ opacity: 0, y: 20, rotate: 0 }}
                      animate={{ opacity: 1, y: 0, rotate: (i - mid) * 8 }}
                      transition={{ delay: i * 0.06, type: 'spring', stiffness: 220, damping: 18 }}
                      style={{
                        width: 84,
                        aspectRatio: '2 / 3',
                        marginLeft: i === 0 ? 0 : -28,
                        borderRadius: 10,
                        border: '1px solid var(--ob-line)',
                        backgroundColor: 'var(--ob-stage-2)',
                        backgroundImage: it.poster_path
                          ? `url(https://image.tmdb.org/t/p/w185${it.poster_path})`
                          : undefined,
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
                  <span className="ob-mono" style={{ color: 'var(--ob-text-mute)', fontSize: 11 }}>
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
      </div>
    </div>
  );
};
