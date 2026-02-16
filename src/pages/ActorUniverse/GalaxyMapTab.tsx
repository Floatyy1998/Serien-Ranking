import { ZoomIn, ZoomOut } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Actor, ActorConnection } from '../../hooks/useActorUniverse';
import { useActorPanZoom } from './useActorPanZoom';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w185';

interface GalaxyMapTabProps {
  actors: Actor[];
  connections: ActorConnection[];
  hoveredActor: Actor | null;
  onHoverActor: (actor: Actor | null) => void;
  onSelectActor: (actor: Actor) => void;
  getActorConnections: (actorId: number) => ActorConnection[];
}

export const GalaxyMapTab = ({
  actors,
  connections,
  hoveredActor,
  onHoverActor,
  onSelectActor,
  getActorConnections,
}: GalaxyMapTabProps) => {
  const { currentTheme } = useTheme();
  const {
    canvasRef,
    transform,
    isDragging,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleWheel,
    zoomIn,
    zoomOut,
    resetView,
  } = useActorPanZoom();

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

  return (
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
          { action: zoomIn, icon: <ZoomIn />, isText: false, tooltip: 'Hineinzoomen' },
          { action: zoomOut, icon: <ZoomOut />, isText: false, tooltip: 'Herauszoomen' },
          { action: resetView, icon: 'Reset', isText: true, tooltip: 'Ansicht zurücksetzen' },
        ].map((btn, idx) => (
          <Tooltip key={idx} title={btn.tooltip} arrow placement="left">
            <motion.button
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
          </Tooltip>
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
                onClick={(e) => { e.stopPropagation(); onSelectActor(actor); }}
                onMouseEnter={() => onHoverActor(actor)}
                onMouseLeave={() => onHoverActor(null)}
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
  );
};
