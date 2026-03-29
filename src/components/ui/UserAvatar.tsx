import { Person } from '@mui/icons-material';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContextDef';

interface UserAvatarProps {
  userId: string;
  username: string;
  photoURL?: string;
  size?: number;
  navigable?: boolean;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  userId,
  username,
  photoURL,
  size = 40,
  navigable = true,
}) => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();

  const iconSize = Math.round(size * 0.5);
  const borderColor = size >= 36 ? `${currentTheme.primary}40` : currentTheme.border.default;

  const handleClick = () => {
    if (navigable) navigate(`/friend/${userId}`);
  };

  return (
    <button
      onClick={handleClick}
      aria-label={`Profil von ${username} anzeigen`}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        flexShrink: 0,
        cursor: navigable ? 'pointer' : 'default',
        border: `2px solid ${borderColor}`,
        boxShadow: size >= 36 ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
        padding: 0,
        ...(photoURL
          ? {
              backgroundImage: `url("${photoURL}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : {
              background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.status.info})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }),
      }}
    >
      {!photoURL && (
        <Person
          style={{ fontSize: iconSize, color: currentTheme.text.primary }}
          aria-hidden="true"
        />
      )}
    </button>
  );
};
