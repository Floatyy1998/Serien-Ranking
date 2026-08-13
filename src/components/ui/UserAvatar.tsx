import { Person } from '@mui/icons-material';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { showAvatar } from '../../lib/avatarViewer';
import { t } from '../../services/i18n';

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
  const initial = username?.trim().charAt(0).toUpperCase() || '';

  // Nicht navigierbar (z. B. auf dem Profil, auf dem man schon steht): dann
  // zeigt ein Tipp das Bild groß, statt gar nichts zu tun.
  const zoomable = !navigable && !!photoURL;

  const handleClick = () => {
    if (navigable) {
      navigate(`/friend/${userId}`);
      return;
    }
    showAvatar(photoURL, username);
  };

  return (
    <button
      onClick={handleClick}
      // Immer benennen: ein Knopf ohne zugaenglichen Namen ist fuer
      // Screenreader stumm, auch wenn er gerade nichts tut.
      aria-label={
        navigable
          ? t('Profil von {name} öffnen', { name: username })
          : t('Profilbild von {name}', { name: username })
      }
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        flexShrink: 0,
        cursor: navigable ? 'pointer' : zoomable ? 'zoom-in' : 'default',
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
              background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.status.info.main})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }),
      }}
    >
      {!photoURL &&
        (initial ? (
          <span
            style={{
              fontSize: Math.round(size * 0.42),
              fontWeight: 700,
              lineHeight: 1,
              color: '#fff',
              fontFamily: 'var(--font-display)',
              userSelect: 'none',
            }}
            aria-hidden="true"
          >
            {initial}
          </span>
        ) : (
          <Person
            style={{ fontSize: iconSize, color: currentTheme.text.primary }}
            aria-hidden="true"
          />
        ))}
    </button>
  );
};
