import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Bolt from '@mui/icons-material/Bolt';
import PlayArrow from '@mui/icons-material/PlayArrow';
import Whatshot from '@mui/icons-material/Whatshot';
import LocalFireDepartment from '@mui/icons-material/LocalFireDepartment';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useTheme } from '../../contexts/ThemeContextDef';
import { useAuth } from '../../AuthContext';
import { getXpBoostInventory, activateXpBoost } from '../../services/pet/dailySpinService';
import type { XpBoostItem } from '../../services/pet/dailySpinService';

export const XpBoostSection: React.FC = () => {
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const [inventory, setInventory] = useState<XpBoostItem[]>([]);
  const [activeBoost, setActiveBoost] = useState<{
    multiplier: number;
    remainingEpisodes: number;
  } | null>(null);
  const [activating, setActivating] = useState(false);

  // Load inventory
  useEffect(() => {
    if (!user?.uid) return;
    getXpBoostInventory(user.uid).then(setInventory);
  }, [user?.uid]);

  // Load active boost with real-time listener
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

  const getBoostIcon = (multiplier: number, episodes: number) => {
    if (episodes >= 10) return <LocalFireDepartment style={{ fontSize: 18, color: '#4CAF50' }} />;
    if (multiplier >= 3 || episodes >= 5)
      return <Whatshot style={{ fontSize: 18, color: '#FF9800' }} />;
    return <Bolt style={{ fontSize: 18, color: '#FFD93D' }} />;
  };

  const getBoostColor = (multiplier: number, episodes: number) => {
    if (episodes >= 10) return '#4CAF50';
    if (multiplier >= 3 || episodes >= 5) return '#FF9800';
    return '#FFD93D';
  };

  if (inventory.length === 0 && !activeBoost) return null;

  return (
    <div style={{ padding: '0 20px', marginBottom: 16 }}>
      <h2
        style={{
          fontSize: 16,
          fontWeight: 700,
          fontFamily: 'var(--font-display)',
          color: currentTheme.text.primary,
          marginBottom: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <Bolt style={{ fontSize: 18, color: '#FFD93D' }} />
        XP Boosts
      </h2>

      {/* Active Boost */}
      <AnimatePresence>
        {activeBoost && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              padding: '10px 14px',
              borderRadius: 12,
              background: `linear-gradient(135deg, ${currentTheme.background.surface}, ${currentTheme.background.surface})`,
              border: `1px solid #FFD93D40`,
              marginBottom: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              boxShadow: '0 2px 12px rgba(255,217,61,0.15)',
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #FFD93D, #FF9800)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Bolt style={{ fontSize: 20, color: '#1a1a2e' }} />
            </motion.div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#FFD93D',
                }}
              >
                {activeBoost.multiplier}x XP aktiv!
              </div>
              <div style={{ fontSize: 12, color: currentTheme.text.secondary }}>
                Noch {activeBoost.remainingEpisodes}{' '}
                {activeBoost.remainingEpisodes === 1 ? 'Episode' : 'Episoden'}
              </div>
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                fontFamily: 'var(--font-display)',
                color: '#FFD93D',
              }}
            >
              {activeBoost.remainingEpisodes}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inventory */}
      {inventory.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {inventory.map((boost, i) => {
            const color = getBoostColor(boost.multiplier, boost.episodeCount);

            return (
              <div
                key={i}
                style={{
                  padding: '8px 12px',
                  borderRadius: 10,
                  background: currentTheme.background.surface,
                  border: `1px solid ${currentTheme.border.default}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: `${color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {getBoostIcon(boost.multiplier, boost.episodeCount)}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: currentTheme.text.primary,
                    }}
                  >
                    {boost.multiplier}x XP — {boost.episodeCount}{' '}
                    {boost.episodeCount === 1 ? 'Episode' : 'Episoden'}
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleActivate(i)}
                  disabled={!!activeBoost || activating}
                  style={{
                    background:
                      activeBoost || activating
                        ? `${currentTheme.text.muted}20`
                        : `linear-gradient(135deg, ${color}, ${color}cc)`,
                    color: activeBoost || activating ? currentTheme.text.muted : '#1a1a2e',
                    border: 'none',
                    borderRadius: 8,
                    padding: '6px 12px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: activeBoost || activating ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <PlayArrow style={{ fontSize: 14 }} />
                  {activeBoost ? 'Boost aktiv' : 'Aktivieren'}
                </motion.button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
