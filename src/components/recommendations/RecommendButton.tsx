import Send from '@mui/icons-material/Send';
import { Tooltip } from '@mui/material';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContextDef';
import type { RecommendationMediaType } from '../../types/Recommendation';
import { RecommendSheet } from './RecommendSheet';

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
  const { currentTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tooltip title="An Freund empfehlen" arrow>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => setOpen(true)}
          className={className}
          aria-label="An Freund empfehlen"
          style={{
            color: currentTheme.primary,
            borderColor: `${currentTheme.primary}33`,
            background: `${currentTheme.primary}10`,
            ...style,
          }}
        >
          <Send style={{ fontSize: iconSize }} />
        </motion.button>
      </Tooltip>
      <RecommendSheet isOpen={open} onClose={() => setOpen(false)} media={media} />
    </>
  );
};
