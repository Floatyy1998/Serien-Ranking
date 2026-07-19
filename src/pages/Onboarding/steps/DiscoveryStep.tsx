import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ContentCard, type WatchSummary } from '../components/ContentCard';
import { CoverWall } from '../components/CoverWall';
import { LetterReveal } from '../components/LetterReveal';
import { TableOfContents } from '../components/TableOfContents';
import { WatchStatusSheet } from '../components/WatchStatusSheet';
import type { WatchTarget } from '../hooks/useApplyWatchProgress';
import type { OnboardingItem } from '../hooks/useOnboardingSearch';
import { t } from '../../../services/i18n';

interface Props {
  contentType: 'series' | 'movie';
  stepNumber: 2 | 3;
  suggestions: OnboardingItem[];
  searchResults: OnboardingItem[];
  loading: boolean;
  searchLoading: boolean;
  pendingMap: Map<string, OnboardingItem>;
  pendingId: string | null;
  watchTargets: Map<number, WatchTarget>;
  onSearchChange: (query: string) => void;
  onTogglePending: (item: OnboardingItem) => void;
  onRemovePending: (item: OnboardingItem) => void;
  onSetWatchTarget: (tmdbId: number, target: WatchTarget) => void;
  onClearSearch: () => void;
  onNext: () => void;
  onBack: () => void;
}

function targetToSummary(t: WatchTarget | undefined): WatchSummary | undefined {
  if (!t || t.kind === 'none') return undefined;
  if (t.kind === 'total') return { kind: 'total' };
  return {
    kind: 'upToEpisode',
    seasonNumber: t.seasonIdx + 1,
    episodeNumber: t.episodeIdx + 1,
  };
}

const SearchIcon = (
  <svg viewBox="0 0 24 24" fill="none" className="ob-search__icon">
    <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M16 16l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const DiscoveryStep: React.FC<Props> = ({
  contentType,
  stepNumber,
  suggestions,
  searchResults,
  loading,
  searchLoading,
  pendingMap,
  pendingId,
  watchTargets,
  onSearchChange,
  onTogglePending,
  onRemovePending,
  onSetWatchTarget,
  onClearSearch,
  onNext,
  onBack,
}) => {
  const [query, setQuery] = useState('');
  const [sheetItem, setSheetItem] = useState<OnboardingItem | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isSearching = query.trim().length > 0;
  useEffect(() => {
    onSearchChange(query);
  }, [query, onSearchChange]);

  const displayItems = useMemo(() => {
    const source = isSearching ? searchResults : suggestions;
    return source.filter((it) => it.type === contentType);
  }, [isSearching, searchResults, suggestions, contentType]);

  const added = useMemo(
    () => Array.from(pendingMap.values()).filter((i) => i.type === contentType),
    [pendingMap, contentType]
  );
  const addedCount = added.length;

  const isAdded = (it: OnboardingItem) => pendingMap.has(`${it.type}-${it.id}`);

  const handlePrimaryTap = (it: OnboardingItem) => {
    if (it.type === 'series') {
      if (!isAdded(it)) onTogglePending(it);
      setSheetItem(it);
    } else {
      onTogglePending(it);
    }
  };

  const headline = contentType === 'series' ? t('Serien') : t('Filme');
  const section = stepNumber === 2 ? '02' : '03';
  const subhead =
    contentType === 'series'
      ? t('Was läuft, was schaust, was willst du verfolgen?')
      : t('Welche Filme dürfen nicht fehlen?');

  return (
    <>
      <motion.div
        className="ob-step"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
      >
        <CoverWall />

        <div
          style={{
            position: 'relative',
            zIndex: 2,
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            padding: 'clamp(18px, 4vw, 48px) clamp(20px, 5vw, 56px) 0',
            gap: 'clamp(18px, 3vw, 30px)',
            overflow: 'hidden',
          }}
        >
          {/* Mast head */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <button onClick={onBack} className="ob-link" style={{ padding: '6px 0', fontSize: 11 }}>
              {t('← zurück')}
            </button>
            <span className="ob-mono" style={{ color: 'rgba(244,237,224,0.4)' }}>
              {section} — {contentType === 'series' ? t('serien') : t('filme')}
            </span>
          </div>

          {/* Editorial header */}
          <div>
            <h1
              className="ob-display"
              style={{
                fontSize: 'clamp(44px, 11vw, 92px)',
                margin: 0,
                color: 'var(--ob-paper)',
              }}
            >
              <LetterReveal text={headline} stagger={0.05} />
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="ob-mono"
              style={{
                marginTop: 10,
                color: 'rgba(244,237,224,0.55)',
                fontSize: 12,
                textTransform: 'none',
                letterSpacing: '0.05em',
                fontFamily: 'var(--ob-font-display)',
                fontStyle: 'italic',
                fontWeight: 400,
                maxWidth: 460,
              }}
            >
              {subhead}
            </motion.p>
          </div>

          {/* Search & bubbles strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            <div className="ob-search">
              {SearchIcon}
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  contentType === 'series'
                    ? t('serie suchen — auch unbekannte titel …')
                    : t('film suchen — auch unbekannte titel …')
                }
              />
              {isSearching && (
                <button
                  onClick={() => {
                    setQuery('');
                    onClearSearch();
                    inputRef.current?.focus();
                  }}
                  className="ob-search__clear"
                >
                  ×
                </button>
              )}
              <span className="ob-mono" style={{ color: 'rgba(244,237,224,0.4)', fontSize: 10 }}>
                {addedCount.toString().padStart(2, '0')}
                <span style={{ opacity: 0.5 }}> / {t('gewählt')}</span>
              </span>
            </div>

            <AnimatePresence>
              {addedCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="ob-bubbles"
                >
                  {added.slice(0, 8).map((it) => (
                    <div
                      key={`${it.type}-${it.id}`}
                      className="ob-bubble"
                      style={{
                        backgroundImage: it.poster_path
                          ? `url(https://image.tmdb.org/t/p/w92${it.poster_path})`
                          : undefined,
                      }}
                      title={it.title || it.name}
                    />
                  ))}
                  {addedCount > 8 && (
                    <div className="ob-bubble ob-bubble--more">+{addedCount - 8}</div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Programm strip */}
          <div className="ob-welcome-side">
            <div className="ob-side-label">
              <span className="ob-mono" style={{ color: 'var(--ob-text-mute)' }}>
                {t('Programm')}
              </span>
              <span className="ob-mono" style={{ color: 'var(--ob-text-mute)', opacity: 0.5 }}>
                {t('4 Akte')}
              </span>
            </div>
            <TableOfContents
              currentStep={contentType === 'series' ? 'series' : 'movies'}
              variant="horizontal"
              delay={0.6}
            />
          </div>

          {/* Grid */}
          <div style={{ flex: 1, minHeight: 0, overflow: 'auto', paddingBottom: 16 }}>
            {(loading || searchLoading) && displayItems.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '60px 0',
                  color: 'rgba(244,237,224,0.45)',
                }}
              >
                <div
                  className="ob-card__spinner"
                  style={{ margin: '0 auto', width: 28, height: 28 }}
                />
                <p className="ob-mono" style={{ marginTop: 16, fontSize: 11 }}>
                  {isSearching ? t('die katalogwand wird durchforstet …') : t('kuration läuft …')}
                </p>
              </div>
            ) : displayItems.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '60px 16px',
                  color: 'rgba(244,237,224,0.55)',
                  maxWidth: 360,
                  margin: '0 auto',
                }}
              >
                <h3
                  className="ob-display"
                  style={{
                    fontSize: 40,
                    margin: 0,
                    color: 'var(--ob-paper)',
                  }}
                >
                  {isSearching ? t('nichts.') : t('leer.')}
                </h3>
                <p className="ob-mono" style={{ fontSize: 11, marginTop: 12 }}>
                  {isSearching
                    ? t('keine treffer für „{query}"', { query })
                    : t('nutze die suche, um etwas hinzuzufügen')}
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                  gap: 'clamp(14px, 2vw, 22px)',
                  rowGap: 'clamp(22px, 3vw, 32px)',
                }}
              >
                <AnimatePresence initial={false}>
                  {displayItems.map((item) => {
                    const key = `${item.type}-${item.id}`;
                    return (
                      <ContentCard
                        key={key}
                        item={item}
                        isAdded={pendingMap.has(key)}
                        isPending={pendingId === key}
                        summary={targetToSummary(watchTargets.get(item.id))}
                        onPrimaryTap={handlePrimaryTap}
                        onRemove={onRemovePending}
                      />
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* CTA */}
        <div
          style={{
            position: 'relative',
            zIndex: 3,
            padding:
              'clamp(14px, 2vw, 20px) clamp(20px, 5vw, 56px) calc(20px + env(safe-area-inset-bottom))',
            background: 'linear-gradient(180deg, transparent 0%, var(--ob-stage) 50%)',
          }}
        >
          <button onClick={onNext} className="ob-cta">
            <span className="ob-cta__inner">
              <span>{contentType === 'series' ? t('weiter zu filmen') : t('fertig')}</span>
              <span style={{ opacity: 0.55, fontSize: 11 }}>·</span>
              <span style={{ opacity: 0.55, fontSize: 11 }}>
                {addedCount > 0 ? t('{n} gewählt', { n: addedCount }) : t('überspringen ok')}
              </span>
            </span>
            <span className="ob-cta__arrow">→</span>
          </button>
        </div>
      </motion.div>

      {sheetItem && (
        <WatchStatusSheet
          open={!!sheetItem}
          tmdbId={sheetItem.id}
          title={sheetItem.title || sheetItem.name || ''}
          posterPath={sheetItem.poster_path}
          initial={watchTargets.get(sheetItem.id) || { kind: 'none' }}
          onClose={() => setSheetItem(null)}
          onConfirm={(t) => onSetWatchTarget(sheetItem.id, t)}
        />
      )}
    </>
  );
};
