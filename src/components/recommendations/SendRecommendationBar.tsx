import Send from '@mui/icons-material/Send';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContextDef';
import { useDeviceType } from '../../hooks/useDeviceType';

interface SendRecommendationBarProps {
  selectedCount: number;
  sending: boolean;
  onSend: () => void;
}

/** Sticky-Bottom-Leiste mit dem Senden-Button inkl. Flieg-Animation beim Senden. */
export const SendRecommendationBar: React.FC<SendRecommendationBarProps> = ({
  selectedCount,
  sending,
  onSend,
}) => {
  const { currentTheme } = useTheme();
  const { isMobile } = useDeviceType();

  return (
    <div
      style={{
        flexShrink: 0,
        padding: isMobile ? '14px 20px 6px' : '18px 30px 8px',
        borderTop: `1px solid ${currentTheme.border.default}40`,
        background: `linear-gradient(180deg, ${currentTheme.background.surface}cc 0%, ${currentTheme.background.default} 60%)`,
        backdropFilter: 'var(--blur-md) saturate(1.4)',
        WebkitBackdropFilter: 'var(--blur-md) saturate(1.4)',
      }}
    >
      <motion.button
        whileTap={selectedCount > 0 && !sending ? { scale: 0.98 } : undefined}
        onClick={onSend}
        disabled={selectedCount === 0 || sending}
        style={{
          position: 'relative',
          width: '100%',
          padding: isMobile ? '16px' : '18px',
          borderRadius: 14,
          border:
            selectedCount === 0
              ? `1px solid ${currentTheme.border.default}`
              : `1px solid ${currentTheme.primary}`,
          cursor: selectedCount === 0 || sending ? 'not-allowed' : 'pointer',
          background: selectedCount === 0 ? 'transparent' : currentTheme.primary,
          color: selectedCount === 0 ? currentTheme.text.muted : currentTheme.background.default,
          fontSize: isMobile ? 15 : 16,
          fontWeight: 800,
          fontFamily: 'var(--font-display)',
          letterSpacing: '-0.005em',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          boxShadow: 'none',
          transition: 'background 0.18s ease, color 0.18s ease',
          overflow: 'hidden',
        }}
      >
        <motion.span
          animate={
            sending
              ? { x: [0, 120], y: [0, -50], rotate: [0, 30], opacity: [1, 0] }
              : { x: 0, y: 0, rotate: 0, opacity: 1 }
          }
          transition={sending ? { duration: 0.6, ease: [0.4, 0, 0.2, 1] } : { duration: 0.18 }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 24,
            height: 24,
          }}
        >
          <Send style={{ fontSize: isMobile ? 18 : 20 }} />
        </motion.span>
        <span style={{ position: 'relative' }}>
          {sending
            ? 'Wird gesendet…'
            : selectedCount === 0
              ? 'Freunde auswählen'
              : selectedCount === 1
                ? 'Empfehlung senden'
                : `An ${selectedCount} Freunde senden`}
        </span>
      </motion.button>
    </div>
  );
};
