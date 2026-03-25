import { AutoAwesome } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContextDef';
import type { CharacterDescription } from '../../hooks/useCharacterDescriptions';

interface CharacterGuideProps {
  characters: CharacterDescription[];
  loading: boolean;
  error: string | null;
  onGenerate: () => void;
  userProgress: { season: number; episode: number } | null;
  isMobile: boolean;
}

export const CharacterGuide: React.FC<CharacterGuideProps> = ({
  characters,
  loading,
  error,
  onGenerate,
  userProgress,
  isMobile,
}) => {
  const { currentTheme } = useTheme();
  const accent = currentTheme.accent || currentTheme.primary;
  const pad = isMobile ? '12px' : '20px';

  // Noch nicht generiert
  if (characters.length === 0 && !loading && !error) {
    return (
      <div style={{ padding: `20px ${pad}`, textAlign: 'center' }}>
        <AutoAwesome
          style={{ fontSize: '40px', color: accent, marginBottom: '12px', opacity: 0.6 }}
        />
        <h3
          style={{
            fontSize: isMobile ? '17px' : '19px',
            fontWeight: 700,
            color: currentTheme.text.secondary,
            margin: '0 0 6px',
          }}
        >
          Wer war das nochmal?
        </h3>
        <p
          style={{
            fontSize: isMobile ? '14px' : '15px',
            color: currentTheme.text.muted,
            margin: '0 0 20px',
            lineHeight: 1.5,
          }}
        >
          KI-Charakter-Guide spoilerfrei bis
          {userProgress
            ? ` S${userProgress.season}E${userProgress.episode}`
            : ' zu deinem Fortschritt'}
        </p>
        <button
          onClick={onGenerate}
          style={{
            padding: '14px 28px',
            background: `${accent}15`,
            border: `1px solid ${accent}30`,
            borderRadius: '14px',
            color: accent,
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AutoAwesome style={{ fontSize: '18px' }} />
          Guide generieren
        </button>
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div
        style={{ padding: `16px ${pad}`, display: 'flex', flexDirection: 'column', gap: '12px' }}
      >
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: '12px',
              padding: '12px',
              borderRadius: '14px',
              background: currentTheme.background.surface,
              animation: 'pulse 1.5s ease-in-out infinite',
              opacity: 1 - i * 0.15,
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: currentTheme.background.default,
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div
                style={{
                  height: '14px',
                  width: '40%',
                  borderRadius: '7px',
                  background: currentTheme.background.default,
                }}
              />
              <div
                style={{
                  height: '12px',
                  width: '80%',
                  borderRadius: '6px',
                  background: currentTheme.background.default,
                }}
              />
            </div>
          </div>
        ))}
        <style>{`@keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.7; } }`}</style>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div style={{ padding: `20px ${pad}`, textAlign: 'center' }}>
        <p style={{ color: currentTheme.text.muted, fontSize: '14px' }}>{error}</p>
        <button
          onClick={onGenerate}
          style={{
            marginTop: '12px',
            padding: '10px 20px',
            background: `${accent}15`,
            border: `1px solid ${accent}30`,
            borderRadius: '10px',
            color: accent,
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Nochmal versuchen
        </button>
      </div>
    );
  }

  // Character list
  return (
    <div style={{ padding: `8px ${pad} 16px` }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <AutoAwesome style={{ fontSize: '14px', color: accent }} />
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              color: accent,
            }}
          >
            KI-Guide
          </span>
        </div>
        {userProgress && (
          <span
            style={{
              fontSize: '12px',
              color: currentTheme.text.muted,
              background: `${accent}10`,
              padding: '3px 10px',
              borderRadius: '8px',
            }}
          >
            Bis S{userProgress.season}E{userProgress.episode}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {characters.map((char, i) => (
          <motion.div
            key={char.character}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            style={{
              display: 'flex',
              gap: '12px',
              padding: '12px',
              borderRadius: '14px',
              background: currentTheme.background.surface,
              border: `1px solid rgba(255,255,255,0.04)`,
            }}
          >
            {/* Profile photo */}
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                overflow: 'hidden',
                flexShrink: 0,
                background: currentTheme.background.default,
              }}
            >
              {char.imageUrl ? (
                <img
                  src={char.imageUrl}
                  alt={char.character}
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : char.profilePath ? (
                <img
                  src={`https://image.tmdb.org/t/p/w185${char.profilePath}`}
                  alt={char.name}
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: 700,
                    color: currentTheme.text.muted,
                  }}
                >
                  {char.character.charAt(0)}
                </div>
              )}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: isMobile ? '15px' : '16px',
                  fontWeight: 700,
                  color: currentTheme.text.secondary,
                  marginBottom: '1px',
                }}
              >
                {char.character}
              </div>
              {char.name && (
                <div
                  style={{
                    fontSize: '12px',
                    color: currentTheme.text.muted,
                    marginBottom: '6px',
                  }}
                >
                  {char.name}
                </div>
              )}
              <p
                style={{
                  fontSize: isMobile ? '13px' : '14px',
                  lineHeight: 1.6,
                  color: currentTheme.text.secondary,
                  margin: 0,
                  opacity: 0.85,
                }}
              >
                {char.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
