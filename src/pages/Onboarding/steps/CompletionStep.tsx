import { motion } from 'framer-motion';
import { CheckCircle } from '@mui/icons-material';
import { useTheme } from '../../../contexts/ThemeContext';
import { GradientText } from '../../../components/ui';

interface Props {
  seriesCount: number;
  movieCount: number;
  isCompleting: boolean;
  completionProgress: number;
  onFinish: () => void;
}

export const CompletionStep: React.FC<Props> = ({
  seriesCount,
  movieCount,
  isCompleting,
  completionProgress,
  onFinish,
}) => {
  const { currentTheme } = useTheme();
  const totalCount = seriesCount + movieCount;

  // Show loading state while completing
  if (isCompleting) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100%',
          padding: '0 24px',
          textAlign: 'center',
        }}
      >
        <GradientText
          as="h2"
          from={currentTheme.primary}
          to="#a855f7"
          style={{ fontSize: 20, fontWeight: 700, margin: 0 }}
        >
          Deine Serien & Filme werden hinzugefügt...
        </GradientText>
        <p style={{ margin: '8px 0 0', fontSize: 14, color: currentTheme.text.muted }}>
          Einen Moment bitte
        </p>

        {/* Progress Bar */}
        <div
          style={{
            width: '100%',
            maxWidth: 300,
            height: 8,
            borderRadius: 8,
            background: `${currentTheme.primary}20`,
            marginTop: 32,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionProgress}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{
              height: '100%',
              background: `linear-gradient(90deg, ${currentTheme.primary}, #a855f7)`,
              borderRadius: 8,
            }}
          />
        </div>

        {/* Progress Percentage */}
        <motion.p
          key={completionProgress}
          initial={{ opacity: 0.7, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            margin: '12px 0 0',
            fontSize: 16,
            fontWeight: 700,
            color: currentTheme.primary,
          }}
        >
          {completionProgress}%
        </motion.p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100%',
        padding: '0 24px',
        textAlign: 'center',
      }}
    >
      {/* Success icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${currentTheme.primary}20, #a855f720)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CheckCircle style={{ fontSize: 44, color: currentTheme.primary }} />
        </div>
      </motion.div>

      {/* Title */}
      <GradientText
        as="h1"
        from={currentTheme.primary}
        to="#a855f7"
        style={{ fontSize: 28, fontWeight: 800, margin: '24px 0 0' }}
      >
        Du bist startklar!
      </GradientText>

      {/* Summary */}
      {totalCount > 0 ? (
        <p
          style={{
            margin: '12px 0 0',
            fontSize: 15,
            color: currentTheme.text.secondary,
            lineHeight: 1.5,
          }}
        >
          {seriesCount > 0 && `${seriesCount} ${seriesCount === 1 ? 'Serie' : 'Serien'}`}
          {seriesCount > 0 && movieCount > 0 && ' und '}
          {movieCount > 0 && `${movieCount} ${movieCount === 1 ? 'Film' : 'Filme'}`} hinzugefügt.
          <br />
          Du kannst jederzeit weitere Titel entdecken.
        </p>
      ) : (
        <p
          style={{
            margin: '12px 0 0',
            fontSize: 15,
            color: currentTheme.text.secondary,
            lineHeight: 1.5,
          }}
        >
          Du kannst jederzeit Serien und Filme über die Suche oder Entdecken-Seite hinzufügen.
        </p>
      )}

      {/* CTA */}
      <button
        onClick={onFinish}
        style={{
          marginTop: 40,
          width: '100%',
          maxWidth: 300,
          padding: '14px 0',
          borderRadius: 14,
          border: 'none',
          background: `linear-gradient(135deg, ${currentTheme.primary}, #a855f7)`,
          color: 'white',
          fontSize: 16,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Los geht's
      </button>
    </motion.div>
  );
};
