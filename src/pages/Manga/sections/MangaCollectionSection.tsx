import { AutoStories, CheckCircle, Close, Search, Star } from '@mui/icons-material';
import React, { forwardRef, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState, SectionHeader } from '../../../components/ui';
import { LoadingSpinner } from '../../../components/ui/feedback/LoadingSpinner';
import { useAuth } from '../../../contexts/AuthContext';
import { useMangaList } from '../../../contexts/MangaListContext';
import { useTheme } from '../../../contexts/ThemeContext';
import {
  filterCollection,
  mangaProgressPercent,
  mangaTotalChapters,
  userMangaRating,
  type CollectionFilter,
  type CollectionSort,
} from '../../../lib/manga/overview';
import { t } from '../../../services/i18n';
import type { Manga } from '../../../types/Manga';
import { getDisplayFormat, STATUS_COLORS, STATUS_LABELS } from '../mangaUtils';

const PREFS_KEY = 'mangaCollectionPrefs';

const SORT_LABELS: Record<CollectionSort, string> = {
  recent: t('Zuletzt gelesen'),
  added: t('Zuletzt hinzugefügt'),
  title: t('Titel A–Z'),
  rating: t('Deine Bewertung'),
  progress: t('Fortschritt'),
};

const FORMAT_FILTERS = [
  { key: 'all', label: t('Alle Formate') },
  { key: 'MANGA', label: 'Manga' },
  { key: 'MANHWA', label: 'Manhwa' },
  { key: 'MANHUA', label: 'Manhua' },
];

const readPrefs = (): Omit<CollectionFilter, 'query'> => {
  try {
    const raw = JSON.parse(localStorage.getItem(PREFS_KEY) || 'null');
    if (raw && typeof raw === 'object') {
      return {
        status: typeof raw.status === 'string' ? raw.status : 'all',
        format: typeof raw.format === 'string' ? raw.format : 'all',
        sort: raw.sort in SORT_LABELS ? raw.sort : 'recent',
      };
    }
  } catch {
    /* ignore */
  }
  return { status: 'all', format: 'all', sort: 'recent' };
};

export const MangaCollectionSection = React.memo(
  forwardRef<HTMLElement>(function MangaCollectionSection(_props, ref) {
    const { currentTheme } = useTheme();
    const { user } = useAuth() || {};
    const { mangaList, loading } = useMangaList();
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [prefs, setPrefs] = useState(readPrefs);

    useEffect(() => {
      try {
        localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
      } catch {
        /* ignore */
      }
    }, [prefs]);

    const statusCounts = useMemo(() => {
      const counts: Record<string, number> = {};
      for (const m of mangaList) counts[m.readStatus] = (counts[m.readStatus] || 0) + 1;
      return counts;
    }, [mangaList]);

    const formatsPresent = useMemo(
      () => new Set(mangaList.map((m) => m.format || 'MANGA')),
      [mangaList]
    );

    const visible = useMemo(
      () => filterCollection(mangaList, { ...prefs, query }, user?.uid),
      [mangaList, prefs, query, user?.uid]
    );

    if (loading && mangaList.length === 0) {
      return <LoadingSpinner text={t('Sammlung wird geladen …')} />;
    }

    if (mangaList.length === 0) {
      return (
        <section ref={ref} className="manga-section">
          <EmptyState
            icon={<AutoStories style={{ fontSize: 48 }} />}
            title={t('Deine Manga-Sammlung')}
            description={t(
              'Suche oben nach Manga, Manhwa oder Manhua und füge sie zu deiner Sammlung hinzu.'
            )}
            action={{ label: t('Manga suchen'), onClick: () => navigate('/manga/search') }}
          />
        </section>
      );
    }

    const statusActive = prefs.status !== 'all' && (statusCounts[prefs.status] || 0) > 0;
    const activeStatus = statusActive ? prefs.status : 'all';

    return (
      <section ref={ref} className="manga-section" id="manga-collection">
        <SectionHeader
          icon={<AutoStories />}
          iconColor={currentTheme.accent}
          title={t('Sammlung')}
          action={
            <span className="manga-count-chip" style={{ color: currentTheme.text.muted }}>
              {visible.length === mangaList.length
                ? mangaList.length
                : `${visible.length} / ${mangaList.length}`}
            </span>
          }
        />

        <div className="manga-collection-toolbar">
          <label className="manga-collection-search">
            <Search style={{ fontSize: 18, color: currentTheme.text.muted }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('In deiner Sammlung suchen')}
              aria-label={t('In deiner Sammlung suchen')}
            />
            {query && (
              <button
                type="button"
                className="manga-collection-clear"
                onClick={() => setQuery('')}
                aria-label={t('Suche leeren')}
                style={{ color: currentTheme.text.muted }}
              >
                <Close style={{ fontSize: 16 }} />
              </button>
            )}
          </label>
          <select
            className="manga-collection-sort"
            value={prefs.sort}
            onChange={(e) => setPrefs((p) => ({ ...p, sort: e.target.value as CollectionSort }))}
            aria-label={t('Sortierung')}
          >
            {(Object.keys(SORT_LABELS) as CollectionSort[]).map((key) => (
              <option key={key} value={key}>
                {SORT_LABELS[key]}
              </option>
            ))}
          </select>
        </div>

        <div className="manga-pill-row" role="tablist" aria-label={t('Lesestatus')}>
          <button
            type="button"
            role="tab"
            aria-selected={activeStatus === 'all'}
            className={`manga-pill ${activeStatus === 'all' ? 'manga-pill--active' : ''}`}
            onClick={() => setPrefs((p) => ({ ...p, status: 'all' }))}
          >
            {t('Alle')} <span className="manga-pill-count">{mangaList.length}</span>
          </button>
          {Object.entries(STATUS_LABELS).map(([key, label]) =>
            (statusCounts[key] || 0) > 0 ? (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={activeStatus === key}
                className={`manga-pill ${activeStatus === key ? 'manga-pill--active' : ''}`}
                onClick={() => setPrefs((p) => ({ ...p, status: key }))}
              >
                <span className="manga-pill-dot" style={{ background: STATUS_COLORS[key] }} />
                {label} <span className="manga-pill-count">{statusCounts[key]}</span>
              </button>
            ) : null
          )}
          {formatsPresent.size > 1 && (
            <>
              <span className="manga-pill-sep" aria-hidden />
              {FORMAT_FILTERS.filter((f) => f.key === 'all' || formatsPresent.has(f.key)).map(
                (f) => (
                  <button
                    key={f.key}
                    type="button"
                    className={`manga-pill ${prefs.format === f.key ? 'manga-pill--active' : ''}`}
                    onClick={() => setPrefs((p) => ({ ...p, format: f.key }))}
                  >
                    {f.label}
                  </button>
                )
              )}
            </>
          )}
        </div>

        {visible.length > 0 ? (
          <div className="manga-collection-grid" style={{ padding: '0 20px' }}>
            {visible.map((manga) => (
              <CollectionCard
                key={manga.anilistId}
                manga={manga}
                rating={userMangaRating(manga, user?.uid)}
                onClick={() => navigate(`/manga/${manga.anilistId}`)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Search style={{ fontSize: 40 }} />}
            title={t('Keine Manga gefunden')}
            description={
              query
                ? t('Nichts in deiner Sammlung passt zu „{query}“.', { query })
                : t('Mit diesen Filtern ist deine Sammlung leer.')
            }
          />
        )}
      </section>
    );
  })
);

const CollectionCard = ({
  manga,
  rating,
  onClick,
}: {
  manga: Manga;
  rating: number;
  onClick: () => void;
}) => {
  const total = mangaTotalChapters(manga);
  const progress = mangaProgressPercent(manga);
  const unread = total > 0 ? total - (manga.currentChapter || 0) : 0;
  const statusColor = STATUS_COLORS[manga.readStatus];

  return (
    <div
      className="manga-collection-item"
      role="button"
      tabIndex={0}
      aria-label={manga.title}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="manga-collection-card">
        <img
          className="manga-collection-poster"
          src={manga.poster}
          alt={manga.title}
          loading="lazy"
          decoding="async"
        />
        <div className="manga-collection-overlay">
          <div className="manga-collection-top">
            <span
              className="manga-collection-status"
              title={STATUS_LABELS[manga.readStatus]}
              style={{ '--status-color': statusColor } as React.CSSProperties}
            >
              {manga.readStatus === 'completed' ? (
                <CheckCircle style={{ fontSize: 12 }} />
              ) : (
                <span className="manga-collection-status-dot" />
              )}
              {STATUS_LABELS[manga.readStatus]}
            </span>
            {rating > 0 && (
              <span className="manga-collection-rating">
                <Star style={{ fontSize: 12 }} />
                {rating}
              </span>
            )}
          </div>
          <div className="manga-collection-bottom">
            <div className="manga-collection-title">{manga.title}</div>
            <div className="manga-collection-meta">
              {manga.currentChapter > 0
                ? total > 0
                  ? t('Kap. {a} / {b}', { a: manga.currentChapter, b: total })
                  : t('Kap. {n}', { n: manga.currentChapter })
                : getDisplayFormat(manga.countryOfOrigin, manga.format)}
              {manga.readStatus === 'reading' && unread > 0 && (
                <span className="manga-collection-unread">{t('{n} offen', { n: unread })}</span>
              )}
            </div>
            {progress > 0 && (
              <div className="manga-collection-progress" aria-hidden>
                <span style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
