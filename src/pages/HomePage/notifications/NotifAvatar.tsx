import { useEffect, useState } from 'react';

/** Profilbild mit Initiale als Rückfall (Google-Fotos brauchen no-referrer, alte URLs 404en). */
export const NotifAvatar = ({
  name,
  photoURL,
  size = 42,
}: {
  name: string;
  photoURL?: string;
  size?: number;
}) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [photoURL]);
  const showImage = !!photoURL && !failed;
  return (
    <span
      className="nh-avatar"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
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
        (name || '?').trim().charAt(0).toUpperCase()
      )}
    </span>
  );
};
