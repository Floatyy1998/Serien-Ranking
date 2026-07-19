import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Close } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { PET_CONFIG } from '../../services/pet/petConstants';
import { t } from '../../services/i18n';
import type { ActivePetInfo, WatchStreakData } from './watchStreakHelpers';

interface StreakShieldDialogProps {
  showConfirm: boolean;
  pet: ActivePetInfo | null;
  streak: WatchStreakData;
  flameColor: string;
  shieldLoading: boolean;
  onClose: () => void;
  onActivate: () => void;
}

const shieldColor = '#5c6bc0';

export const StreakShieldDialog: React.FC<StreakShieldDialogProps> = ({
  showConfirm,
  pet,
  streak,
  flameColor,
  shieldLoading,
  onClose,
  onActivate,
}) => {
  const { currentTheme } = useTheme();

  return (
    <AnimatePresence>
      {showConfirm && pet && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => !shieldLoading && onClose()}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10, 14, 26, 0.75)',
            backdropFilter: 'var(--blur-sm)',
            WebkitBackdropFilter: 'var(--blur-sm)',
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
              borderRadius: 20,
              padding: '20px',
              maxWidth: 320,
              width: '100%',
              boxShadow: 'var(--shadow-md)',
              border: '1px solid var(--glass-border-light)',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    background: `linear-gradient(135deg, ${shieldColor}, ${shieldColor}cc)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Shield style={{ fontSize: 18, color: 'white' }} />
                </div>
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    fontFamily: 'var(--font-display)',
                    color: currentTheme.text.primary,
                  }}
                >
                  Streak Shield
                </span>
              </div>
              <button
                onClick={onClose}
                disabled={shieldLoading}
                aria-label={t('Schließen')}
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
            <p
              style={{
                margin: '0 0 16px',
                fontSize: 14,
                color: currentTheme.text.secondary,
                lineHeight: 1.5,
              }}
            >
              <strong style={{ color: currentTheme.text.primary }}>{pet.name}</strong> {t('opfert')}{' '}
              <strong style={{ color: shieldColor }}>{PET_CONFIG.STREAK_SHIELD_XP_COST} XP</strong>{' '}
              {t('um deine')}{' '}
              <strong style={{ color: flameColor }}>
                {t('{n}-Tage-Streak', { n: streak.currentStreak })}
              </strong>
              {t(' zu retten.')}
            </p>

            {/* Cost breakdown */}
            <div
              style={{
                background: `${shieldColor}10`,
                borderRadius: 12,
                padding: '10px 12px',
                marginBottom: 16,
                fontSize: 13,
                color: currentTheme.text.secondary,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>{t('XP-Kosten')}</span>
                <span style={{ fontWeight: 600, color: currentTheme.text.primary }}>
                  -{PET_CONFIG.STREAK_SHIELD_XP_COST} XP
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Happiness</span>
                <span style={{ fontWeight: 600, color: currentTheme.text.primary }}>
                  -{PET_CONFIG.STREAK_SHIELD_HAPPINESS_COST}
                </span>
              </div>
              {pet.experience < PET_CONFIG.STREAK_SHIELD_XP_COST && (
                <div
                  style={{
                    marginTop: 8,
                    paddingTop: 8,
                    borderTop: '1px solid var(--glass-border-light)',
                    fontSize: 12,
                    color: currentTheme.status?.warning || '#f59e0b',
                  }}
                >
                  {t('{name} wird auf Level {level} fallen', {
                    name: pet.name,
                    level: pet.level - 1,
                  })}
                </div>
              )}
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={onClose}
                disabled={shieldLoading}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 12,
                  border: '1px solid var(--glass-border-medium)',
                  background: 'transparent',
                  color: currentTheme.text.secondary,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {t('Abbrechen')}
              </button>
              <button
                onClick={onActivate}
                disabled={shieldLoading}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 12,
                  border: 'none',
                  background: `linear-gradient(135deg, ${shieldColor}, ${shieldColor}cc)`,
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: shieldLoading ? 'wait' : 'pointer',
                  opacity: shieldLoading ? 0.7 : 1,
                }}
              >
                {shieldLoading ? t('Aktiviere...') : t('Aktivieren')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
