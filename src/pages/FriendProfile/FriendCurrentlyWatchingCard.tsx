import { VisibilityOutlined, WarningAmberRounded } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { t } from '../../services/i18n';
import { getImageUrl } from '../../utils/imageUrl';
import type { FriendCurrentlyWatching, WatchingMood } from './useFriendCurrentlyWatching';
import { mediaTargetProps } from '../../lib/interaction/mediaTarget';

const MOOD_META: Record<WatchingMood, { label: string; tint: string }> = {
  binge: { label: t('Binge-Modus'), tint: '#ff6b3d' },
  active: { label: t('Aktiv dabei'), tint: '#4ecdc4' },
  casual: { label: t('Schaut entspannt'), tint: '#9b8cff' },
  paused: { label: t('Pausiert'), tint: '#94a3b8' },
  rewatch: { label: t('Rewatch'), tint: '#c084fc' },
};

function formatRelative(timestamp: number): string {
  const diffMin = Math.round((Date.now() - timestamp) / 60000);
  if (diffMin < 60) return diffMin <= 1 ? t('gerade eben') : t('vor {n} min', { n: diffMin });
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return t('vor {n} h', { n: diffH });
  const diffD = Math.round(diffH / 24);
  return diffD === 1 ? t('vor 1 Tag') : t('vor {n} Tagen', { n: diffD });
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
      {...mediaTargetProps({
        type: 'series',
        id: data.seriesId,
        title: data.title,
        poster: data.poster,
      })}
      className="fp-card fp-watching-card"
      style={{
        background: `radial-gradient(120% 140% at 0% 0%, ${mood.tint}22, transparent 60%), var(--glass-subtle)`,
      }}
    >
      <img
        src={getImageUrl(data.poster, 'w342')}
        alt=""
        aria-hidden
        className="fp-watching-backdrop"
        loading="lazy"
        decoding="async"
      />
      <img
        src={getImageUrl(data.poster, 'w342')}
        alt={data.title}
        className="fp-watching-poster"
        loading="lazy"
        decoding="async"
      />

      <div className="fp-watching-body">
        <div className="fp-card-eyebrow" style={{ color: mood.tint }}>
          <span className="fp-watching-mood-dot" style={{ background: mood.tint }} />
          <span>{mood.label}</span>
        </div>

        <div className="fp-watching-title" style={{ color: currentTheme.text.primary }}>
          {data.title}
        </div>

        <div className="fp-watching-meta" style={{ color: currentTheme.text.muted }}>
          {t('{name} schaut', { name: friendName })} S{data.latestSeason}E{data.latestEpisode} ·{' '}
          {formatRelative(data.latestWatchedAt)}
        </div>

        <div className="fp-watching-chips" style={{ color: currentTheme.text.secondary }}>
          <span className="fp-chip">
            <strong>{data.episodeCount}</strong>{' '}
            {data.episodeCount === 1 ? t('Folge') : t('Folgen')}
          </span>
          <span className="fp-chip">
            {data.daysCovered === 1 ? t('heute') : t('in {n} Tagen', { n: data.daysCovered })}
          </span>
        </div>

        <div className="fp-watching-spoiler" style={{ color: spoilerColor }}>
          {data.spoilerDiff.warning ? (
            <WarningAmberRounded style={{ fontSize: 16 }} />
          ) : (
            <VisibilityOutlined style={{ fontSize: 16 }} />
          )}
          <span>{data.spoilerDiff.message}</span>
        </div>
      </div>
    </motion.div>
  );
});
