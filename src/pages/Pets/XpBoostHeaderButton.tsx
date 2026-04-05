import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Bolt from '@mui/icons-material/Bolt';
import PlayArrow from '@mui/icons-material/PlayArrow';
import Check from '@mui/icons-material/Check';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useTheme } from '../../contexts/ThemeContextDef';
import { useAuth } from '../../AuthContext';
import { getXpBoostInventory, activateXpBoost } from '../../services/pet/dailySpinService';
import type { XpBoostItem } from '../../services/pet/dailySpinService';

/** Color based on total boost value (multiplier × episodes) */
function getBoostColor(multiplier: number, episodes: number): string {
  const value = multiplier * episodes;
  if (value >= 45) return '#FFD700'; // Legendary gold
  if (value >= 30) return '#9C27B0'; // Epic purple
  if (value >= 20) return '#4CAF50'; // Rare green
  if (value >= 10) return '#FF9800'; // Uncommon orange
  return '#90A4AE'; // Common grey-blue
}

function getBoostLabel(multiplier: number, episodes: number): string {
  const value = multiplier * episodes;
  if (value >= 45) return 'Legendär';
  if (value >= 30) return 'Episch';
  if (value >= 20) return 'Selten';
  if (value >= 10) return 'Ungewöhnlich';
  return 'Gewöhnlich';
}

export const XpBoostHeaderButton: React.FC = () => {
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const [inventory, setInventory] = useState<XpBoostItem[]>([]);
  const [activeBoost, setActiveBoost] = useState<{
    multiplier: number;
    remainingEpisodes: number;
  } | null>(null);
  const [open, setOpen] = useState(false);
  const [activating, setActivating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load inventory
  useEffect(() => {
    if (!user?.uid) return;
    getXpBoostInventory(user.uid).then(setInventory);
  }, [user?.uid]);

  // Real-time active boost listener
  useEffect(() => {
    if (!user?.uid) return;
    const ref = firebase.database().ref(`users/${user.uid}/activeXpBoost`);
    const handler = (snap: firebase.database.DataSnapshot) => {
      const data = snap.val();
      if (data && data.remainingEpisodes > 0) {
        setActiveBoost({ multiplier: data.multiplier, remainingEpisodes: data.remainingEpisodes });
      } else {
        setActiveBoost(null);
      }
    };
    ref.on('value', handler);
    return () => ref.off('value', handler);
  }, [user?.uid]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleActivate = async (index: number) => {
    if (!user?.uid || activating) return;
    setActivating(true);
    const success = await activateXpBoost(user.uid, index);
    if (success) {
      const updated = await getXpBoostInventory(user.uid);
      setInventory(updated);
    }
    setActivating(false);
  };

  const hasBoosts = inventory.length > 0;
  const isEmpty = !hasBoosts && !activeBoost;

  // Determine icon color + glow
  let iconColor = currentTheme.text.muted;
  let glowColor = 'transparent';
  let showPulse = false;

  if (activeBoost) {
    iconColor = getBoostColor(activeBoost.multiplier, activeBoost.remainingEpisodes);
    glowColor = iconColor;
  } else if (hasBoosts) {
    // White pulse = "you have boosts, activate one!"
    iconColor = '#ffffff';
    glowColor = '#ffffff';
    showPulse = true;
  }

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Shield Icon Button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen((v) => !v)}
        style={{
          position: 'relative',
          width: 36,
          height: 44,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        {/* Pulse ring for available boosts */}
        {showPulse && (
          <motion.div
            animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              inset: -4,
              borderRadius: 8,
              border: `2px solid ${iconColor}`,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Glow behind shield when active */}
        {activeBoost && (
          <div
            style={{
              position: 'absolute',
              inset: -6,
              background: `radial-gradient(circle, ${glowColor}30, transparent 70%)`,
              pointerEvents: 'none',
              filter: 'blur(4px)',
            }}
          />
        )}

        {/* Shield SVG */}
        <svg
          viewBox="0 0 36 44"
          width={36}
          height={44}
          style={{
            position: 'relative',
            filter: activeBoost ? `drop-shadow(0 2px 8px ${glowColor}50)` : 'none',
            transition: 'filter 0.3s',
          }}
        >
          {/* Shield shape */}
          <path
            d="M18 2 L33 8 L33 20 Q33 35 18 42 Q3 35 3 20 L3 8 Z"
            fill={isEmpty ? currentTheme.background.surface : `${iconColor}20`}
            stroke={isEmpty ? currentTheme.border.default : iconColor}
            strokeWidth={1.5}
            style={{ transition: 'fill 0.3s, stroke 0.3s' }}
          />
          {/* XP text */}
          <text
            x="18"
            y="23"
            textAnchor="middle"
            dominantBaseline="central"
            fill={iconColor}
            fontWeight="900"
            fontSize="13"
            fontFamily="var(--font-display)"
            style={{ transition: 'fill 0.3s' }}
          >
            XP
          </text>
        </svg>

        {/* Active boost indicator dot */}
        {activeBoost && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{
              position: 'absolute',
              top: -2,
              right: -4,
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: iconColor,
              border: `2px solid ${currentTheme.background.default}`,
              boxShadow: `0 0 6px ${iconColor}60`,
            }}
          />
        )}

        {/* Inventory count badge */}
        {!activeBoost && hasBoosts && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{
              position: 'absolute',
              top: -3,
              right: -5,
              minWidth: 16,
              height: 16,
              borderRadius: 8,
              background: iconColor,
              border: `2px solid ${currentTheme.background.default}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 9,
              fontWeight: 800,
              color: '#1a1a2e',
              padding: '0 3px',
            }}
          >
            {inventory.length}
          </motion.div>
        )}
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute',
              top: 50,
              right: 0,
              width: 260,
              borderRadius: 16,
              background: currentTheme.background.card,
              border: `1px solid ${currentTheme.border.default}`,
              boxShadow: `0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px ${currentTheme.border.default}`,
              zIndex: 100,
              overflow: 'hidden',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '14px 16px 10px',
                borderBottom: `1px solid ${currentTheme.border.default}`,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Bolt style={{ fontSize: 16, color: '#FFD93D' }} />
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: 'var(--font-display)',
                  color: currentTheme.text.primary,
                }}
              >
                XP Boosts
              </span>
            </div>

            {/* Active Boost */}
            {activeBoost && (
              <div
                style={{
                  margin: '10px 10px 0',
                  padding: '10px 12px',
                  borderRadius: 12,
                  background: `linear-gradient(135deg, ${getBoostColor(activeBoost.multiplier, activeBoost.remainingEpisodes)}18, ${getBoostColor(activeBoost.multiplier, activeBoost.remainingEpisodes)}08)`,
                  border: `1px solid ${getBoostColor(activeBoost.multiplier, activeBoost.remainingEpisodes)}30`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: `linear-gradient(135deg, ${getBoostColor(activeBoost.multiplier, activeBoost.remainingEpisodes)}, ${getBoostColor(activeBoost.multiplier, activeBoost.remainingEpisodes)}aa)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Bolt style={{ fontSize: 18, color: '#1a1a2e' }} />
                </motion.div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: getBoostColor(activeBoost.multiplier, activeBoost.remainingEpisodes),
                    }}
                  >
                    {activeBoost.multiplier}x XP aktiv
                  </div>
                  <div style={{ fontSize: 11, color: currentTheme.text.muted }}>
                    Noch {activeBoost.remainingEpisodes}{' '}
                    {activeBoost.remainingEpisodes === 1 ? 'Episode' : 'Episoden'}
                  </div>
                </div>
                <Check
                  style={{
                    fontSize: 18,
                    color: getBoostColor(activeBoost.multiplier, activeBoost.remainingEpisodes),
                  }}
                />
              </div>
            )}

            {/* Inventory */}
            <div style={{ padding: 10, maxHeight: 220, overflowY: 'auto' }}>
              {inventory.length === 0 && !activeBoost && (
                <div
                  style={{
                    padding: '20px 10px',
                    textAlign: 'center',
                    color: currentTheme.text.muted,
                    fontSize: 13,
                  }}
                >
                  Keine Boosts vorhanden.
                  <br />
                  <span style={{ fontSize: 11, opacity: 0.7 }}>
                    Boosts gibt's beim Daily Spin & in Mystery Boxen!
                  </span>
                </div>
              )}

              {inventory.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {inventory.map((boost, i) => {
                    const color = getBoostColor(boost.multiplier, boost.episodeCount);
                    const label = getBoostLabel(boost.multiplier, boost.episodeCount);
                    const disabled = !!activeBoost || activating;

                    return (
                      <motion.button
                        key={i}
                        whileTap={disabled ? {} : { scale: 0.97 }}
                        onClick={() => !disabled && handleActivate(i)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '8px 10px',
                          borderRadius: 10,
                          border: `1px solid ${currentTheme.border.default}`,
                          background: currentTheme.background.surface,
                          cursor: disabled ? 'default' : 'pointer',
                          opacity: disabled ? 0.5 : 1,
                          transition: 'opacity 0.2s',
                          width: '100%',
                          textAlign: 'left',
                        }}
                      >
                        {/* Color dot */}
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            background: `linear-gradient(135deg, ${color}, ${color}aa)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Bolt style={{ fontSize: 15, color: '#1a1a2e' }} />
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: currentTheme.text.primary,
                            }}
                          >
                            {boost.multiplier}x XP — {boost.episodeCount} Ep
                          </div>
                          <div style={{ fontSize: 10, fontWeight: 600, color }}>{label}</div>
                        </div>

                        {/* Activate hint */}
                        {!disabled && <PlayArrow style={{ fontSize: 16, color }} />}
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
