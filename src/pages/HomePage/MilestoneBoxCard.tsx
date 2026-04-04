import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Inventory2 from '@mui/icons-material/Inventory2';
import { useTheme } from '../../contexts/ThemeContextDef';
import { useAuth } from '../../AuthContext';
import { useWebWorkerStatsOptimized } from '../../hooks/useWebWorkerStatsOptimized';
import {
  getAvailableBoxCount,
  getNextBoxThreshold,
  getProgressToNextBox,
} from '../../services/pet/mysteryBoxService';
import { MysteryBoxOverlay } from '../../components/pet/MysteryBoxOverlay';

export const MilestoneBoxCard: React.FC = () => {
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const stats = useWebWorkerStatsOptimized();
  const [availableBoxes, setAvailableBoxes] = useState(0);
  const [showBox, setShowBox] = useState(false);

  const totalEpisodes = stats.watchedEpisodes || 0;
  const nextThreshold = getNextBoxThreshold(totalEpisodes);
  const progress = getProgressToNextBox(totalEpisodes);

  useEffect(() => {
    if (!user?.uid) return;
    getAvailableBoxCount(user.uid, totalEpisodes).then(setAvailableBoxes);
  }, [user?.uid, totalEpisodes]);

  const handleClose = () => {
    setShowBox(false);
    if (user?.uid) {
      getAvailableBoxCount(user.uid, totalEpisodes).then(setAvailableBoxes);
    }
  };

  const hasBox = availableBoxes > 0;

  return (
    <>
      <div style={{ margin: '0 20px', width: 'calc(100% - 40px)' }}>
        <motion.div
          onClick={hasBox ? () => setShowBox(true) : undefined}
          whileTap={hasBox ? { scale: 0.98 } : undefined}
          style={{
            padding: '12px 14px',
            borderRadius: '14px',
            background: currentTheme.background.surface,
            border: `1px solid ${hasBox ? '#9C27B040' : currentTheme.border.default}`,
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
                ? 'linear-gradient(135deg, #9C27B0, #E040FB)'
                : `${currentTheme.text.muted}20`,
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
                color: hasBox ? '#E040FB' : currentTheme.text.secondary,
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
                      color: '#E040FB',
                      background: '#E040FB18',
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
                    background: '#E040FB',
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
                    background: `${currentTheme.text.muted}20`,
                    overflow: 'hidden',
                  }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress * 100}%` }}
                    style={{
                      height: '100%',
                      borderRadius: 2,
                      background: 'linear-gradient(90deg, #9C27B0, #E040FB)',
                    }}
                  />
                </div>
                <span style={{ fontSize: 10, color: currentTheme.text.muted }}>
                  {totalEpisodes % 50}/{50}
                </span>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showBox && <MysteryBoxOverlay totalEpisodes={totalEpisodes} onClose={handleClose} />}
      </AnimatePresence>
    </>
  );
};
