import Send from '@mui/icons-material/Send';
import { Tooltip } from '@mui/material';
import { motion } from 'framer-motion';
import { useState } from 'react';
import type { RecommendationMediaType } from '../../types/Recommendation';
import { RecommendSheet } from './RecommendSheet';
import { tapScale } from '../../lib/motion';

interface RecommendButtonProps {
  media: {
    id: number;
    type: RecommendationMediaType;
    title: string;
    posterPath?: string;
    backdropPath?: string;
  };
  iconSize?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const RecommendButton: React.FC<RecommendButtonProps> = ({
  media,
  iconSize = 18,
  className,
  style,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tooltip title="An Freund empfehlen" arrow>
        <motion.button
          whileTap={tapScale}
          onClick={() => setOpen(true)}
          className={className}
          aria-label="An Freund empfehlen"
          // Bewusst NEUTRAL wie die anderen Sekundär-Buttons — Farbe ist in
          // der Toolbar Zustands-Signal (aktiv/destruktiv), kein Dauer-Akzent.
          style={{ ...style }}
        >
          <Send style={{ fontSize: iconSize }} />
        </motion.button>
      </Tooltip>
      <RecommendSheet isOpen={open} onClose={() => setOpen(false)} media={media} />
    </>
  );
};
