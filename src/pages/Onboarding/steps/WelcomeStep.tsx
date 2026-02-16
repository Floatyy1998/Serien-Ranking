import { motion } from 'framer-motion';
import { useTheme } from '../../../contexts/ThemeContext';
import { GradientText } from '../../../components/ui';
import type { Genre } from '../hooks/useOnboardingSearch';

interface Props {
  username: string;
  genres: Genre[];
  selectedGenres: number[];
  onToggleGenre: (id: number) => void;
  onNext: () => void;
  onSkip: () => void;
}

export const WelcomeStep: React.FC<Props> = ({ username, genres, selectedGenres, onToggleGenre, onNext, onSkip }) => {
  const { currentTheme } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
      transition={{ duration: 0.3 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '0 clamp(20px, 5vw, 60px)',
        width: '100%',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginTop: 24, flexShrink: 0 }}>
        <GradientText
          as="h1"
          from={currentTheme.primary}
          to="#a855f7"
          style={{ fontSize: 24, fontWeight: 800, margin: 0 }}
        >
          Willkommen, {username}!
        </GradientText>
        <p style={{ margin: '8px 0 0', fontSize: 13, color: currentTheme.text.secondary, lineHeight: 1.4 }}>
          Wähle bis zu 4 Genres
        </p>
        {selectedGenres.length > 0 && (
          <motion.p
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ margin: '6px 0 0', fontSize: 11, fontWeight: 600, color: selectedGenres.length >= 4 ? currentTheme.status.success : currentTheme.primary }}
          >
            {selectedGenres.length} von 4 {selectedGenres.length === 1 ? 'Genre' : 'Genres'}
          </motion.p>
        )}
      </div>

      {/* Genre cards grid */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          marginTop: 16,
          paddingBottom: 16,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: 10,
          }}
        >
          {genres.map((genre, i) => {
            const selected = selectedGenres.includes(genre.id);
            const isDisabled = !selected && selectedGenres.length >= 4;
            return (
              <motion.button
                key={genre.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.01, duration: 0.15 }}
                onClick={() => !isDisabled && onToggleGenre(genre.id)}
                disabled={isDisabled}
                style={{
                  position: 'relative',
                  padding: '16px 12px',
                  borderRadius: 14,
                  border: `2px solid ${selected ? currentTheme.primary : currentTheme.border.default}`,
                  background: selected
                    ? `linear-gradient(135deg, ${currentTheme.primary}18, ${currentTheme.primary}08)`
                    : currentTheme.background.surface,
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  opacity: isDisabled ? 0.4 : 1,
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 60,
                }}
              >
                {/* Genre name */}
                <span
                  style={{
                    color: selected ? currentTheme.primary : currentTheme.text.primary,
                    fontSize: 14,
                    fontWeight: selected ? 700 : 600,
                    lineHeight: 1.3,
                    textAlign: 'center',
                  }}
                >
                  {selected && '✓ '}{genre.name}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding: '12px 0 28px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', flexShrink: 0 }}>
        <button
          onClick={onNext}
          disabled={selectedGenres.length === 0}
          style={{
            width: '100%',
            padding: '14px 0',
            borderRadius: 12,
            border: 'none',
            background: selectedGenres.length > 0
              ? `linear-gradient(135deg, ${currentTheme.primary}, #a855f7)`
              : currentTheme.background.surface,
            color: selectedGenres.length > 0 ? 'white' : currentTheme.text.muted,
            fontSize: 16,
            fontWeight: 600,
            cursor: selectedGenres.length > 0 ? 'pointer' : 'not-allowed',
            opacity: selectedGenres.length > 0 ? 1 : 0.5,
            transition: 'all 0.2s ease',
          }}
        >
          Weiter
        </button>
        <button
          onClick={onSkip}
          style={{
            background: 'none',
            border: 'none',
            color: currentTheme.text.muted,
            fontSize: 12,
            cursor: 'pointer',
            padding: '4px 8px',
          }}
        >
          Überspringen
        </button>
      </div>
    </motion.div>
  );
};
