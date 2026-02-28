import { useState, useEffect } from 'react';
import { Badge, IconButton, Tooltip, keyframes } from '@mui/material';
import { EmojiEvents } from '@mui/icons-material';
import { useBadges } from './BadgeProvider';

const pulseAnimation = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
`;

const BadgeButton = () => {
  const { showBadgeOverview, newBadges } = useBadges();
  const [animate, setAnimate] = useState(false);

  // Animiere Button wenn neue Badges da sind
  useEffect(() => {
    if (newBadges.length > 0) {
      setAnimate(true);
      const timer = setTimeout(() => setAnimate(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [newBadges.length]);

  return (
    <Tooltip title="Meine Badges ansehen" arrow>
      <IconButton
        onClick={showBadgeOverview}
        sx={{
          color: '#ffd700',
          animation: animate ? `${pulseAnimation} 1s ease-in-out infinite` : 'none',
          '&:hover': {
            color: '#ffed4e',
            transform: 'scale(1.1)',
            transition: 'all 0.2s ease',
          },
        }}
      >
        <Badge
          badgeContent={newBadges.length > 0 ? newBadges.length : undefined}
          color="error"
          sx={{
            '& .MuiBadge-badge': {
              backgroundColor: '#ff4444',
              color: 'white',
              fontWeight: 'bold',
            },
          }}
        >
          <EmojiEvents sx={{ fontSize: 28 }} />
        </Badge>
      </IconButton>
    </Tooltip>
  );
};

export default BadgeButton;
