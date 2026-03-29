import { Add, Star } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContextDef';
import { GradientText, HorizontalScrollContainer } from '../../components/ui';
import type { Actor, ActorConnection } from '../../hooks/useActorUniverse';
import './ActorUniversePage.css';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w185';

interface ActorDetailModalProps {
  selectedActor: Actor | null;
  actors: Actor[];
  onClose: () => void;
  onSelectActor: (actor: Actor) => void;
  getActorConnections: (actorId: number) => ActorConnection[];
}

export const ActorDetailModal = ({
  selectedActor,
  actors,
  onClose,
  onSelectActor,
  getActorConnections,
}: ActorDetailModalProps) => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();

  return (
    <AnimatePresence>
      {selectedActor && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="au-modal-overlay"
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="au-modal-sheet"
            style={{
              background: `linear-gradient(180deg, ${currentTheme.background.card}, ${currentTheme.background.default})`,
              color: currentTheme.text.primary,
            }}
          >
            {/* Decorative gradient */}
            <div
              className="au-modal-gradient"
              style={{
                background: `linear-gradient(180deg, ${currentTheme.primary}15, transparent)`,
              }}
            />

            {/* Handle bar */}
            <div className="au-modal-handle" style={{ background: currentTheme.border.default }} />

            {/* Actor header */}
            <div className="au-modal-actor-header">
              <div
                className="au-modal-avatar"
                style={{
                  background: selectedActor.profilePath
                    ? `url(${TMDB_IMAGE_BASE}${selectedActor.profilePath})`
                    : `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderColor: currentTheme.primary,
                  boxShadow: `0 8px 24px ${currentTheme.primary}40`,
                }}
              />
              <div>
                <GradientText
                  as="h2"
                  from={currentTheme.text.primary}
                  to={currentTheme.primary}
                  style={{
                    margin: '0 0 10px 0',
                    fontSize: '24px',
                    fontWeight: 800,
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  {selectedActor.name}
                </GradientText>
                <div
                  className="au-modal-series-badge"
                  style={{
                    background: `linear-gradient(135deg, ${currentTheme.primary}20, ${currentTheme.accent}20)`,
                  }}
                >
                  <Star style={{ fontSize: '18px', color: currentTheme.accent }} />
                  <span style={{ fontSize: '15px', fontWeight: 600 }}>
                    {selectedActor.seriesCount} Serien
                  </span>
                </div>
              </div>
            </div>

            {/* Series list */}
            <h2 className="au-modal-section-title" style={{ color: currentTheme.text.primary }}>
              In deiner Sammlung
            </h2>
            <div className="au-modal-series-list">
              {selectedActor.series.map((series) => (
                <motion.div
                  key={series.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onClose();
                    navigate(`/series/${series.id}`);
                  }}
                  className="au-modal-series-item"
                  style={{
                    background: currentTheme.background.surface,
                    borderColor: currentTheme.border.default,
                  }}
                >
                  <div
                    className="au-modal-series-poster"
                    style={{
                      background: series.poster
                        ? `url(https://image.tmdb.org/t/p/w92${series.poster})`
                        : `linear-gradient(135deg, ${currentTheme.primary}40, ${currentTheme.accent}40)`,
                      backgroundSize: 'cover',
                      boxShadow: `0 4px 12px ${currentTheme.background.default}60`,
                    }}
                  />
                  <div>
                    <p
                      className="au-modal-series-title"
                      style={{ color: currentTheme.text.primary }}
                    >
                      {series.title}
                    </p>
                    <p
                      className="au-modal-series-character"
                      style={{ color: currentTheme.primary }}
                    >
                      als {series.character}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Recommendations */}
            {selectedActor.recommendations && selectedActor.recommendations.length > 0 && (
              <>
                <h2 className="au-modal-section-title" style={{ color: currentTheme.text.primary }}>
                  Weitere Serien mit {selectedActor.name.split(' ')[0]}
                </h2>
                <HorizontalScrollContainer gap={14}>
                  {selectedActor.recommendations.map((rec) => (
                    <motion.div
                      key={rec.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        onClose();
                        navigate(`/series/${rec.id}`);
                      }}
                      className="au-modal-rec-item"
                    >
                      <div
                        className="au-modal-rec-poster"
                        style={{
                          background: rec.poster
                            ? `url(${TMDB_IMAGE_BASE}${rec.poster})`
                            : `linear-gradient(135deg, ${currentTheme.primary}40, ${currentTheme.accent}40)`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          boxShadow: `0 6px 16px ${currentTheme.background.default}60`,
                        }}
                      >
                        <div className="au-modal-rec-rating">
                          <Star style={{ fontSize: '12px', color: currentTheme.accent }} />
                          <span className="au-modal-rec-rating-text">
                            {rec.voteAverage.toFixed(1)}
                          </span>
                        </div>
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          className="au-modal-rec-add-btn"
                          style={{
                            background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                            boxShadow: `0 4px 12px ${currentTheme.primary}50`,
                          }}
                        >
                          <Add style={{ fontSize: '18px' }} />
                        </motion.div>
                      </div>
                      <p
                        className="au-modal-rec-title"
                        style={{ color: currentTheme.text.primary }}
                      >
                        {rec.title}
                      </p>
                    </motion.div>
                  ))}
                </HorizontalScrollContainer>
              </>
            )}

            {/* Connected actors */}
            {getActorConnections(selectedActor.id).length > 0 && (
              <>
                <h2
                  className="au-modal-section-title au-modal-section-title--connected"
                  style={{ color: currentTheme.text.primary }}
                >
                  Spielt zusammen mit
                </h2>
                <div className="au-modal-connections">
                  {getActorConnections(selectedActor.id)
                    .slice(0, 8)
                    .map((conn) => {
                      const otherId =
                        conn.actor1Id === selectedActor.id ? conn.actor2Id : conn.actor1Id;
                      const other = actors.find((a) => a.id === otherId);
                      if (!other) return null;

                      return (
                        <motion.div
                          key={otherId}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onSelectActor(other)}
                          className="au-modal-connection-chip"
                          style={{
                            background: `linear-gradient(135deg, ${currentTheme.primary}25, ${currentTheme.accent}25)`,
                            borderColor: `${currentTheme.primary}30`,
                          }}
                        >
                          <div
                            className="au-modal-connection-avatar"
                            style={{
                              background: other.profilePath
                                ? `url(${TMDB_IMAGE_BASE}${other.profilePath})`
                                : `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                              backgroundSize: 'cover',
                              borderColor: `${currentTheme.primary}50`,
                            }}
                          />
                          <span style={{ fontSize: '14px', fontWeight: 600 }}>{other.name}</span>
                          <span
                            style={{
                              fontSize: '12px',
                              color: currentTheme.primary,
                              fontWeight: 600,
                            }}
                          >
                            ({conn.strength})
                          </span>
                        </motion.div>
                      );
                    })}
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
