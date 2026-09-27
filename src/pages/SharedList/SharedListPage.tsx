import { Check, ListAlt, Star } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { PageHeader, PageLayout } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useMovieList } from '../../contexts/MovieListContext';
import { useSeriesList } from '../../contexts/SeriesListContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useRatingFolders } from '../../hooks/rating/useRatingFolders';
import { detectAppInstallTarget } from '../../lib/platform/appInstallTarget';
import {
  sharedListItemPath,
  type SharedList,
  type SharedListItem,
} from '../../lib/rating/sharedList';
import { addGuestPick } from '../../services/account/guestOnboarding';
import { t } from '../../services/i18n';
import { fetchSharedList } from '../../services/rating/sharedListService';
import { getImageUrl } from '../../utils/imageUrl';
import { listSubtitle } from './listSubtitle';
import './SharedListPage.css';

type LoadState = { id: string; list: SharedList | null } | null;

const GUEST_PICKS = 10;

export const SharedListPage = ({
  listId,
  preview,
}: {
  listId?: string;
  /** Nur für /dev/ui-preview: fertige Liste statt RTDB-Read. */
  preview?: { list: SharedList; guest: boolean };
}) => {
  const params = useParams<{ id: string }>();
  const id = listId ?? params.id ?? '';
  const { user } = useAuth() || {};
  const { currentTheme: theme } = useTheme();
  const navigate = useNavigate();
  const { allSeriesList } = useSeriesList();
  const { movieList } = useMovieList();
  const { folders } = useRatingFolders();
  const [state, setState] = useState<LoadState>(null);
  const [installTarget] = useState(detectAppInstallTarget);

  useEffect(() => {
    if (preview) return;
    let cancelled = false;
    fetchSharedList(id)
      .then((list) => !cancelled && setState({ id, list }))
      .catch(() => !cancelled && setState({ id, list: null }));
    return () => {
      cancelled = true;
    };
  }, [id, preview]);

  const owned = useMemo(() => {
    const keys = new Set<string>();
    for (const s of allSeriesList) keys.add(`s${s.id}`);
    for (const m of movieList) keys.add(`m${m.id}`);
    return keys;
  }, [allSeriesList, movieList]);

  const loaded = preview ? { id, list: preview.list } : state?.id === id ? state : null;
  const list = loaded?.list ?? null;
  const guest = preview ? preview.guest : !user;

  if (!preview && user && (list?.owner === user.uid || folders.some((f) => f.id === id))) {
    return <Navigate to={`/ratings?tab=folders&folder=${encodeURIComponent(id)}`} replace />;
  }

  const subtitle = list ? listSubtitle(list.ownerName, list.items.length) : '';

  const startWithList = () => {
    if (!list) return;
    for (const item of list.items.slice(0, GUEST_PICKS)) {
      addGuestPick({
        id: item.id,
        type: item.k === 'm' ? 'movie' : 'series',
        title: item.t,
        poster_path: item.p ?? null,
        vote_average: 0,
      });
    }
    navigate('/join');
  };

  const body = !loaded ? (
    <div className="sl-grid" aria-busy>
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="sl-card">
          <div className="sl-card__art sl-card__art--skeleton" />
        </div>
      ))}
    </div>
  ) : !list ? (
    <div className="sl-empty" style={{ color: theme.text.secondary }}>
      <ListAlt style={{ fontSize: 48, color: theme.text.muted }} />
      <p>{t('Diese Liste gibt es nicht mehr oder sie wird nicht mehr geteilt.')}</p>
      <button
        type="button"
        className="sl-btn"
        onClick={() => navigate('/')}
        style={{ borderColor: theme.border.default, color: theme.text.primary }}
      >
        {t('Zur Startseite')}
      </button>
    </div>
  ) : list.items.length === 0 ? (
    <div className="sl-empty" style={{ color: theme.text.secondary }}>
      <ListAlt style={{ fontSize: 48, color: theme.text.muted }} />
      <p>{t('Diese Liste ist noch leer')}</p>
    </div>
  ) : (
    <div className="sl-grid">
      {list.items.map((item) => (
        <SharedListCard
          key={`${item.k}${item.id}`}
          item={item}
          inLibrary={!guest && owned.has(`${item.k}${item.id}`)}
          onOpen={() => navigate(sharedListItemPath(item))}
        />
      ))}
    </div>
  );

  const backdrop = list?.items.find((i) => i.p)?.p;

  return (
    <PageLayout
      style={{
        position: 'fixed',
        inset: 0,
        height: 'var(--vh, 100dvh)',
        overflowY: 'auto',
        overflowX: 'hidden',
        color: theme.text.primary,
      }}
    >
      {backdrop && (
        <div aria-hidden className="sl-backdrop">
          <div
            className="sl-backdrop__img"
            style={{ backgroundImage: `url(${getImageUrl(backdrop, 'w342', '')})` }}
          />
        </div>
      )}

      <div className="sl-content">
        {guest ? (
          <header className="sl-guest-head">
            <button
              type="button"
              className="sl-wordmark"
              onClick={() => navigate('/')}
              aria-label="TV-RANK"
              style={{
                backgroundImage: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
              }}
            >
              TV-RANK
            </button>
            {list && (
              <>
                <p className="sl-eyebrow" style={{ color: theme.primary }}>
                  {t('Geteilte Liste')}
                </p>
                <h1 className="sl-title">{list.name}</h1>
                <p className="sl-subtitle" style={{ color: theme.text.secondary }}>
                  {subtitle}
                </p>
              </>
            )}
          </header>
        ) : (
          <PageHeader
            title={list?.name ?? t('Liste')}
            subtitle={subtitle || undefined}
            gradientFrom={theme.text.primary}
            gradientTo={theme.text.secondary}
            sticky={false}
          />
        )}

        {guest && list && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="sl-cta"
            style={{ background: `${theme.background.default}cc` }}
          >
            <div className="sl-cta__text">
              <strong>{t('Folgen abhaken, bewerten, eigene Listen anlegen')}</strong>
              <span style={{ color: theme.text.muted }}>
                {t('Starte mit dieser Liste bei TV-RANK — kostenlos.')}
              </span>
            </div>
            <div className="sl-cta__buttons">
              <button
                type="button"
                className="sl-btn sl-btn--primary"
                onClick={startWithList}
                style={{
                  background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                  color: theme.background.default,
                }}
              >
                {t('Jetzt starten')}
              </button>
              <button
                type="button"
                className="sl-btn"
                onClick={() => navigate('/login')}
                style={{ borderColor: theme.border.default, color: theme.text.primary }}
              >
                {t('Anmelden')}
              </button>
              {installTarget.os && (
                <a
                  className="sl-btn"
                  href={installTarget.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ borderColor: `${theme.primary}55`, color: theme.primary }}
                >
                  {installTarget.os === 'ios'
                    ? t('Im App Store laden')
                    : t('Bei Google Play laden')}
                </a>
              )}
            </div>
          </motion.div>
        )}

        {body}
      </div>
    </PageLayout>
  );
};

const SharedListCard = ({
  item,
  inLibrary,
  onOpen,
}: {
  item: SharedListItem;
  inLibrary: boolean;
  onOpen: () => void;
}) => {
  const { currentTheme: theme } = useTheme();
  const poster = getImageUrl(item.p, 'w342');
  return (
    <button type="button" className="sl-card" onClick={onOpen} aria-label={item.t}>
      <div className="sl-card__art" style={{ borderColor: theme.border.default }}>
        <img src={poster} alt="" loading="lazy" />
        {item.r !== undefined && (
          <span className="sl-card__rating" style={{ color: theme.accent }}>
            <Star style={{ fontSize: 13 }} />
            {item.r.toFixed(1)}
          </span>
        )}
        {inLibrary && (
          <span
            className="sl-card__owned"
            title={t('In deiner Bibliothek')}
            style={{ background: theme.primary, color: theme.background.default }}
          >
            <Check style={{ fontSize: 14 }} />
          </span>
        )}
      </div>
      <span className="sl-card__title" style={{ color: theme.text.primary }}>
        {item.t}
      </span>
      <span className="sl-card__meta" style={{ color: theme.text.muted }}>
        {[item.k === 'm' ? t('Film') : t('Serie'), item.y].filter(Boolean).join(' · ')}
      </span>
    </button>
  );
};
