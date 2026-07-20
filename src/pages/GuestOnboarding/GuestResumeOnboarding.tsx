import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { invalidateActiveSubscriptions } from '../../hooks/useActiveSubscriptions';
import { dbGet, dbRef, userPath } from '../../services/db/ref';
import { petService } from '../../services/petService';
import { t } from '../../services/i18n';
import {
  clearGuestPicks,
  getGuestPet,
  getGuestPicks,
  getGuestSubscriptions,
  type GuestPick,
} from '../../services/guestOnboarding';
import { WatchStatusSheet } from '../Onboarding/components/WatchStatusSheet';
import type { WatchTarget } from '../Onboarding/hooks/useApplyWatchProgress';
import { useApplyWatchProgress } from '../Onboarding/hooks/useApplyWatchProgress';
import { useOnboardingSearch } from '../Onboarding/hooks/useOnboardingSearch';
import { useWaitForBackendItem } from '../Onboarding/hooks/useWaitForBackendItem';
import '../Onboarding/onboarding.css';

type Phase = 'applying' | 'progress';

function summaryLabel(target: WatchTarget | undefined): string | null {
  if (!target || target.kind === 'none') return null;
  if (target.kind === 'total') return t('komplett gesehen');
  return t('bei s{s} · e{e}', { s: target.seasonIdx + 1, e: target.episodeIdx + 1 });
}

/**
 * Post-Signup-Teil des einen Onboardings: übernimmt die vor dem Anmelden
 * getroffene Gast-Auswahl (services/guestOnboarding), legt Titel/Abos/Pet an
 * und fragt anschließend den Watch-Fortschritt ab („wo stehst du?") — der geht
 * erst jetzt, weil die Serien nun im Katalog liegen.
 */
export const GuestResumeOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const { user, setOnboardingComplete } = useAuth() || {};
  const { addToList } = useOnboardingSearch();
  const waitForBackendItem = useWaitForBackendItem();
  const applyWatchProgress = useApplyWatchProgress();

  // Auswahl einmalig einlesen — der Store wird am Ende geleert.
  const [data] = useState(() => ({
    picks: getGuestPicks(),
    subscriptions: getGuestSubscriptions(),
    pet: getGuestPet(),
  }));
  const seriesPicks = data.picks.filter((p) => p.type === 'series');

  const [phase, setPhase] = useState<Phase>('applying');
  const [progress, setProgress] = useState(0);
  const [targets, setTargets] = useState<Map<number, WatchTarget>>(new Map());
  const [sheetItem, setSheetItem] = useState<GuestPick | null>(null);
  const startedRef = useRef(false);

  const finalize = useCallback(
    async (finalTargets: Map<number, WatchTarget>) => {
      const uid = user?.uid;
      if (!uid) return;
      try {
        const obj: Record<number, WatchTarget> = {};
        for (const [id, tgt] of finalTargets.entries()) if (tgt.kind !== 'none') obj[id] = tgt;
        if (Object.keys(obj).length > 0) await applyWatchProgress(obj);
      } catch (e) {
        console.error('[guest-resume] progress error', e);
      }
      await dbRef(userPath(uid, 'onboardingComplete')).set(true);
      setOnboardingComplete?.(true);
      clearGuestPicks();
      navigate('/', { replace: true });
    },
    [user?.uid, applyWatchProgress, setOnboardingComplete, navigate]
  );

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    const uid = user?.uid;
    if (!uid) return;

    (async () => {
      const { picks, subscriptions, pet } = data;
      const total = Math.max(picks.length + 2, 1);
      let done = 0;
      const tick = () => {
        done++;
        setProgress(Math.min(99, Math.round((done / total) * 100)));
      };
      try {
        await Promise.all(
          picks.map(async (item) => {
            const ok = await addToList(item);
            if (ok) await waitForBackendItem(item.type, item.id, 60_000);
            tick();
          })
        );

        if (subscriptions.length > 0) {
          const cfg: Record<string, { active: boolean }> = {};
          for (const name of subscriptions) cfg[name] = { active: true };
          await dbRef(userPath(uid, 'subscriptions', 'providers')).set(cfg);
          invalidateActiveSubscriptions(uid);
        }
        tick();

        if (pet) {
          const existing = Object.keys((await dbGet(userPath(uid, 'pets'))) || {}).length > 0;
          if (!existing)
            await petService.createPet(uid, pet.name.trim() || t('Mein Pet'), pet.type);
        }
        tick();
      } catch (e) {
        console.error('[guest-resume] apply error', e);
      }
      setProgress(100);
      // Kein Watch-Fortschritt möglich → direkt fertig.
      if (seriesPicks.length === 0) {
        void finalize(new Map());
      } else {
        setPhase('progress');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  return (
    <div className="ob-root">
      <div style={{ position: 'relative', zIndex: 2, flex: 1, overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          {phase === 'applying' && (
            <motion.div
              key="applying"
              className="ob-step"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                padding: 'clamp(24px, 6vw, 64px)',
                gap: 24,
              }}
            >
              <div className="ob-card__spinner" style={{ width: 34, height: 34 }} />
              <h1
                className="ob-display"
                style={{ fontSize: 'clamp(30px, 7vw, 52px)', margin: 0, color: 'var(--ob-paper)' }}
              >
                {t('Wir richten alles ein …')}
              </h1>
              <span className="ob-mono" style={{ color: 'var(--ob-text-mute)' }}>
                {progress}%
              </span>
            </motion.div>
          )}

          {phase === 'progress' && (
            <motion.div
              key="progress"
              className="ob-step"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}
            >
              <div
                style={{
                  padding: 'clamp(20px, 5vw, 48px) clamp(20px, 5vw, 56px) 0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  minHeight: 0,
                  flex: 1,
                  overflow: 'hidden',
                }}
              >
                <div>
                  <span className="ob-mono" style={{ color: 'var(--ob-text-mute)' }}>
                    {t('letzter Schritt')}
                  </span>
                  <h1
                    className="ob-display"
                    style={{
                      fontSize: 'clamp(38px, 9vw, 68px)',
                      margin: '8px 0 0',
                      color: 'var(--ob-paper)',
                    }}
                  >
                    {t('Wo stehst du?')}
                  </h1>
                  <p
                    style={{
                      marginTop: 8,
                      color: 'var(--ob-text-mute)',
                      fontFamily: 'var(--ob-font-display)',
                      fontStyle: 'italic',
                      fontSize: 'clamp(14px, 2.4vw, 18px)',
                      maxWidth: 480,
                    }}
                  >
                    {t('Tippe eine Serie an und sag uns, bis wohin du sie schon geschaut hast.')}
                  </p>
                </div>

                <div style={{ flex: 1, minHeight: 0, overflow: 'auto', paddingBottom: 16 }}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                      gap: 'clamp(12px, 2vw, 20px)',
                      rowGap: 'clamp(18px, 3vw, 28px)',
                    }}
                  >
                    {seriesPicks.map((it) => {
                      const label = summaryLabel(targets.get(it.id));
                      return (
                        <button
                          key={it.id}
                          onClick={() => setSheetItem(it)}
                          style={{
                            // display/min* setzen die globale `.mobile-app button`-Zentrierregel
                            // außer Kraft, die sonst Poster+Titel als Klumpen zusammenschiebt.
                            display: 'block',
                            width: '100%',
                            minWidth: 0,
                            minHeight: 0,
                            border: 'none',
                            background: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            textAlign: 'left',
                          }}
                        >
                          <div
                            style={{
                              width: '100%',
                              aspectRatio: '2 / 3',
                              borderRadius: 12,
                              backgroundColor: 'var(--ob-stage-2)',
                              backgroundImage: it.poster_path
                                ? `url(https://image.tmdb.org/t/p/w342${it.poster_path})`
                                : undefined,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              border: `1px solid ${label ? 'var(--ob-paper)' : 'var(--ob-line)'}`,
                              boxShadow: label
                                ? '0 10px 26px color-mix(in srgb, var(--ob-paper) 20%, transparent)'
                                : 'none',
                            }}
                          />
                          <div
                            style={{
                              marginTop: 8,
                              fontSize: 12,
                              fontWeight: 700,
                              color: 'var(--ob-text)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {it.title || it.name}
                          </div>
                          <div
                            className="ob-mono"
                            style={{ marginTop: 2, fontSize: 9, color: 'var(--ob-paper)' }}
                          >
                            {label ?? t('wo stehst du?')}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding:
                    'clamp(14px, 2vw, 20px) clamp(20px, 5vw, 56px) calc(20px + env(safe-area-inset-bottom))',
                  background: 'linear-gradient(180deg, transparent 0%, var(--ob-stage) 55%)',
                }}
              >
                <button onClick={() => finalize(targets)} className="ob-cta">
                  <span className="ob-cta__inner">
                    <span>{t('fertig — los geht’s')}</span>
                  </span>
                  <span className="ob-cta__arrow">→</span>
                </button>
                <button
                  onClick={() => finalize(new Map())}
                  className="ob-link"
                  style={{ margin: '8px auto 0', display: 'block' }}
                >
                  {t('überspringen')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {sheetItem && (
        <WatchStatusSheet
          open={!!sheetItem}
          tmdbId={sheetItem.id}
          title={sheetItem.title || sheetItem.name || ''}
          posterPath={sheetItem.poster_path}
          initial={targets.get(sheetItem.id) || { kind: 'none' }}
          onClose={() => setSheetItem(null)}
          onConfirm={(tgt) =>
            setTargets((prev) => {
              const next = new Map(prev);
              next.set(sheetItem.id, tgt);
              return next;
            })
          }
        />
      )}
    </div>
  );
};
