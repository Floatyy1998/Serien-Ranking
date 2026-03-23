import { AutoAwesome } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContextDef';
import { BackButton, GradientText } from '../../components/ui';
import './ActorUniversePage.css';

interface LoadingScreenProps {
  progress: number;
}

export const LoadingScreen = ({ progress }: LoadingScreenProps) => {
  const { currentTheme } = useTheme();

  return (
    <div className="au-page" style={{ backgroundColor: currentTheme.background.default }}>
      {/* Decorative background */}
      <div
        className="au-bg-decoration"
        style={{
          background: `radial-gradient(ellipse at 30% 20%, ${currentTheme.primary}15 0%, transparent 50%),
                       radial-gradient(ellipse at 70% 80%, ${currentTheme.secondary}15 0%, transparent 50%)`,
        }}
      />

      {/* Header */}
      <header
        className="au-header au-header--loading"
        style={{
          background: `linear-gradient(180deg, ${currentTheme.background.card}ee 0%, ${currentTheme.background.card}00 100%)`,
        }}
      >
        <div className="au-header-row">
          <BackButton
            style={{
              background: `linear-gradient(135deg, ${currentTheme.background.surface}, ${currentTheme.background.surfaceHover})`,
              border: `1px solid ${currentTheme.border.default}`,
              color: currentTheme.text.primary,
              boxShadow: `0 2px 8px ${currentTheme.background.default}80`,
            }}
          />
          <div style={{ flex: 1 }}>
            <GradientText
              as="h1"
              style={{
                fontSize: '22px',
                fontWeight: 800,
                fontFamily: 'var(--font-display)',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AutoAwesome
                style={{
                  fontSize: '24px',
                  color: currentTheme.accent,
                  WebkitTextFillColor: currentTheme.accent,
                }}
              />
              Actor Universe
            </GradientText>
            <p className="au-subtitle" style={{ color: currentTheme.text.muted }}>
              Analysiere deine Serien...
            </p>
          </div>
        </div>
      </header>

      {/* Loading Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="au-loading-content"
      >
        {/* Animated cosmic ring */}
        <div className="au-loading-ring-container">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className="au-loading-ring-outer"
            style={{
              borderColor: currentTheme.border.default,
              borderTopColor: currentTheme.primary,
              borderRightColor: currentTheme.secondary,
            }}
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="au-loading-ring-inner"
            style={{
              borderColor: currentTheme.border.default,
              borderBottomColor: currentTheme.primary,
            }}
          />
          <AutoAwesome className="au-loading-icon" style={{ color: currentTheme.primary }} />
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="au-loading-text"
          style={{ color: currentTheme.text.secondary }}
        >
          {Math.round(progress)}% - Sammle Schauspieler-Daten
        </motion.p>

        {/* Progress bar */}
        <div
          className="au-loading-progress-track"
          style={{
            background: currentTheme.background.surface,
            boxShadow: `inset 0 2px 4px ${currentTheme.background.default}`,
          }}
        >
          <motion.div
            className="au-loading-progress-fill"
            style={{
              background: `linear-gradient(90deg, ${currentTheme.primary}, ${currentTheme.secondary}, ${currentTheme.primary})`,
            }}
            animate={{
              width: `${progress}%`,
              backgroundPosition: ['0% 0%', '100% 0%'],
            }}
            transition={{
              width: { duration: 0.3 },
              backgroundPosition: { duration: 2, repeat: Infinity, ease: 'linear' },
            }}
          />
        </div>
      </motion.div>
    </div>
  );
};
