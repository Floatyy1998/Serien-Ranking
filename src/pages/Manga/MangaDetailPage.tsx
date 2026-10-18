import { SearchOff } from '@mui/icons-material';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { EmptyState, LoadingSpinner, PageLayout } from '../../components/ui';
import { useBooksList } from '../../contexts/BooksListContext';
import { useMangaList } from '../../contexts/MangaListContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useDeviceType } from '../../hooks/platform/useDeviceType';
import { logMangaRating } from '../../services/discussion/readActivityService';
import { logReadingActivity } from '../../features/badges/minimalActivityLogger';
import { showToast, showUndoToast } from '../../lib/interaction/toast';
import {
  isStaleVolumeMode,
  mangaHasVolumes,
  mangaStand,
  mangaUnit,
  type MangaUnit,
} from '../../lib/manga/progress';
import type { Manga } from '../../types/Manga';
import './MangaDetailPage.css';
import { MangaDetailBody } from './detail/MangaDetailBody';
import { MangaDetailHero } from './detail/MangaDetailHero';
import { MangaDetailPreview } from './detail/MangaDetailPreview';
import { VolumeHint } from './detail/VolumeHint';
import { buildHeroData } from './detail/mangaDetailData';
import { useMangaLiveData } from './detail/useMangaLiveData';
import { addMangaToList } from './addMangaToList';
import { getEffectiveChapterCount } from './mangaUtils';
import { saveReadProgress } from './saveReadProgress';
import { moveMangaToBooks, rememberSourceBooks, restoreMangaFromBooks } from './mangaBookSwitch';
import { bookPath, searchPath } from '../Books/helpers';
import { useOwnedBooks } from '../../hooks/books/useOwnedBooks';
import { findVolumeBook } from '../../services/books/volumeBook';
import {
  firstSourceBook,
  sameEdition,
  volumeBookFrom,
  volumeSnapshot,
} from '../../lib/books/mangaBooks';
import { bookAsResult } from '../../lib/books/bookSearchMapping';
import { dbRef, paths, userPath } from '../../services/db/ref';
import { trackMangaDeleted } from '../../services/firebase/analytics';
import { t } from '../../services/i18n';

const logMangaActivity = (uid: string, manga: Manga, type: 'manga_rated', rating?: number) =>
  void logReadingActivity(uid, {
    type,
    itemId: manga.anilistId,
    itemTitle: manga.title,
    poster: manga.poster,
    rating,
  });
export const MangaDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const { isMobile } = useDeviceType();
  const { mangaList, hiddenMangaList, toggleHideManga } = useMangaList();
  const { allBookList } = useBooksList();
  const navigate = useNavigate();
  const location = useLocation();

  const anilistId = Number(id);
  // Versteckte Manga gehören weiter zur Sammlung — sonst landet man auf der Vorschau.
  const manga =
    mangaList.find((m) => m.anilistId === anilistId) ||
    hiddenMangaList.find((m) => m.anilistId === anilistId);
  const ownedIds = useMemo(
    () => new Set([...mangaList, ...hiddenMangaList].map((m) => m.anilistId)),
    [mangaList, hiddenMangaList]
  );
  const [adding, setAdding] = useState(false);
  const [movingToBooks, setMovingToBooks] = useState(false);
  const [openingBook, setOpeningBook] = useState(false);
  const ownedFor = useOwnedBooks();
  // Band aus der ISBN-Suche (?band=N) — bietet „Bis Band N gelesen" an.
  const scannedVolume = Number(new URLSearchParams(location.search ?? '').get('band')) || 0;
  // Der Band selbst (ISBN-Treffer, Buchseite) — „Zum Buch" braucht dann keine Titelsuche.
  const scannedBook = volumeBookFrom(location.state);
  const [hintDismissed, setHintDismissed] = useState(false);

  const unit: MangaUnit = manga ? mangaUnit(manga) : 'chapter';
  const storedValue = (unit === 'volume' ? manga?.currentVolume : manga?.currentChapter) || 0;
  const [editValue, setEditValue] = useState(storedValue);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notesValue, setNotesValue] = useState(manga?.notes || '');
  const [notesStatus, setNotesStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const notesFocusedRef = useRef(false);
  const notesSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [customPlatform, setCustomPlatform] = useState('');
  const [showCustomPlatform, setShowCustomPlatform] = useState(false);

  const { anilistData, detailsFailed, mangadexInfo, chapterInfo, liveVolumes, volumesChecked } =
    useMangaLiveData({ user, anilistId, manga });

  // Sync local edit state when manga data changes from Firebase. Cannot be a
  // pure useMemo since editValue is also driven by local stepper clicks.
  const mangaNotes = manga?.notes;

  useEffect(() => {
    setEditValue(storedValue);
  }, [storedValue, unit]);
  useEffect(() => {
    // Fremd-Updates (z.B. anderes Gerät) übernehmen — aber nicht, während der
    // Nutzer gerade tippt, sonst würde die Eingabe überschrieben (F13 Autosave).
    if (!notesFocusedRef.current) setNotesValue(mangaNotes || '');
  }, [mangaNotes]);

  const updateField = useCallback(
    async (field: string, value: unknown) => {
      if (!user || !manga) return;
      await dbRef(userPath(user.uid, 'manga', anilistId, field)).set(value);
    },
    [user, manga, anilistId]
  );

  // Live-Daten (mangadexInfo, chapterInfo, Bandzahl) einrechnen, bevor der
  // Firebase-Write der Totals durch ist — sonst klemmt der Zähler auf dem alten Wert.
  const latestFromReleases = chapterInfo?.recentChapters?.length
    ? Math.max(...chapterInfo.recentChapters.map((c) => c.chapter))
    : 0;
  const total = manga
    ? unit === 'volume'
      ? mangaStand(manga, liveVolumes).total || null
      : getEffectiveChapterCount(manga, mangadexInfo?.latestChapter, latestFromReleases)
    : null;

  const handleValueChange = useCallback(
    async (next: number) => {
      if (!user || !manga) return;
      const cap = total ? Math.max(total, editValue) : null;
      const clamped = Math.max(0, cap ? Math.min(next, cap) : next);
      const previous = editValue;
      setEditValue(clamped);
      await saveReadProgress(user.uid, manga, { next: clamped, previous, total });
    },
    [user, manga, editValue, total]
  );

  const handleUnitChange = useCallback(
    (next: MangaUnit) => updateField('trackBy', next === 'volume' ? 'volumes' : null),
    [updateField]
  );

  const staleVolumeMode =
    !!manga && volumesChecked && scannedVolume === 0 && isStaleVolumeMode(manga, liveVolumes);
  useEffect(() => {
    if (staleVolumeMode) void updateField('trackBy', null).catch(() => {});
  }, [staleVolumeMode, updateField]);

  const handleMarkScannedVolume = useCallback(async () => {
    if (!user || !manga || scannedVolume <= 0) return;
    const asVolumes: Manga = { ...manga, trackBy: 'volumes' };
    if (unit !== 'volume') await updateField('trackBy', 'volumes');
    const snapshot = scannedBook && volumeSnapshot(scannedBook, new Date().toISOString());
    if (snapshot && !Object.values(manga.fromBooks ?? {}).some((b) => sameEdition(b, snapshot))) {
      void rememberSourceBooks(user.uid, manga.anilistId, [snapshot]).catch(() => {});
    }
    const volumeTotal = mangaStand(asVolumes, liveVolumes).total || null;
    await saveReadProgress(user.uid, asVolumes, {
      next: volumeTotal ? Math.min(scannedVolume, volumeTotal) : scannedVolume,
      previous: manga.currentVolume || 0,
      total: volumeTotal,
    });
  }, [user, manga, unit, scannedVolume, scannedBook, liveVolumes, updateField]);

  const handleMoveToBooks = useCallback(async () => {
    if (!user || !manga || movingToBooks) return;
    setMovingToBooks(true);
    try {
      const firstVolume = manga.fromBooks
        ? null
        : (scannedBook ?? (await findVolumeBook(manga, 1)));
      const books = await moveMangaToBooks(user.uid, manga, new Set(allBookList.map((b) => b.id)));
      const uid = user.uid;
      const undo = (message: string) =>
        showUndoToast(
          message,
          () =>
            void restoreMangaFromBooks(uid, manga, books).then(
              () => navigate(`/manga/${manga.anilistId}`, { replace: true }),
              () => showToast(t('Speichern fehlgeschlagen'), 2200, 'error')
            )
        );
      if (books.length === 0 && firstVolume) {
        const owned = ownedFor(firstVolume);
        navigate(bookPath(owned?.id ?? firstVolume.id), {
          replace: true,
          state: owned ? undefined : { result: firstVolume },
        });
        undo(t('„{title}" wird jetzt als Buch geführt', { title: manga.title }));
      } else if (books.length === 1) {
        navigate(`/books/${encodeURIComponent(books[0].id)}`, { replace: true });
        undo(t('„{title}" steht wieder bei deinen Büchern', { title: books[0].title }));
      } else if (books.length > 1) {
        navigate('/books', { replace: true });
        undo(t('{n} Bände stehen wieder bei deinen Büchern', { n: books.length }));
      } else {
        navigate(searchPath(manga.title), { replace: true });
        undo(t('Such dir die Bände aus, die du als Buch führen willst'));
      }
    } catch {
      showToast(t('Speichern fehlgeschlagen'), 2200, 'error');
    } finally {
      setMovingToBooks(false);
    }
  }, [user, manga, movingToBooks, scannedBook, allBookList, ownedFor, navigate]);

  const handleOpenBook = useCallback(async () => {
    if (!manga || openingBook) return;
    setOpeningBook(true);
    try {
      const own = firstSourceBook(manga);
      const result = scannedBook ?? (own ? bookAsResult(own) : await findVolumeBook(manga, 1));
      if (!result) {
        navigate(searchPath(manga.title));
        return;
      }
      const owned = ownedFor(result);
      navigate(bookPath(owned?.id ?? result.id), owned ? undefined : { state: { result } });
    } finally {
      setOpeningBook(false);
    }
  }, [manga, openingBook, scannedBook, ownedFor, navigate]);

  const handleStatusChange = useCallback(
    async (status: Manga['readStatus']) => {
      if (!user || !manga) return;
      const updates: Record<string, unknown> = { readStatus: status };
      if (status === 'reading' && !manga.startedAt) {
        updates.startedAt = new Date().toISOString();
      }
      if (status === 'completed') {
        updates.completedAt = new Date().toISOString();
      }
      await dbRef(paths.mangaItem(user.uid, anilistId)).update(updates);
      if (status === 'completed' && manga.readStatus !== 'completed') {
        void logReadingActivity(user.uid, {
          type: 'manga_finished',
          itemId: manga.anilistId,
          itemTitle: manga.title,
          poster: manga.poster,
        });
      }
    },
    [user, manga, anilistId]
  );

  const handleReread = useCallback(async () => {
    if (!user || !manga) return;
    const now = new Date().toISOString();
    await dbRef(paths.mangaItem(user.uid, anilistId)).update({
      readStatus: 'reading',
      currentChapter: 0,
      currentVolume: 0,
      rereadCount: (manga.rereadCount || 0) + 1,
      startedAt: now,
      lastReadAt: now,
      completedAt: null,
    });
  }, [user, manga, anilistId]);

  const scrollToRating = useCallback(() => {
    document
      .getElementById('manga-rating')
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  // Einstieg aus „Noch nicht bewertet" springt direkt zu den Sternen.
  const hasManga = !!manga;
  useEffect(() => {
    if (location.hash !== '#rating' || !hasManga) return;
    const timer = setTimeout(scrollToRating, 450);
    return () => clearTimeout(timer);
  }, [location.hash, hasManga, scrollToRating]);

  const handleRating = useCallback(
    async (rating: number) => {
      if (!user || !manga) return;
      const currentRating = manga.rating?.[user.uid];
      if (currentRating === rating) {
        await dbRef(userPath(user.uid, 'manga', anilistId, 'rating', user.uid)).remove();
      } else {
        await updateField(`rating/${user.uid}`, rating);
        await logMangaRating(user.uid, manga, rating);
        logMangaActivity(user.uid, manga, 'manga_rated', rating);
      }
    },
    [user, manga, anilistId, updateField]
  );

  const handlePlatformSelect = useCallback(
    async (platform: string) => {
      await updateField('readingPlatform', platform);
      setShowCustomPlatform(false);
    },
    [updateField]
  );

  // F13: Notizen speichern sich selbst (debounced) — kein Edit-Modus mehr.
  const saveNotes = useCallback(
    async (value: string) => {
      if (!user || !manga) return;
      if ((manga.notes || '') === value) {
        setNotesStatus('idle');
        return;
      }
      setNotesStatus('saving');
      try {
        await updateField('notes', value);
        setNotesStatus('saved');
      } catch {
        setNotesStatus('idle');
      }
    },
    [user, manga, updateField]
  );

  const handleNotesChange = useCallback(
    (value: string) => {
      setNotesValue(value);
      setNotesStatus('saving');
      if (notesSaveTimer.current) clearTimeout(notesSaveTimer.current);
      notesSaveTimer.current = setTimeout(() => void saveNotes(value), 800);
    },
    [saveNotes]
  );

  const handleNotesFocus = useCallback(() => {
    notesFocusedRef.current = true;
  }, []);

  const handleNotesBlur = useCallback(() => {
    notesFocusedRef.current = false;
    if (notesSaveTimer.current) clearTimeout(notesSaveTimer.current);
    void saveNotes(notesValue);
  }, [saveNotes, notesValue]);

  // "Gespeichert"-Hinweis nach kurzer Zeit ausblenden.
  useEffect(() => {
    if (notesStatus !== 'saved') return;
    const t = setTimeout(() => setNotesStatus('idle'), 2000);
    return () => clearTimeout(t);
  }, [notesStatus]);

  // Ausstehenden Debounce beim Unmount aufräumen.
  useEffect(() => {
    return () => {
      if (notesSaveTimer.current) clearTimeout(notesSaveTimer.current);
    };
  }, []);

  const mangaTitle = manga?.title ?? '';
  const handleDelete = useCallback(async () => {
    if (!user) return;
    await dbRef(paths.mangaItem(user.uid, anilistId)).remove();
    trackMangaDeleted(String(anilistId), mangaTitle);
    navigate('/reading');
  }, [user, anilistId, mangaTitle, navigate]);

  const heroData = useMemo(
    () => buildHeroData(anilistId, manga, anilistData),
    [anilistId, manga, anilistData]
  );

  // Noch nicht in der Sammlung → AniList-Vorschau mit Hinzufügen-Knopf
  if (!manga) {
    if (!anilistData) {
      return (
        <PageLayout>
          {detailsFailed ? (
            <EmptyState
              icon={<SearchOff style={{ fontSize: 44 }} />}
              title={t('Manga nicht gefunden')}
              action={{ label: t('Zur Lesen-Seite'), onClick: () => navigate('/reading') }}
            />
          ) : (
            <LoadingSpinner text={t('Laden...')} />
          )}
        </PageLayout>
      );
    }

    return (
      <MangaDetailPreview
        anilistData={anilistData}
        heroData={heroData}
        currentTheme={currentTheme}
        isMobile={isMobile}
        ownedIds={ownedIds}
        adding={adding}
        onAdd={async () => {
          if (!user || adding) return;
          setAdding(true);
          const all = [...mangaList, ...hiddenMangaList];
          const nextNmr = all.length > 0 ? Math.max(...all.map((m) => m.nmr)) + 1 : 1;
          try {
            await addMangaToList(user.uid, anilistData, nextNmr, {
              byVolume: scannedVolume > 0,
              fromBooks: scannedBook
                ? [volumeSnapshot(scannedBook, new Date().toISOString())]
                : undefined,
            });
          } finally {
            setAdding(false);
          }
        }}
      />
    );
  }

  const userRating = user ? manga.rating?.[user.uid] || 0 : 0;
  const hasVolumes = unit === 'volume' || mangaHasVolumes(manga, liveVolumes);
  const progress = total && total > 0 ? Math.min((editValue / total) * 100, 100) : 0;
  const showVolumeHint =
    scannedVolume > 0 &&
    !hintDismissed &&
    (unit !== 'volume' || (manga.currentVolume || 0) < scannedVolume);

  return (
    <PageLayout>
      <MangaDetailHero
        data={heroData}
        currentTheme={currentTheme}
        isMobile={isMobile}
        owned={{
          manga,
          unit,
          value: editValue,
          total,
          progress,
          userRating,
          nextChapterDate: chapterInfo?.estimatedNextDate ?? null,
          canCountVolumes: hasVolumes,
          onValueChange: handleValueChange,
          onUnitChange: handleUnitChange,
          onRate: scrollToRating,
        }}
      />

      {showVolumeHint && (
        <VolumeHint
          volume={scannedVolume}
          tracksChapters={unit !== 'volume'}
          onMark={() => void handleMarkScannedVolume()}
          onDismiss={() => setHintDismissed(true)}
        />
      )}

      <MangaDetailBody
        manga={manga}
        heroData={heroData}
        currentTheme={currentTheme}
        isMobile={isMobile}
        chapterInfo={chapterInfo}
        displayData={anilistData}
        ownedIds={ownedIds}
        userRating={userRating}
        notesValue={notesValue}
        notesStatus={notesStatus}
        showCustomPlatform={showCustomPlatform}
        setShowCustomPlatform={setShowCustomPlatform}
        customPlatform={customPlatform}
        setCustomPlatform={setCustomPlatform}
        showDeleteConfirm={showDeleteConfirm}
        setShowDeleteConfirm={setShowDeleteConfirm}
        onStatusChange={handleStatusChange}
        volumeTotal={unit === 'volume' ? total || 0 : 0}
        onChapterChange={handleValueChange}
        onVolumeChange={handleValueChange}
        onRating={handleRating}
        onPlatformSelect={handlePlatformSelect}
        onNotesChange={handleNotesChange}
        onNotesFocus={handleNotesFocus}
        onNotesBlur={handleNotesBlur}
        onReread={handleReread}
        onToggleHide={() => toggleHideManga(anilistId, !manga.hidden)}
        onDelete={handleDelete}
        onMoveToBooks={hasVolumes ? () => void handleMoveToBooks() : undefined}
        movingToBooks={movingToBooks}
        onOpenBook={() => void handleOpenBook()}
        openingBook={openingBook}
      />
    </PageLayout>
  );
};
