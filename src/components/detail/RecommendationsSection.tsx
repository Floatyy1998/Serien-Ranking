import Add from '@mui/icons-material/Add';
import AutoAwesome from '@mui/icons-material/AutoAwesome';
import Check from '@mui/icons-material/Check';
import Star from '@mui/icons-material/Star';
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContextDef';
import { useDeviceType } from '../../hooks/useDeviceType';
import { useDetailRecommendations } from '../../hooks/useDetailRecommendations';
import { handleImgError } from '../../pages/Discover/discoverItemHelpers';
import type { DiscoverItem } from '../../pages/Discover/discoverItemHelpers';
import { HorizontalScrollContainer } from '../ui/HorizontalScrollContainer';

interface RecommendationsSectionProps {
  id: string | number | undefined;
  mediaType: 'tv' | 'movie';
}

/* ───────────────────  SECTION  ─────────────────── */

export const RecommendationsSection = memo(({ id, mediaType }: RecommendationsSectionProps) => {
  const { isMobile } = useDeviceType();
  const navigate = useNavigate();
  const { items, loading, addingId, addToList } = useDetailRecommendations(id, mediaType);

  if (!loading && items.length === 0) return null;

  const sectionPad = isMobile ? '0 12px 28px' : '0 20px 36px';
  const cardWidth = isMobile ? 138 : 178;

  const navigateTo = (item: DiscoverItem) => {
    const path = item.type === 'series' ? `/series/${item.id}` : `/movie/${item.id}`;
    navigate(path);
  };

  return (
    <section style={{ padding: sectionPad }}>
      <SectionHeader mediaType={mediaType} isMobile={isMobile} />

      {loading && items.length === 0 ? (
        <SkeletonRow cardWidth={cardWidth} count={6} />
      ) : (
        <div style={{ perspective: 1500 }}>
          <HorizontalScrollContainer gap={16} showArrows="desktop">
            {items.map((item, idx) => (
              <MagneticCard
                key={`${item.type}-${item.id}`}
                item={item}
                index={idx}
                width={cardWidth}
                isAdding={addingId === item.id}
                isMobile={isMobile}
                onClick={() => navigateTo(item)}
                onAdd={() => addToList(item)}
              />
            ))}
          </HorizontalScrollContainer>
        </div>
      )}
    </section>
  );
});

RecommendationsSection.displayName = 'RecommendationsSection';

/* ───────────────────  HEADER  ─────────────────── */

const SectionHeader = memo(
  ({ mediaType, isMobile }: { mediaType: 'tv' | 'movie'; isMobile: boolean }) => {
    const { currentTheme } = useTheme();
    return (
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: isMobile ? 16 : 22,
          padding: isMobile ? '10px 12px' : '12px 16px',
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(20px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 14,
        }}
      >
        <div
          style={{
            width: isMobile ? 32 : 36,
            height: isMobile ? 32 : 36,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `linear-gradient(135deg, ${currentTheme.primary}33, ${currentTheme.accent}33)`,
            border: `1px solid ${currentTheme.primary}40`,
          }}
        >
          <AutoAwesome style={{ fontSize: isMobile ? 18 : 20, color: currentTheme.accent }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: isMobile ? 15 : 17,
              fontWeight: 700,
              margin: 0,
              color: currentTheme.text.primary,
              letterSpacing: '-0.01em',
            }}
          >
            Vielleicht auch was für dich
          </h3>
          <p
            style={{
              fontSize: isMobile ? 11 : 12,
              margin: '2px 0 0',
              color: currentTheme.text.muted,
              fontWeight: 500,
            }}
          >
            {mediaType === 'tv' ? 'Ähnliche Serien' : 'Ähnliche Filme'} – noch nicht in deiner Liste
          </p>
        </div>
      </header>
    );
  }
);

SectionHeader.displayName = 'SectionHeader';

/* ───────────────────  MAGNETIC CARD  ─────────────────── */

interface MagneticCardProps {
  item: DiscoverItem;
  index: number;
  width: number;
  isAdding: boolean;
  isMobile: boolean;
  onClick: () => void;
  onAdd: () => Promise<boolean>;
}

const MAX_DIST = 480; // px – Radius in dem die Welle wirkt
const MAX_TILT = 18; // Grad
const MAX_LIFT = 14; // px
const TOP_RESERVE = 18; // px Padding oben/unten – damit der Lift nicht abgeschnitten wird

const MagneticCard = memo(
  ({ item, index, width, isAdding, isMobile, onClick, onAdd }: MagneticCardProps) => {
    const { currentTheme } = useTheme();
    const ref = useRef<HTMLDivElement>(null);
    const [hovered, setHovered] = useState(false);
    const [justAdded, setJustAdded] = useState(false);

    // Raw motion values
    const rawRotateX = useMotionValue(0);
    const rawRotateY = useMotionValue(0);
    const rawLift = useMotionValue(0);
    const rawIntensity = useMotionValue(0);

    // Smooth springs
    const spring = { stiffness: 240, damping: 24, mass: 0.4 };
    const rotateX = useSpring(rawRotateX, spring);
    const rotateY = useSpring(rawRotateY, spring);
    const lift = useSpring(rawLift, spring);
    const intensity = useSpring(rawIntensity, { stiffness: 180, damping: 26 });

    // Box-Shadow als motion template – kein React-Rerender pro Frame
    const [r, g, b] = useMemo(() => hexToRgb(currentTheme.primary), [currentTheme.primary]);
    const [ar, ag, ab] = useMemo(() => hexToRgb(currentTheme.accent), [currentTheme.accent]);
    const shadowOffsetY = useTransform(intensity, [0, 1], [10, 46]);
    const shadowBlur = useTransform(intensity, [0, 1], [22, 80]);
    const shadowAlpha = useTransform(intensity, [0, 1], [0.5, 0.8]);
    const glowBlur = useTransform(intensity, [0, 1], [0, 84]);
    const glowAlphaMV = useTransform(intensity, [0, 1], [0, 0.9]);
    const ringAlpha = useTransform(intensity, [0, 1], [0.06, 0.65]);
    const boxShadow = useMotionTemplate`0 ${shadowOffsetY}px ${shadowBlur}px -14px rgba(0,0,0,${shadowAlpha}), 0 0 ${glowBlur}px -8px rgba(${r},${g},${b},${glowAlphaMV}), 0 0 0 1.5px rgba(${ar},${ag},${ab},${ringAlpha})`;

    // Window-level mouse listener mit rAF-Throttle
    useEffect(() => {
      if (isMobile) return;

      let pendingX = -99999;
      let pendingY = -99999;
      let scheduled = false;

      const apply = () => {
        scheduled = false;
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        // Skip wenn Card komplett außerhalb des Viewports → spart Arbeit beim Scrollen
        if (
          rect.right < 0 ||
          rect.left > window.innerWidth ||
          rect.bottom < 0 ||
          rect.top > window.innerHeight
        ) {
          if (rawIntensity.get() !== 0) {
            rawRotateX.set(0);
            rawRotateY.set(0);
            rawLift.set(0);
            rawIntensity.set(0);
          }
          return;
        }
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = pendingX - cx;
        const dy = pendingY - cy;
        const dist = Math.hypot(dx, dy);
        const t = Math.max(0, 1 - dist / MAX_DIST);
        const i = t * t * (3 - 2 * t); // smoothstep
        const nx = clamp(dx / (rect.width * 1.1), -1, 1);
        const ny = clamp(dy / (rect.height * 1.1), -1, 1);
        rawRotateY.set(nx * MAX_TILT * i);
        rawRotateX.set(-ny * MAX_TILT * i);
        rawLift.set(-i * MAX_LIFT);
        rawIntensity.set(i);
      };

      const onMove = (e: MouseEvent) => {
        pendingX = e.clientX;
        pendingY = e.clientY;
        if (!scheduled) {
          scheduled = true;
          requestAnimationFrame(apply);
        }
      };
      const onLeave = () => {
        pendingX = -99999;
        pendingY = -99999;
        if (!scheduled) {
          scheduled = true;
          requestAnimationFrame(apply);
        }
      };

      window.addEventListener('mousemove', onMove, { passive: true });
      document.addEventListener('mouseleave', onLeave);
      return () => {
        window.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseleave', onLeave);
      };
    }, [isMobile, rawRotateX, rawRotateY, rawLift, rawIntensity]);

    const title = item.title || item.name || '';
    const year =
      item.release_date || item.first_air_date
        ? new Date(item.release_date || item.first_air_date || '').getFullYear()
        : null;
    const rating = item.vote_average > 0 ? item.vote_average.toFixed(1) : null;
    const poster = item.poster_path
      ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
      : '/placeholder.jpg';

    const handleAdd = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isAdding || justAdded) return;
      setJustAdded(true);
      const ok = await onAdd();
      if (!ok) setJustAdded(false);
    };

    const showAddButton = hovered || justAdded || isMobile;

    return (
      <motion.div
        onClick={onClick}
        whileTap={{ scale: 0.97 }}
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '0px 0px -40px 0px' }}
        transition={{
          duration: 0.5,
          delay: Math.min(index * 0.05, 0.6),
          ease: [0.25, 0.1, 0.25, 1],
        }}
        style={{
          flexShrink: 0,
          width,
          cursor: 'pointer',
          scrollSnapAlign: 'start',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          // Reserve oben/unten damit Lift + Tilt nicht vom Scroll-Container abgeschnitten werden
          paddingTop: TOP_RESERVE,
          paddingBottom: TOP_RESERVE,
        }}
      >
        <motion.div
          ref={ref}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '2 / 3',
            borderRadius: 16,
            overflow: 'hidden',
            background: '#0a0e1a',
            transformStyle: 'preserve-3d',
            rotateX: isMobile ? 0 : rotateX,
            rotateY: isMobile ? 0 : rotateY,
            y: isMobile ? 0 : lift,
            willChange: 'transform',
            boxShadow,
          }}
        >
          <img
            src={poster}
            alt={title}
            loading="lazy"
            decoding="async"
            onError={handleImgError}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />

          {/* Sehr dezenter Top-Edge-Sheen für plastischen Look */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.10) 0%, transparent 14%, transparent 86%, rgba(0,0,0,0.18) 100%)',
              pointerEvents: 'none',
              mixBlendMode: 'soft-light',
            }}
          />

          {/* Hover-Vignette für Add-Button-Lesbarkeit */}
          <motion.div
            aria-hidden
            initial={false}
            animate={{ opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.25 }}
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(ellipse at top right, rgba(0,0,0,0.45), transparent 55%)',
              pointerEvents: 'none',
            }}
          />

          <AnimatePresence>
            {showAddButton && (
              <motion.button
                onClick={handleAdd}
                disabled={isAdding || justAdded}
                aria-label="Zur Liste hinzufügen"
                initial={{ opacity: 0, y: -4, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.85 }}
                transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.92 }}
                style={{
                  position: 'absolute',
                  top: 9,
                  right: 9,
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  border: justAdded
                    ? `1px solid ${currentTheme.status.success}aa`
                    : '1px solid rgba(255, 255, 255, 0.22)',
                  background: justAdded
                    ? `${currentTheme.status.success}cc`
                    : 'rgba(0, 0, 0, 0.55)',
                  backdropFilter: 'blur(18px) saturate(1.6)',
                  WebkitBackdropFilter: 'blur(18px) saturate(1.6)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isAdding ? 'wait' : 'pointer',
                  padding: 0,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                  opacity: isAdding ? 0.65 : 1,
                  zIndex: 4,
                }}
              >
                {justAdded ? <Check style={{ fontSize: 16 }} /> : <Add style={{ fontSize: 17 }} />}
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        <div style={{ paddingInline: 2, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              lineHeight: 1.3,
              letterSpacing: '-0.01em',
              color: currentTheme.text.primary,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </div>
          {(year || rating) && (
            <div
              style={{
                marginTop: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11.5,
                color: currentTheme.text.muted,
                fontWeight: 500,
                letterSpacing: '0.01em',
              }}
            >
              {year && <span>{year}</span>}
              {year && rating && <Dot />}
              {rating && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                  <Star style={{ fontSize: 11, color: currentTheme.accent }} />
                  {rating}
                </span>
              )}
            </div>
          )}
        </div>
      </motion.div>
    );
  }
);

MagneticCard.displayName = 'MagneticCard';

const Dot = () => (
  <span
    style={{
      width: 3,
      height: 3,
      borderRadius: '50%',
      background: 'currentColor',
      opacity: 0.6,
      display: 'inline-block',
    }}
  />
);

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const hexToRgb = (hex: string): [number, number, number] => {
  const cleaned = hex.replace('#', '').trim();
  if (cleaned.length === 3) {
    return [
      parseInt(cleaned[0] + cleaned[0], 16),
      parseInt(cleaned[1] + cleaned[1], 16),
      parseInt(cleaned[2] + cleaned[2], 16),
    ];
  }
  return [
    parseInt(cleaned.slice(0, 2), 16) || 0,
    parseInt(cleaned.slice(2, 4), 16) || 0,
    parseInt(cleaned.slice(4, 6), 16) || 0,
  ];
};

/* ───────────────────  SKELETON  ─────────────────── */

const shimmerBg =
  'linear-gradient(110deg, rgba(255,255,255,0.04) 30%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.04) 70%)';

const SkeletonRow = memo(({ cardWidth, count }: { cardWidth: number; count: number }) => (
  <div style={{ display: 'flex', gap: 16, overflow: 'hidden' }}>
    {Array.from({ length: count }).map((_, idx) => (
      <SkeletonCard key={idx} width={cardWidth} />
    ))}
    <style>{`
      @keyframes recShimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `}</style>
  </div>
));

SkeletonRow.displayName = 'SkeletonRow';

const SkeletonCard = memo(({ width }: { width: number }) => (
  <div
    style={{
      flexShrink: 0,
      width,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}
  >
    <div
      style={{
        width: '100%',
        aspectRatio: '2 / 3',
        borderRadius: 16,
        background: shimmerBg,
        backgroundSize: '200% 100%',
        animation: 'recShimmer 1.4s ease-in-out infinite',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.06)',
      }}
    />
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingInline: 2 }}>
      <div
        style={{
          height: 12,
          width: '85%',
          borderRadius: 4,
          background: shimmerBg,
          backgroundSize: '200% 100%',
          animation: 'recShimmer 1.4s ease-in-out infinite',
        }}
      />
      <div
        style={{
          height: 10,
          width: '55%',
          borderRadius: 4,
          background: shimmerBg,
          backgroundSize: '200% 100%',
          animation: 'recShimmer 1.4s ease-in-out infinite',
        }}
      />
    </div>
  </div>
));

SkeletonCard.displayName = 'SkeletonCard';
