/**
 * ShareCardSheet - Bottom-Sheet mit Karten-Vorschau + „Teilen"-Button.
 *
 * Zeigt die 1080×1920-ShareCard per transform: scale() verkleinert an und
 * exportiert beim Teilen den unskalierten Karten-Knoten als PNG.
 *
 * CORS-Fallback: schlägt der Export fehl (z. B. TMDB-Poster/Avatare nicht
 * einbettbar), wird die Karte einmal OHNE externe Bilder neu gerendert und
 * der Export wiederholt; erst danach gibt es einen Fehler-Toast.
 */

import { IosShare } from '@mui/icons-material';
import { CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';
import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { hapticError, hapticTap } from '../../lib/haptics';
import { tapScale } from '../../lib/motion';
import { exportNodeAsImage, shareOrDownload } from '../../services/share/shareCard';
import { showToast } from '../../lib/toast';
import { BottomSheet } from '../ui';
import { SHARE_CARD_HEIGHT, SHARE_CARD_WIDTH } from './ShareCardFrame';

/** Vorschau-Maßstab: 1080×1920 → 216×384, passt auch auf kleine Phones. */
const PREVIEW_SCALE = 0.2;

interface ShareCardSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** Überschrift im Sheet (z. B. „Stats teilen"). */
  sheetTitle: string;
  /** Dateiname des exportierten PNGs. */
  filename: string;
  /** Begleittext für navigator.share. */
  shareText: string;
  /** Rendert die Karte; bei showImages=false ohne externe Bilder (CORS-Fallback). */
  renderCard: (showImages: boolean) => React.ReactNode;
}

export const ShareCardSheet: React.FC<ShareCardSheetProps> = ({
  isOpen,
  onClose,
  sheetTitle,
  filename,
  shareText,
  renderCard,
}) => {
  const { currentTheme } = useTheme();
  const cardRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);
  const [showImages, setShowImages] = useState(true);

  // Beim Öffnen wieder mit Bildern starten (Fallback-Zustand zurücksetzen).
  useEffect(() => {
    if (isOpen) setShowImages(true);
  }, [isOpen]);

  const doExport = async (): Promise<void> => {
    if (!cardRef.current) throw new Error('Karte nicht gerendert');
    const blob = await exportNodeAsImage(cardRef.current, filename);
    await shareOrDownload(blob, filename, shareText);
  };

  const handleShare = async () => {
    if (sharing) return;
    hapticTap();
    setSharing(true);
    try {
      await doExport();
    } catch {
      if (showImages) {
        // Externe Bilder (Poster/Avatare) könnten der Grund sein:
        // Karte ohne Bilder neu rendern und einmal erneut versuchen.
        setShowImages(false);
        await new Promise((resolve) => setTimeout(resolve, 120));
        try {
          await doExport();
        } catch {
          hapticError();
          showToast('Bild konnte nicht erstellt werden', 2500, 'error');
        }
      } else {
        hapticError();
        showToast('Bild konnte nicht erstellt werden', 2500, 'error');
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} ariaLabel={sheetTitle} maxWidth="480px">
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-4)',
          padding: '0 var(--space-5) var(--space-2)',
          overflowY: 'auto',
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            fontFamily: 'var(--font-display)',
            color: currentTheme.text.secondary,
          }}
        >
          {sheetTitle}
        </h2>

        {/* Vorschau: Karte in Originalgröße, per scale verkleinert */}
        <div
          style={{
            width: SHARE_CARD_WIDTH * PREVIEW_SCALE,
            height: SHARE_CARD_HEIGHT * PREVIEW_SCALE,
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            border: '1px solid var(--glass-border-medium)',
            boxShadow: 'var(--shadow-lg, 0 12px 40px rgba(0, 0, 0, 0.4))',
            flexShrink: 0,
          }}
        >
          <div style={{ transform: `scale(${PREVIEW_SCALE})`, transformOrigin: 'top left' }}>
            {/* Dieser unskalierte Knoten wird exportiert */}
            <div ref={cardRef}>{renderCard(showImages)}</div>
          </div>
        </div>

        <motion.button
          type="button"
          whileTap={tapScale}
          onClick={handleShare}
          disabled={sharing}
          aria-label="Karte als Bild teilen"
          aria-busy={sharing}
          style={{
            width: '100%',
            minHeight: 52,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-2)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            background: sharing
              ? `linear-gradient(135deg, ${currentTheme.primary}99, ${currentTheme.accent}99)`
              : `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
            color: currentTheme.background.default,
            fontSize: 16,
            fontWeight: 700,
            fontFamily: 'var(--font-display)',
            letterSpacing: '-0.01em',
            cursor: sharing ? 'wait' : 'pointer',
            boxShadow: `0 8px 24px ${currentTheme.primary}35`,
          }}
        >
          {sharing ? (
            <>
              <CircularProgress size={20} sx={{ color: currentTheme.background.default }} />
              <span>Bild wird erstellt…</span>
            </>
          ) : (
            <>
              <IosShare style={{ fontSize: 20 }} />
              <span>Teilen</span>
            </>
          )}
        </motion.button>
      </div>
    </BottomSheet>
  );
};
