import { Notifications } from '@mui/icons-material';
import { Badge } from '@mui/material';
import { motion } from 'framer-motion';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContextDef';

interface HeaderActionsProps {
  totalUnreadBadge: number;
  onNotificationsOpen: () => void;
  photoURL: string | undefined | null;
}

export const HeaderActions = React.memo(function HeaderActions({
  totalUnreadBadge,
  onNotificationsOpen,
  photoURL,
}: HeaderActionsProps) {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();

  const bellButton = (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onNotificationsOpen}
      style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        background: `${currentTheme.primary}1A`,
        border: `1px solid ${currentTheme.primary}33`,
        color: currentTheme.text.primary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      <Notifications style={{ fontSize: 20 }} />
    </motion.button>
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {totalUnreadBadge > 0 ? (
        <Badge
          badgeContent={totalUnreadBadge}
          color="error"
          sx={{
            '& .MuiBadge-badge': {
              background: `linear-gradient(135deg, ${currentTheme.status?.error || '#ef4444'} 0%, ${currentTheme.status?.error || '#ef4444'} 100%)`,
            },
          }}
        >
          {bellButton}
        </Badge>
      ) : (
        bellButton
      )}

      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate('/profile')}
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: photoURL ? `url(${photoURL}) center/cover` : `${currentTheme.primary}30`,
          border: `2px solid ${currentTheme.primary}`,
          cursor: 'pointer',
        }}
      />
    </div>
  );
});
