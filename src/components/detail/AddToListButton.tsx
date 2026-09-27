import PlaylistAdd from '@mui/icons-material/PlaylistAdd';
import PlaylistAddCheck from '@mui/icons-material/PlaylistAddCheck';
import { Tooltip } from '@mui/material';
import { motion } from 'framer-motion';
import type React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { openMediaActions } from '../../features/mediaActions/openMediaActions';
import { useRatingFolders } from '../../hooks/rating/useRatingFolders';
import type { MediaTarget } from '../../lib/interaction/mediaTarget';
import { tapScale } from '../../lib/motion';
import { folderItemKey } from '../../lib/rating/ratingFolders';
import { t } from '../../services/i18n';
import './AddToListButton.css';

export const AddToListButton = ({
  target,
  className,
  iconSize,
  style,
}: {
  target: MediaTarget;
  className: string;
  iconSize: number;
  style?: React.CSSProperties;
}) => {
  const { currentTheme } = useTheme();
  const { folders } = useRatingFolders();
  const key = folderItemKey(target.type, target.id);
  const count = folders.filter((f) => f.items.has(key)).length;
  const label =
    count === 0
      ? t('Zu Liste hinzufügen')
      : count === 1
        ? t('in 1 Liste')
        : t('in {n} Listen', { n: count });

  return (
    <Tooltip title={label} arrow>
      <motion.button
        type="button"
        whileTap={tapScale}
        onClick={() => openMediaActions(target, 'folders')}
        className={`${className} add-to-list-btn`}
        aria-label={label}
        style={
          count > 0
            ? {
                ...style,
                color: currentTheme.primary,
                borderColor: `${currentTheme.primary}33`,
                background: `${currentTheme.primary}0d`,
              }
            : style
        }
      >
        {count > 0 ? (
          <PlaylistAddCheck style={{ fontSize: iconSize }} />
        ) : (
          <PlaylistAdd style={{ fontSize: iconSize }} />
        )}
        {count > 1 && (
          <span
            className="add-to-list-btn__count"
            style={{ background: currentTheme.primary, color: currentTheme.background.default }}
          >
            {count}
          </span>
        )}
      </motion.button>
    </Tooltip>
  );
};
