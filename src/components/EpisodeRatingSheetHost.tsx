import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { BottomSheet } from './ui';
import { StarRatingRow } from './ui/StarRatingRow';
import { EPISODE_RATING_EVENT, type EpisodeRatingRequest } from '../lib/episodeRatingPrompt';
import { setEpisodeRating } from '../services/episodeRatingService';
import { showToast } from '../lib/toast';
import { t } from '../services/i18n';

/**
 * Globales Folgen-Bewertungs-Sheet: wird von requestEpisodeRating() (nach dem
 * Abhaken in Weiterschauen/Als Nächstes) geöffnet. Einmal in MobileApp
 * gemountet. Kurze Öffnungs-Verzögerung, damit Haptik/Undo-Toast zuerst landen.
 */
export const EpisodeRatingSheetHost = () => {
  const { user } = useAuth() || {};
  const { currentTheme } = useTheme();
  const [request, setRequest] = useState<EpisodeRatingRequest | null>(null);

  useEffect(() => {
    const onRequest = (e: Event) => {
      const detail = (e as CustomEvent<EpisodeRatingRequest>).detail;
      if (!detail) return;
      window.setTimeout(() => setRequest(detail), 400);
    };
    window.addEventListener(EPISODE_RATING_EVENT, onRequest);
    return () => window.removeEventListener(EPISODE_RATING_EVENT, onRequest);
  }, []);

  const close = useCallback(() => setRequest(null), []);

  const handleSelect = useCallback(
    async (value: number | null) => {
      if (!user || !request) return;
      close();
      try {
        await setEpisodeRating(
          user.uid,
          request.seriesId,
          request.seasonIndex,
          request.episodeId,
          value
        );
        showToast(
          value ? t('Folge mit {n}/10 bewertet', { n: value }) : t('Folgenbewertung entfernt'),
          2000,
          'success'
        );
      } catch {
        showToast(t('Fehler beim Speichern'), 2500, 'error');
      }
    },
    [user, request, close]
  );

  if (!user) return null;

  return (
    <BottomSheet isOpen={request !== null} onClose={close} ariaLabel={t('Folge bewerten')}>
      {request && (
        <div style={{ padding: '0 20px 32px', textAlign: 'center' }}>
          <p
            style={{
              fontSize: '13px',
              color: currentTheme.text?.muted || 'rgba(255,255,255,0.5)',
              margin: '0 0 4px',
            }}
          >
            {request.seriesTitle}
          </p>
          <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 14px' }}>{request.label}</h3>
          <p
            style={{
              fontSize: '12px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: currentTheme.text?.muted || 'rgba(255,255,255,0.5)',
              margin: '0 0 8px',
            }}
          >
            {t('Wie war die Folge?')}
          </p>
          <StarRatingRow value={request.currentRating} onSelect={handleSelect} size={28} />
          <button
            onClick={close}
            style={{
              marginTop: '16px',
              padding: '10px 22px',
              background: 'transparent',
              border: 'none',
              color: currentTheme.text?.muted || 'rgba(255,255,255,0.5)',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            {t('Später')}
          </button>
        </div>
      )}
    </BottomSheet>
  );
};
