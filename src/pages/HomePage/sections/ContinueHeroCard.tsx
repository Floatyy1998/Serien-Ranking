import { Check, PlayArrow } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTheme } from '../../../contexts/ThemeContextDef';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import { getOptimalTextColor } from '../../../theme/colorUtils';
import { getImageUrl } from '../../../utils/imageUrl';
import { hapticSuccess, hapticTap } from '../../../lib/haptics';
import { tapScale } from '../../../lib/motion';
import { chipColor, chipLabel, type EpisodeChipType } from '../../../utils/episodeChips';

/**
 * Kanonische „Weiterschauen"-Hero-Karte (D6). Ein dominantes Muster für die
 * häufigste Aktion — die zuletzt gesehene Serie fortsetzen. Bewusst
 * präsentationsrein + datenagnostisch, damit sie auf Home/WatchNext/CatchUp
 * identisch wiederverwendet werden kann.
 */
export interface ContinueHeroItem {
  id: number;
  title: string;
  poster: string;
  progress: number;
  nextEpisode: { seasonNumber: number; episodeNumber: number; name: string };
  chipType?: EpisodeChipType;
}

interface ContinueHeroCardProps {
  item: ContinueHeroItem;
  /** Öffnet die Folge (Poster-Navigation). */
  onOpen: (item: ContinueHeroItem) => void;
  /** Markiert die nächste Folge als gesehen (gleiche Pipeline wie Swipe). */
  onMarkWatched: (item: ContinueHeroItem) => void;
}

export const ContinueHeroCard: React.FC<ContinueHeroCardProps> = ({
  item,
  onOpen,
  onMarkWatched,
}) => {
  const { currentTheme } = useTheme();
  const shouldReduceMotion = useReducedMotion();
  const primary = currentTheme.primary;
  const accent = currentTheme.accent || primary;
  const onPrimary = getOptimalTextColor(primary);

  const poster = getImageUrl(item.poster, 'w500');
  const nextLabel = `S${item.nextEpisode.seasonNumber} E${item.nextEpisode.episodeNumber}`;

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'relative',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-cinematic)',
        border: `1px solid ${currentTheme.border.default}`,
        minHeight: 168,
        display: 'flex',
      }}
    >
      {/* Backdrop = poster, gedimmt für Textkontrast */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${poster})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 20%',
          filter: 'saturate(1.1)',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(90deg, ${currentTheme.background.default}f2 0%, ${currentTheme.background.default}d9 45%, ${currentTheme.background.default}55 100%)`,
        }}
      />

      {/* Inhalt */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          gap: 10,
          padding: 16,
          width: '100%',
        }}
      >
        <div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
              color: accent,
            }}
          >
            Weiterschauen
          </span>
          <h2
            style={{
              margin: '4px 0 2px',
              fontSize: 22,
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              fontFamily: 'var(--font-display)',
              color: currentTheme.text.primary,
              textShadow: '0 2px 12px rgba(0,0,0,0.6)',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {item.title}
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              fontWeight: 500,
              color: currentTheme.text.secondary,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {nextLabel} · {item.nextEpisode.name}
            {item.chipType && (
              <span
                style={{
                  marginLeft: 6,
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '1px 5px',
                  borderRadius: 4,
                  background: `${chipColor(item.chipType)}22`,
                  color: chipColor(item.chipType),
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                }}
              >
                {chipLabel(item.chipType)}
              </span>
            )}
          </p>
        </div>

        {/* Fortschritt */}
        <div
          style={{
            height: 5,
            background: currentTheme.border.default,
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${item.progress}%`,
              background: `linear-gradient(90deg, ${primary}, ${accent})`,
              boxShadow: `0 0 8px ${primary}80`,
            }}
          />
        </div>

        {/* Aktionen */}
        <div style={{ display: 'flex', gap: 8 }}>
          <motion.button
            whileTap={tapScale}
            onClick={() => {
              hapticTap();
              onOpen(item);
            }}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              minHeight: 44,
              border: 'none',
              borderRadius: 'var(--radius-md)',
              background: primary,
              color: onPrimary,
              fontSize: 14,
              fontWeight: 700,
              fontFamily: 'inherit',
              cursor: 'pointer',
              boxShadow: `0 4px 16px -4px ${primary}80`,
            }}
          >
            <PlayArrow style={{ fontSize: 20 }} />
            Ansehen
          </motion.button>
          <motion.button
            whileTap={tapScale}
            onClick={() => {
              hapticSuccess();
              onMarkWatched(item);
            }}
            aria-label={`${nextLabel} als gesehen markieren`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              minWidth: 44,
              minHeight: 44,
              padding: '0 16px',
              border: `1px solid ${currentTheme.border.default}`,
              borderRadius: 'var(--radius-md)',
              background: currentTheme.background.surface,
              color: currentTheme.text.primary,
              fontSize: 14,
              fontWeight: 600,
              fontFamily: 'inherit',
              cursor: 'pointer',
              backdropFilter: 'var(--blur-sm)',
            }}
          >
            <Check style={{ fontSize: 20 }} />
            Gesehen
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
