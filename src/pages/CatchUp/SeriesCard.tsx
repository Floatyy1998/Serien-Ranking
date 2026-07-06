import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getImageUrl } from '../../utils/imageUrl';
import { getOptimalTextColor } from '../../theme/colorUtils';
import { markNextEpisodeWatched } from '../../hooks/markNextEpisode';
import { hasEpisodeAired } from '../../utils/episodeDate';
import type { Series } from '../../types/Series';
import { GradientRing } from './GradientRing';
import { advanceCatchUpView, formatTimeString, type CatchUpSeries } from './useCatchUpData';

interface SeriesCardProps {
  item: CatchUpSeries;
}

/**
 * Klont eine Serie und markiert ihre ersten `advance` ungesehenen, bereits
 * ausgestrahlten Folgen als gesehen. Dadurch wählt `findNextEpisode()` in
 * {@link markNextEpisodeWatched} beim optimistischen Binge die NÄCHSTE Folge –
 * nicht dieselbe (Doppel-Mark-Schutz), ohne die Mark-Pipeline selbst zu ändern.
 */
function cloneSeriesWithAdvance(series: Series, advance: number): Series {
  if (advance <= 0) return series;
  let remaining = advance;
  const seasons = series.seasons?.map((season) => {
    if (remaining <= 0 || !season.episodes) return season;
    const episodes = season.episodes.map((ep) => {
      if (remaining > 0 && !ep?.watched && hasEpisodeAired(ep)) {
        remaining--;
        return { ...ep, watched: true };
      }
      return ep;
    });
    return { ...season, episodes };
  });
  return { ...series, seasons };
}

export const SeriesCard = memo<SeriesCardProps>(({ item }) => {
  const navigate = useNavigate();
  const authContext = useAuth();
  const user = authContext?.user;
  const { currentTheme } = useTheme();

  // Optimistischer Vorlauf: Anzahl der Folgen, die lokal schon als "gesehen"
  // gelten, aber deren Firebase-Update noch nicht in `item` angekommen ist.
  // Ref = synchrone Wahrheit (nächster Tap trifft die nächste Folge), State =
  // Render-Trigger.
  const [pendingAdvance, setPendingAdvance] = useState(0);
  const pendingAdvanceRef = useRef(0);
  const prevWatchedRef = useRef(item.watchedEpisodes);

  // Konvergenz: sobald die echten Daten die Marks widerspiegeln (watchedEpisodes
  // steigt), den Vorlauf entsprechend abbauen – Anzeige bleibt stabil, kein
  // Zurückflackern auf eine schon markierte Folge.
  useEffect(() => {
    const prev = prevWatchedRef.current;
    prevWatchedRef.current = item.watchedEpisodes;
    if (item.watchedEpisodes > prev) {
      const delta = item.watchedEpisodes - prev;
      pendingAdvanceRef.current = Math.max(0, pendingAdvanceRef.current - delta);
      setPendingAdvance(pendingAdvanceRef.current);
    }
  }, [item.watchedEpisodes]);

  const handleClick = useCallback(() => {
    navigate(`/series/${item.series.id}`);
  }, [navigate, item.series.id]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      // Nur reagieren, wenn die Karte selbst fokussiert ist – nicht wenn das
      // Tastatur-Event von einem inneren Control (Mark-Button) hochblubbert.
      if (e.target !== e.currentTarget) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  const handleMarkNext = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!user) return;
      const advance = pendingAdvanceRef.current;
      // Nicht über das Ende hinaus vor-advancen (nichts mehr zu markieren).
      if (advance >= item.remainingEpisodes) return;

      // Sofort optimistisch weiterschieben (synchron via Ref), damit ein
      // schneller zweiter Tap die nächste – nicht dieselbe – Folge markiert.
      pendingAdvanceRef.current = advance + 1;
      setPendingAdvance(pendingAdvanceRef.current);

      // Serie so klonen, dass die bereits optimistisch abgehakten Folgen als
      // gesehen gelten → markNextEpisodeWatched zielt auf die richtige Folge.
      const seriesForMark = cloneSeriesWithAdvance(item.series, advance);
      const ok = await markNextEpisodeWatched(user.uid, seriesForMark);
      if (!ok) {
        // Fehlschlag → Vorlauf zurücknehmen.
        pendingAdvanceRef.current = Math.max(0, pendingAdvanceRef.current - 1);
        setPendingAdvance(pendingAdvanceRef.current);
      }
    },
    [user, item.series, item.remainingEpisodes]
  );

  const handleImgError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    (e.target as HTMLImageElement).style.opacity = '0';
  }, []);

  // Anzeige-Sicht mit optimistischem Vorlauf. `null` = durch Markieren komplett
  // aufgeholt → Karte sauber ausblenden (bis der Realtime-Update sie eh entfernt).
  const view = advanceCatchUpView(item, pendingAdvance);
  if (!view) return null;

  const accentAlpha = Math.round(view.progress * 2.55)
    .toString(16)
    .padStart(2, '0');

  return (
    <div
      className="cu-card"
      role="button"
      tabIndex={0}
      aria-label={`${item.series.title} öffnen`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      style={{
        background: currentTheme.background.surface,
        border: `1px solid ${currentTheme.border.default}`,
      }}
    >
      {/* Subtle gradient accent */}
      <div
        className="cu-card-accent"
        style={{
          background: `linear-gradient(90deg,
            ${currentTheme.primary}${accentAlpha},
            ${currentTheme.accent}${accentAlpha}
          )`,
        }}
      />

      {/* Poster */}
      <div className="cu-card-poster">
        <img
          src={getImageUrl(item.series.poster?.poster, 'w500')}
          alt={item.series.title}
          loading="lazy"
          decoding="async"
          onError={handleImgError}
        />
        {/* Episode badge */}
        <div className="cu-card-badge">
          <span className="cu-card-badge-count">{view.remainingEpisodes}</span>
          <span className="cu-card-badge-label">EP</span>
        </div>
      </div>

      {/* Content */}
      <div className="cu-card-body">
        <h3 className="cu-card-title" style={{ color: currentTheme.text.primary }}>
          {item.series.title}
        </h3>

        <div className="cu-card-meta">
          <span className="cu-card-episode" style={{ color: currentTheme.text.secondary }}>
            S{view.currentSeason} E{view.currentEpisode}
          </span>
          <span
            className="cu-card-time"
            style={{
              background: `${currentTheme.primary}15`,
              color: currentTheme.primary,
            }}
          >
            {formatTimeString(view.remainingMinutes)}
          </span>
        </div>

        {/* Inline progress */}
        <div
          className="cu-card-progress-track"
          style={{ background: `${currentTheme.text.muted}15` }}
        >
          <div
            className="cu-card-progress-fill"
            style={{
              width: `${view.progress}%`,
              background: `linear-gradient(90deg, ${currentTheme.primary}, ${currentTheme.accent})`,
            }}
          />
        </div>
        <div className="cu-card-progress-label" style={{ color: currentTheme.text.muted }}>
          <span>
            {view.watchedEpisodes} von {view.totalEpisodes}
          </span>
        </div>

        {/* Direkt-Markieren: nächste Folge ohne Umweg über die Detailseite */}
        <button
          type="button"
          onClick={handleMarkNext}
          aria-label={`S${view.currentSeason} E${view.currentEpisode} als gesehen markieren`}
          className="cu-card-mark-next"
          style={{
            marginTop: 8,
            width: '100%',
            minHeight: 40,
            borderRadius: 10,
            border: 'none',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 700,
            background: currentTheme.primary,
            color: getOptimalTextColor(currentTheme.primary),
          }}
        >
          ✓ S{view.currentSeason} E{view.currentEpisode} gesehen
        </button>
      </div>

      {/* Progress Ring */}
      <div className="cu-card-ring">
        <GradientRing progress={view.progress} size={52} strokeWidth={4} />
      </div>
    </div>
  );
});

SeriesCard.displayName = 'SeriesCard';
