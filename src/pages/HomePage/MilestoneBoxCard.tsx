import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { dbRef, userPath } from '../../lib/db/ref';
import Inventory2 from '@mui/icons-material/Inventory2';
import { CelebrationBurst } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../AuthContext';
import { useWebWorkerStatsOptimized } from '../../hooks/useWebWorkerStatsOptimized';
import { hapticCelebrate } from '../../lib/haptics';
import {
  BOX_EVERY_N_EPISODES,
  BOX_SCHEMA_VERSION,
  ensureInitialized,
  getNextBoxThreshold,
  getProgressToNextBox,
} from '../../services/pet/mysteryBoxService';
import { MysteryBoxOverlay } from '../../components/pet/MysteryBoxOverlay';

// Bewusste Akzent-Konstanten für die Mystery Box: gamifizierte Lila/Magenta-
// Markenoptik, absichtlich theme-unabhängig (nicht an --theme-primary koppeln).
const BOX_PURPLE = '#9C27B0';
const BOX_MAGENTA = '#E040FB';

export const MilestoneBoxCard: React.FC = () => {
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const stats = useWebWorkerStatsOptimized();
  const [lastOpenedBoxNumber, setLastOpenedBoxNumber] = useState<number | null>(null);
  const [showBox, setShowBox] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  // Unique watched Episoden (nicht totalViews) damit die Anzeige mit dem
  // "Eps. gesamt" Counter synchron laeuft und User-Erwartung matcht:
  // 1 Folge gesehen = +1 Progress, Rewatches zaehlen nicht doppelt.
  const totalEpisodes = stats.watchedEpisodes || 0;
  const nextThreshold = getNextBoxThreshold(totalEpisodes);
  const progress = getProgressToNextBox(totalEpisodes);

  // Live subscription auf den Box-Counter. Solange schemaVersion < 2 ist
  // (alter 50er-Stand), unterdruecken wir den State-Update — der separate
  // Bootstrap-Effect schreibt erst die neue Baseline, danach feuert der
  // Listener mit korrekten Werten.
  useEffect(() => {
    if (!user?.uid) return;
    const ref = dbRef(userPath(user.uid, 'mysteryBox'));
    const handler = (snap: firebase.database.DataSnapshot) => {
      const data = snap.val() as {
        lastOpenedBoxNumber?: number;
        boxesOpened?: number;
        schemaVersion?: number;
      } | null;
      const last = typeof data?.lastOpenedBoxNumber === 'number' ? data.lastOpenedBoxNumber : null;
      const schemaVersion = data?.schemaVersion ?? 1;

      // Migration steht aus: nicht setzen, sonst flasht kurz die alte
      // Box-Zahl (z.B. 651) auf, bevor ensureInitialized die Baseline neu setzt.
      if (last !== null && last > 0 && schemaVersion < BOX_SCHEMA_VERSION) return;

      setLastOpenedBoxNumber(last);
    };
    ref.on('value', handler);
    return () => ref.off('value', handler);
  }, [user?.uid]);

  // Bootstrap / Migration einmalig triggern, sobald totalEpisodes geladen ist.
  // ensureInitialized prueft Schema-Version und setzt ggf. die Baseline.
  const bootstrapDoneRef = useRef(false);
  useEffect(() => {
    if (!user?.uid || totalEpisodes === 0 || bootstrapDoneRef.current) return;
    bootstrapDoneRef.current = true;
    void ensureInitialized(user.uid, totalEpisodes);
  }, [user?.uid, totalEpisodes]);

  const handleClose = () => {
    setShowBox(false);
  };

  const earnedBoxes = Math.floor(totalEpisodes / BOX_EVERY_N_EPISODES);
  // Solange Bootstrap noch nicht durch ist, keine Boxen anzeigen
  // (sonst wuerden bei einem etablierten User mit z.B. 500 Eps fuer
  // einen Frame 10 Boxen aufploppen).
  const availableBoxes =
    lastOpenedBoxNumber === null ? 0 : Math.max(0, earnedBoxes - lastOpenedBoxNumber);
  const hasBox = availableBoxes > 0;

  return (
    <>
      <div style={{ margin: '0 20px', width: 'calc(100% - 40px)' }}>
        <motion.div
          onClick={
            hasBox
              ? () => {
                  hapticCelebrate();
                  setCelebrate(true);
                  setShowBox(true);
                }
              : undefined
          }
          whileTap={hasBox ? { scale: 0.98 } : undefined}
          {...(hasBox && {
            role: 'button',
            tabIndex: 0,
            'aria-label': `Mystery Box öffnen – ${availableBoxes} verfügbar`,
            onKeyDown: (e: React.KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                hapticCelebrate();
                setCelebrate(true);
                setShowBox(true);
              }
            },
          })}
          style={{
            padding: '12px 14px',
            borderRadius: '14px',
            background: currentTheme.background.surface,
            border: `1px solid ${hasBox ? `${BOX_PURPLE}40` : currentTheme.border.default}`,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: hasBox ? 'pointer' : 'default',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: hasBox
              ? '0 4px 16px -4px rgba(156,39,176,0.3), 0 2px 6px -2px rgba(0, 0, 0, 0.3)'
              : '0 4px 16px -4px rgba(0, 0, 0, 0.4), 0 2px 6px -2px rgba(0, 0, 0, 0.3)',
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '12px',
              background: hasBox
                ? `linear-gradient(135deg, ${BOX_PURPLE}, ${BOX_MAGENTA})`
                : 'var(--glass-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <motion.div
              animate={hasBox ? { scale: [1, 1.15, 1] } : {}}
              transition={hasBox ? { duration: 2, repeat: Infinity } : {}}
              style={{ display: 'flex' }}
            >
              <Inventory2
                style={{ fontSize: 20, color: hasBox ? 'white' : currentTheme.text.muted }}
              />
            </motion.div>
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 700,
                fontFamily: 'var(--font-display)',
                color: currentTheme.text.primary,
                whiteSpace: 'nowrap',
              }}
            >
              Mystery Box
            </h2>
            <p
              style={{
                margin: '1px 0 0',
                fontSize: 12,
                color: hasBox ? BOX_MAGENTA : currentTheme.text.secondary,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontWeight: hasBox ? 600 : 400,
              }}
            >
              {hasBox
                ? `${availableBoxes} Box${availableBoxes > 1 ? 'en' : ''} verfügbar!`
                : `Nächste in ${nextThreshold - totalEpisodes} Episoden`}
            </p>
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {hasBox ? (
              <>
                {availableBoxes > 1 && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: BOX_MAGENTA,
                      background: `${BOX_MAGENTA}18`,
                      padding: '2px 6px',
                      borderRadius: 4,
                    }}
                  >
                    x{availableBoxes}
                  </span>
                )}
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: BOX_MAGENTA,
                  }}
                />
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div
                  style={{
                    width: 40,
                    height: 4,
                    borderRadius: 2,
                    background: 'var(--glass-light)',
                    overflow: 'hidden',
                  }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress * 100}%` }}
                    style={{
                      height: '100%',
                      borderRadius: 2,
                      background: `linear-gradient(90deg, ${BOX_PURPLE}, ${BOX_MAGENTA})`,
                    }}
                  />
                </div>
                <span style={{ fontSize: 10, color: currentTheme.text.muted }}>
                  {totalEpisodes % BOX_EVERY_N_EPISODES}/{BOX_EVERY_N_EPISODES}
                </span>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showBox && <MysteryBoxOverlay totalEpisodes={totalEpisodes} onClose={handleClose} />}
      </AnimatePresence>
      <CelebrationBurst
        trigger={celebrate}
        onDone={() => setCelebrate(false)}
        colors={[currentTheme.primary, currentTheme.accent]}
      />
    </>
  );
};
