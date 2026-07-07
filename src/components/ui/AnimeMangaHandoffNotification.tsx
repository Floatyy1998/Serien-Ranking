import { Close, MenuBook } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useMangaList } from '../../contexts/MangaListContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getOptimalTextColor } from '../../theme/colorUtils';
import { hapticTap } from '../../lib/haptics';
import { tapScale } from '../../lib/motion';
import {
  markAnimeMangaHandoffDismissed,
  type AnimeMangaHandoff,
} from '../../services/detection/animeMangaHandoffDetection';

interface AnimeMangaHandoffNotificationProps {
  handoffs: AnimeMangaHandoff[];
  /** Kategorie aus der Ansicht nehmen, wenn alle Handoffs abgearbeitet sind. */
  onDismiss: () => void;
}

/**
 * F9 „Manga-Anschluss": zeigt eine Karte, wenn der Nutzer eine Anime-Staffel
 * durch hat, für die ein Quell-Manga bekannt ist — „lies den Manga weiter ab
 * ~Kapitel X" (KI-Schätzung, klar gelabelt). Ein-Karte-Muster (kein Carousel);
 * bei mehreren Anschlüssen wird nach dem Wegtippen der nächste gezeigt.
 */
export const AnimeMangaHandoffNotification: React.FC<AnimeMangaHandoffNotificationProps> = ({
  handoffs,
  onDismiss,
}) => {
  const { user } = useAuth() || {};
  const { currentTheme } = useTheme();
  const { mangaList } = useMangaList();
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);

  const safeIndex = handoffs.length > 0 ? Math.min(index, handoffs.length - 1) : 0;
  const h = handoffs[safeIndex];
  if (!h) return null;

  const accent = currentTheme.accent || currentTheme.primary;
  const onPrimary = getOptimalTextColor(currentTheme.primary);
  const tracked = mangaList.some((m) => m.anilistId === h.mangaId);
  const remaining = handoffs.length - safeIndex - 1;

  const persistDismiss = () => {
    if (user) void markAnimeMangaHandoffDismissed(user.uid, h.series.id, h.seasonNumber);
  };
  const advanceOrClose = () => {
    if (safeIndex + 1 < handoffs.length) setIndex(safeIndex + 1);
    else onDismiss();
  };
  const handleDismiss = () => {
    hapticTap();
    persistDismiss();
    advanceOrClose();
  };
  const handleGoToManga = () => {
    hapticTap();
    persistDismiss();
    navigate(`/manga/${h.mangaId}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        position: 'relative',
        padding: '16px 18px',
        borderRadius: 'var(--radius-lg)',
        background: `linear-gradient(145deg, ${currentTheme.background.surface}, ${currentTheme.background.default})`,
        border: `1px solid ${accent}44`,
        boxShadow: 'var(--shadow-md)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <MenuBook style={{ fontSize: 18, color: accent }} />
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.6px',
            textTransform: 'uppercase',
            color: accent,
            flex: 1,
          }}
        >
          Manga-Anschluss
        </span>
        <motion.button
          whileTap={tapScale}
          onClick={handleDismiss}
          aria-label="Benachrichtigung schließen"
          style={{
            display: 'flex',
            border: 'none',
            background: 'transparent',
            color: currentTheme.text.muted,
            cursor: 'pointer',
            padding: 4,
          }}
        >
          <Close style={{ fontSize: 18 }} />
        </motion.button>
      </div>

      <h3
        style={{
          margin: '0 0 4px',
          fontSize: 16,
          fontWeight: 700,
          fontFamily: 'var(--font-display)',
          color: currentTheme.text.primary,
          lineHeight: 1.25,
        }}
      >
        Staffel {h.seasonNumber} von {h.series.title} durch! 🎉
      </h3>
      <p
        style={{
          margin: '0 0 14px',
          fontSize: 13,
          color: currentTheme.text.secondary,
          lineHeight: 1.45,
        }}
      >
        Lies <strong style={{ color: currentTheme.text.primary }}>{h.mangaTitle}</strong> weiter —
        der Anime endet ca. bei Kapitel {h.estimatedChapter}.{' '}
        <span style={{ color: currentTheme.text.muted, fontStyle: 'italic' }}>(KI-Schätzung)</span>
      </p>

      {/* Aktionen */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <motion.button
          whileTap={tapScale}
          onClick={handleGoToManga}
          style={{
            flex: 1,
            minHeight: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            border: 'none',
            borderRadius: 'var(--radius-md)',
            background: currentTheme.primary,
            color: onPrimary,
            fontSize: 14,
            fontWeight: 700,
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        >
          <MenuBook style={{ fontSize: 18 }} />
          {tracked ? 'Weiterlesen' : 'Zum Manga'}
        </motion.button>
        <motion.button
          whileTap={tapScale}
          onClick={handleDismiss}
          style={{
            minHeight: 44,
            padding: '0 18px',
            border: `1px solid ${currentTheme.border.default}`,
            borderRadius: 'var(--radius-md)',
            background: 'transparent',
            color: currentTheme.text.secondary,
            fontSize: 14,
            fontWeight: 500,
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        >
          Später
        </motion.button>
      </div>

      {remaining > 0 && (
        <p
          style={{
            margin: '10px 0 0',
            fontSize: 11,
            color: currentTheme.text.muted,
            textAlign: 'center',
          }}
        >
          +{remaining} {remaining === 1 ? 'weiterer Anschluss' : 'weitere Anschlüsse'}
        </p>
      )}
    </motion.div>
  );
};
