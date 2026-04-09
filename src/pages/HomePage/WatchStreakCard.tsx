import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Whatshot, Shield } from '@mui/icons-material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useTheme } from '../../contexts/ThemeContextDef';
import { useAuth } from '../../AuthContext';
import { petService } from '../../services/petService';
import { PET_CONFIG } from '../../services/pet/petConstants';
import { getStreakStatus, getShieldCooldown } from './watchStreakHelpers';
import type { WatchStreakData, ActivePetInfo } from './watchStreakHelpers';
import { StreakShieldDialog } from './StreakShieldDialog';

// Streak colors are resolved at render time from currentTheme
// active = success, at_risk/shieldable = warning, lost = muted

export const WatchStreakCard: React.FC = () => {
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const [streak, setStreak] = useState<WatchStreakData | null>(null);
  const [pet, setPet] = useState<ActivePetInfo | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [shieldLoading, setShieldLoading] = useState(false);
  const [shieldJustUsed, setShieldJustUsed] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // Load streak data
  useEffect(() => {
    if (!user?.uid) return;
    const year = new Date().getFullYear();
    const ref = firebase.database().ref(`users/${user.uid}/wrapped/${year}/streak`);

    const handler = (snapshot: firebase.database.DataSnapshot) => {
      const data = snapshot.val();
      if (data) {
        setStreak({
          currentStreak: data.currentStreak || 0,
          longestStreak: data.longestStreak || 0,
          lastWatchDate: data.lastWatchDate || '',
          lastShieldUsedDate: data.lastShieldUsedDate,
          shieldUsedCount: data.shieldUsedCount,
        });
      } else {
        setStreak({ currentStreak: 0, longestStreak: 0, lastWatchDate: '' });
      }
    };

    ref.on('value', handler);
    return () => ref.off('value', handler);
  }, [user?.uid]);

  // Load active pet info
  useEffect(() => {
    if (!user?.uid) return;

    const activePetRef = firebase.database().ref(`users/${user.uid}/petWidget/activePetId`);
    let petRef: firebase.database.Reference | null = null;
    let petHandler: ((s: firebase.database.DataSnapshot) => void) | null = null;

    const activeHandler = (snapshot: firebase.database.DataSnapshot) => {
      const activePetId = snapshot.val();
      // Clean up previous pet listener
      if (petRef && petHandler) {
        petRef.off('value', petHandler);
      }

      if (!activePetId) {
        setPet(null);
        return;
      }

      petRef = firebase.database().ref(`users/${user.uid}/pets/${activePetId}`);
      petHandler = (petSnap: firebase.database.DataSnapshot) => {
        const data = petSnap.val();
        if (data) {
          setPet({
            id: activePetId,
            name: data.name || 'Pet',
            level: data.level || 1,
            experience: data.experience || 0,
            isAlive: data.isAlive !== false,
          });
        } else {
          setPet(null);
        }
      };
      petRef.on('value', petHandler);
    };

    activePetRef.on('value', activeHandler);
    return () => {
      activePetRef.off('value', activeHandler);
      if (petRef && petHandler) {
        petRef.off('value', petHandler);
      }
    };
  }, [user?.uid]);

  const handleShieldActivate = useCallback(async () => {
    if (!user?.uid || !pet?.id) return;
    setShieldLoading(true);
    try {
      const result = await petService.activateStreakShield(user.uid, pet.id);
      if (result.success) {
        setShowConfirm(false);
        setShieldJustUsed(true);
        setTimeout(() => setShieldJustUsed(false), 5000);
      } else {
        alert(result.error || 'Fehler beim Aktivieren des Shields');
      }
    } finally {
      setShieldLoading(false);
    }
  }, [user?.uid, pet?.id]);

  if (!streak) return null;

  const status = getStreakStatus(streak.lastWatchDate);
  const displayStreak = status === 'lost' ? 0 : streak.currentStreak;
  const isRecord = displayStreak > 0 && displayStreak >= streak.longestStreak;

  // Shield eligibility
  const canUseShield = status === 'shieldable';
  const cooldown = getShieldCooldown(streak.lastShieldUsedDate);
  const petTotalXP = pet ? (pet.level - 1) * PET_CONFIG.XP_PER_LEVEL + pet.experience : 0;
  const petCanAfford = petTotalXP >= PET_CONFIG.STREAK_SHIELD_XP_COST;

  let shieldDisabledReason = '';
  if (!pet) shieldDisabledReason = 'Kein Pet vorhanden';
  else if (!pet.isAlive) shieldDisabledReason = 'Dein Pet lebt nicht';
  else if (!petCanAfford)
    shieldDisabledReason = `Nicht genug XP (${petTotalXP}/${PET_CONFIG.STREAK_SHIELD_XP_COST})`;
  else if (cooldown.onCooldown)
    shieldDisabledReason = `Cooldown: noch ${cooldown.daysRemaining} ${cooldown.daysRemaining === 1 ? 'Tag' : 'Tage'}`;

  const shieldEligible = canUseShield && !shieldDisabledReason;
  const showShieldButton = canUseShield && pet;

  const streakColors = {
    active: currentTheme.status?.success || '#22c55e',
    at_risk: currentTheme.status?.warning || '#f59e0b',
    shieldable: currentTheme.status?.warning || '#f59e0b',
    lost: currentTheme.text.muted,
  };
  const flameColor = streakColors[status] || currentTheme.text.muted;

  const shieldColor = '#5c6bc0';

  return (
    <>
      <div style={{ margin: '0 20px', width: 'calc(100% - 40px)' }}>
        <div
          onClick={() => setShowInfo((v) => !v)}
          style={{
            padding: '12px 14px',
            borderRadius: showInfo ? '14px 14px 0 0' : '14px',
            background: currentTheme.background.surface,
            border: `1px solid ${currentTheme.border.default}`,
            borderBottom: showInfo ? 'none' : `1px solid ${currentTheme.border.default}`,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 4px 16px -4px rgba(0, 0, 0, 0.4), 0 2px 6px -2px rgba(0, 0, 0, 0.3)',
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${flameColor}, ${flameColor}cc)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {shieldJustUsed ? (
              <Shield style={{ fontSize: 20, color: 'white' }} />
            ) : (
              <Whatshot style={{ fontSize: 20, color: 'white' }} />
            )}
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
              Watch Streak
            </h2>
            <p
              style={{
                margin: '1px 0 0',
                fontSize: 12,
                color: shieldJustUsed
                  ? shieldColor
                  : status === 'at_risk' || status === 'shieldable'
                    ? flameColor
                    : currentTheme.text.secondary,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontWeight:
                  status === 'at_risk' || status === 'shieldable' || shieldJustUsed ? 600 : 400,
              }}
            >
              {shieldJustUsed && 'Streak gerettet!'}
              {!shieldJustUsed &&
                status === 'active' &&
                `${displayStreak} ${displayStreak === 1 ? 'Tag' : 'Tage'} in Folge`}
              {!shieldJustUsed && status === 'at_risk' && 'Schau heute!'}
              {!shieldJustUsed && status === 'shieldable' && 'Streak in Gefahr!'}
              {!shieldJustUsed && status === 'lost' && 'Starte eine neue Streak!'}
            </p>
          </div>

          {/* Right side: Streak Number + Shield */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 4 }}>
            {/* Shield button */}
            {showShieldButton && !shieldJustUsed && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (shieldEligible) setShowConfirm(true);
                }}
                disabled={!shieldEligible}
                title={shieldDisabledReason || 'Streak Shield aktivieren'}
                style={{
                  background: shieldEligible
                    ? `linear-gradient(135deg, ${shieldColor}, ${shieldColor}cc)`
                    : `${currentTheme.text.muted}20`,
                  border: 'none',
                  borderRadius: 8,
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: shieldEligible ? 'pointer' : 'default',
                  opacity: shieldEligible ? 1 : 0.4,
                  padding: 0,
                }}
              >
                <Shield
                  style={{
                    fontSize: 16,
                    color: shieldEligible ? 'white' : currentTheme.text.muted,
                  }}
                />
              </motion.button>
            )}

            {(displayStreak > 0 || (status === 'shieldable' && streak.currentStreak > 0)) && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span
                  style={{
                    fontSize: 24,
                    fontWeight: 800,
                    fontFamily: 'var(--font-display)',
                    color: flameColor,
                    lineHeight: 1,
                  }}
                >
                  {status === 'shieldable' ? streak.currentStreak : displayStreak}
                </span>
                <motion.div
                  animate={{ y: [0, -2, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                >
                  <Whatshot style={{ fontSize: 18, color: flameColor }} />
                </motion.div>
              </motion.div>
            )}
            {isRecord && (
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: flameColor,
                  background: `${flameColor}18`,
                  padding: '2px 5px',
                  borderRadius: 4,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Rekord
              </span>
            )}
            {!isRecord && displayStreak > 0 && streak.longestStreak > displayStreak && (
              <span
                style={{
                  fontSize: 10,
                  color: currentTheme.text.muted,
                  whiteSpace: 'nowrap',
                }}
              >
                Best: {streak.longestStreak}
              </span>
            )}
          </div>
        </div>

        {/* Info Legend */}
        <AnimatePresence>
          {showInfo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden' }}
            >
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '0 0 14px 14px',
                  background: `${currentTheme.background.card}`,
                  border: `1px solid ${flameColor}30`,
                  borderTop: `1px solid ${flameColor}15`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                {[
                  { color: streakColors.active, label: 'Heute geschaut' },
                  { color: streakColors.at_risk, label: 'Schau heute, sonst bricht die Streak' },
                  { color: currentTheme.text.muted, label: 'Streak verloren' },
                ].map(({ color, label }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: color,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: 12, color: currentTheme.text.secondary }}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Confirmation Dialog */}
      <StreakShieldDialog
        showConfirm={showConfirm}
        pet={pet}
        streak={streak}
        flameColor={flameColor}
        shieldLoading={shieldLoading}
        onClose={() => setShowConfirm(false)}
        onActivate={handleShieldActivate}
      />
    </>
  );
};
