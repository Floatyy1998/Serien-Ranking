import { Add, AutoAwesome, People, RecordVoiceOver, Star, TrendingUp } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { BackButton, GradientText, HorizontalScrollContainer } from '../../components/ui';
import { Actor, useActorUniverse } from '../../hooks/useActorUniverse';
import { RecommendationsTab } from './RecommendationsTab';
import { TopActorsTab } from './TopActorsTab';
import { GalaxyMapTab } from './GalaxyMapTab';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w185';

export const ActorUniversePage = () => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();

  // Voice actor toggle - persisted in localStorage
  const [hideVoiceActors, setHideVoiceActors] = useState(() => {
    const saved = localStorage.getItem('actorUniverse_hideVoiceActors');
    return saved === 'true';
  });

  const toggleVoiceActors = () => {
    setHideVoiceActors(prev => {
      const newValue = !prev;
      localStorage.setItem('actorUniverse_hideVoiceActors', String(newValue));
      return newValue;
    });
  };

  const {
    actors,
    connections,
    topActors,
    recommendations,
    stats,
    loading,
    progress,
    loadingRecommendations,
  } = useActorUniverse(hideVoiceActors);

  const [selectedActor, setSelectedActor] = useState<Actor | null>(null);
  const [hoveredActor, setHoveredActor] = useState<Actor | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'recommendations' | 'top'>('recommendations');

  // Get actor connections
  const getActorConnections = useCallback((actorId: number) => {
    return connections.filter(c => c.actor1Id === actorId || c.actor2Id === actorId);
  }, [connections]);

  // Tab configuration
  const tabs = [
    { id: 'recommendations' as const, label: 'Empfehlungen', icon: TrendingUp },
    { id: 'top' as const, label: 'Top Actors', icon: Star },
    { id: 'map' as const, label: 'Galaxy Map', icon: AutoAwesome },
  ];

  if (loading && actors.length === 0) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: currentTheme.background.default,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative background */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(ellipse at 30% 20%, ${currentTheme.primary}15 0%, transparent 50%),
                       radial-gradient(ellipse at 70% 80%, #8b5cf615 0%, transparent 50%)`,
          pointerEvents: 'none',
        }} />

        {/* Premium Header */}
        <header style={{
          padding: '16px 20px',
          paddingTop: 'calc(16px + env(safe-area-inset-top))',
          background: `linear-gradient(180deg, ${currentTheme.background.card}ee 0%, ${currentTheme.background.card}00 100%)`,
          backdropFilter: 'blur(20px)',
          position: 'relative',
          zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <BackButton
              style={{
                background: `linear-gradient(135deg, ${currentTheme.background.surface}, ${currentTheme.background.surfaceHover})`,
                border: `1px solid ${currentTheme.border.default}`,
                color: currentTheme.text.primary,
                boxShadow: `0 2px 8px ${currentTheme.background.default}80`,
              }}
            />
            <div style={{ flex: 1 }}>
              <GradientText as="h1" to="#8b5cf6" style={{
                fontSize: '22px',
                fontWeight: 800,
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <AutoAwesome style={{
                  fontSize: '24px',
                  color: currentTheme.primary,
                  WebkitTextFillColor: currentTheme.primary,
                }} />
                Actor Universe
              </GradientText>
              <p style={{
                fontSize: '12px',
                color: currentTheme.text.muted,
                margin: '4px 0 0 0',
                letterSpacing: '0.3px',
              }}>
                Analysiere deine Serien...
              </p>
            </div>
          </div>
        </header>

        {/* Premium Loading Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px 20px',
            position: 'relative',
            zIndex: 5,
          }}
        >
          {/* Animated cosmic ring */}
          <div style={{ position: 'relative', marginBottom: '32px' }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                border: `3px solid ${currentTheme.border.default}`,
                borderTopColor: currentTheme.primary,
                borderRightColor: '#8b5cf6',
              }}
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute',
                top: '15px',
                left: '15px',
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                border: `2px solid ${currentTheme.border.default}`,
                borderBottomColor: currentTheme.primary,
              }}
            />
            <AutoAwesome style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '28px',
              color: currentTheme.primary,
            }} />
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{
              margin: 0,
              color: currentTheme.text.secondary,
              fontSize: '16px',
              fontWeight: 500,
            }}
          >
            {Math.round(progress)}% - Sammle Schauspieler-Daten
          </motion.p>

          {/* Premium progress bar */}
          <div style={{
            width: '260px',
            height: '8px',
            background: currentTheme.background.surface,
            borderRadius: '10px',
            marginTop: '20px',
            overflow: 'hidden',
            boxShadow: `inset 0 2px 4px ${currentTheme.background.default}`,
          }}>
            <motion.div
              style={{
                height: '100%',
                background: `linear-gradient(90deg, ${currentTheme.primary}, #8b5cf6, ${currentTheme.primary})`,
                backgroundSize: '200% 100%',
                borderRadius: '10px',
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
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: currentTheme.background.default,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative background */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `radial-gradient(ellipse at 20% 10%, ${currentTheme.primary}12 0%, transparent 40%),
                     radial-gradient(ellipse at 80% 90%, #8b5cf612 0%, transparent 40%)`,
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Premium Header */}
      <header style={{
        padding: '16px 20px',
        paddingTop: 'calc(16px + env(safe-area-inset-top))',
        background: `linear-gradient(180deg, ${currentTheme.background.card}f5 0%, ${currentTheme.background.card}00 100%)`,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(20px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
          <BackButton
            style={{
              background: `linear-gradient(135deg, ${currentTheme.background.surface}, ${currentTheme.background.surfaceHover})`,
              border: `1px solid ${currentTheme.border.default}`,
              color: currentTheme.text.primary,
              boxShadow: `0 2px 8px ${currentTheme.background.default}80`,
            }}
          />
          <div style={{ flex: 1 }}>
            <GradientText as="h1" to="#8b5cf6" style={{
              fontSize: '22px',
              fontWeight: 800,
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <AutoAwesome style={{
                fontSize: '24px',
                color: currentTheme.primary,
                WebkitTextFillColor: currentTheme.primary,
              }} />
              Actor Universe
            </GradientText>
            <p style={{
              fontSize: '12px',
              color: currentTheme.text.muted,
              margin: '4px 0 0 0',
              letterSpacing: '0.3px',
            }}>
              {stats.totalActors} Schauspieler • {stats.actorsInMultipleSeries} in mehreren Serien
            </p>
          </div>
        </div>

        {/* Premium Tabs */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                whileTap={{ scale: 0.95 }}
                style={{
                  flex: 1,
                  padding: '12px 10px',
                  background: isActive
                    ? `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`
                    : `${currentTheme.background.surface}`,
                  border: isActive
                    ? 'none'
                    : `1px solid ${currentTheme.border.default}`,
                  borderRadius: '14px',
                  color: isActive ? '#fff' : currentTheme.text.secondary,
                  fontSize: '12px',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: isActive ? `0 4px 15px ${currentTheme.primary}40` : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <Icon style={{ fontSize: '16px' }} />
                {tab.label}
              </motion.button>
            );
          })}

          {/* Voice Actor Toggle */}
          <motion.button
            onClick={toggleVoiceActors}
            whileTap={{ scale: 0.95 }}
            title={hideVoiceActors ? 'Voice Actors anzeigen' : 'Voice Actors ausblenden'}
            style={{
              padding: '12px',
              background: hideVoiceActors
                ? currentTheme.background.surface
                : `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`,
              border: hideVoiceActors ? `1px solid ${currentTheme.border.default}` : 'none',
              borderRadius: '14px',
              color: hideVoiceActors ? currentTheme.text.muted : '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: !hideVoiceActors ? `0 4px 15px ${currentTheme.primary}40` : 'none',
            }}
          >
            <RecordVoiceOver style={{ fontSize: '18px' }} />
          </motion.button>
        </div>
      </header>

      {/* Premium Stats Banner */}
      {stats.mostConnectedPair && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            margin: '16px 20px',
            padding: '18px',
            background: `linear-gradient(135deg, ${currentTheme.primary}18, #8b5cf618)`,
            borderRadius: '16px',
            border: `1px solid ${currentTheme.primary}30`,
            position: 'relative',
            overflow: 'hidden',
            zIndex: 5,
          }}
        >
          {/* Decorative gradient */}
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '150px',
            height: '150px',
            background: `radial-gradient(circle, ${currentTheme.primary}20 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', position: 'relative' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 12px ${currentTheme.primary}40`,
            }}>
              <People style={{ color: '#fff', fontSize: '24px' }} />
            </div>
            <div>
              <p style={{
                margin: 0,
                fontSize: '12px',
                color: currentTheme.text.muted,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontWeight: 600,
              }}>Stärkstes Duo</p>
              <p style={{
                margin: '4px 0 0 0',
                fontSize: '17px',
                fontWeight: 700,
                color: currentTheme.text.primary,
              }}>
                {stats.mostConnectedPair.actor1} & {stats.mostConnectedPair.actor2}
              </p>
              <p style={{
                margin: '4px 0 0 0',
                fontSize: '13px',
                color: currentTheme.primary,
                fontWeight: 500,
              }}>
                {stats.mostConnectedPair.count} gemeinsame Serien
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'recommendations' && (
          <RecommendationsTab
            recommendations={recommendations}
            loadingRecommendations={loadingRecommendations}
          />
        )}

        {activeTab === 'top' && (
          <TopActorsTab
            topActors={topActors}
            actors={actors}
            onSelectActor={setSelectedActor}
          />
        )}

        {activeTab === 'map' && (
          <GalaxyMapTab
            actors={actors}
            connections={connections}
            hoveredActor={hoveredActor}
            onHoverActor={setHoveredActor}
            onSelectActor={setSelectedActor}
            getActorConnections={getActorConnections}
          />
        )}
      </AnimatePresence>

      {/* Premium Actor Detail Modal */}
      <AnimatePresence>
        {selectedActor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedActor(null)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(20px)',
              zIndex: 200,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
            }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: `linear-gradient(180deg, ${currentTheme.background.card}, ${currentTheme.background.default})`,
                borderRadius: '28px 28px 0 0',
                padding: '24px',
                width: '100%',
                maxWidth: '500px',
                maxHeight: '85vh',
                overflow: 'auto',
                color: currentTheme.text.primary,
                position: 'relative',
              }}
            >
              {/* Decorative gradient */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '150px',
                background: `linear-gradient(180deg, ${currentTheme.primary}15, transparent)`,
                borderRadius: '28px 28px 0 0',
                pointerEvents: 'none',
              }} />

              {/* Handle bar */}
              <div style={{
                width: '44px',
                height: '5px',
                background: currentTheme.border.default,
                borderRadius: '3px',
                margin: '0 auto 24px',
              }} />

              {/* Actor header */}
              <div style={{ display: 'flex', gap: '18px', marginBottom: '28px', position: 'relative' }}>
                <div style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  background: selectedActor.profilePath
                    ? `url(${TMDB_IMAGE_BASE}${selectedActor.profilePath})`
                    : `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  border: `4px solid ${currentTheme.primary}`,
                  flexShrink: 0,
                  boxShadow: `0 8px 24px ${currentTheme.primary}40`,
                }} />
                <div>
                  <GradientText as="h2" from={currentTheme.text.primary} to={currentTheme.primary} style={{
                    margin: '0 0 10px 0',
                    fontSize: '24px',
                    fontWeight: 800,
                  }}>
                    {selectedActor.name}
                  </GradientText>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: `linear-gradient(135deg, ${currentTheme.primary}20, #8b5cf620)`,
                    padding: '8px 14px',
                    borderRadius: '12px',
                    width: 'fit-content',
                  }}>
                    <Star style={{ fontSize: '18px', color: '#ffc107' }} />
                    <span style={{ fontSize: '15px', fontWeight: 600 }}>
                      {selectedActor.seriesCount} Serien
                    </span>
                  </div>
                </div>
              </div>

              {/* Series list */}
              <h3 style={{
                margin: '0 0 14px 0',
                fontSize: '13px',
                color: currentTheme.text.muted,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                fontWeight: 700,
              }}>
                In deiner Sammlung
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
                {selectedActor.series.map(series => (
                  <motion.div
                    key={series.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setSelectedActor(null); navigate(`/series/${series.id}`); }}
                    style={{
                      display: 'flex',
                      gap: '14px',
                      padding: '12px',
                      background: currentTheme.background.surface,
                      borderRadius: '14px',
                      cursor: 'pointer',
                      border: `1px solid ${currentTheme.border.default}`,
                    }}
                  >
                    <div style={{
                      width: '44px',
                      height: '66px',
                      borderRadius: '8px',
                      background: series.poster
                        ? `url(https://image.tmdb.org/t/p/w92${series.poster})`
                        : `linear-gradient(135deg, ${currentTheme.primary}40, #8b5cf640)`,
                      backgroundSize: 'cover',
                      flexShrink: 0,
                      boxShadow: `0 4px 12px ${currentTheme.background.default}60`,
                    }} />
                    <div>
                      <p style={{
                        margin: 0,
                        fontSize: '15px',
                        fontWeight: 700,
                        color: currentTheme.text.primary,
                      }}>
                        {series.title}
                      </p>
                      <p style={{
                        margin: '5px 0 0 0',
                        fontSize: '13px',
                        color: currentTheme.primary,
                        fontWeight: 500,
                      }}>
                        als {series.character}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Recommendations */}
              {selectedActor.recommendations && selectedActor.recommendations.length > 0 && (
                <>
                  <h3 style={{
                    margin: '0 0 14px 0',
                    fontSize: '13px',
                    color: currentTheme.text.muted,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    fontWeight: 700,
                  }}>
                    Weitere Serien mit {selectedActor.name.split(' ')[0]}
                  </h3>
                  <HorizontalScrollContainer gap={14}>
                    {selectedActor.recommendations.map(rec => (
                      <motion.div
                        key={rec.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { setSelectedActor(null); navigate(`/series/${rec.id}`); }}
                        style={{ minWidth: '110px', cursor: 'pointer' }}
                      >
                        <div style={{
                          width: '110px',
                          height: '160px',
                          borderRadius: '12px',
                          marginBottom: '10px',
                          background: rec.poster
                            ? `url(${TMDB_IMAGE_BASE}${rec.poster})`
                            : `linear-gradient(135deg, ${currentTheme.primary}40, #8b5cf640)`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          position: 'relative',
                          boxShadow: `0 6px 16px ${currentTheme.background.default}60`,
                        }}>
                          <div style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.85), rgba(20, 20, 40, 0.9))',
                            borderRadius: '8px',
                            padding: '4px 8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}>
                            <Star style={{ fontSize: '11px', color: '#ffc107' }} />
                            <span style={{ fontSize: '11px', color: 'white', fontWeight: 600 }}>
                              {rec.voteAverage.toFixed(1)}
                            </span>
                          </div>
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            style={{
                              position: 'absolute',
                              bottom: '8px',
                              right: '8px',
                              background: `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`,
                              borderRadius: '50%',
                              width: '28px',
                              height: '28px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#fff',
                              boxShadow: `0 4px 12px ${currentTheme.primary}50`,
                            }}
                          >
                            <Add style={{ fontSize: '18px' }} />
                          </motion.div>
                        </div>
                        <p style={{
                          margin: 0,
                          fontSize: '13px',
                          fontWeight: 600,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          color: currentTheme.text.primary,
                        }}>
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
                  <h3 style={{
                    margin: '28px 0 14px 0',
                    fontSize: '13px',
                    color: currentTheme.text.muted,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    fontWeight: 700,
                  }}>
                    Spielt zusammen mit
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {getActorConnections(selectedActor.id).slice(0, 8).map(conn => {
                      const otherId = conn.actor1Id === selectedActor.id ? conn.actor2Id : conn.actor1Id;
                      const other = actors.find(a => a.id === otherId);
                      if (!other) return null;

                      return (
                        <motion.div
                          key={otherId}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedActor(other)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 14px',
                            background: `linear-gradient(135deg, ${currentTheme.primary}25, #8b5cf625)`,
                            borderRadius: '16px',
                            cursor: 'pointer',
                            border: `1px solid ${currentTheme.primary}30`,
                          }}
                        >
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: other.profilePath
                              ? `url(${TMDB_IMAGE_BASE}${other.profilePath})`
                              : `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`,
                            backgroundSize: 'cover',
                            border: `2px solid ${currentTheme.primary}50`,
                          }} />
                          <span style={{ fontSize: '13px', fontWeight: 600 }}>{other.name}</span>
                          <span style={{
                            fontSize: '11px',
                            color: currentTheme.primary,
                            fontWeight: 600,
                          }}>
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
    </div>
  );
};
