import { Search } from '@mui/icons-material';
import { motion } from 'framer-motion';
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeaderActions } from '../../components/ui';
import { ReadingGreetingTitle } from '../../components/reading/ReadingGreetingTitle';
import { useBooksList } from '../../contexts/BooksListContext';
import { useMangaList } from '../../contexts/MangaListContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getNewChapterEntries } from '../../lib/manga/overview';
import { tapScaleSmall } from '../../lib/motion';
import { usesArea, type ReadingAreas } from '../../lib/reading/readingMedium';
import { t } from '../../services/i18n';
import { BookCover } from '../Books/components/BookCover';
import '../Books/components/books.css';
import type { BookYear } from '../Books/hooks/useBookYear';
import './ReadingPage.css';

interface ReadingDeckProps {
  areas: ReadingAreas;
  bookYear: BookYear;
  photoURL?: string | null;
  displayName?: string | null;
  totalUnreadBadge: number;
  onNotificationsOpen: () => void;
  onSearch: (filter: 'all' | 'books' | 'manga', query?: string) => void;
  onShowReading: () => void;
  onShowCollection: () => void;
}

interface Pod {
  key: string;
  value: number | string;
  label: string;
  onClick: () => void;
  highlight?: boolean;
}

/** Kopf der Lesen-Seite: Lese-Gruß, gemeinsame Suche und Kennzahlen zu dem, was jemand liest. */
export const ReadingDeck: React.FC<ReadingDeckProps> = React.memo(
  ({
    areas,
    bookYear,
    photoURL,
    displayName,
    totalUnreadBadge,
    onNotificationsOpen,
    onSearch,
    onShowReading,
    onShowCollection,
  }) => {
    const { currentTheme } = useTheme();
    const navigate = useNavigate();
    const { bookList } = useBooksList();
    const { mangaList } = useMangaList();
    const [now] = useState(() => Date.now());
    const { yearStats } = bookYear;
    const showBooks = usesArea(areas, 'books');
    const showManga = usesArea(areas, 'manga');
    const hasBooks = showBooks && bookList.length > 0;
    const hasManga = showManga && mangaList.length > 0;
    // Kennzahlen zu dem, was wirklich da ist: beides, nur Bücher oder nur Manga.
    const kind: 'mixed' | 'books' | 'manga' =
      hasBooks && hasManga ? 'mixed' : hasBooks || !showManga ? 'books' : 'manga';

    const books = useMemo(() => {
      const reading = bookList.filter((b) => b.status === 'reading');
      const art = [...reading, ...bookList.filter((b) => b.status !== 'reading')]
        .filter((b) => b.cover)
        .slice(0, 2);
      return { reading: reading.length, art };
    }, [bookList]);

    const manga = useMemo(() => {
      let reading = 0;
      let chapters = 0;
      let completed = 0;
      for (const m of mangaList) {
        if (m.readStatus === 'reading') reading += 1;
        if (m.readStatus === 'completed') completed += 1;
        chapters += m.currentChapter || 0;
      }
      const newChapters = getNewChapterEntries(mangaList, now).reduce((s, e) => s + e.unread, 0);
      const banner = [...mangaList]
        .filter((m) => m.bannerImage)
        .sort(
          (a, b) =>
            new Date(b.lastReadAt || b.addedAt || 0).getTime() -
            new Date(a.lastReadAt || a.addedAt || 0).getTime()
        )[0]?.bannerImage;
      return { reading, chapters, completed, newChapters, banner };
    }, [mangaList, now]);

    const newChaptersPod: Pod[] =
      manga.newChapters > 0
        ? [
            {
              key: 'new',
              value: manga.newChapters,
              label: t('Neu'),
              onClick: () => navigate('/manga/catch-up'),
              highlight: true,
            },
          ]
        : [];

    let pods: Pod[];
    let sub: string;
    if (kind === 'mixed') {
      pods = [
        {
          key: 'reading',
          value: books.reading + manga.reading,
          label: t('Am Lesen'),
          onClick: onShowReading,
        },
        ...newChaptersPod,
        {
          key: 'books',
          value: bookList.length,
          label: t('Bücher'),
          onClick: () => navigate('/books/shelf'),
        },
        { key: 'manga', value: mangaList.length, label: 'Manga', onClick: onShowCollection },
      ];
      sub = t('{n} Bücher · {m} Manga', { n: bookList.length, m: mangaList.length });
    } else if (kind === 'books') {
      pods = [
        { key: 'reading', value: books.reading, label: t('Am Lesen'), onClick: onShowReading },
        {
          key: 'year',
          value: yearStats.booksFinished,
          label: t('Gelesen'),
          onClick: () => navigate('/books/stats'),
        },
        {
          key: 'pages',
          value: yearStats.pagesRead.toLocaleString(),
          label: t('Seiten'),
          onClick: () => navigate('/books/stats'),
        },
        {
          key: 'shelf',
          value: bookList.length,
          label: t('Im Regal'),
          onClick: () => navigate('/books/shelf'),
        },
      ];
      sub = hasBooks
        ? t('{n} Bücher · {m} dieses Jahr gelesen', {
            n: bookList.length,
            m: yearStats.booksFinished,
          })
        : showManga
          ? t('Bücher und Manga an einem Ort')
          : t('Dein Bücherregal');
    } else {
      pods = [
        { key: 'reading', value: manga.reading, label: t('Am Lesen'), onClick: onShowReading },
        ...newChaptersPod,
        {
          key: 'chapters',
          value: manga.chapters.toLocaleString(),
          label: t('Kapitel'),
          onClick: () => navigate('/manga/stats'),
        },
        {
          key: 'collection',
          value: mangaList.length,
          label: t('Sammlung'),
          onClick: onShowCollection,
        },
      ];
      sub = hasManga
        ? manga.completed > 0
          ? t('{n} Titel · {m} abgeschlossen', { n: mangaList.length, m: manga.completed })
          : t('{n} Titel in deiner Sammlung', { n: mangaList.length })
        : t('Deine Manga-Sammlung');
    }

    const showBanner = kind !== 'books' && !!manga.banner;
    const showCovers = !showBanner && kind !== 'manga' && books.art.length > 0;

    return (
      <header className="bk-deck-wrap">
        <motion.div
          className="bk-deck liquid-glass"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        >
          {showBanner && (
            <div
              className="rd-deck-banner"
              aria-hidden
              style={{ backgroundImage: `url(${manga.banner})` }}
            />
          )}
          {showCovers && (
            <div className="bk-deck-art" aria-hidden>
              {books.art.map((b) => (
                <BookCover key={b.id} book={b} />
              ))}
            </div>
          )}
          <div
            className="bk-deck-glow"
            aria-hidden
            style={{
              background: `radial-gradient(ellipse, ${currentTheme.primary}33, transparent 70%)`,
            }}
          />

          <div className="bk-deck-top">
            <div className="rd-deck-title">
              <ReadingGreetingTitle
                displayName={displayName}
                areas={areas}
                onSearch={(query, target) => onSearch(target, query)}
              />
              <p className="bk-deck-sub" style={{ color: currentTheme.text.secondary }}>
                {sub}
              </p>
            </div>
            <div className="bk-deck-actions">
              <HeaderActions
                totalUnreadBadge={totalUnreadBadge}
                onNotificationsOpen={onNotificationsOpen}
                photoURL={photoURL}
                displayName={displayName ?? undefined}
              />
            </div>
          </div>

          <div className="bk-deck-row">
            <motion.button
              type="button"
              whileTap={tapScaleSmall}
              onClick={() => onSearch(areas === 'both' ? 'all' : areas)}
              aria-label={
                areas === 'manga'
                  ? t('Manga suchen')
                  : areas === 'books'
                    ? t('Bücher suchen')
                    : t('Bücher und Manga suchen')
              }
              className="bk-deck-search"
              style={{
                background: `linear-gradient(135deg, ${currentTheme.primary}14, transparent 45%), var(--glass-light)`,
                borderColor: `${currentTheme.primary}33`,
              }}
            >
              <Search style={{ fontSize: 20, color: currentTheme.primary, flexShrink: 0 }} />
              <span className="bk-deck-search-hint" style={{ color: currentTheme.text.muted }}>
                {areas === 'manga'
                  ? t('Manga, Manhwa, Manhua suchen...')
                  : areas === 'books'
                    ? t('Titel, Autor oder ISBN suchen...')
                    : t('Bücher und Manga suchen...')}
              </span>
            </motion.button>
            {(hasBooks || hasManga) &&
              pods.map((pod) => (
                <motion.button
                  key={pod.key}
                  type="button"
                  whileTap={tapScaleSmall}
                  onClick={pod.onClick}
                  className="bk-pod"
                  aria-label={`${pod.value} ${pod.label}`}
                  style={pod.highlight ? { borderColor: `${currentTheme.primary}59` } : undefined}
                >
                  <span
                    className="bk-pod-value"
                    style={{
                      color: pod.highlight ? currentTheme.primary : currentTheme.text.secondary,
                    }}
                  >
                    {pod.value}
                  </span>
                  <span className="bk-pod-label" style={{ color: currentTheme.text.muted }}>
                    {pod.label}
                  </span>
                </motion.button>
              ))}
          </div>
        </motion.div>
      </header>
    );
  }
);
ReadingDeck.displayName = 'ReadingDeck';
