import AutoStories from '@mui/icons-material/AutoStories';
import ExpandMore from '@mui/icons-material/ExpandMore';
import LocalMovies from '@mui/icons-material/LocalMovies';
import MenuBook from '@mui/icons-material/MenuBook';
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
import { actionLabel, mediaLabel } from './activityText';
import { NotifAvatar } from './NotifAvatar';

const SLOT_PX = 46;
const CHEVRON_PX = 30;

const MEDIA_ICON: Record<ActivityMedia, typeof Tv> = {
  series: Tv,
  movie: LocalMovies,
  manga: AutoStories,
  book: MenuBook,
};

const Poster = ({
  title,
  src,
  size,
}: {
  title: BundledTitle;
  src: string | undefined;
  size: 'strip' | 'row' | 'single';
}) => {
  const [failed, setFailed] = useState(false);
  const Icon = MEDIA_ICON[title.media];
  const url = src && !failed ? getImageUrl(src, 'w154', '') : '';
  return (
    <span className={`nh-poster nh-poster--${size}`} aria-hidden>
      {url ? (
        <img src={url} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} />
      ) : (
        <Icon />
      )}
    </span>
  );
};

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
  const [slots, setSlots] = useState(7);
  const stripRef = useRef<HTMLDivElement>(null);
  const bundle = item.bundle;
  const single = bundle?.titles.length === 1 ? bundle.titles[0] : null;

  useEffect(() => {
    const strip = stripRef.current;
    if (!strip || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      const room = entry.contentRect.width - CHEVRON_PX + 6;
      setSlots(Math.max(2, Math.floor(room / SLOT_PX)));
    });
    observer.observe(strip);
    return () => observer.disconnect();
  }, [single]);

  if (!bundle) return null;
  const shown = bundle.titles.length <= slots ? bundle.titles.length : slots - 1;
  const rest = bundle.titles.length - shown;

  const openTitle = (title: BundledTitle) => {
    const path = activityPath(title.media, title.id);
    if (!path) return;
    const preview = bookPreviewFromActivity(title.activity);
    onOpen(path, preview ? { result: preview } : undefined);
  };

  const activate = () => (single ? openTitle(single) : setOpen((v) => !v));

  return (
    <div className={`nh-bundle${item.read ? '' : ' is-unread'}${open ? ' is-open' : ''}`}>
      <div
        className="nh-row"
        role="button"
        tabIndex={0}
        aria-expanded={single ? undefined : open}
        onClick={activate}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            activate();
          }
        }}
      >
        <NotifAvatar name={item.title} photoURL={item.photoURL} />
        <div className="nh-body">
          <div className="nh-head">
            <span className="nh-name">{item.title}</span>
            <span className="nh-time">
              {formatNotificationTime(item.timestamp)}
              {!item.read && <span className="nh-dot" />}
            </span>
          </div>
          <div className="nh-text">{item.message}</div>
          {!single && (
            <div className="nh-strip" ref={stripRef}>
              {bundle.titles.slice(0, shown).map((title) => (
                <Poster key={title.key} title={title} src={posterFor(title)} size="strip" />
              ))}
              {rest > 0 && <span className="nh-strip-more">+{rest}</span>}
              <ExpandMore className="nh-chevron" aria-label={open ? t('Weniger') : t('Alle')} />
            </div>
          )}
        </div>
        {single && <Poster title={single} src={posterFor(single)} size="single" />}
      </div>

      {open && !single && (
        <ul className="nh-titles">
          {bundle.titles.map((title) => (
            <li key={title.key}>
              <button type="button" className="nh-title" onClick={() => openTitle(title)}>
                <Poster title={title} src={posterFor(title)} size="row" />
                <span className="nh-title-main">
                  <span className="nh-title-name">{title.title}</span>
                  <span className="nh-title-meta">
                    {[
                      mediaLabel(title),
                      ...title.actions
                        .filter((a) => a !== 'added')
                        .map((a) => actionLabel(a, title)),
                    ].join(' · ')}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});
