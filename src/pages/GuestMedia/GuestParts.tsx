import { NotificationsActive, PlayArrow, Star } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useState, type ReactNode, type RefObject } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { detectAppInstallTarget } from '../../lib/platform/appInstallTarget';
import { t } from '../../services/i18n';
import { formatVoteCount } from '../../utils/voteCount';
import './GuestMediaPage.css';

export interface GuestFeature {
  icon: ReactNode;
  title: string;
  text: string;
}

export interface GuestRailItem {
  key: string | number;
  image?: string | null;
  title: string;
  sub?: string;
  to?: string;
  badge?: string;
  current?: boolean;
}

export interface GuestRatingValue {
  value: number;
  votes?: string;
  href?: string;
}

export interface GuestNotice {
  title: string;
  text: string;
}

const useGradient = () => {
  const { currentTheme } = useTheme();
  return `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`;
};

export function GuestPrimaryButton({
  label,
  onClick,
  small,
}: {
  label: string;
  onClick: () => void;
  small?: boolean;
}) {
  const { currentTheme } = useTheme();
  const gradient = useGradient();
  return (
    <motion.button
      whileTap={{ opacity: 0.7 }}
      onClick={onClick}
      className={`gm-btn gm-btn--primary${small ? ' gm-btn--small' : ''}`}
      style={{ background: gradient, color: currentTheme.background.default }}
    >
      {label}
    </motion.button>
  );
}

export function GuestShell({
  status,
  children,
}: {
  status: 'loading' | 'failed' | 'ready';
  children?: ReactNode;
}) {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const gradient = useGradient();
  return (
    <div
      className="gm"
      style={
        {
          background: currentTheme.background.default,
          '--gm-bg': currentTheme.background.default,
        } as React.CSSProperties
      }
    >
      <header className="gm-top">
        <button
          onClick={() => navigate('/')}
          aria-label="TV-RANK"
          className="gm-wordmark"
          style={{ backgroundImage: gradient }}
        >
          TV-RANK
        </button>
        <button onClick={() => navigate('/login')} className="gm-btn gm-btn--ghost gm-top__login">
          {t('Anmelden')}
        </button>
      </header>
      {status === 'failed' && (
        <div className="gm-failed">
          <p>{t('Titel nicht gefunden.')}</p>
          <button onClick={() => navigate('/')} className="gm-btn gm-btn--ghost">
            {t('Zur Startseite')}
          </button>
        </div>
      )}
      {status === 'loading' && <div className="gm-skeleton" aria-hidden />}
      {status === 'ready' && children}
    </div>
  );
}

export function GuestHero({
  backdrop,
  blurBackdrop,
  poster,
  eyebrow,
  eyebrowDetail,
  title,
  byline,
  tagline,
  rating,
  ratings,
  facts,
  extra,
  secondary,
  ctaRef,
  onCta,
}: {
  backdrop?: string;
  blurBackdrop?: boolean;
  poster?: string;
  eyebrow: string;
  eyebrowDetail?: string[];
  title: string;
  byline?: string;
  tagline?: string;
  rating?: string;
  ratings?: ReactNode;
  facts: string[];
  extra?: ReactNode;
  secondary?: ReactNode;
  ctaRef: RefObject<HTMLDivElement | null>;
  onCta: () => void;
}) {
  const { currentTheme } = useTheme();
  return (
    <section className="gm-hero">
      {backdrop && (
        <div
          aria-hidden
          className={`gm-hero__bg${blurBackdrop ? ' gm-hero__bg--blur' : ''}`}
          style={{ backgroundImage: `url(${backdrop})` }}
        />
      )}
      <div aria-hidden className="gm-hero__shade" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="gm-hero__body"
      >
        {poster && <img src={poster} alt={title} className="gm-poster" />}
        <div className="gm-hero__text">
          <p className="gm-eyebrow" style={{ color: currentTheme.primary }}>
            {eyebrow}
            {eyebrowDetail && eyebrowDetail.length > 0 && (
              <span> · {eyebrowDetail.join(' · ')}</span>
            )}
          </p>
          <h1 className="gm-title">{title}</h1>
          {byline && <p className="gm-byline">{byline}</p>}
          {tagline && <p className="gm-tagline">{tagline}</p>}
          <div className="gm-facts">
            {rating && (
              <span className="gm-rating">
                <Star style={{ color: currentTheme.accent }} />
                {rating}
              </span>
            )}
            {facts.map((f) => (
              <span key={f} className="gm-fact">
                {f}
              </span>
            ))}
          </div>
          {ratings}
          {extra}
          <div ref={ctaRef} className="gm-cta-row">
            <GuestPrimaryButton label={t('Jetzt tracken — kostenlos')} onClick={onCta} />
            {secondary}
          </div>
          <p className="gm-cta-note">{t('Kostenlos · ohne Abo · in 30 Sekunden startklar')}</p>
        </div>
      </motion.div>
    </section>
  );
}

export function GuestRatings({
  tmdb,
  imdb,
  tvrank,
}: {
  tmdb?: GuestRatingValue | null;
  imdb?: GuestRatingValue | null;
  tvrank?: GuestRatingValue | null;
}) {
  const { currentTheme } = useTheme();
  const badges = [
    tmdb && { key: 'tmdb', label: 'TMDB', bg: '#01b4e4', fg: '#0d253f', rating: tmdb },
    imdb && { key: 'imdb', label: 'IMDb', bg: '#f5c518', fg: '#000', rating: imdb },
    tvrank && {
      key: 'tvrank',
      label: 'TV-RANK',
      bg: currentTheme.primary,
      fg: currentTheme.background.default,
      rating: tvrank,
    },
  ].filter((b): b is NonNullable<typeof b> => !!b && b.rating.value > 0);
  if (badges.length === 0) return null;
  return (
    <div className="gm-ratings">
      {badges.map((b) => {
        const content = (
          <>
            <span className="gm-ratings__label" style={{ background: b.bg, color: b.fg }}>
              {b.label}
            </span>
            <span className="gm-ratings__stack">
              <span className="gm-ratings__value">
                {b.rating.value.toFixed(1)}
                <small>/10</small>
              </span>
              {b.rating.votes && (
                <span className="gm-ratings__votes">
                  {t('{n} Stimmen', { n: formatVoteCount(b.rating.votes) })}
                </span>
              )}
            </span>
          </>
        );
        return b.rating.href ? (
          <a
            key={b.key}
            href={b.rating.href}
            target="_blank"
            rel="noopener noreferrer"
            className="gm-ratings__badge"
          >
            {content}
          </a>
        ) : (
          <span key={b.key} className="gm-ratings__badge">
            {content}
          </span>
        );
      })}
    </div>
  );
}

export function GuestNoticeCard({ notice }: { notice: GuestNotice }) {
  const { currentTheme } = useTheme();
  return (
    <div className="gm-next" style={{ borderColor: `${currentTheme.primary}55` }}>
      <NotificationsActive style={{ color: currentTheme.primary }} />
      <div>
        <p className="gm-next__title">{notice.title}</p>
        <p className="gm-next__text">{notice.text}</p>
      </div>
    </div>
  );
}

export function GuestTrailerButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button whileTap={{ opacity: 0.7 }} onClick={onClick} className="gm-btn gm-btn--ghost">
      <PlayArrow />
      {t('Trailer')}
    </motion.button>
  );
}

export function GuestTrailer({
  videoKey,
  cover,
  title,
  playing,
  onPlay,
}: {
  videoKey: string;
  cover?: string;
  title: string;
  playing: boolean;
  onPlay: () => void;
}) {
  const { currentTheme } = useTheme();
  const gradient = useGradient();
  return (
    <div className="gm-trailer">
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoKey}?autoplay=1&rel=0`}
          title={`${title} – ${t('Trailer')}`}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      ) : (
        <button
          className="gm-trailer__cover"
          onClick={onPlay}
          aria-label={t('Trailer abspielen')}
          style={cover ? { backgroundImage: `url(${cover})` } : undefined}
        >
          <span className="gm-trailer__play" style={{ background: gradient }}>
            <PlayArrow style={{ color: currentTheme.background.default }} />
          </span>
        </button>
      )}
    </div>
  );
}

export function GuestStory({
  overviewTitle,
  overview,
  notice,
  media,
  below,
}: {
  overviewTitle?: string;
  overview?: string;
  notice?: GuestNotice | null;
  media?: ReactNode;
  below?: ReactNode;
}) {
  if (!overview && !notice && !media && !below) return null;
  return (
    <section className={`gm-section gm-story${media ? '' : ' gm-story--single'}`}>
      {(overview || notice) && (
        <div className="gm-story__text">
          {overview && (
            <>
              <h2 className="gm-h2">{overviewTitle ?? t('Worum geht’s')}</h2>
              <p className="gm-overview">{overview}</p>
            </>
          )}
          {notice && <GuestNoticeCard notice={notice} />}
        </div>
      )}
      {media && <div className="gm-story__trailer">{media}</div>}
      {below && <div className="gm-story__cast">{below}</div>}
    </section>
  );
}

export function GuestRail({
  title,
  items,
  variant = 'poster',
  bare,
}: {
  title: string;
  items: GuestRailItem[];
  variant?: 'poster' | 'person' | 'still';
  bare?: boolean;
}) {
  const { currentTheme } = useTheme();
  if (items.length === 0) return null;
  const body = (
    <>
      <h2 className="gm-h2">{title}</h2>
      <div className="gm-rail">
        {items.map((item) => {
          const content =
            variant === 'person' ? (
              <>
                <div className="gm-person__photo">
                  {item.image ? (
                    <img src={item.image} alt={item.title} loading="lazy" />
                  ) : (
                    <span>{item.title.charAt(0)}</span>
                  )}
                </div>
                <p className="gm-card__title">{item.title}</p>
                {item.sub && <p className="gm-card__sub">{item.sub}</p>}
              </>
            ) : (
              <>
                <div
                  className="gm-card__cover"
                  style={
                    item.current ? { outline: `2px solid ${currentTheme.primary}` } : undefined
                  }
                >
                  {item.image ? (
                    <img src={item.image} alt={item.title} loading="lazy" />
                  ) : (
                    <span className="gm-card__placeholder">{item.badge ?? item.title}</span>
                  )}
                  {item.badge && item.image && <span className="gm-card__badge">{item.badge}</span>}
                </div>
                <p className="gm-card__title">{item.title}</p>
                {item.sub && <p className="gm-card__sub">{item.sub}</p>}
              </>
            );
          const className =
            variant === 'person'
              ? 'gm-person'
              : variant === 'still'
                ? 'gm-similar gm-similar--still'
                : 'gm-similar';
          return item.to && !item.current ? (
            <Link key={item.key} to={item.to} className={className}>
              {content}
            </Link>
          ) : (
            <div key={item.key} className={className}>
              {content}
            </div>
          );
        })}
      </div>
    </>
  );
  return bare ? body : <section className="gm-section">{body}</section>;
}

export function GuestPitch({
  heading,
  cover,
  title,
  mockSub,
  progress,
  chips,
  features,
}: {
  heading: string;
  cover?: string;
  title: string;
  mockSub: string;
  progress: number;
  chips: { icon: ReactNode; label: string }[];
  features: GuestFeature[];
}) {
  const { currentTheme } = useTheme();
  const gradient = useGradient();
  return (
    <section className="gm-section gm-pitch">
      <div className="gm-pitch__head">
        <p className="gm-eyebrow" style={{ color: currentTheme.primary }}>
          {t('Warum TV-RANK')}
        </p>
        <h2 className="gm-h2 gm-h2--big">{heading}</h2>
      </div>
      <div className="gm-pitch__grid">
        <div className="gm-mock">
          <div className="gm-mock__row">
            {cover && <img src={cover} alt="" />}
            <div className="gm-mock__info">
              <p className="gm-mock__title">{title}</p>
              <p className="gm-mock__sub">{mockSub}</p>
              <div className="gm-mock__bar">
                <span style={{ width: `${progress}%`, background: gradient }} />
              </div>
            </div>
          </div>
          <div className="gm-mock__chips">
            {chips.map((chip, i) => (
              <span key={chip.label} style={i === 0 ? { color: currentTheme.primary } : undefined}>
                {chip.icon} {chip.label}
              </span>
            ))}
          </div>
          <p className="gm-mock__caption">{t('So sieht es in deiner App aus')}</p>
        </div>
        <div className="gm-features">
          {features.map((f) => (
            <div key={f.title} className="gm-feature">
              <span
                className="gm-feature__icon"
                style={{ color: currentTheme.primary, background: `${currentTheme.primary}1f` }}
              >
                {f.icon}
              </span>
              <div>
                <p className="gm-feature__title">{f.title}</p>
                <p className="gm-feature__text">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function GuestFinal({
  cover,
  title,
  onCta,
}: {
  cover?: string;
  title: string;
  onCta: () => void;
}) {
  const navigate = useNavigate();
  const [installTarget] = useState(detectAppInstallTarget);
  return (
    <section className="gm-section gm-final">
      {cover && <img src={cover} alt="" className="gm-final__poster" />}
      <div>
        <h2 className="gm-h2 gm-h2--big">{t('Bereit für {title}?', { title })}</h2>
        <p className="gm-final__text">
          {t('Leg ein kostenloses Konto an — {title} steht dann schon auf deiner Liste.', {
            title,
          })}
        </p>
        <div className="gm-cta-row">
          <GuestPrimaryButton label={t('Jetzt tracken — kostenlos')} onClick={onCta} />
          {installTarget.os && (
            <a
              href={installTarget.url}
              target="_blank"
              rel="noopener noreferrer"
              className="gm-btn gm-btn--ghost"
            >
              {installTarget.os === 'ios' ? t('Im App Store laden') : t('Bei Google Play laden')}
            </a>
          )}
        </div>
        <button onClick={() => navigate('/login')} className="gm-link">
          {t('Schon ein Konto? Anmelden')}
        </button>
      </div>
    </section>
  );
}

export function GuestLegal({ source }: { source: string }) {
  return (
    <footer className="gm-legal">
      <Link to="/privacy">{t('Datenschutz')}</Link>
      <Link to="/impressum">{t('Impressum')}</Link>
      <span>{source}</span>
    </footer>
  );
}

export function GuestSticky({
  visible,
  cover,
  title,
  onCta,
}: {
  visible: boolean;
  cover?: string;
  title: string;
  onCta: () => void;
}) {
  return (
    <div className={`gm-sticky${visible ? ' gm-sticky--on' : ''}`} aria-hidden={!visible}>
      {cover && <img src={cover} alt="" />}
      <p className="gm-sticky__title">{title}</p>
      <GuestPrimaryButton label={t('Kostenlos tracken')} onClick={onCta} small />
    </div>
  );
}
