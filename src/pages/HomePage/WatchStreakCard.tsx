import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Whatshot, Shield, Close } from '@mui/icons-material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../App';
import { petService } from '../../services/petService';
import { PET_CONFIG } from '../../services/petConstants';

const STREAK_COLORS = {
  active: '#4caf50',
  at_risk: '#ffa726',
  shieldable: '#ffa726',
  lost: '',  // uses currentTheme.text.muted
} as const;

interface WatchStreakData {
  currentStreak: number;
  longestStreak: number;
  lastWatchDate: string;
  lastShieldUsedDate?: string;
  shieldUsedCount?: number;
}

interface ActivePetInfo {
  id: string;
  name: string;
  level: number;
  experience: number;
  isAlive: boolean;
}

type StreakStatus = 'active' | 'at_risk' | 'shieldable' | 'lost';

function getDaysSinceLastWatch(lastWatchDate: string): number {
  if (!lastWatchDate) return Infinity;
  const today = new Date().toISOString().split('T')[0];
  const todayMs = new Date(today).getTime();
  const lastMs = new Date(lastWatchDate).getTime();
  return Math.round((todayMs - lastMs) / (1000 * 60 * 60 * 24));
}

function getStreakStatus(lastWatchDate: string): StreakStatus {
  const daysSince = getDaysSinceLastWatch(lastWatchDate);
  if (daysSince === 0) return 'active';
  if (daysSince === 1) return 'at_risk';
  // shieldable: 2 to (MAX_MISSED_DAYS + 1) days since last watch
  if (daysSince <= PET_CONFIG.STREAK_SHIELD_MAX_MISSED_DAYS + 1) return 'shieldable';
  return 'lost';
}

function getShieldCooldown(lastShieldUsedDate?: string): { onCooldown: boolean; daysRemaining: number } {
  if (!lastShieldUsedDate) return { onCooldown: false, daysRemaining: 0 };
  const today = new Date().toISOString().split('T')[0];
  const todayMs = new Date(today).getTime();
  const lastMs = new Date(lastShieldUsedDate).getTime();
  const daysSince = Math.round((todayMs - lastMs) / (1000 * 60 * 60 * 24));
  const daysRemaining = PET_CONFIG.STREAK_SHIELD_COOLDOWN_DAYS - daysSince;
  return { onCooldown: daysRemaining > 0, daysRemaining: Math.max(0, daysRemaining) };
}

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
    const ref = firebase.database().ref(`${user.uid}/wrapped/${year}/streak`);

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

    const activePetRef = firebase.database().ref(`petWidget/${user.uid}/activePetId`);
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

      petRef = firebase.database().ref(`pets/${user.uid}/${activePetId}`);
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
  const petTotalXP = pet ? ((pet.level - 1) * PET_CONFIG.XP_PER_LEVEL) + pet.experience : 0;
  const petCanAfford = petTotalXP >= PET_CONFIG.STREAK_SHIELD_XP_COST;

  let shieldDisabledReason = '';
  if (!pet) shieldDisabledReason = 'Kein Pet vorhanden';
  else if (!pet.isAlive) shieldDisabledReason = 'Dein Pet lebt nicht';
  else if (!petCanAfford) shieldDisabledReason = `Nicht genug XP (${petTotalXP}/${PET_CONFIG.STREAK_SHIELD_XP_COST})`;
  else if (cooldown.onCooldown) shieldDisabledReason = `Cooldown: noch ${cooldown.daysRemaining} ${cooldown.daysRemaining === 1 ? 'Tag' : 'Tage'}`;

  const shieldEligible = canUseShield && !shieldDisabledReason;
  const showShieldButton = canUseShield && pet;

  const flameColor = STREAK_COLORS[status] || currentTheme.text.muted;

  const shieldColor = '#5c6bc0';

  return (
    <>
      <div style={{ margin: '0 20px', width: 'calc(100% - 40px)' }}>
        <div
          onClick={() => setShowInfo((v) => !v)}
          style={{
            padding: '12px 14px',
            borderRadius: showInfo ? '14px 14px 0 0' : '14px',
            background: `linear-gradient(135deg, ${flameColor}15, ${flameColor}05)`,
            border: `1px solid ${flameColor}30`,
            borderBottom: showInfo ? 'none' : `1px solid ${flameColor}30`,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '10px',
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
                fontWeight: 600,
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
                color: shieldJustUsed ? shieldColor :
                  (status === 'at_risk' || status === 'shieldable') ? flameColor :
                  currentTheme.text.secondary,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontWeight: (status === 'at_risk' || status === 'shieldable' || shieldJustUsed) ? 600 : 400,
              }}
            >
              {shieldJustUsed && 'Streak gerettet!'}
              {!shieldJustUsed && status === 'active' && `${displayStreak} ${displayStreak === 1 ? 'Tag' : 'Tage'} in Folge`}
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
              onClick={(e) => { e.stopPropagation(); if (shieldEligible) setShowConfirm(true); }}
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
              <Shield style={{ fontSize: 16, color: shieldEligible ? 'white' : currentTheme.text.muted }} />
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
                  { color: STREAK_COLORS.active, label: 'Heute geschaut' },
                  { color: STREAK_COLORS.at_risk, label: 'Schau heute, sonst bricht die Streak' },
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
                    <span style={{ fontSize: 12, color: currentTheme.text.secondary }}>{label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {showConfirm && pet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => !shieldLoading && setShowConfirm(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: 20,
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: currentTheme.background.card,
                borderRadius: 16,
                padding: '20px',
                maxWidth: 320,
                width: '100%',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: `linear-gradient(135deg, ${shieldColor}, ${shieldColor}cc)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Shield style={{ fontSize: 18, color: 'white' }} />
                  </div>
                  <span style={{ fontSize: 16, fontWeight: 700, color: currentTheme.text.primary }}>
                    Streak Shield
                  </span>
                </div>
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={shieldLoading}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 4,
                    color: currentTheme.text.muted,
                  }}
                >
                  <Close style={{ fontSize: 20 }} />
                </button>
              </div>

              {/* Description */}
              <p style={{ margin: '0 0 16px', fontSize: 14, color: currentTheme.text.secondary, lineHeight: 1.5 }}>
                <strong style={{ color: currentTheme.text.primary }}>{pet.name}</strong> opfert{' '}
                <strong style={{ color: shieldColor }}>{PET_CONFIG.STREAK_SHIELD_XP_COST} XP</strong> um deine{' '}
                <strong style={{ color: flameColor }}>{streak.currentStreak}-Tage-Streak</strong> zu retten.
              </p>

              {/* Cost breakdown */}
              <div
                style={{
                  background: `${shieldColor}10`,
                  borderRadius: 10,
                  padding: '10px 12px',
                  marginBottom: 16,
                  fontSize: 13,
                  color: currentTheme.text.secondary,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>XP-Kosten</span>
                  <span style={{ fontWeight: 600, color: currentTheme.text.primary }}>-{PET_CONFIG.STREAK_SHIELD_XP_COST} XP</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Happiness</span>
                  <span style={{ fontWeight: 600, color: currentTheme.text.primary }}>-{PET_CONFIG.STREAK_SHIELD_HAPPINESS_COST}</span>
                </div>
                {pet.experience < PET_CONFIG.STREAK_SHIELD_XP_COST && (
                  <div
                    style={{
                      marginTop: 8,
                      paddingTop: 8,
                      borderTop: `1px solid ${currentTheme.text.muted}20`,
                      fontSize: 12,
                      color: '#ffa726',
                    }}
                  >
                    {pet.name} wird auf Level {pet.level - 1} fallen
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={shieldLoading}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: 10,
                    border: `1px solid ${currentTheme.text.muted}30`,
                    background: 'transparent',
                    color: currentTheme.text.secondary,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleShieldActivate}
                  disabled={shieldLoading}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: 10,
                    border: 'none',
                    background: `linear-gradient(135deg, ${shieldColor}, ${shieldColor}cc)`,
                    color: 'white',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: shieldLoading ? 'wait' : 'pointer',
                    opacity: shieldLoading ? 0.7 : 1,
                  }}
                >
                  {shieldLoading ? 'Aktiviere...' : 'Aktivieren'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
