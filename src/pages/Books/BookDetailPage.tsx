import {
  AutoStories,
  CalendarMonth,
  DeleteOutlined,
  Headphones,
  Language,
  MenuBook,
  Notes,
  OpenInNew,
  Person,
  Schedule,
  Star,
  TabletAndroid,
  Translate,
  ViewWeek,
  VisibilityOff,
} from '@mui/icons-material';
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useBooksList } from '../../contexts/BooksListContext';
import { BackButton, HorizontalScrollContainer } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { useBookDetails, useBookLinks } from '../../hooks/books/useBookLinks';
import { useMangaVolumes } from '../../hooks/books/useMangaVolumes';
import { PAGES_PER_HOUR } from '../../lib/books/bookProgress';
import { partPositionOf, seriesPlacement } from '../../lib/books/bookSeries';
import { splitVolume } from '../../lib/books/mangaVolume';
import { hardcoverBook, hardcoverReady } from '../../services/api/hardcoverApi';
import { BookMoodPanel, SimilarBooksPanel, WhenNearViewport } from './detail/BookExtrasPanels';
import { EditableDetailRow, type EditableDetailRowProps } from './detail/EditableDetailRow';
import { bookAsResult, coverAtSize } from '../../lib/books/bookSearchMapping';
import { showToast, showUndoToast } from '../../lib/interaction/toast';
import { removeBook, setBookHidden } from '../../services/books/bookService';
import {
  sameEdition,
  volumeBookState,
  volumeSnapshot,
  withSourceBook,
} from '../../lib/books/mangaBooks';
import { useAuth } from '../../contexts/AuthContext';
import {
  moveMangaToBooks,
  rememberSourceBooks,
  restoreBookFromManga,
  restoreMangaFromBooks,
} from '../Manga/mangaBookSwitch';
import { mangaPath } from '../../lib/manga/mangaSource';
import { fetchMoreByAuthor } from '../../services/api/bookDiscovery';
import { dateLocale, t } from '../../services/i18n';
import type { Book, BookFormat, BookSearchResult } from '../../types/Book';
import { useAddManga } from '../Manga/useAddManga';
import './BookDetailPage.css';
import { AddOptions, type AddChoice } from './components/AddBookSheet';
import { BookCover } from './components/BookCover';
import './components/books.css';
import { ProgressSheet } from './components/ProgressSheet';
import { BookAdaptationsPanel, BookSeriesPanel } from './detail/BookLinksPanels';
import { BookStatePanel } from './detail/BookStatePanel';
import { MangaVolumePanel } from './detail/MangaVolumePanel';
import { OwnToggle } from './detail/OwnToggle';
import { WishToggle } from './detail/WishToggle';
import { FriendsOwningPanel } from './detail/FriendsOwningPanel';
import { DiscoverCard, SkeletonCards } from './discover/DiscoverParts';
import { useAddFlow } from './discover/useAddFlow';
import { useAdaptationMeta } from './hooks/useAdaptationMeta';
import { useBookActions } from './hooks/useBookActions';
import { useBookDescription } from './hooks/useBookDescription';

const FORMATS: { id: BookFormat; label: () => string; icon: React.ReactNode }[] = [
  { id: 'print', label: () => t('Gedruckt'), icon: <MenuBook style={{ fontSize: 17 }} /> },
  { id: 'ebook', label: () => t('E-Book'), icon: <TabletAndroid style={{ fontSize: 17 }} /> },
  { id: 'audio', label: () => t('Hörbuch'), icon: <Headphones style={{ fontSize: 17 }} /> },
];

const languageName = (code?: string) => {
  if (!code) return undefined;
  try {
    return new Intl.DisplayNames([dateLocale()], { type: 'language' }).of(code) ?? code;
  } catch {
    return code;
  }
};

const MoreByAuthor: React.FC<{ author: string; title: string }> = ({ author, title }) => {
  const { currentTheme } = useTheme();
  const [items, setItems] = useState<BookSearchResult[] | null>(null);
  const { openAdd, sheet } = useAddFlow();

  useEffect(() => {
    let alive = true;
    setItems(null);
    fetchMoreByAuthor(author, title)
      .then((list) => alive && setItems(list))
      .catch(() => alive && setItems([]));
    return () => {
      alive = false;
    };
  }, [author, title]);

  if (items && items.length === 0) return null;
  return (
    <div className="bd-panel">
      <h2 className="bd-panel-title" style={{ color: currentTheme.text.secondary }}>
        <Person style={{ fontSize: 20, color: currentTheme.primary }} />
        {t('Mehr von {author}', { author })}
      </h2>
      <HorizontalScrollContainer
        scrollerClassName="dsc-row"
        scrollerStyle={{ padding: '4px 0 6px', margin: '0 -4px' }}
      >
        {items ? (
          items.slice(0, 14).map((r) => <DiscoverCard key={r.id} result={r} onAdd={openAdd} />)
        ) : (
          <SkeletonCards count={5} />
        )}
      </HorizontalScrollContainer>
      {sheet}
    </div>
  );
};

interface DetailRow {
  label: string;
  value?: string | number;
  /** Nur bei eigenen Büchern: Zeile lässt sich direkt überschreiben. */
  edit?: Omit<EditableDetailRowProps, 'label' | 'value'>;
}

export const BookDetailPage = () => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { bookId = '' } = useParams<{ bookId: string }>();
  const { allBookList, loading } = useBooksList();
  const actions = useBookActions();
  const [progressOpen, setProgressOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  const owned = useMemo(
    () => allBookList.find((b) => b.id === decodeURIComponent(bookId)) ?? null,
    [allBookList, bookId]
  );
  const stateResult = (location.state as { result?: BookSearchResult } | null)?.result ?? null;
  const decodedId = decodeURIComponent(bookId);
  const hardcoverFromId = /^hc-(\d+)$/.exec(decodedId)?.[1];
  const [fetched, setFetched] = useState<BookSearchResult | null>(null);
  const [fetchSettled, setFetchSettled] = useState(false);
  // Link, Neuladen oder fehlender Navigationszustand: Hardcover-Bücher lassen sich über ihre ID wieder laden.
  useEffect(() => {
    if (owned || stateResult || !hardcoverFromId || !hardcoverReady()) return;
    let alive = true;
    void hardcoverBook(Number(hardcoverFromId))
      .then((hit) => alive && setFetched(hit?.result ?? null))
      .catch(() => undefined)
      .finally(() => alive && setFetchSettled(true));
    return () => {
      alive = false;
    };
  }, [owned, stateResult, hardcoverFromId]);
  const preview = stateResult ?? (fetched?.id === decodedId ? fetched : null);
  const view: (Book | BookSearchResult) | null = owned ?? preview;
  const fetchingPreview =
    !view && !!hardcoverFromId && !stateResult && hardcoverReady() && !fetchSettled;

  const [notes, setNotes] = useState(owned?.notes ?? '');
  useEffect(() => {
    setNotes(owned?.notes ?? '');
  }, [owned?.id, owned?.notes]);

  const { details, loading: detailsLoading } = useBookDetails(
    view
      ? { hardcoverId: view.hardcoverId, googleId: view.googleId, olWorkId: view.olWorkId }
      : null
  );
  const {
    links,
    parts,
    loading: linksLoading,
  } = useBookLinks(view?.title, view?.authors?.[0], view?.series);
  const adaptations = useAdaptationMeta(links?.adaptations ?? []);
  const mangaItems = useMemo(
    () =>
      view
        ? [
            {
              ...view,
              publisher: view.publisher ?? details?.publisher,
              categories: view.categories?.length ? view.categories : details?.categories,
            },
          ]
        : [],
    [view, details]
  );
  const { links: mangaLinks } = useMangaVolumes(mangaItems, { deep: true });
  const mangaLink = view ? mangaLinks.get(view.id) : undefined;
  const coverFallback =
    (view && 'coverFallback' in view ? view.coverFallback : undefined) ??
    mangaLink?.manga.coverImage.large ??
    undefined;
  const ownDescription = details?.description ?? preview?.description;
  const seriesDescription =
    !ownDescription && !detailsLoading ? (mangaLink?.manga.description ?? undefined) : undefined;
  const description = useBookDescription(
    seriesDescription ? `manga:${mangaLink?.manga.id}` : view?.id,
    ownDescription ?? seriesDescription,
    detailsLoading,
    links,
    linksLoading,
    view?.hardcoverId
  );
  // Reihe soll als Bücher laufen: fremde Bände zeigen wieder „In deine Bücher".
  const mangaOffer = mangaLink && !mangaLink.asBooks ? mangaLink : undefined;
  const uid = useAuth()?.user?.uid;
  const { add: addManga, addingId } = useAddManga();

  useEffect(() => {
    if (!owned || !links) return;
    const fields: Partial<Book> = {};
    if (links.wikidataId && !owned.wikidataId) fields.wikidataId = links.wikidataId;
    const seriesId = owned.series?.wikidataId ?? links.series?.wikidataId;
    const position =
      owned.series?.position ??
      (links.series?.wikidataId === seriesId ? links.series?.position : undefined) ??
      (seriesId ? partPositionOf({ ...owned, ...fields }, parts, seriesId) : undefined);
    if (seriesId && (!owned.series?.wikidataId || (!owned.series.position && position))) {
      fields.series = {
        name: owned.series?.name || links.series?.name || '',
        wikidataId: seriesId,
        ...(position ? { position } : {}),
      };
    }
    if (Object.keys(fields).length === 0) return;
    void actions.updateFields(owned, { ...fields, wdChecked: new Date().toISOString() });
  }, [owned, links, parts, actions]);

  if (!view) {
    return (
      <div className="bd-page" style={{ background: currentTheme.background.default }}>
        <div className="bd-topbar">
          <BackButton />
        </div>
        <div className="bk-empty" style={{ marginTop: 40 }}>
          <h2 className="bk-empty-title" style={{ color: currentTheme.text.secondary }}>
            {loading || fetchingPreview ? t('Lädt…') : t('Buch nicht gefunden')}
          </h2>
          {!loading && !fetchingPreview && (
            <button
              type="button"
              className="bk-cta bk-cta--ghost"
              style={{ color: currentTheme.text.secondary }}
              onClick={() => navigate('/books')}
            >
              {t('Zu den Büchern')}
            </button>
          )}
        </div>
      </div>
    );
  }

  const categories =
    view.source === 'openlibrary'
      ? []
      : (details?.categories ?? view.categories ?? []).filter((c) => c.length <= 22);
  const pageCount = view.pageCount ?? details?.pageCount;
  const readingHours = pageCount ? Math.max(1, Math.round(pageCount / PAGES_PER_HOUR)) : null;
  const { name: seriesName, position: seriesPosition } = seriesPlacement({
    title: view.title,
    own: owned?.series,
    linked: links?.series,
    manga: mangaLink && {
      name: mangaLink.manga.title.english || mangaLink.manga.title.romaji,
      volume: mangaLink.volume,
    },
  });
  const author = view.authors?.[0];
  const descriptionText =
    showOriginal && description.original ? description.original : description.text;

  const seriesValue = seriesPosition
    ? seriesName
      ? `${seriesName} · ${t('Band {n}', { n: seriesPosition })}`
      : t('Band {n}', { n: seriesPosition })
    : seriesName;

  const saveSeriesPosition = (value: string) => {
    if (!owned) return;
    const position = Number(value);
    if (!position) {
      void actions.updateFields(
        owned,
        owned.series?.wikidataId ? { 'series/position': null } : { series: null }
      );
      return;
    }
    void actions.updateFields(owned, {
      'series/name': owned.series?.name || seriesName || splitVolume(owned.title).series,
      'series/position': position,
    });
  };

  const rawRows: DetailRow[] = [
    {
      label: t('Reihe'),
      value: seriesValue,
      edit: {
        draft: seriesPosition ? String(seriesPosition) : '',
        placeholder: t('Band-Nr.'),
        numeric: true,
        onSave: saveSeriesPosition,
      },
    },
    { label: t('Seiten'), value: pageCount ? pageCount.toLocaleString(dateLocale()) : undefined },
    { label: t('Erschienen'), value: details?.publishedDate ?? view.publishedYear },
    { label: t('Verlag'), value: view.publisher ?? details?.publisher },
    {
      label: t('Auflage'),
      value: view.edition,
      edit: {
        placeholder: t('z. B. 3. Auflage 2021'),
        maxLength: 40,
        onSave: (value) => owned && void actions.updateFields(owned, { edition: value || null }),
      },
    },
    { label: t('Sprache'), value: languageName(view.language) },
    { label: 'ISBN', value: view.isbn13 },
    {
      label: t('Hinzugefügt'),
      value: owned ? new Date(owned.addedAt).toLocaleDateString(dateLocale()) : undefined,
    },
  ];
  const detailRows = rawRows.filter(
    (row) => (owned && row.edit) || (row.value !== undefined && row.value !== '')
  );

  const externalLinks = [
    details?.infoLink &&
      /google\./.test(details.infoLink) && { label: 'Google Books', href: details.infoLink },
    view.olWorkId && {
      label: 'Open Library',
      href: `https://openlibrary.org/works/${view.olWorkId}`,
    },
    view.source === 'dnb' &&
      view.isbn13 && {
        label: 'Deutsche Nationalbibliothek',
        href: `https://portal.dnb.de/opac.htm?method=simpleSearch&query=${view.isbn13}`,
      },
    links?.wikipedia && {
      label: 'Wikipedia',
      href: `https://${links.wikipedia.lang}.wikipedia.org/wiki/${encodeURIComponent(
        links.wikipedia.title.replace(/ /g, '_')
      )}`,
    },
  ].filter((l): l is { label: string; href: string } => !!l);

  const pickAdd = async (choice: AddChoice) => {
    if (!preview) return;
    setBusy(true);
    const book = await actions.add(preview, choice.status, {
      finishedEarlier: choice.finishedEarlier,
    });
    setBusy(false);
    if (book && book.id !== bookId) {
      navigate(`/books/${encodeURIComponent(book.id)}`, { replace: true });
    }
  };

  const toggleWish = async () => {
    if (owned) {
      void actions.toggleWish(owned);
      return;
    }
    if (!preview) return;
    setBusy(true);
    const book = await actions.add(preview, 'planned', { wish: true });
    setBusy(false);
    if (book && book.id !== bookId) {
      navigate(`/books/${encodeURIComponent(book.id)}`, { replace: true });
    }
  };

  const openManga = () => {
    if (!mangaLink) return;
    navigate(
      mangaPath(mangaLink.manga.id, mangaLink.volume),
      volumeBookState(owned ? bookAsResult(owned) : preview)
    );
  };

  const addAsManga = async () => {
    if (!mangaLink || !preview) return;
    const fromBooks = [volumeSnapshot(preview, new Date().toISOString())];
    if (await addManga(mangaLink.manga, { byVolume: true, fromBooks })) openManga();
  };

  const moveToManga = async () => {
    if (!mangaLink || !owned || !uid) return;
    const saved = mangaLink.owned
      ? await rememberSourceBooks(uid, mangaLink.manga.id, [owned]).then(
          () => true,
          () => false
        )
      : await addManga(mangaLink.manga, { byVolume: true, fromBooks: [owned] });
    if (!saved) {
      showToast(t('Speichern fehlgeschlagen'), 2200, 'error');
      return;
    }
    const restore = {
      mangaWasNew: !mangaLink.owned,
      seriesAsBooks: !!mangaLink.asBooks,
    };
    await setBookHidden(uid, owned.id, true).catch(() => {});
    navigate(mangaPath(mangaLink.manga.id, mangaLink.volume), { replace: true });
    showUndoToast(
      t('„{title}“ ist ein Manga – bei deinen Manga gespeichert', {
        title: mangaLink.manga.title.english || mangaLink.manga.title.romaji,
      }),
      {
        onUndo: () =>
          void restoreBookFromManga(uid, owned, mangaLink.manga.id, restore).then(
            () => navigate(`/books/${encodeURIComponent(owned.id)}`, { replace: true }),
            () => showToast(t('Speichern fehlgeschlagen'), 2200, 'error')
          ),
        onCommit: () => void removeBook(uid, owned.id),
      }
    );
  };

  const moveSeriesToBooks = async () => {
    const manga = mangaLink?.owned;
    if (!manga || !preview || !uid) return;
    setBusy(true);
    try {
      const shown = volumeSnapshot(preview, new Date().toISOString());
      const books = await moveMangaToBooks(
        uid,
        withSourceBook(manga, shown),
        new Set(allBookList.map((b) => b.id))
      );
      const target = books.find((b) => sameEdition(b, shown)) ?? books[0];
      if (target) {
        navigate(`/books/${encodeURIComponent(target.id)}`, { replace: true });
        showUndoToast(
          t('„{title}" steht wieder bei deinen Büchern', { title: target.title }),
          () =>
            void restoreMangaFromBooks(uid, manga, books).then(
              () => navigate(`/manga/${manga.anilistId}`, { replace: true }),
              () => showToast(t('Speichern fehlgeschlagen'), 2200, 'error')
            )
        );
      }
    } catch {
      showToast(t('Speichern fehlgeschlagen'), 2200, 'error');
    } finally {
      setBusy(false);
    }
  };

  const factStyle = { fontSize: 16, color: currentTheme.accent };
  const facts: { key: string; icon: React.ReactNode; label: string }[] = [];
  if (view.publishedYear) {
    facts.push({
      key: 'year',
      icon: <CalendarMonth style={factStyle} />,
      label: String(view.publishedYear),
    });
  }
  if (pageCount) {
    facts.push({
      key: 'pages',
      icon: <AutoStories style={factStyle} />,
      label: t('{n} Seiten', { n: pageCount }),
    });
  }
  if (readingHours) {
    facts.push({
      key: 'time',
      icon: <Schedule style={factStyle} />,
      label: t('ca. {n} h Lesezeit', { n: readingHours }),
    });
  }
  const lang = languageName(view.language);
  if (lang) facts.push({ key: 'lang', icon: <Language style={factStyle} />, label: lang });
  const community = 'avgRating' in view ? view : undefined;
  if (community?.avgRating && (community.ratingCount ?? 0) >= 5) {
    facts.push({
      key: 'rating',
      icon: <Star style={factStyle} />,
      label: `${(community.avgRating * 2).toFixed(1)} / 10 · ${new Intl.NumberFormat(dateLocale(), { notation: 'compact' }).format(community.ratingCount ?? 0)}`,
    });
  }

  return (
    <div className="bd-page" style={{ background: currentTheme.background.default }}>
      <div className="bd-backdrop" aria-hidden>
        {(view.cover || coverFallback) && (
          <div
            className="bd-backdrop-img"
            style={{ backgroundImage: `url(${coverAtSize(view.cover || coverFallback, 'M')})` }}
          />
        )}
        <div
          className="bd-backdrop-fade"
          style={{
            background: `linear-gradient(180deg, ${currentTheme.background.default}40 0%, ${currentTheme.background.default}b3 55%, ${currentTheme.background.default} 100%)`,
          }}
        />
      </div>

      <div className="bd-topbar">
        <BackButton />
      </div>

      <header className="bd-hero">
        <div className="bd-hero-cover">
          <BookCover book={view} fallbackSrc={coverFallback} depth eager />
        </div>
        <div className="bd-hero-info">
          {seriesName && (
            <div className="dsc-kicker" style={{ color: '#fff' }}>
              <ViewWeek style={{ fontSize: 14, color: currentTheme.accent }} />
              {seriesPosition
                ? t('Band {n} · {series}', { n: seriesPosition, series: seriesName })
                : seriesName}
            </div>
          )}
          <h1 className="bd-title" style={{ color: currentTheme.text.secondary }}>
            {view.title}
          </h1>
          {view.subtitle && (
            <p className="bd-subtitle" style={{ color: currentTheme.text.muted }}>
              {view.subtitle}
            </p>
          )}
          {view.authors?.length ? (
            <div className="bd-authors" style={{ color: currentTheme.primary }}>
              {view.authors.join(', ')}
            </div>
          ) : null}
          {(facts.length > 0 || categories.length > 0) && (
            <div className="bd-facts">
              {facts.map((f) => (
                <span
                  key={f.key}
                  className="bd-fact"
                  style={{ color: currentTheme.text.secondary }}
                >
                  {f.icon}
                  {f.label}
                </span>
              ))}
              {categories.slice(0, 3).map((c) => (
                <span key={c} className="bd-fact" style={{ color: currentTheme.text.muted }}>
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="bd-layout">
        <aside className="bd-side">
          {mangaLink && (owned || (preview && mangaOffer)) && (
            <MangaVolumePanel
              link={mangaLink}
              savedAsBook={!!owned}
              busy={busy || addingId === mangaLink.manga.id}
              onOpen={openManga}
              onAdd={() => void addAsManga()}
              onMove={() => void moveToManga()}
              onMoveToBooks={
                preview && !owned && mangaLink.owned ? () => void moveSeriesToBooks() : undefined
              }
            />
          )}
          {owned ? (
            <BookStatePanel
              book={owned}
              onStatus={(status) => void actions.changeStatus(owned, status)}
              onQuickAdd={(pages) =>
                void actions.saveProgress(owned, (owned.currentPage || 0) + pages)
              }
              onOpenProgress={() => setProgressOpen(true)}
              onRate={(rating) => void actions.rate(owned, rating)}
            />
          ) : preview && !mangaOffer ? (
            <div
              className="bd-panel"
              style={{
                borderColor: `${currentTheme.primary}55`,
                background: `linear-gradient(150deg, ${currentTheme.primary}1f, var(--glass-light) 60%)`,
              }}
            >
              <h2 className="bd-panel-title" style={{ color: currentTheme.text.secondary }}>
                {t('In deine Bücher')}
              </h2>
              <AddOptions busy={busy} onPick={(c) => void pickAdd(c)} />
            </div>
          ) : null}
          {(owned || (preview && !mangaOffer)) && (
            <WishToggle wished={!!owned?.wishedAt} busy={busy} onToggle={() => void toggleWish()} />
          )}
          {owned && (
            <OwnToggle owned={!!owned.ownedAt} onToggle={() => void actions.toggleOwned(owned)} />
          )}
          {view && !owned?.ownedAt && (
            <FriendsOwningPanel id={view.id} title={view.title} authors={view.authors ?? []} />
          )}

          {detailRows.length > 0 && (
            <div className="bd-panel">
              <h2 className="bd-panel-title" style={{ color: currentTheme.text.secondary }}>
                {t('Details')}
              </h2>
              {detailRows.map(({ label, value, edit }) =>
                owned && edit ? (
                  <EditableDetailRow
                    key={label}
                    label={label}
                    value={value === undefined ? undefined : String(value)}
                    {...edit}
                  />
                ) : (
                  <div key={label} className="bd-detail-row">
                    <span style={{ color: currentTheme.text.muted }}>{label}</span>
                    <span
                      style={{
                        color: currentTheme.text.secondary,
                        fontWeight: 700,
                        textAlign: 'right',
                      }}
                    >
                      {value}
                    </span>
                  </div>
                )
              )}
              {owned && (
                <div style={{ marginTop: 12 }}>
                  <div
                    className="bk-muted"
                    style={{ color: currentTheme.text.muted, marginBottom: 8, fontWeight: 700 }}
                  >
                    {t('Format')}
                  </div>
                  <div className="bd-format-row">
                    {FORMATS.map((f) => {
                      const active = (owned.format ?? 'print') === f.id;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          className="bk-chip-btn"
                          onClick={() =>
                            void actions.updateFields(owned, {
                              format: f.id === 'print' ? null : f.id,
                            })
                          }
                          style={{
                            flex: 1,
                            color: active ? currentTheme.primary : currentTheme.text.muted,
                            borderColor: active ? `${currentTheme.primary}80` : undefined,
                            background: active ? `${currentTheme.primary}1a` : undefined,
                          }}
                        >
                          {f.icon}
                          {f.label()}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {externalLinks.length > 0 && (
                <div className="bd-links" style={{ marginTop: 14 }}>
                  {externalLinks.map((l) => (
                    <a
                      key={l.label}
                      className="bd-link"
                      href={l.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: currentTheme.text.secondary }}
                    >
                      {l.label}
                      <OpenInNew style={{ fontSize: 15, color: currentTheme.text.muted }} />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {owned && (
            <div className="bd-links">
              <button
                type="button"
                className="bk-chip-btn"
                style={{ color: currentTheme.text.muted }}
                onClick={() => void actions.toggleHidden(owned)}
              >
                <VisibilityOff style={{ fontSize: 16 }} />
                {owned.hidden ? t('Einblenden') : t('Ausblenden')}
              </button>
              <button
                type="button"
                className="bk-chip-btn"
                style={{ color: currentTheme.status.error }}
                onClick={() => actions.remove(owned, () => navigate('/books', { replace: true }))}
              >
                <DeleteOutlined style={{ fontSize: 16 }} />
                {t('Entfernen')}
              </button>
            </div>
          )}
        </aside>

        <main className="bd-main">
          {(description.loading || descriptionText) && (
            <div className="bd-panel">
              <h2 className="bd-panel-title" style={{ color: currentTheme.text.secondary }}>
                {t('Worum geht es?')}
                {description.source === 'translated' && !description.loading && (
                  <button
                    type="button"
                    className="bd-translate-toggle"
                    onClick={() => setShowOriginal((v) => !v)}
                    style={{ color: currentTheme.text.muted }}
                  >
                    <Translate style={{ fontSize: 14 }} />
                    {showOriginal ? t('Übersetzung anzeigen') : t('Original anzeigen')}
                  </button>
                )}
              </h2>
              {description.loading && !descriptionText ? (
                <div className="bd-desc-skeleton" aria-hidden>
                  {[96, 88, 92, 70, 84, 40].map((w, i) => (
                    <span key={i} className="dsc-skeleton-line" style={{ width: `${w}%` }} />
                  ))}
                  {description.source === 'translated' && (
                    <span
                      className="bk-muted"
                      style={{ color: currentTheme.text.muted, marginTop: 4 }}
                    >
                      {t('Wird übersetzt …')}
                    </span>
                  )}
                </div>
              ) : (
                <>
                  <div
                    className={`bd-description${expanded ? '' : ' bd-description--clamped'}`}
                    style={{ color: currentTheme.text.secondary }}
                  >
                    {descriptionText}
                  </div>
                  {descriptionText.length > 420 && (
                    <button
                      type="button"
                      className="bk-chip-btn"
                      style={{ marginTop: 10, color: currentTheme.primary }}
                      onClick={() => setExpanded((v) => !v)}
                    >
                      {expanded ? t('Weniger anzeigen') : t('Mehr anzeigen')}
                    </button>
                  )}
                  {description.source === 'wikipedia' && (
                    <div className="bd-source-note" style={{ color: currentTheme.text.muted }}>
                      {t('Quelle: Wikipedia')}
                    </div>
                  )}
                  {seriesDescription && (
                    <div className="bd-source-note" style={{ color: currentTheme.text.muted }}>
                      {t('Quelle: AniList, über die ganze Reihe')}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {links?.series && (
            <BookSeriesPanel
              seriesId={links.series.wikidataId}
              name={seriesName ?? ''}
              parts={parts}
              current={owned}
              currentPosition={seriesPosition}
              library={allBookList}
              author={author}
            />
          )}

          <BookAdaptationsPanel items={adaptations} />

          <BookMoodPanel moods={details?.moods} pace={details?.pace} warnings={details?.warnings} />

          {author && !mangaOffer && (
            <WhenNearViewport>
              <MoreByAuthor author={author} title={view.title} />
            </WhenNearViewport>
          )}
          {view.hardcoverId && !mangaOffer && (
            <WhenNearViewport>
              <SimilarBooksPanel hardcoverId={view.hardcoverId} />
            </WhenNearViewport>
          )}

          {owned && (
            <div className="bd-panel">
              <h2 className="bd-panel-title" style={{ color: currentTheme.text.secondary }}>
                <Notes style={{ fontSize: 20, color: currentTheme.text.muted }} />
                {t('Notizen')}
              </h2>
              <textarea
                className="bd-notes"
                value={notes}
                placeholder={t('Lieblingszitate, Gedanken, wer es empfohlen hat …')}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={() => {
                  if ((owned.notes ?? '') !== notes) {
                    void actions.updateFields(owned, {
                      notes: notes.trim() ? notes.slice(0, 4000) : null,
                    });
                  }
                }}
                style={{ color: currentTheme.text.secondary }}
              />
            </div>
          )}
        </main>
      </div>

      <ProgressSheet
        book={progressOpen ? owned : null}
        onClose={() => setProgressOpen(false)}
        onSave={(page, total) => {
          if (owned) void actions.saveProgress(owned, page, total);
          setProgressOpen(false);
        }}
        onFinish={() => {
          if (owned) void actions.changeStatus(owned, 'completed');
          setProgressOpen(false);
        }}
      />
    </div>
  );
};
