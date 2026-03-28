import { Stop, VolumeUp } from '@mui/icons-material';
import { motion } from 'framer-motion';

type TtsState = 'idle' | 'loading' | 'speaking';

interface SpeakButtonProps {
  state: TtsState;
  onClick: () => void;
  accent: string;
  size?: number;
}

export const SpeakButton: React.FC<SpeakButtonProps> = ({ state, onClick, accent, size = 28 }) => {
  const iconSize = size * 0.55;
  const barCount = 3;
  const barWidth = size * 0.07;
  const barGap = size * 0.06;

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.9 }}
      title={state === 'speaking' ? 'Vorlesen stoppen' : 'Vorlesen'}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        border: 'none',
        background: state !== 'idle' ? `${accent}30` : `${accent}15`,
        color: accent,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        padding: 0,
        flexShrink: 0,
      }}
    >
      {state === 'speaking' ? (
        <Stop style={{ fontSize: `${iconSize}px` }} />
      ) : state === 'loading' ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: `${barGap}px`,
            height: `${iconSize}px`,
          }}
        >
          {Array.from({ length: barCount }).map((_, i) => (
            <motion.div
              key={i}
              animate={{ scaleY: [0.3, 1, 0.3] }}
              transition={{
                repeat: Infinity,
                duration: 0.8,
                delay: i * 0.15,
                ease: 'easeInOut',
              }}
              style={{
                width: `${barWidth}px`,
                height: '100%',
                borderRadius: `${barWidth}px`,
                background: accent,
                originY: 0.5,
              }}
            />
          ))}
        </div>
      ) : (
        <VolumeUp style={{ fontSize: `${iconSize}px` }} />
      )}
    </motion.button>
  );
};
