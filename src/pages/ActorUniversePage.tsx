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

  if (loading && actors.length === 0) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: currentTheme.background.default }}>
        {/* Header auch beim Laden */}
        <header
          style={{
            padding: '16px',
            paddingTop: 'calc(16px + env(safe-area-inset-top))',
            background: `linear-gradient(180deg, ${currentTheme.primary}33 0%, transparent 100%)`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <BackButton
              style={{
                background: `${currentTheme.background.card}80`,
                border: `1px solid ${currentTheme.border.default}`,
                color: currentTheme.text.primary,
              }}
            />
            <div style={{ flex: 1 }}>
              <h1
                style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  margin: 0,
                  color: currentTheme.text.primary,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <AutoAwesome style={{ fontSize: '18px', color: currentTheme.primary }} />
                Actor Universe
              </h1>
              <p style={{ fontSize: '11px', color: currentTheme.text.muted, margin: '2px 0 0 0' }}>
                Analysiere deine Serien...
              </p>
            </div>
          </div>
        </header>

        {/* Loading Content */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 20px',
        }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              border: `3px solid ${currentTheme.border.default}`,
              borderTopColor: currentTheme.primary,
              marginBottom: '20px',
            }}
          />
          <p style={{ margin: 0, color: currentTheme.text.secondary, fontSize: '14px' }}>
            {Math.round(progress)}% - Sammle Schauspieler-Daten
          </p>
          <div style={{
            width: '200px',
            height: '4px',
            background: currentTheme.border.default,
            borderRadius: '2px',
            marginTop: '16px',
            overflow: 'hidden',
          }}>
            <motion.div
              style={{
                height: '100%',
                background: currentTheme.primary,
                borderRadius: '2px',
              }}
              animate={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: currentTheme.background.default }}>
      {/* Header */}
      <header
        style={{
          padding: '16px',
          paddingTop: 'calc(16px + env(safe-area-inset-top))',
          background: `linear-gradient(180deg, ${currentTheme.primary}33 0%, transparent 100%)`,
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backdropFilter: 'blur(10px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <BackButton
            style={{
              background: `${currentTheme.background.card}80`,
              border: `1px solid ${currentTheme.border.default}`,
              color: currentTheme.text.primary,
            }}
          />
          <div style={{ flex: 1 }}>
            <h1
              style={{
                fontSize: '18px',
                fontWeight: 'bold',
                margin: 0,
                color: currentTheme.text.primary,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <AutoAwesome style={{ fontSize: '18px', color: currentTheme.primary }} />
              Actor Universe
            </h1>
            <p style={{ fontSize: '11px', color: currentTheme.text.muted, margin: '2px 0 0 0' }}>
              {stats.totalActors} Schauspieler • {stats.actorsInMultipleSeries} in mehreren Serien
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['recommendations', 'top', 'map'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '10px',
                background: activeTab === tab
                  ? currentTheme.primary
                  : `${currentTheme.background.card}80`,
                border: `1px solid ${activeTab === tab ? currentTheme.primary : currentTheme.border.default}`,
                borderRadius: '10px',
                color: activeTab === tab ? '#fff' : currentTheme.text.primary,
                fontSize: '13px',
                fontWeight: activeTab === tab ? 600 : 400,
                cursor: 'pointer',
              }}
            >
              {tab === 'recommendations' && 'Empfehlungen'}
              {tab === 'top' && 'Top Actors'}
              {tab === 'map' && 'Galaxy Map'}
            </button>
          ))}

          {/* Voice Actor Toggle */}
          <button
            onClick={toggleVoiceActors}
            title={hideVoiceActors ? 'Voice Actors anzeigen' : 'Voice Actors ausblenden'}
            style={{
              padding: '10px',
              background: hideVoiceActors
                ? `${currentTheme.background.card}80`
                : currentTheme.primary,
              border: `1px solid ${hideVoiceActors ? currentTheme.border.default : currentTheme.primary}`,
              borderRadius: '10px',
              color: hideVoiceActors ? currentTheme.text.muted : '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <RecordVoiceOver style={{ fontSize: '18px' }} />
          </button>
        </div>
      </header>

      {/* Stats Banner */}
      {stats.mostConnectedPair && (
        <div style={{
          margin: '16px 20px',
          padding: '16px',
          background: `${currentTheme.primary}22`,
          borderRadius: '12px',
          border: `1px solid ${currentTheme.primary}44`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <People style={{ color: currentTheme.primary }} />
            <div>
              <p style={{ margin: 0, fontSize: '13px', color: currentTheme.text.secondary }}>Stärkstes Duo</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '15px', fontWeight: 600 }}>
                {stats.mostConnectedPair.actor1} & {stats.mostConnectedPair.actor2}
              </p>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: currentTheme.text.muted }}>
                {stats.mostConnectedPair.count} gemeinsame Serien
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations Tab */}
      {activeTab === 'recommendations' && (
        <div style={{ padding: '0 20px 100px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <TrendingUp style={{ color: currentTheme.primary }} />
            <h2 style={{ margin: 0, fontSize: '18px' }}>Basierend auf deinen Lieblings-Schauspielern</h2>
          </div>

          {loadingRecommendations ? (
            <div style={{ textAlign: 'center', padding: '40px', color: currentTheme.text.muted }}>
              Lade Empfehlungen...
            </div>
          ) : recommendations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: currentTheme.text.muted }}>
              Keine Empfehlungen gefunden
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recommendations.map(rec => (
                <motion.div
                  key={rec.series.id}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => navigate(`/series/${rec.series.id}`)}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '12px',
                    background: currentTheme.background.card,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    border: `1px solid ${currentTheme.border.default}`,
                  }}
                >
                  <div style={{
                    width: '60px',
                    height: '90px',
                    borderRadius: '8px',
                    background: rec.series.poster
                      ? `url(${TMDB_IMAGE_BASE}${rec.series.poster})`
                      : 'linear-gradient(135deg, #333, #555)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    flexShrink: 0,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h3 style={{
                        margin: 0,
                        fontSize: '15px',
                        fontWeight: 600,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {rec.series.title}
                      </h3>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                        background: 'rgba(255, 193, 7, 0.2)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        flexShrink: 0,
                      }}>
                        <Star style={{ fontSize: '12px', color: '#ffc107' }} />
                        <span style={{ fontSize: '11px', color: '#ffc107' }}>
                          {rec.series.voteAverage.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <p style={{
                      margin: '0 0 8px 0',
                      fontSize: '12px',
                      color: currentTheme.primary,
                    }}>
                      {rec.actors.length} deiner Schauspieler
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {rec.actors.slice(0, 3).map(actor => (
                        <span
                          key={actor.id}
                          style={{
                            fontSize: '11px',
                            background: currentTheme.background.surfaceHover,
                            padding: '3px 8px',
                            borderRadius: '12px',
                          }}
                        >
                          {actor.name}
                        </span>
                      ))}
                      {rec.actors.length > 3 && (
                        <span style={{
                          fontSize: '11px',
                          background: currentTheme.background.surfaceHover,
                          padding: '3px 8px',
                          borderRadius: '12px',
                        }}>
                          +{rec.actors.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                  <OpenInNew style={{ fontSize: '18px', opacity: 0.3, alignSelf: 'center' }} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Top Actors Tab */}
      {activeTab === 'top' && (
        <div style={{ padding: '0 20px 100px' }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>Deine meistgesehenen Schauspieler</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {topActors.map((actor, index) => (
              <motion.div
                key={actor.id}
                whileHover={{ scale: 1.01 }}
                onClick={() => setSelectedActor(actor)}
                style={{
                  display: 'flex',
                  gap: '12px',
                  padding: '12px',
                  background: index < 3
                    ? `${currentTheme.primary}22`
                    : currentTheme.background.card,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  border: index < 3
                    ? `1px solid ${currentTheme.primary}44`
                    : `1px solid ${currentTheme.border.default}`,
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: index < 3
                    ? currentTheme.primary
                    : currentTheme.background.surfaceHover,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 700,
                  flexShrink: 0,
                  color: index < 3 ? '#fff' : currentTheme.text.primary,
                }}>
                  {index + 1}
                </div>

                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: actor.profilePath
                    ? `url(${TMDB_IMAGE_BASE}${actor.profilePath})`
                    : currentTheme.primary,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  flexShrink: 0,
                }} />

                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>{actor.name}</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: currentTheme.primary }}>
                    {actor.seriesCount} Serien
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* All actors who appear in multiple series */}
          <h3 style={{ margin: '32px 0 16px 0', fontSize: '16px', color: currentTheme.text.secondary }}>
            Weitere Schauspieler in mehreren deiner Serien
          </h3>
          <HorizontalScrollContainer gap={12}>
            {actors.slice(10, 50).map(actor => (
              <motion.div
                key={actor.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedActor(actor)}
                style={{
                  minWidth: '80px',
                  textAlign: 'center',
                  cursor: 'pointer',
                }}
              >
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  margin: '0 auto 8px',
                  background: actor.profilePath
                    ? `url(${TMDB_IMAGE_BASE}${actor.profilePath})`
                    : currentTheme.primary,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  border: `2px solid ${currentTheme.border.default}`,
                }} />
                <p style={{
                  margin: 0,
                  fontSize: '11px',
                  fontWeight: 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {actor.name.split(' ')[0]}
                </p>
                <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: currentTheme.text.muted }}>
                  {actor.seriesCount} Serien
                </p>
              </motion.div>
            ))}
          </HorizontalScrollContainer>
        </div>
      )}

      {/* Galaxy Map Tab */}
      {activeTab === 'map' && (
        <div style={{ position: 'relative', height: 'calc(100vh - 180px)' }}>
          {/* Zoom Controls */}
          <div style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            zIndex: 50,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}>
            <button onClick={zoomIn} style={zoomButtonStyle}><ZoomIn /></button>
            <button onClick={zoomOut} style={zoomButtonStyle}><ZoomOut /></button>
            <button onClick={resetView} style={{ ...zoomButtonStyle, fontSize: '12px' }}>Reset</button>
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
                      stroke={isHighlighted ? 'rgba(102, 126, 234, 0.7)' : 'rgba(255, 255, 255, 0.05)'}
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
                        background: 'rgba(0, 0, 0, 0.9)',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        whiteSpace: 'nowrap',
                        fontSize: `${12 / transform.scale}px`,
                        fontWeight: 600,
                        pointerEvents: 'none',
                      }}>
                        {actor.name}
                        <div style={{ fontSize: `${10 / transform.scale}px`, opacity: 0.7, marginTop: '2px' }}>
                          {actor.seriesCount} Serien
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            background: 'rgba(0, 0, 0, 0.8)',
            borderRadius: '12px',
            padding: '12px',
            fontSize: '11px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'hsl(45, 80%, 60%)' }} />
              <span>Top 10 Schauspieler</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '16px', height: '2px', background: 'rgba(102, 126, 234, 0.5)' }} />
              <span>Gemeinsame Serie</span>
            </div>
          </div>
        </div>
      )}

      {/* Actor Detail Modal */}
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
              backdropFilter: 'blur(10px)',
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
                background: currentTheme.background.dialog || currentTheme.background.card,
                borderRadius: '24px 24px 0 0',
                padding: '24px',
                width: '100%',
                maxWidth: '500px',
                maxHeight: '80vh',
                overflow: 'auto',
                color: currentTheme.text.primary,
              }}
            >
              {/* Handle bar */}
              <div style={{
                width: '40px',
                height: '4px',
                background: currentTheme.border.default,
                borderRadius: '2px',
                margin: '0 auto 20px',
              }} />

              {/* Actor header */}
              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: selectedActor.profilePath
                    ? `url(${TMDB_IMAGE_BASE}${selectedActor.profilePath})`
                    : currentTheme.primary,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  border: `3px solid ${currentTheme.primary}`,
                  flexShrink: 0,
                }} />
                <div>
                  <h2 style={{ margin: '0 0 8px 0', fontSize: '22px' }}>{selectedActor.name}</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Star style={{ fontSize: '18px', color: '#ffc107' }} />
                    <span style={{ fontSize: '15px' }}>{selectedActor.seriesCount} Serien</span>
                  </div>
                </div>
              </div>

              {/* Series list */}
              <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: currentTheme.text.muted, textTransform: 'uppercase' }}>
                In deiner Sammlung
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                {selectedActor.series.map(series => (
                  <div
                    key={series.id}
                    onClick={() => { setSelectedActor(null); navigate(`/series/${series.id}`); }}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      padding: '10px',
                      background: currentTheme.background.surfaceHover,
                      borderRadius: '10px',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '60px',
                      borderRadius: '6px',
                      background: series.poster
                        ? `url(https://image.tmdb.org/t/p/w92${series.poster})`
                        : currentTheme.background.card,
                      backgroundSize: 'cover',
                      flexShrink: 0,
                    }} />
                    <div>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>{series.title}</p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: currentTheme.text.muted }}>
                        als {series.character}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recommendations */}
              {selectedActor.recommendations && selectedActor.recommendations.length > 0 && (
                <>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: currentTheme.text.muted, textTransform: 'uppercase' }}>
                    Weitere Serien mit {selectedActor.name.split(' ')[0]}
                  </h3>
                  <HorizontalScrollContainer gap={12}>
                    {selectedActor.recommendations.map(rec => (
                      <div
                        key={rec.id}
                        onClick={() => { setSelectedActor(null); navigate(`/series/${rec.id}`); }}
                        style={{ minWidth: '100px', cursor: 'pointer' }}
                      >
                        <div style={{
                          width: '100px',
                          height: '150px',
                          borderRadius: '8px',
                          marginBottom: '8px',
                          background: rec.poster
                            ? `url(${TMDB_IMAGE_BASE}${rec.poster})`
                            : currentTheme.background.card,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          position: 'relative',
                        }}>
                          <div style={{
                            position: 'absolute',
                            top: '6px',
                            right: '6px',
                            background: 'rgba(0, 0, 0, 0.8)',
                            borderRadius: '4px',
                            padding: '2px 6px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px',
                          }}>
                            <Star style={{ fontSize: '10px', color: '#ffc107' }} />
                            <span style={{ fontSize: '10px', color: 'white' }}>{rec.voteAverage.toFixed(1)}</span>
                          </div>
                          <div style={{
                            position: 'absolute',
                            bottom: '6px',
                            right: '6px',
                            background: currentTheme.primary,
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                          }}>
                            <Add style={{ fontSize: '16px' }} />
                          </div>
                        </div>
                        <p style={{
                          margin: 0,
                          fontSize: '12px',
                          fontWeight: 500,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {rec.title}
                        </p>
                      </div>
                    ))}
                  </HorizontalScrollContainer>
                </>
              )}

              {/* Connected actors */}
              {getActorConnections(selectedActor.id).length > 0 && (
                <>
                  <h3 style={{ margin: '24px 0 12px 0', fontSize: '14px', color: currentTheme.text.muted, textTransform: 'uppercase' }}>
                    Spielt zusammen mit
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {getActorConnections(selectedActor.id).slice(0, 8).map(conn => {
                      const otherId = conn.actor1Id === selectedActor.id ? conn.actor2Id : conn.actor1Id;
                      const other = actors.find(a => a.id === otherId);
                      if (!other) return null;

                      return (
                        <div
                          key={otherId}
                          onClick={() => setSelectedActor(other)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 12px',
                            background: `${currentTheme.primary}33`,
                            borderRadius: '20px',
                            cursor: 'pointer',
                          }}
                        >
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: other.profilePath
                              ? `url(${TMDB_IMAGE_BASE}${other.profilePath})`
                              : currentTheme.primary,
                            backgroundSize: 'cover',
                          }} />
                          <span style={{ fontSize: '12px' }}>{other.name}</span>
                          <span style={{ fontSize: '10px', color: currentTheme.text.muted }}>({conn.strength})</span>
                        </div>
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

const zoomButtonStyle: React.CSSProperties = {
  width: '40px',
  height: '40px',
  borderRadius: '10px',
  background: 'rgba(0, 0, 0, 0.7)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
};
