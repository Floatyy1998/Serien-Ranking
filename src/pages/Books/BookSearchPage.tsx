import { Add, Check, History, UploadFile } from '@mui/icons-material';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BackButton, SearchInput } from '../../components/ui';
import { useBooksList } from '../../contexts/BooksListContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useBooksForYourShows } from '../../hooks/books/useBasedOnBooks';
import { useBookSearch } from '../../hooks/books/useBookSearch';
import { bookMatchKey, looksLikeIsbn } from '../../lib/books/bookIdentity';
import { hasGoogleBooks } from '../../services/api/booksApi';
import { t } from '../../services/i18n';
import { getOptimalTextColor } from '../../theme/colorUtils';
import type { Book, BookSearchResult } from '../../types/Book';
import { AddBookSheet, type AddChoice } from './components/AddBookSheet';
import { BookCover } from './components/BookCover';
import './components/books.css';
import { bookPath, STATUS_LABELS } from './helpers';
import { useBookActions } from './hooks/useBookActions';
import { ForYourShowsSection } from './sections/ForYourShowsSection';
import { isShelfId } from './data/genres';
import { GenreView } from './discover/GenreView';

const RECENT_KEY = 'bookRecentSearches';

const readRecent = (): string[] => {
  try {
    const list = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    return Array.isArray(list) ? list.filter((q) => typeof q === 'string').slice(0, 8) : [];
  } catch {
    return [];
  }
};

const ResultRow: React.FC<{
  result: BookSearchResult;
  owned?: Book;
  onOpen: () => void;
  onAdd: () => void;
}> = ({ result, owned, onOpen, onAdd }) => {
  const { currentTheme } = useTheme();
  const meta = [
    result.authors.slice(0, 2).join(', '),
    result.publishedYear,
    result.pageCount && t('{n} S.', { n: result.pageCount }),
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <div className="bk-result" onClick={onOpen} role="button" tabIndex={0}>
      <BookCover book={result} fallbackSrc={result.coverFallback} />
      <div className="bk-result-main">
        <span className="bk-result-title" style={{ color: currentTheme.text.secondary }}>
          {result.title}
        </span>
        {result.subtitle && (
          <span className="bk-result-meta" style={{ color: currentTheme.text.muted }}>
            {result.subtitle}
          </span>
        )}
        <span className="bk-result-meta" style={{ color: currentTheme.text.muted }}>
          {meta}
        </span>
        {owned && (
          <span
            className="bk-badge"
            style={{
              background: `${currentTheme.status.success}22`,
              color: currentTheme.status.success,
            }}
          >
            <Check style={{ fontSize: 13 }} />
            {STATUS_LABELS[owned.status]()}
          </span>
        )}
      </div>
      {!owned && (
        <button
          type="button"
          className="bk-add-btn"
          aria-label={t('Buch hinzufügen')}
          onClick={(e) => {
            e.stopPropagation();
            onAdd();
          }}
          style={{
            background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
            color: getOptimalTextColor(currentTheme.primary),
          }}
        >
          <Add />
        </button>
      )}
    </div>
  );
};

export const BookSearchPage = () => {
  const [params] = useSearchParams();
  const genre = params.get('genre');
  return isShelfId(genre) ? <GenreView id={genre} /> : <BookSearchView />;
};

const BookSearchView = () => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') ?? '');
  const qParam = params.get('q') ?? '';
  useEffect(() => {
    setQuery((current) => (current.trim() === qParam ? current : qParam));
  }, [qParam]);
  const [recent, setRecent] = useState<string[]>(readRecent);
  const [pending, setPending] = useState<BookSearchResult | null>(null);
  const [busy, setBusy] = useState(false);
  const { allBookList } = useBooksList();
  const { results, loading, error } = useBookSearch(query);
  const { suggestions } = useBooksForYourShows(query.trim().length < 2);
  const actions = useBookActions();

  useEffect(() => {
    const q = query.trim();
    const timer = setTimeout(() => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (q) next.set('q', q);
          else next.delete('q');
          return next;
        },
        { replace: true }
      );
    }, 400);
    return () => clearTimeout(timer);
  }, [query, setParams]);

  const ownedByKey = useMemo(() => {
    const map = new Map<string, Book>();
    for (const b of allBookList) {
      map.set(b.id, b);
      map.set(bookMatchKey(b.title, b.authors), b);
      if (b.isbn13) map.set(b.isbn13, b);
    }
    return map;
  }, [allBookList]);

  const ownedFor = useCallback(
    (r: BookSearchResult) =>
      ownedByKey.get(r.id) ??
      (r.isbn13 ? ownedByKey.get(r.isbn13) : undefined) ??
      ownedByKey.get(bookMatchKey(r.title, r.authors)),
    [ownedByKey]
  );

  const libraryMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return allBookList
      .filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.authors?.some((a) => a.toLowerCase().includes(q)) ||
          (looksLikeIsbn(q) && b.isbn13 === q.replace(/\D/g, ''))
      )
      .slice(0, 6);
  }, [allBookList, query]);

  const remember = (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) return;
    const next = [
      trimmed,
      ...recent.filter((r) => r.toLowerCase() !== trimmed.toLowerCase()),
    ].slice(0, 8);
    setRecent(next);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      /* egal */
    }
  };

  const openResult = (result: BookSearchResult) => {
    remember(query);
    const owned = ownedFor(result);
    navigate(bookPath(owned?.id ?? result.id), owned ? undefined : { state: { result } });
  };

  const pick = async (choice: AddChoice) => {
    if (!pending) return;
    setBusy(true);
    remember(query);
    await actions.add(pending, choice.status, { finishedEarlier: choice.finishedEarlier });
    setBusy(false);
    setPending(null);
  };

  const showIdle = query.trim().length < 2;

  return (
    <div className="bk-page" style={{ background: currentTheme.background.default }}>
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: `${currentTheme.background.default}e8`,
          backdropFilter: 'var(--glass-filter-lg)',
          WebkitBackdropFilter: 'var(--glass-filter-lg)',
        }}
      >
        <div
          style={{
            background: `linear-gradient(180deg, ${currentTheme.primary}15 0%, transparent 100%)`,
            padding: '16px 20px',
            paddingTop: 'calc(16px + env(safe-area-inset-top))',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <BackButton />
          <div style={{ flex: 1, minWidth: 0 }}>
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder={t('Titel, Autor oder ISBN suchen...')}
              autoFocus={!params.get('q')}
            />
          </div>
        </div>
      </div>

      <div style={{ padding: '8px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {showIdle && recent.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
            {recent.map((r) => (
              <button
                key={r}
                type="button"
                className="bk-chip-btn"
                style={{ color: currentTheme.text.secondary, fontWeight: 600 }}
                onClick={() => setQuery(r)}
              >
                <History style={{ fontSize: 15, color: currentTheme.text.muted }} />
                {r}
              </button>
            ))}
          </div>
        )}

        {libraryMatches.length > 0 && (
          <>
            <div className="bk-source-kicker" style={{ color: currentTheme.text.muted }}>
              {t('In deinen Büchern')}
            </div>
            {libraryMatches.map((b) => (
              <ResultRow
                key={`own-${b.id}`}
                result={{ ...b, authors: b.authors ?? [], source: b.source ?? 'google' }}
                owned={b}
                onOpen={() => navigate(bookPath(b.id))}
                onAdd={() => {}}
              />
            ))}
          </>
        )}

        {!showIdle && (
          <div
            className="bk-source-kicker"
            style={{ color: currentTheme.text.muted, marginTop: 6 }}
          >
            {loading ? t('Suche läuft…') : t('{n} Treffer', { n: results.length })}
          </div>
        )}

        {!showIdle && !loading && results.length === 0 && (
          <div className="bk-card" style={{ textAlign: 'center', color: currentTheme.text.muted }}>
            {error
              ? t('Die Buchsuche ist gerade nicht erreichbar.')
              : t('Nichts gefunden. Versuch es mit Autor oder ISBN.')}
          </div>
        )}

        {results.map((r) => {
          const owned = ownedFor(r);
          if (owned && libraryMatches.some((b) => b.id === owned.id)) return null;
          return (
            <ResultRow
              key={r.id}
              result={r}
              owned={owned}
              onOpen={() => openResult(r)}
              onAdd={() => setPending(r)}
            />
          );
        })}
      </div>

      {showIdle && (
        <div style={{ marginTop: 18 }}>
          <ForYourShowsSection suggestions={suggestions} title={t('Vorlagen deiner Serien')} />
          <div className="bk-pad">
            <button
              type="button"
              className="bk-cta bk-cta--ghost"
              style={{ color: currentTheme.text.secondary, width: '100%' }}
              onClick={() => navigate('/books/import')}
            >
              <UploadFile style={{ fontSize: 18 }} />
              {t('Bibliothek von Goodreads oder StoryGraph importieren')}
            </button>
          </div>
        </div>
      )}

      <div
        className="bk-muted"
        style={{
          textAlign: 'center',
          padding: '24px 20px 0',
          color: currentTheme.text.muted,
          fontSize: 11.5,
        }}
      >
        {hasGoogleBooks()
          ? t('Buchdaten: Google Books und Open Library')
          : t('Buchdaten: Open Library')}
      </div>

      <AddBookSheet
        result={pending}
        busy={busy}
        onClose={() => setPending(null)}
        onPick={(c) => void pick(c)}
      />
    </div>
  );
};
