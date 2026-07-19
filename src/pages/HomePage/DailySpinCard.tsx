import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { dbRef, userPath } from '../../services/db/ref';
import AutoAwesome from '@mui/icons-material/AutoAwesome';
import Whatshot from '@mui/icons-material/Whatshot';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { toLocalDateString } from '../../services/pet/dailySpinService';
import { DailySpinWheel } from '../../components/pet/DailySpinWheel';
import { tapScaleSmall } from '../../lib/motion';
import { t } from '../../services/i18n';

// Bewusste Akzent-Konstanten für das Glücksrad: gamifizierte Gold/Orange-
// Markenoptik, absichtlich theme-unabhängig (nicht an --theme-primary koppeln).
const SPIN_GOLD = '#FFD93D';
const SPIN_ORANGE = '#FF9800';
const SPIN_ICON_DARK = '#1a1a2e';

export const DailySpinCard: React.FC = () => {
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const [lastSpinDate, setLastSpinDate] = useState<string | null>(null);
  const [showWheel, setShowWheel] = useState(false);
  const [streakDays, setStreakDays] = useState(0);
  const [totalSpins, setTotalSpins] = useState(0);

  const available = lastSpinDate !== toLocalDateString(new Date());

  // Live subscription auf lastSpinDate, damit die Card sofort updated
  // wenn der User im DailySpinWheel oder anderswo gespint hat.
  useEffect(() => {
    if (!user?.uid) return;
    const ref = dbRef(userPath(user.uid, 'dailySpin', 'lastSpinDate'));
    const handler = (snap: firebase.database.DataSnapshot) => {
      setLastSpinDate(snap.val());
    };
    ref.on('value', handler);
    return () => ref.off('value', handler);
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    const year = new Date().getFullYear();
    const ref = dbRef(userPath(user.uid, 'wrapped', year, 'streak'));
    const handler = (snap: firebase.database.DataSnapshot) => {
      const data = snap.val();
      setStreakDays(data?.currentStreak || 0);
    };
    ref.on('value', handler);
    return () => ref.off('value', handler);
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    const ref = dbRef(userPath(user.uid, 'dailySpin', 'totalSpins'));
    const handler = (snap: firebase.database.DataSnapshot) => {
      setTotalSpins(snap.val() || 0);
    };
    ref.on('value', handler);
    return () => ref.off('value', handler);
  }, [user?.uid]);

  const handleClose = () => {
    setShowWheel(false);
  };

  return (
    <>
      <div style={{ margin: '0 20px', width: 'calc(100% - 40px)' }}>
        <motion.div
          onClick={() => setShowWheel(true)}
          whileTap={tapScaleSmall}
          role="button"
          tabIndex={0}
          aria-label={available ? t('Glücksrad drehen') : t('Glücksrad – morgen wieder verfügbar')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setShowWheel(true);
            }
          }}
          style={{
            padding: '12px 14px',
            borderRadius: '14px',
            background: available
              ? `linear-gradient(135deg, ${currentTheme.background.surface}, ${currentTheme.background.surface})`
              : currentTheme.background.surface,
            border: `1px solid ${available ? `${SPIN_GOLD}40` : currentTheme.border.default}`,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: available
              ? '0 4px 16px -4px rgba(255,217,61,0.3), 0 2px 6px -2px rgba(0, 0, 0, 0.3)'
              : '0 4px 16px -4px rgba(0, 0, 0, 0.4), 0 2px 6px -2px rgba(0, 0, 0, 0.3)',
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '12px',
              // WICHTIG: gültige CSS-Farbe verwenden. `${text.muted}20` ergab
              // `rgba(...)20` (ungültig) -> der Browser lehnt den Wert ab und
              // behält den zuvor gesetzten Gold-Gradienten (Icon blieb gold,
              // obwohl available=false). Token ist gültig und wird sauber gesetzt.
              background: available
                ? `linear-gradient(135deg, ${SPIN_GOLD}, ${SPIN_ORANGE})`
                : 'var(--glass-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              position: 'relative',
            }}
          >
            <motion.div
              animate={available ? { rotate: [0, -10, 10, -10, 10, 0] } : {}}
              transition={available ? { duration: 2, repeat: Infinity, repeatDelay: 3 } : {}}
              style={{ display: 'flex' }}
            >
              <AutoAwesome
                style={{
                  fontSize: 20,
                  color: available ? SPIN_ICON_DARK : currentTheme.text.muted,
                }}
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
              {t('Glücksrad')}
            </h2>
            <p
              style={{
                margin: '1px 0 0',
                fontSize: 12,
                color: available ? SPIN_GOLD : currentTheme.text.secondary,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontWeight: available ? 600 : 400,
              }}
            >
              {available ? t('Jetzt drehen!') : t('Morgen wieder verfügbar')}
            </p>
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {streakDays > 0 && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: SPIN_GOLD,
                  background: `${SPIN_GOLD}18`,
                  padding: '2px 6px',
                  borderRadius: 4,
                }}
              >
                <Whatshot style={{ fontSize: 12 }} /> {t('{n}d Bonus', { n: streakDays })}
              </span>
            )}
            {available && (
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: SPIN_GOLD,
                }}
              />
            )}
            {!available && totalSpins > 0 && (
              <span
                style={{
                  fontSize: 10,
                  color: currentTheme.text.muted,
                }}
              >
                {t('{n}x gedreht', { n: totalSpins })}
              </span>
            )}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showWheel && <DailySpinWheel streakDays={streakDays} onClose={handleClose} />}
      </AnimatePresence>
    </>
  );
};
