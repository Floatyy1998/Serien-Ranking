import { motion } from 'framer-motion';
import { HorizontalScrollContainer } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { Actor } from '../../hooks/useActorUniverse';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w185';

interface TopActorsTabProps {
  topActors: Actor[];
  actors: Actor[];
  onSelectActor: (actor: Actor) => void;
}

export const TopActorsTab = ({ topActors, actors, onSelectActor }: TopActorsTabProps) => {
  const { currentTheme } = useTheme();

  return (
    <motion.div
      key="top"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      style={{ padding: '0 20px 100px', position: 'relative', zIndex: 5 }}
    >
      <h2 style={{
        margin: '0 0 20px 0',
        fontSize: '18px',
        fontWeight: 700,
        color: currentTheme.text.primary,
      }}>
        Deine meistgesehenen Schauspieler
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {topActors.map((actor, index) => {
          const isTop3 = index < 3;
          const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32'];

          return (
            <motion.div
              key={actor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectActor(actor)}
              style={{
                display: 'flex',
                gap: '14px',
                padding: '14px',
                background: isTop3
                  ? `linear-gradient(135deg, ${currentTheme.primary}15, #8b5cf615)`
                  : currentTheme.background.card,
                borderRadius: '16px',
                cursor: 'pointer',
                border: isTop3
                  ? `1px solid ${currentTheme.primary}30`
                  : `1px solid ${currentTheme.border.default}`,
                boxShadow: isTop3
                  ? `0 4px 15px ${currentTheme.primary}20`
                  : `0 2px 8px ${currentTheme.background.default}40`,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Rank badge */}
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '12px',
                background: isTop3
                  ? `linear-gradient(135deg, ${rankColors[index]}, ${rankColors[index]}99)`
                  : currentTheme.background.surfaceHover,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: 800,
                flexShrink: 0,
                color: isTop3 ? '#000' : currentTheme.text.primary,
                boxShadow: isTop3 ? `0 2px 8px ${rankColors[index]}40` : 'none',
              }}>
                {index + 1}
              </div>

              {/* Actor image */}
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: actor.profilePath
                  ? `url(${TMDB_IMAGE_BASE}${actor.profilePath})`
                  : `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                flexShrink: 0,
                border: isTop3
                  ? `3px solid ${rankColors[index]}`
                  : `2px solid ${currentTheme.border.default}`,
                boxShadow: `0 4px 12px ${currentTheme.background.default}60`,
              }} />

              <div style={{ flex: 1 }}>
                <h3 style={{
                  margin: 0,
                  fontSize: '16px',
                  fontWeight: 700,
                  color: currentTheme.text.primary,
                }}>
                  {actor.name}
                </h3>
                <p style={{
                  margin: '4px 0 0 0',
                  fontSize: '14px',
                  color: currentTheme.primary,
                  fontWeight: 600,
                }}>
                  {actor.seriesCount} Serien
                </p>
              </div>

              {/* Decorative shine for top 3 */}
              {isTop3 && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '120px',
                  height: '100%',
                  background: `linear-gradient(90deg, transparent, ${rankColors[index]}10)`,
                  pointerEvents: 'none',
                }} />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* All actors who appear in multiple series */}
      <h3 style={{
        margin: '36px 0 18px 0',
        fontSize: '16px',
        color: currentTheme.text.secondary,
        fontWeight: 600,
      }}>
        Weitere Schauspieler in mehreren deiner Serien
      </h3>
      <HorizontalScrollContainer gap={14}>
        {actors.slice(10, 50).map((actor, index) => (
          <motion.div
            key={actor.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelectActor(actor)}
            style={{
              minWidth: '85px',
              textAlign: 'center',
              cursor: 'pointer',
            }}
          >
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              margin: '0 auto 10px',
              background: actor.profilePath
                ? `url(${TMDB_IMAGE_BASE}${actor.profilePath})`
                : `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              border: `2px solid ${currentTheme.border.default}`,
              boxShadow: `0 4px 12px ${currentTheme.background.default}60`,
            }} />
            <p style={{
              margin: 0,
              fontSize: '12px',
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: currentTheme.text.primary,
            }}>
              {actor.name.split(' ')[0]}
            </p>
            <p style={{
              margin: '3px 0 0 0',
              fontSize: '11px',
              color: currentTheme.primary,
              fontWeight: 500,
            }}>
              {actor.seriesCount} Serien
            </p>
          </motion.div>
        ))}
      </HorizontalScrollContainer>
    </motion.div>
  );
};
