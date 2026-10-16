import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CoverWall } from '../components/CoverWall';
import { LetterReveal } from '../components/LetterReveal';
import { TableOfContents } from '../components/TableOfContents';
import { useActNum, useActs } from '../data/acts';
import {
  useReadingPicks,
  type ReadingItem,
  type ReadingKind,
  type ReadingPick,
  type ReadingPickStatus,
} from '../hooks/useReadingPicks';
import { t } from '../../../services/i18n';

interface Props {
  genreSlugs: string[];
  picks: Map<string, ReadingPick>;
  /** Pflicht bei „Manga & Bücher" und „Beides", sonst überspringbar. */
  required: boolean;
  onToggle: (item: ReadingItem) => void;
  onStatus: (key: string, status: ReadingPickStatus) => void;
  onNext: () => void;
  onBack: () => void;
  hideProgram?: boolean;
}

const NEXT_STATUS: Record<ReadingPickStatus, ReadingPickStatus> = {
  reading: 'completed',
  completed: 'planned',
  planned: 'reading',
};

const statusLabel = (status: ReadingPickStatus): string =>
  status === 'reading'
    ? t('lese ich gerade')
    : status === 'completed'
      ? t('schon gelesen')
      : t('will ich lesen');

const SearchIcon = (
  <svg viewBox="0 0 24 24" fill="none" className="ob-search__icon">
    <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M16 16l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const Plus = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const Check = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path
      d="M5 12l5 5L20 7"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ReadingCard = ({
  item,
  pick,
  onToggle,
  onStatus,
}: {
  item: ReadingItem;
  pick?: ReadingPick;
  onToggle: (item: ReadingItem) => void;
  onStatus: (key: string, status: ReadingPickStatus) => void;
}) => (
  <motion.div
    role="button"
    tabIndex={0}
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    whileTap={{ opacity: 0.7 }}
    transition={{ duration: 0.3 }}
    onClick={() => onToggle(item)}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onToggle(item);
      }
    }}
    className={`ob-card ${pick ? 'ob-card--added' : ''}`}
  >
    <div
      className="ob-card__poster"
      style={{ backgroundImage: item.cover ? `url(${item.cover})` : undefined }}
    >
      {!item.cover && (
        <span
          className="ob-mono"
          style={{
            position: 'absolute',
            inset: 12,
            display: 'flex',
            alignItems: 'flex-end',
            fontSize: 11,
            textTransform: 'none',
            color: 'var(--ob-text-mute)',
          }}
        >
          {item.title}
        </span>
      )}
      <div className="ob-card__action" aria-hidden>
        {pick ? Check : Plus}
      </div>
    </div>
    <div className="ob-card__meta">
      <h3 className="ob-card__title">{item.title}</h3>
      <span className="ob-card__year ob-mono" style={{ fontSize: 10 }}>
        {item.year}
      </span>
    </div>
    {pick && (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onStatus(pick.key, NEXT_STATUS[pick.status]);
        }}
        className="ob-link"
        style={{ padding: '4px 0', alignSelf: 'flex-start', fontSize: 10 }}
        aria-label={t('Lesestand ändern')}
      >
        {statusLabel(pick.status)} ↻
      </button>
    )}
  </motion.div>
);

/** Akt „Lesen": Manga und Bücher wählen, mit Lesestand je Titel. */
export const ReadingStep: React.FC<Props> = ({
  genreSlugs,
  picks,
  required,
  onToggle,
  onStatus,
  onNext,
  onBack,
  hideProgram = false,
}) => {
  const actNum = useActNum('reading');
  const actCount = useActs().length;
  const [kind, setKind] = useState<ReadingKind>('book');
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { suggestions, loading, results, searching, search } = useReadingPicks(genreSlugs);
  const isSearching = query.trim().length > 0;

  useEffect(() => {
    const timer = setTimeout(() => search(kind, query), 350);
    return () => clearTimeout(timer);
  }, [kind, query, search]);

  const items = isSearching ? results : suggestions[kind];
  const busy = isSearching ? searching : loading[kind];
  const picked = useMemo(() => Array.from(picks.values()), [picks]);
  const wall = useMemo(
    () =>
      [...suggestions.manga, ...suggestions.book]
        .map((item) => item.cover)
        .filter((c): c is string => !!c),
    [suggestions]
  );
  const count = picked.length;

  return (
    <motion.div
      className="ob-step"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <CoverWall covers={wall} />

      <div
        className="ob-discovery-body"
        style={{
          position: 'relative',
          zIndex: 2,
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          padding: 'clamp(18px, 4vw, 48px) clamp(20px, 5vw, 56px) 0',
          gap: 'clamp(16px, 3vw, 28px)',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <button onClick={onBack} className="ob-link" style={{ padding: '6px 0', fontSize: 11 }}>
            {t('← zurück')}
          </button>
          <span className="ob-mono" style={{ color: 'rgba(244,237,224,0.4)' }}>
            {actNum} — {t('lesen')}
          </span>
        </div>

        <div>
          <h1
            className="ob-display"
            style={{ fontSize: 'clamp(44px, 11vw, 92px)', margin: 0, color: 'var(--ob-paper)' }}
          >
            <LetterReveal text={required ? t('Lesen') : t('Liest du auch?')} stagger={0.05} />
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            style={{
              marginTop: 10,
              color: 'rgba(244,237,224,0.55)',
              fontSize: 12,
              letterSpacing: '0.05em',
              fontFamily: 'var(--ob-font-display)',
              fontStyle: 'italic',
              maxWidth: 460,
            }}
          >
            {required
              ? t(
                  'Welche Manga und Bücher gehören in dein Regal? Tipp sie an – den Lesestand stellst du darunter ein.'
                )
              : t('Manga und Bücher kannst du gleich mit anlegen – oder einfach weiter.')}
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
        >
          <div className="ob-season-tabs" role="tablist">
            {(['book', 'manga'] as ReadingKind[]).map((k) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={kind === k}
                className={`ob-season-tab ${kind === k ? 'ob-season-tab--active' : ''}`}
                onClick={() => setKind(k)}
              >
                {k === 'book' ? t('Bücher') : 'Manga'}
              </button>
            ))}
          </div>
          <div className="ob-search">
            {SearchIcon}
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={kind === 'book' ? t('buch suchen …') : t('manga suchen …')}
            />
            {isSearching && (
              <button
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                className="ob-search__clear"
              >
                ×
              </button>
            )}
            <span
              className="ob-mono ob-search__count"
              style={{ color: 'rgba(244,237,224,0.4)', fontSize: 10 }}
            >
              {count.toString().padStart(2, '0')}
              <span className="ob-search__count-label" style={{ opacity: 0.5 }}>
                {' '}
                / {t('gewählt')}
              </span>
            </span>
          </div>
          <AnimatePresence>
            {count > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="ob-bubbles"
              >
                {picked.slice(0, 8).map((pick) => (
                  <div
                    key={pick.key}
                    className="ob-bubble"
                    style={{ backgroundImage: pick.cover ? `url(${pick.cover})` : undefined }}
                    title={pick.title}
                  />
                ))}
                {count > 8 && <div className="ob-bubble ob-bubble--more">+{count - 8}</div>}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {!hideProgram && (
          <div className="ob-welcome-side">
            <div className="ob-side-label">
              <span className="ob-mono" style={{ color: 'var(--ob-text-mute)' }}>
                {t('Programm')}
              </span>
              <span className="ob-mono" style={{ color: 'var(--ob-text-mute)', opacity: 0.5 }}>
                {t('{n} Akte', { n: actCount })}
              </span>
            </div>
            <TableOfContents currentStep="reading" variant="horizontal" delay={0.6} />
          </div>
        )}

        <div
          className="ob-discovery-results"
          style={{ flex: 1, minHeight: 0, overflow: 'auto', paddingBottom: 16 }}
        >
          {busy && items.length === 0 ? (
            <div
              style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(244,237,224,0.45)' }}
            >
              <div
                className="ob-card__spinner"
                style={{ margin: '0 auto', width: 28, height: 28 }}
              />
              <p className="ob-mono" style={{ marginTop: 16, fontSize: 11 }}>
                {isSearching ? t('die regale werden durchsucht …') : t('kuration läuft …')}
              </p>
            </div>
          ) : items.length === 0 ? (
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
                style={{ fontSize: 40, margin: 0, color: 'var(--ob-paper)' }}
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
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(150px, 47%), 1fr))',
                gap: 'clamp(14px, 2vw, 22px)',
                rowGap: 'clamp(22px, 3vw, 32px)',
              }}
            >
              <AnimatePresence initial={false}>
                {items.map((item) => (
                  <ReadingCard
                    key={item.key}
                    item={item}
                    pick={picks.get(item.key)}
                    onToggle={onToggle}
                    onStatus={onStatus}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      <div
        className="ob-discovery-cta"
        style={{
          position: 'relative',
          zIndex: 3,
          padding: 'clamp(14px, 2vw, 20px) clamp(20px, 5vw, 56px) clamp(16px, 2.5vw, 24px)',
          background: 'linear-gradient(180deg, transparent 0%, var(--ob-stage) 50%)',
        }}
      >
        <button onClick={onNext} disabled={required && count === 0} className="ob-cta">
          <span className="ob-cta__inner">
            <span>{count === 0 && !required ? t('ich lese nicht – weiter') : t('weiter')}</span>
            <span className="ob-cta__hint" style={{ opacity: 0.55, fontSize: 11 }}>
              ·
            </span>
            <span className="ob-cta__hint" style={{ opacity: 0.55, fontSize: 11 }}>
              {count > 0
                ? t('{n} gewählt', { n: count })
                : required
                  ? t('wähle min. 1')
                  : t('später möglich')}
            </span>
          </span>
          <span className="ob-cta__arrow">→</span>
        </button>
      </div>
    </motion.div>
  );
};
