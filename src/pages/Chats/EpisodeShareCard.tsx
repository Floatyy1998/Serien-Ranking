import { ChevronRight, LiveTv } from '@mui/icons-material';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSeriesList } from '../../contexts/SeriesListContext';
import { isEpisodeWatched } from '../../lib/episode/seriesMetrics';
import type { SharedEpisode } from '../../services/chat/chatService';
import { t } from '../../services/i18n';
import { getImageUrl } from '../../utils/imageUrl';

const episodePath = (ep: SharedEpisode) => `/episode/${ep.seriesId}/s/${ep.season}/e/${ep.episode}`;

/** Geteilte Folge im Chat — der Folgentitel kann spoilern, deshalb erst nach eigenem Ansehen. */
export const EpisodeShareCard = ({ episode, own }: { episode: SharedEpisode; own: boolean }) => {
  const navigate = useNavigate();
  const { seriesList } = useSeriesList();
  const watched = useMemo(() => {
    const series = seriesList.find((s) => s.id === episode.seriesId);
    const local = series?.seasons?.find((s) => s.seasonNumber === episode.season - 1)?.episodes?.[
      episode.episode - 1
    ];
    return !!local && isEpisodeWatched(local);
  }, [seriesList, episode]);
  const showTitle = !!episode.episodeTitle && (own || watched);

  return (
    <button
      type="button"
      className="ch-episode"
      onClick={(e) => {
        e.stopPropagation();
        navigate(episodePath(episode));
      }}
    >
      {episode.poster ? (
        <img
          className="ch-episode-poster"
          src={getImageUrl(episode.poster, 'w154')}
          alt=""
          loading="lazy"
          decoding="async"
        />
      ) : (
        <span className="ch-episode-poster ch-episode-poster--empty">
          <LiveTv style={{ fontSize: 22 }} />
        </span>
      )}
      <span className="ch-episode-body">
        <span className="ch-episode-kicker">
          {t('Staffel {s} · Folge {e}', { s: episode.season, e: episode.episode })}
        </span>
        <span className="ch-episode-series">{episode.seriesTitle}</span>
        {showTitle ? (
          <span className="ch-episode-title">{episode.episodeTitle}</span>
        ) : episode.episodeTitle ? (
          <span className="ch-episode-title ch-episode-title--hidden">
            {t('Titel erst nach dem Ansehen')}
          </span>
        ) : null}
      </span>
      <ChevronRight className="ch-episode-arrow" style={{ fontSize: 20 }} />
    </button>
  );
};
