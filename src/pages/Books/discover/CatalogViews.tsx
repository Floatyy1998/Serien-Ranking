import React, { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  BackButton,
  FilterPill,
  HorizontalScrollContainer,
  TabSwitcher,
} from '../../../components/ui';
import { useTheme } from '../../../contexts/ThemeContext';
import { useCatalogFeed } from '../../../hooks/books/useCatalogFeed';
import { curateShelf } from '../../../lib/books/discoverMix';
import type { ShelfSort } from '../../../services/api/bookDiscovery';
import { t } from '../../../services/i18n';
import { BookCover } from '../components/BookCover';
import '../components/books.css';
import {
  CATALOG_GENRES,
  CATALOG_GROUPS,
  CATALOG_MOODS,
  catalogGenre,
  catalogGroup,
} from '../data/genreCatalog';
import { SORT_HINTS, SORT_LABELS } from '../data/genres';
import { DiscoverCard, SkeletonCards } from './DiscoverParts';
import './discover.css';
import { useAddFlow, useHideOwned } from './useAddFlow';

const SORTS: ShelfSort[] = ['popular', 'top', 'gems', 'recent'];
const FEW_RESULTS = 6;

/** Ein Katalog-Genre und/oder eine Stimmung als Poster-Raster mit Sortierung und Stimmungsfilter. */
export const CatalogGenreView: React.FC<{ genre?: string; mood?: string }> = ({ genre, mood }) => {
  const { currentTheme } = useTheme();
  const [params, setParams] = useSearchParams();
  const info = catalogGenre(genre);
  const group = info ? catalogGroup(info.group) : undefined;
  const moodInfo = CATALOG_MOODS.find((m) => m.id === mood);
  const sort = SORTS.find((s) => s === params.get('sort')) ?? SORTS[0];
  const { sentinelRef, items, loading, loadingMore, error, finished } = useCatalogFeed(genre, {
    mood,
    sort,
  });
  const hideOwned = useHideOwned();
  const { items: shown, hidden } = useMemo(
    () => curateShelf(items, { isOwned: hideOwned, perAuthor: 1 }),
    [items, hideOwned]
  );
  const { openAdd, sheet } = useAddFlow();
  const colors = group?.colors ?? [currentTheme.primary, currentTheme.accent];
  const title = info?.label() ?? moodInfo?.label() ?? t('Genres & Stimmungen');

  const setParam = (key: 'sort' | 'mood', value: string | undefined) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true }
    );

  return (
    <div className="bk-page" style={{ background: currentTheme.background.default }}>
      <header
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: 'calc(14px + env(safe-area-inset-top)) 20px 26px',
          marginBottom: 18,
          background: `linear-gradient(160deg, ${colors[0]}, ${colors[1]}aa 60%, ${currentTheme.background.default})`,
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            right: -20,
            bottom: -30,
            display: 'flex',
            gap: 10,
            opacity: 0.55,
            transform: 'rotate(-8deg)',
          }}
        >
          {shown.slice(0, 4).map((r) => (
            <BookCover key={r.id} book={r} width={84} />
          ))}
        </div>
        <div style={{ position: 'relative' }}>
          <BackButton />
        </div>
        <h1
          style={{
            position: 'relative',
            margin: '22px 0 4px',
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            fontSize: 'clamp(30px, 3vw + 18px, 52px)',
            letterSpacing: '-0.03em',
            color: '#fff',
            textShadow: '0 4px 24px rgba(0,0,0,0.35)',
          }}
        >
          {title}
        </h1>
        <p
          style={{
            position: 'relative',
            margin: 0,
            color: 'rgba(255,255,255,0.85)',
            fontWeight: 600,
          }}
        >
          {info && moodInfo ? `${moodInfo.label()} · ${SORT_HINTS[sort]()}` : SORT_HINTS[sort]()}
        </p>
      </header>

      <div className="dsc-filters">
        <TabSwitcher
          className="dsc-sort-tabs"
          tabs={SORTS.map((s) => ({ id: s, label: SORT_LABELS[s]() }))}
          activeTab={sort}
          onTabChange={(s) => setParam('sort', s === SORTS[0] ? undefined : s)}
          style={{ margin: '0 20px' }}
        />
        <HorizontalScrollContainer scrollerClassName="dsc-themes" gap={8}>
          <FilterPill
            label={t('Egal')}
            active={!mood}
            onClick={() => setParam('mood', undefined)}
          />
          {CATALOG_MOODS.map((m) => (
            <FilterPill
              key={m.id}
              label={m.label()}
              active={mood === m.id}
              onClick={() => setParam('mood', m.id)}
            />
          ))}
        </HorizontalScrollContainer>
      </div>

      {!loading && !loadingMore && finished && shown.length === 0 ? (
        <div className="bk-card dsc-empty" style={{ color: currentTheme.text.muted }}>
          {error
            ? t('Die Buchsuche ist gerade nicht erreichbar.')
            : t(
                'Hier ist gerade nichts Neues für dich dabei. Probier eine andere Sortierung oder ein anderes Thema.'
              )}
        </div>
      ) : (
        <div className="dsc-grid">
          {loading && shown.length === 0 ? (
            <SkeletonCards count={12} />
          ) : (
            shown.map((r) => <DiscoverCard key={r.id} result={r} onAdd={openAdd} />)
          )}
          {loadingMore && <SkeletonCards count={6} />}
        </div>
      )}
      <div ref={sentinelRef} aria-hidden style={{ height: 1 }} />
      {finished && shown.length > 0 && shown.length < FEW_RESULTS && (
        <p className="dsc-hidden-note" style={{ color: currentTheme.text.muted }}>
          {t('Nur wenige Treffer. Mit einer anderen Sortierung oder „Alle“ findest du mehr.')}
        </p>
      )}
      {!loading && hidden > 0 && (
        <p className="dsc-hidden-note" style={{ color: currentTheme.text.muted }}>
          {hidden === 1
            ? t('Ein Buch aus deiner Sammlung ausgeblendet')
            : t('{n} Bücher aus deiner Sammlung ausgeblendet', { n: hidden })}
        </p>
      )}
      <p className="dsc-hidden-note" style={{ color: currentTheme.text.muted }}>
        {t('Daten von Hardcover')}
      </p>
      {sheet}
    </div>
  );
};

/** Alle Genres nach Gruppen plus Stimmungen — Einstieg ins Entdecken über den ganzen Katalog. */
export const AllGenresView: React.FC = () => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <div className="bk-page" style={{ background: currentTheme.background.default }}>
      <header style={{ padding: 'calc(14px + env(safe-area-inset-top)) 20px 8px' }}>
        <BackButton />
        <h1
          style={{
            margin: '18px 0 4px',
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            fontSize: 'clamp(28px, 3vw + 16px, 46px)',
            letterSpacing: '-0.03em',
            color: currentTheme.text.primary,
          }}
        >
          {t('Genres & Stimmungen')}
        </h1>
      </header>

      <section className="bk-section">
        <h2 className="dsc-group-title" style={{ color: currentTheme.text.secondary }}>
          {t('Nach Stimmung')}
        </h2>
        <HorizontalScrollContainer scrollerClassName="dsc-themes" gap={8}>
          {CATALOG_MOODS.map((m) => (
            <FilterPill
              key={m.id}
              label={m.label()}
              active={false}
              onClick={() => navigate(`/books/search?mood=${m.id}`)}
            />
          ))}
        </HorizontalScrollContainer>
      </section>

      {CATALOG_GROUPS.map((group) => {
        const Icon = group.icon;
        return (
          <section key={group.id} className="bk-section">
            <h2 className="dsc-group-title" style={{ color: currentTheme.text.secondary }}>
              {group.label()}
            </h2>
            <div className="dsc-genres">
              {CATALOG_GENRES.filter((g) => g.group === group.id).map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className="dsc-genre"
                  onClick={() => navigate(`/books/search?cat=${g.id}`)}
                  style={{
                    background: `radial-gradient(120% 140% at 0% 100%, ${group.colors[0]}, transparent 70%), linear-gradient(135deg, ${group.colors[0]}, ${group.colors[1]})`,
                  }}
                >
                  <Icon className="dsc-genre-icon" aria-hidden />
                  <span className="dsc-genre-label">{g.label()}</span>
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
};
