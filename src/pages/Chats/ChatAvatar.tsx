import { useEffect, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface Props {
  name: string;
  photoURL?: string;
  small?: boolean;
  ring?: boolean;
  online?: boolean;
}

export const ChatAvatar = ({ name, photoURL, small, ring, online }: Props) => {
  const { currentTheme } = useTheme();
  // Google-Fotos (googleusercontent) liefern mit Referer 403, und veraltete
  // URLs 404en — bei Ladefehler auf die Initiale zurückfallen.
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [photoURL]);

  const initial = (name || '?').trim().charAt(0).toUpperCase();
  const showImage = !!photoURL && !failed;

  return (
    <div className="ch-avatar-wrap">
      <div
        className={`ch-avatar${small ? ' ch-avatar--sm' : ''}${ring ? ' ch-avatar--ring' : ''}`}
        style={
          showImage
            ? undefined
            : {
                background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
              }
        }
        aria-hidden
      >
        {showImage ? (
          <img
            src={photoURL}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setFailed(true)}
          />
        ) : (
          initial
        )}
      </div>
      {online && <span className="ch-online-dot" aria-hidden />}
    </div>
  );
};
