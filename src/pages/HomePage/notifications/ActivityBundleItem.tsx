import AutoStories from '@mui/icons-material/AutoStories';
import Bookmark from '@mui/icons-material/Bookmark';
import CheckCircle from '@mui/icons-material/CheckCircle';
import ExpandLess from '@mui/icons-material/ExpandLess';
import LocalMovies from '@mui/icons-material/LocalMovies';
import MenuBook from '@mui/icons-material/MenuBook';
import Schedule from '@mui/icons-material/Schedule';
import Star from '@mui/icons-material/Star';
import Tv from '@mui/icons-material/Tv';
import React, { useEffect, useRef, useState } from 'react';
import {
  activityPath,
  bookPreviewFromActivity,
  type ActivityMedia,
  type BundledTitle,
} from '../../../lib/social/activityBundles';
import { t } from '../../../services/i18n';
import { getImageUrl } from '../../../utils/imageUrl';
import { formatNotificationTime, type UnifiedNotification } from '../hooks/useUnifiedNotifications';
import {
  actionLabel,
  bundleTimeRange,
  mediaBreakdown,
  mediaLabel,
  titleTime,
} from './activityText';
import { NotifAvatar } from './NotifAvatar';

const TILE_GAP = 10;
const tileMin = (width: number) => (width < 520 ? 72 : 88);

const MEDIA_ICON: Record<ActivityMedia, typeof Tv> = {
  series: Tv,
  movie: LocalMovies,
  manga: AutoStories,
  book: MenuBook,
};

const PosterImage = ({ title, src }: { title: BundledTitle; src: string | undefined }) => {
  const [failed, setFailed] = useState(false);
  const Icon = MEDIA_ICON[title.media];
  const url = src && !failed ? getImageUrl(src, 'w185', '') : '';
  return url ? (
    <img src={url} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} />
  ) : (
    <Icon className="nh-poster-fallback" />
  );
};

/** Wichtigste Aktion als Marker auf dem Poster — „hinzugefügt" braucht keinen. */
const ActionBadge = ({ title }: { title: BundledTitle }) => {
  const action = title.actions[0];
  if (action === 'rated') {
    return (
      <span className="nh-badge nh-badge--rating">
        <Star />
        {title.rating ?? ''}
      </span>
    );
  }
  if (action === 'watchlist') {
    return (
      <span className="nh-badge nh-badge--watchlist" aria-label={t('Watchlist')}>
        <Bookmark />
      </span>
    );
  }
  if (action === 'finished') {
    return (
      <span className="nh-badge nh-badge--finished" aria-label={t('ausgelesen')}>
        <CheckCircle />
      </span>
    );
  }
  return null;
};

const titleMeta = (title: BundledTitle): string =>
  [
    mediaLabel(title),
    ...(title.actions.length === 1 && title.actions[0] === 'added'
      ? [t('hinzugefügt')]
      : title.actions.filter((a) => a !== 'added').map((a) => actionLabel(a, title))),
  ].join(' · ');

interface Props {
  item: UnifiedNotification;
  posterFor: (title: BundledTitle) => string | undefined;
  onOpen: (path: string, state?: unknown) => void;
}

export const ActivityBundleItem = React.memo(function ActivityBundleItem({
  item,
  posterFor,
  onOpen,
}: Props) {
  const [open, setOpen] = useState(false);
  const [cols, setCols] = useState(5);
  const gridRef = useRef<HTMLDivElement>(null);
  const bundle = item.bundle;
  const single = bundle?.titles.length === 1 ? bundle.titles[0] : null;
  const isNew = !item.read;

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      setCols(Math.max(3, Math.floor((width + TILE_GAP) / (tileMin(width) + TILE_GAP))));
    });
    observer.observe(grid);
    return () => observer.disconnect();
  }, [single]);

  if (!bundle) return null;

  const openTitle = (title: BundledTitle) => {
    const path = activityPath(title.media, title.id);
    if (!path) return;
    const preview = bookPreviewFromActivity(title.activity);
    onOpen(path, preview ? { result: preview } : undefined);
  };

  const breakdown = mediaBreakdown(bundle);
  const timeRange = bundleTimeRange(bundle);
  const limit = cols * (isNew ? 2 : 1);
  const collapsed = !open && bundle.titles.length > limit;
  const visible = collapsed ? bundle.titles.slice(0, limit - 1) : bundle.titles;
  const rest = bundle.titles.length - visible.length;

  const tile = (title: BundledTitle) => {
    const MediaIcon = MEDIA_ICON[title.media];
    return (
      <button
        key={title.key}
        type="button"
        className="nh-tile"
        onClick={() => openTitle(title)}
        aria-label={`${title.title} · ${titleMeta(title)} · ${titleTime(title.latest)}`}
      >
        <span className="nh-tile-poster">
          <PosterImage title={title} src={posterFor(title)} />
          <span className={`nh-tile-media nh-tile-media--${title.media}`} aria-hidden>
            <MediaIcon />
            {mediaLabel(title)}
          </span>
          <ActionBadge title={title} />
        </span>
        <span className="nh-tile-title">{title.title}</span>
        <span className="nh-tile-when">{titleTime(title.latest)}</span>
      </button>
    );
  };

  return (
    <article className={`nh-friend${isNew ? ' is-new' : ''}`}>
      <div className="nh-friend-head">
        <button
          type="button"
          className="nh-friend-who"
          onClick={() => onOpen(`/friend/${bundle.userId}`)}
        >
          <NotifAvatar name={item.title} photoURL={item.photoURL} size={40} />
          <span className="nh-friend-names">
            <span className="nh-friend-name">{item.title}</span>
            {!single && <span className="nh-friend-what">{item.message}</span>}
          </span>
        </button>
        <span className="nh-time">
          {formatNotificationTime(item.timestamp)}
          {isNew && <span className="nh-new-pill">{t('NEU')}</span>}
        </span>
      </div>

      {!single && (
        <div className="nh-friend-meta">
          {breakdown.map(({ media, label }) => {
            const Icon = MEDIA_ICON[media];
            return (
              <span key={media} className={`nh-media-chip nh-media-chip--${media}`}>
                <Icon />
                {label}
              </span>
            );
          })}
          {timeRange && (
            <span className="nh-span">
              <Schedule />
              {timeRange}
            </span>
          )}
        </div>
      )}

      {single ? (
        <button type="button" className="nh-feature" onClick={() => openTitle(single)}>
          <span className="nh-tile-poster nh-feature-poster">
            <PosterImage title={single} src={posterFor(single)} />
            <ActionBadge title={single} />
          </span>
          <span className="nh-feature-main">
            <span className="nh-feature-title">{single.title}</span>
            <span className="nh-feature-meta">{titleMeta(single)}</span>
          </span>
        </button>
      ) : (
        <div
          ref={gridRef}
          className="nh-tiles"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {visible.map(tile)}
          {collapsed && (
            <button
              type="button"
              className="nh-tile nh-tile--more"
              onClick={() => setOpen(true)}
              aria-label={t('Alle {n} anzeigen', { n: bundle.titles.length })}
            >
              <span className="nh-tile-poster">
                <span className="nh-more-count">+{rest}</span>
              </span>
            </button>
          )}
          {open && bundle.titles.length > limit && (
            <button
              type="button"
              className="nh-tile nh-tile--more"
              onClick={() => setOpen(false)}
              aria-label={t('Weniger')}
            >
              <span className="nh-tile-poster">
                <ExpandLess />
              </span>
            </button>
          )}
        </div>
      )}
    </article>
  );
});
