import { Add, AutoAwesome, OpenInNew, People, RecordVoiceOver, Star, TrendingUp, ZoomIn, ZoomOut } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackButton } from '../components/BackButton';
import { HorizontalScrollContainer } from '../components/HorizontalScrollContainer';
import { useTheme } from '../contexts/ThemeContext';
import { Actor, useActorUniverse } from '../hooks/useActorUniverse';

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

  const canvasRef = useRef<HTMLDivElement>(null);
  const [selectedActor, setSelectedActor] = useState<Actor | null>(null);
  const [hoveredActor, setHoveredActor] = useState<Actor | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'recommendations' | 'top'>('recommendations');

  // Pan/Zoom state
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [, setDimensions] = useState({ width: 800, height: 600 });

  // Update dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current) {
        setDimensions({
          width: canvasRef.current.clientWidth,
          height: canvasRef.current.clientHeight,
        });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  }, [transform]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setTransform(prev => ({
      ...prev,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    }));
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch handlers for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - transform.x,
        y: e.touches[0].clientY - transform.y,
      });
    }
  }, [transform]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setTransform(prev => ({
      ...prev,
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    }));
  }, [isDragging, dragStart]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Zoom handlers
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform(prev => ({
      ...prev,
      scale: Math.min(Math.max(prev.scale * delta, 0.3), 4),
    }));
  }, []);

  const zoomIn = () => setTransform(prev => ({ ...prev, scale: Math.min(prev.scale * 1.3, 4) }));
  const zoomOut = () => setTransform(prev => ({ ...prev, scale: Math.max(prev.scale * 0.7, 0.3) }));
  const resetView = () => setTransform({ x: 0, y: 0, scale: 1 });

  // Get actor connections
  const getActorConnections = useCallback((actorId: number) => {
    return connections.filter(c => c.actor1Id === actorId || c.actor2Id === actorId);
  }, [connections]);

  // Background stars
  const backgroundStars = useMemo(() => {
    return Array.from({ length: 200 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.4 + 0.1,
    }));
  }, []);

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
              <h1 style={{
                fontSize: '22px',
                fontWeight: 800,
                margin: 0,
                background: `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
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
              </h1>
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
            <h1 style={{
              fontSize: '22px',
              fontWeight: 800,
              margin: 0,
              background: `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
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
            </h1>
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

      {/* Recommendations Tab */}
      <AnimatePresence mode="wait">
        {activeTab === 'recommendations' && (
          <motion.div
            key="recommendations"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            style={{ padding: '0 20px 100px', position: 'relative', zIndex: 5 }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '20px',
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: `linear-gradient(135deg, ${currentTheme.primary}20, #8b5cf620)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <TrendingUp style={{ color: currentTheme.primary, fontSize: '22px' }} />
              </div>
              <h2 style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: 700,
                color: currentTheme.text.primary,
              }}>
                Basierend auf deinen Lieblings-Schauspielern
              </h2>
            </div>

            {loadingRecommendations ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    border: `3px solid ${currentTheme.border.default}`,
                    borderTopColor: currentTheme.primary,
                    margin: '0 auto 16px',
                  }}
                />
                <p style={{ color: currentTheme.text.muted, fontSize: '14px' }}>
                  Lade Empfehlungen...
                </p>
              </motion.div>
            ) : recommendations.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  background: currentTheme.background.surface,
                  borderRadius: '20px',
                  border: `1px solid ${currentTheme.border.default}`,
                }}
              >
                <AutoAwesome style={{ fontSize: '48px', color: currentTheme.text.muted, marginBottom: '16px' }} />
                <p style={{ color: currentTheme.text.muted, fontSize: '15px', margin: 0 }}>
                  Keine Empfehlungen gefunden
                </p>
              </motion.div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {recommendations.map((rec, index) => (
                  <motion.div
                    key={rec.series.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/series/${rec.series.id}`)}
                    style={{
                      display: 'flex',
                      gap: '14px',
                      padding: '14px',
                      background: currentTheme.background.card,
                      borderRadius: '16px',
                      cursor: 'pointer',
                      border: `1px solid ${currentTheme.border.default}`,
                      boxShadow: `0 4px 12px ${currentTheme.background.default}40`,
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Subtle gradient overlay */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: '100px',
                      height: '100%',
                      background: `linear-gradient(90deg, transparent, ${currentTheme.primary}05)`,
                      pointerEvents: 'none',
                    }} />

                    <div style={{
                      width: '65px',
                      height: '95px',
                      borderRadius: '10px',
                      background: rec.series.poster
                        ? `url(${TMDB_IMAGE_BASE}${rec.series.poster})`
                        : `linear-gradient(135deg, ${currentTheme.primary}40, #8b5cf640)`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      flexShrink: 0,
                      boxShadow: `0 4px 12px ${currentTheme.background.default}60`,
                    }} />

                    <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <h3 style={{
                          margin: 0,
                          fontSize: '15px',
                          fontWeight: 700,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          color: currentTheme.text.primary,
                        }}>
                          {rec.series.title}
                        </h3>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.2), rgba(255, 152, 0, 0.2))',
                          padding: '3px 8px',
                          borderRadius: '8px',
                          flexShrink: 0,
                        }}>
                          <Star style={{ fontSize: '12px', color: '#ffc107' }} />
                          <span style={{ fontSize: '12px', color: '#ffc107', fontWeight: 600 }}>
                            {rec.series.voteAverage.toFixed(1)}
                          </span>
                        </div>
                      </div>

                      <p style={{
                        margin: '0 0 10px 0',
                        fontSize: '13px',
                        color: currentTheme.primary,
                        fontWeight: 600,
                      }}>
                        {rec.actors.length} deiner Schauspieler
                      </p>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {rec.actors.slice(0, 3).map(actor => (
                          <span
                            key={actor.id}
                            style={{
                              fontSize: '11px',
                              background: `linear-gradient(135deg, ${currentTheme.background.surfaceHover}, ${currentTheme.background.surface})`,
                              padding: '4px 10px',
                              borderRadius: '10px',
                              color: currentTheme.text.secondary,
                              fontWeight: 500,
                            }}
                          >
                            {actor.name}
                          </span>
                        ))}
                        {rec.actors.length > 3 && (
                          <span style={{
                            fontSize: '11px',
                            background: `${currentTheme.primary}20`,
                            padding: '4px 10px',
                            borderRadius: '10px',
                            color: currentTheme.primary,
                            fontWeight: 600,
                          }}>
                            +{rec.actors.length - 3}
                          </span>
                        )}
                      </div>
                    </div>

                    <OpenInNew style={{
                      fontSize: '18px',
                      opacity: 0.3,
                      alignSelf: 'center',
                      color: currentTheme.text.muted,
                    }} />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Top Actors Tab */}
        {activeTab === 'top' && (
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
                    onClick={() => setSelectedActor(actor)}
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
                  onClick={() => setSelectedActor(actor)}
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
        )}

        {/* Galaxy Map Tab */}
        {activeTab === 'map' && (
          <motion.div
            key="map"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'relative', height: 'calc(100vh - 180px)' }}
          >
            {/* Premium Zoom Controls */}
            <div style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}>
              {[
                { action: zoomIn, icon: <ZoomIn /> },
                { action: zoomOut, icon: <ZoomOut /> },
                { action: resetView, icon: 'Reset', isText: true },
              ].map((btn, idx) => (
                <motion.button
                  key={idx}
                  onClick={btn.action}
                  whileTap={{ scale: 0.9 }}
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: `linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(20, 20, 40, 0.9))`,
                    border: `1px solid rgba(255, 255, 255, 0.15)`,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: btn.isText ? '11px' : 'inherit',
                    fontWeight: btn.isText ? 600 : 'normal',
                    boxShadow: `0 4px 12px rgba(0, 0, 0, 0.4)`,
                  }}
                >
                  {btn.isText ? btn.icon : btn.icon}
                </motion.button>
              ))}
            </div>

            {/* Canvas */}
            <div
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onWheel={handleWheel}
              style={{
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                cursor: isDragging ? 'grabbing' : 'grab',
                position: 'relative',
                background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a1a 100%)',
              }}
            >
              {/* Background stars */}
              {backgroundStars.map(star => (
                <div
                  key={star.id}
                  style={{
                    position: 'absolute',
                    left: `${star.x}%`,
                    top: `${star.y}%`,
                    width: star.size,
                    height: star.size,
                    borderRadius: '50%',
                    background: 'white',
                    opacity: star.opacity,
                  }}
                />
              ))}

              {/* Transformed content */}
              <div style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
              }}>
                {/* Connection lines */}
                <svg style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                }}>
                  <defs>
                    <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor={currentTheme.primary} stopOpacity="0.5" />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.5" />
                    </linearGradient>
                  </defs>
                  {connections.slice(0, 200).map((conn, idx) => {
                    const actor1 = actors.find(a => a.id === conn.actor1Id);
                    const actor2 = actors.find(a => a.id === conn.actor2Id);
                    if (!actor1 || !actor2) return null;

                    const isHighlighted = hoveredActor &&
                      (conn.actor1Id === hoveredActor.id || conn.actor2Id === hoveredActor.id);

                    return (
                      <line
                        key={idx}
                        x1={`${(actor1.x || 0.5) * 100}%`}
                        y1={`${(actor1.y || 0.5) * 100}%`}
                        x2={`${(actor2.x || 0.5) * 100}%`}
                        y2={`${(actor2.y || 0.5) * 100}%`}
                        stroke={isHighlighted ? 'url(#connectionGradient)' : 'rgba(255, 255, 255, 0.05)'}
                        strokeWidth={isHighlighted ? 2 : 1}
                      />
                    );
                  })}
                </svg>

                {/* Actor nodes */}
                {actors.map((actor, index) => {
                  const isHovered = hoveredActor?.id === actor.id;
                  const isConnected = hoveredActor && getActorConnections(hoveredActor.id)
                    .some(c => c.actor1Id === actor.id || c.actor2Id === actor.id);

                  return (
                    <div
                      key={actor.id}
                      onClick={(e) => { e.stopPropagation(); setSelectedActor(actor); }}
                      onMouseEnter={() => setHoveredActor(actor)}
                      onMouseLeave={() => setHoveredActor(null)}
                      style={{
                        position: 'absolute',
                        left: `${(actor.x || 0.5) * 100}%`,
                        top: `${(actor.y || 0.5) * 100}%`,
                        transform: 'translate(-50%, -50%)',
                        cursor: 'pointer',
                        opacity: hoveredActor ? (isHovered || isConnected ? 1 : 0.3) : 1,
                        transition: 'opacity 0.2s',
                        zIndex: isHovered ? 100 : index < 10 ? 50 : 10,
                      }}
                    >
                      {/* Glow */}
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: (actor.size || 10) * 2.5,
                        height: (actor.size || 10) * 2.5,
                        borderRadius: '50%',
                        background: `radial-gradient(circle, ${actor.color}55 0%, transparent 70%)`,
                        pointerEvents: 'none',
                      }} />

                      {/* Node */}
                      <div style={{
                        width: actor.size || 10,
                        height: actor.size || 10,
                        borderRadius: '50%',
                        background: actor.profilePath
                          ? `url(${TMDB_IMAGE_BASE}${actor.profilePath})`
                          : actor.color,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        border: `2px solid ${actor.color}`,
                        boxShadow: `0 0 ${(actor.size || 10) / 2}px ${actor.color}`,
                        transition: 'transform 0.2s',
                        transform: isHovered ? 'scale(1.3)' : 'scale(1)',
                      }} />

                      {/* Label on hover */}
                      {isHovered && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          marginTop: '8px',
                          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(20, 20, 40, 0.95))',
                          padding: '8px 14px',
                          borderRadius: '10px',
                          whiteSpace: 'nowrap',
                          fontSize: `${12 / transform.scale}px`,
                          fontWeight: 600,
                          pointerEvents: 'none',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                        }}>
                          {actor.name}
                          <div style={{
                            fontSize: `${10 / transform.scale}px`,
                            opacity: 0.7,
                            marginTop: '3px',
                            color: currentTheme.primary,
                          }}>
                            {actor.seriesCount} Serien
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Premium Legend */}
            <div style={{
              position: 'absolute',
              bottom: '16px',
              left: '16px',
              background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(20, 20, 40, 0.9))',
              borderRadius: '14px',
              padding: '14px 16px',
              fontSize: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, hsl(45, 80%, 60%), hsl(35, 80%, 50%))',
                  boxShadow: '0 0 8px hsl(45, 80%, 60%)',
                }} />
                <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Top 10 Schauspieler</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '18px',
                  height: '3px',
                  background: `linear-gradient(90deg, ${currentTheme.primary}, #8b5cf6)`,
                  borderRadius: '2px',
                }} />
                <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Gemeinsame Serie</span>
              </div>
            </div>
          </motion.div>
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
                  <h2 style={{
                    margin: '0 0 10px 0',
                    fontSize: '24px',
                    fontWeight: 800,
                    background: `linear-gradient(135deg, ${currentTheme.text.primary}, ${currentTheme.primary})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                    {selectedActor.name}
                  </h2>
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
