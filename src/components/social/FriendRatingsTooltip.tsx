import Tooltip from '@mui/material/Tooltip';
import { useState } from 'react';
import { useOptimizedFriends } from '../../contexts/OptimizedFriendsContext';
import { useDeviceType } from '../../hooks/platform/useDeviceType';
import { t } from '../../services/i18n';
import { FriendRatingsPanel } from './FriendRatingsPanel';

interface FriendRatingsTooltipProps {
  itemId: number | string | undefined;
  mediaType: 'series' | 'movie';
  children: React.ReactElement;
}

/**
 * Zeigt die Bewertungen der Favoriten beim Überfahren — nur am Zeiger-Gerät.
 * Am Handy übernimmt der Freundes-Reiter im Bewertungs-Sheet, das beim Antippen
 * desselben Sterns ohnehin aufgeht; ein Touch-Tooltip würde mit diesem Tipp
 * kollidieren. Geladen wird erst beim Aufklappen.
 */
export const FriendRatingsTooltip: React.FC<FriendRatingsTooltipProps> = ({
  itemId,
  mediaType,
  children,
}) => {
  const { isMobile } = useDeviceType();
  const { favoriteFriends } = useOptimizedFriends();
  const [open, setOpen] = useState(false);

  if (isMobile || favoriteFriends.length === 0 || itemId === undefined) return children;

  return (
    <Tooltip
      arrow
      enterDelay={400}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      // Touch-Auslöser aus: der Tipp gehört dem Bewerten.
      disableTouchListener
      title={
        <div style={{ minWidth: 220, padding: '4px 2px' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              opacity: 0.7,
              marginBottom: '8px',
            }}
          >
            {t('Deine Favoriten')}
          </div>
          <FriendRatingsPanel itemId={itemId} mediaType={mediaType} active={open} />
        </div>
      }
      slotProps={{ tooltip: { sx: { maxWidth: 320, p: 1.2 } } }}
    >
      {children}
    </Tooltip>
  );
};
