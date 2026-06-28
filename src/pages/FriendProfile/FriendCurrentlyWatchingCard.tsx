import { motion } from 'framer-motion';
import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContextDef';
import { getImageUrl } from '../../utils/imageUrl';
import type { FriendCurrentlyWatching, WatchingMood } from './useFriendCurrentlyWatching';

const MOOD_META: Record<WatchingMood, { label: string; tint: string }> = {
  binge: { label: 'Binge-Modus', tint: '#ff6b3d' },
  active: { label: 'Aktiv dabei', tint: '#4ecdc4' },
  casual: { label: 'Schaut entspannt', tint: '#9b8cff' },
  paused: { label: 'Pausiert', tint: '#94a3b8' },
  rewatch: { label: 'Rewatch', tint: '#c084fc' },
};

function formatRelative(timestamp: number): string {
  const diffMin = Math.round((Date.now() - timestamp) / 60000);
  if (diffMin < 60) return diffMin <= 1 ? 'gerade eben' : `vor ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `vor ${diffH} h`;
  const diffD = Math.round(diffH / 24);
  return `vor ${diffD} Tag${diffD === 1 ? '' : 'en'}`;
}

interface Props {
  friendName: string;
  data: FriendCurrentlyWatching;
}

export const FriendCurrentlyWatchingCard = memo(function FriendCurrentlyWatchingCard({
  friendName,
  data,
}: Props) {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const mood = MOOD_META[data.mood];

  const spoilerColor = data.spoilerDiff.warning
    ? currentTheme.status?.warning || '#ffb15c'
    : currentTheme.text.muted;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => navigate(`/series/${data.seriesId}`)}
      className="fp-watching-card"
      style={{
        background: `linear-gradient(135deg, ${mood.tint}18, ${currentTheme.primary}10)`,
        border: `1px solid ${mood.tint}40`,
      }}
    >
      <img src={getImageUrl(data.poster, 'w342')} alt={data.title} className="fp-watching-poster" />

      <div className="fp-watching-body">
        <div className="fp-watching-mood" style={{ color: mood.tint }}>
          <span className="fp-watching-mood-dot" style={{ background: mood.tint }} />
          <span>{mood.label}</span>
        </div>

        <div className="fp-watching-title">{data.title}</div>

        <div className="fp-watching-meta">
          {friendName} schaut S{data.latestSeason}E{data.latestEpisode} ·{' '}
          {formatRelative(data.latestWatchedAt)}
        </div>

        <div className="fp-watching-stats">
          <span>
            <strong>{data.episodeCount}</strong> {data.episodeCount === 1 ? 'Folge' : 'Folgen'}
          </span>
          <span>·</span>
          <span>{data.daysCovered === 1 ? 'heute' : `in ${data.daysCovered} Tagen`}</span>
        </div>

        <div className="fp-watching-spoiler" style={{ color: spoilerColor }}>
          {data.spoilerDiff.message}
        </div>
      </div>
    </motion.div>
  );
});
