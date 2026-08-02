import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useDeviceType } from '../../hooks/useDeviceType';
import { detectAppInstallTarget } from '../../lib/appInstallTarget';
import { addGuestPick } from '../../services/guestOnboarding';
import { t } from '../../services/i18n';
import { tmdbFetch } from '../../services/tmdbClient';
import { getImageUrl } from '../../utils/imageUrl';

interface GuestMediaPageProps {
  mediaType: 'tv' | 'movie';
  tmdbId: number;
}

interface TmdbDetail {
  name?: string;
  title?: string;
  first_air_date?: string;
  release_date?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  runtime?: number;
  genres?: { name: string }[];
}

/**
 * Öffentliche, login-freie Detailseite für geteilte Links (/series/:id,
 * /movie/:id ohne Session). Zeigt die TMDB-Basisdaten + Register/Login-CTA,
 * statt Empfänger ohne Konto auf die Login-Wand laufen zu lassen.
 */
export const GuestMediaPage: React.FC<GuestMediaPageProps> = ({ mediaType, tmdbId }) => {
  const { currentTheme } = useTheme();
  const { isMobile } = useDeviceType();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<TmdbDetail | null>(null);
  const [failed, setFailed] = useState(false);
  // Mobiler Browser ohne App → fester Store-Button im CTA-Panel.
  const [installTarget] = useState(detectAppInstallTarget);

  useEffect(() => {
    let cancelled = false;
    setDetail(null);
    setFailed(false);
    tmdbFetch<TmdbDetail>(`${mediaType}/${tmdbId}`)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [mediaType, tmdbId]);

  const title = detail?.name || detail?.title || '';
  const year = (detail?.first_air_date || detail?.release_date || '').slice(0, 4);
  const genres = (detail?.genres || [])
    .map((g) => g.name)
    .slice(0, 3)
    .join(' · ');
  const backdropUrl = getImageUrl(detail?.backdrop_path || undefined, 'w1280', '');
  const posterUrl = getImageUrl(detail?.poster_path || undefined, 'w342', '');

  const metaParts = [
    year,
    genres,
    mediaType === 'tv' && detail?.number_of_seasons
      ? `${detail.number_of_seasons} ${t('Staffeln')}`
      : '',
    mediaType === 'movie' && detail?.runtime ? `${detail.runtime} Min.` : '',
    detail?.vote_average ? `★ ${detail.vote_average.toFixed(1)}` : '',
  ].filter(Boolean);

  return (
    <div
      style={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        background: currentTheme.background.default,
        color: currentTheme.text.primary,
      }}
    >
      {/* Backdrop */}
      {backdropUrl && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${backdropUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 20%',
            filter: 'blur(24px) brightness(0.35) saturate(1.4)',
            transform: 'scale(1.15)',
          }}
        />
      )}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(180deg, transparent 0%, ${currentTheme.background.default} 85%)`,
        }}
      />

      <div
        style={{
          position: 'relative',
          maxWidth: 960,
          margin: '0 auto',
          padding: `calc(24px + env(safe-area-inset-top)) 20px calc(32px + env(safe-area-inset-bottom))`,
        }}
      >
        {/* Wortmarke */}
        <button
          onClick={() => navigate('/')}
          aria-label="TV-RANK"
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: 18,
            letterSpacing: '0.06em',
            backgroundImage: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          TV-RANK
        </button>

        {failed && (
          <div style={{ marginTop: 80, textAlign: 'center' }}>
            <p style={{ fontSize: 16, color: currentTheme.text.secondary }}>
              {t('Titel nicht gefunden.')}
            </p>
            <button
              onClick={() => navigate('/')}
              style={{
                marginTop: 12,
                padding: '10px 20px',
                borderRadius: 12,
                border: '1px solid var(--glass-border-subtle)',
                background: 'rgba(255,255,255,0.06)',
                color: currentTheme.text.primary,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {t('Zur Startseite')}
            </button>
          </div>
        )}

        {detail && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: isMobile ? 'center' : 'flex-start',
              gap: isMobile ? 20 : 32,
              marginTop: isMobile ? 28 : 48,
            }}
          >
            {posterUrl && (
              <img
                src={posterUrl}
                alt={title}
                style={{
                  width: isMobile ? 150 : 210,
                  aspectRatio: '2/3',
                  objectFit: 'cover',
                  borderRadius: 16,
                  border: '1px solid var(--glass-border-subtle)',
                  boxShadow: '0 24px 60px -20px rgba(0,0,0,0.7)',
                  flexShrink: 0,
                }}
              />
            )}

            <div style={{ minWidth: 0, textAlign: isMobile ? 'center' : 'left' }}>
              <h1
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-display)',
                  fontSize: isMobile ? 28 : 40,
                  fontWeight: 800,
                  lineHeight: 1.15,
                }}
              >
                {title}
              </h1>
              {metaParts.length > 0 && (
                <p
                  style={{
                    margin: '10px 0 0',
                    fontSize: 14,
                    color: currentTheme.text.secondary,
                  }}
                >
                  {metaParts.join(' · ')}
                </p>
              )}
              {detail.overview && (
                <p
                  style={{
                    margin: '16px 0 0',
                    fontSize: 15,
                    lineHeight: 1.6,
                    color: currentTheme.text.secondary,
                    maxWidth: 620,
                  }}
                >
                  {detail.overview}
                </p>
              )}

              {/* CTA */}
              <div
                style={{
                  marginTop: 28,
                  padding: isMobile ? '18px 16px' : '20px 24px',
                  borderRadius: 18,
                  border: '1px solid var(--glass-border-subtle)',
                  background: `linear-gradient(150deg, var(--glass-light) 0%, var(--glass-subtle) 100%), ${currentTheme.background.default}`,
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
                }}
              >
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>
                  {t('Tracke {title} mit TV-RANK', { title })}
                </p>
                <p
                  style={{
                    margin: '6px 0 14px',
                    fontSize: 13,
                    color: currentTheme.text.muted,
                  }}
                >
                  {t('Folgen abhaken, bewerten, mit Freunden vergleichen — kostenlos.')}
                </p>
                <div
                  style={{
                    display: 'flex',
                    gap: 10,
                    flexWrap: 'wrap',
                    justifyContent: isMobile ? 'center' : 'flex-start',
                  }}
                >
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      // Geteilten Titel in die Gast-Auswahl legen und ins
                      // bestehende /join-Onboarding einsteigen — nach dem
                      // Signup ist er automatisch in der Liste.
                      addGuestPick({
                        id: tmdbId,
                        type: mediaType === 'movie' ? 'movie' : 'series',
                        title,
                        name: detail.name,
                        poster_path: detail.poster_path ?? null,
                        vote_average: detail.vote_average ?? 0,
                        first_air_date: detail.first_air_date,
                        release_date: detail.release_date,
                        number_of_seasons: detail.number_of_seasons,
                      });
                      navigate('/join');
                    }}
                    style={{
                      padding: '12px 22px',
                      borderRadius: 12,
                      border: 'none',
                      background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                      color: currentTheme.background.default,
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {t('Jetzt tracken — kostenlos')}
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate('/login')}
                    style={{
                      padding: '12px 22px',
                      borderRadius: 12,
                      border: '1px solid var(--glass-border-subtle)',
                      background: 'rgba(255,255,255,0.06)',
                      color: currentTheme.text.primary,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {t('Anmelden')}
                  </motion.button>
                  {installTarget.os && (
                    <motion.a
                      whileTap={{ scale: 0.97 }}
                      href={installTarget.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px 22px',
                        borderRadius: 12,
                        border: `1px solid ${currentTheme.primary}55`,
                        background: `${currentTheme.primary}14`,
                        color: currentTheme.primary,
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer',
                        textDecoration: 'none',
                      }}
                    >
                      {installTarget.os === 'ios'
                        ? t('Im App Store laden')
                        : t('Bei Google Play laden')}
                    </motion.a>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
