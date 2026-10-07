import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner, PageLayout } from '../../components/ui';
import { useMangaList } from '../../contexts/MangaListContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useDeviceType } from '../../hooks/platform/useDeviceType';
import { logChapterRead, logMangaRating } from '../../services/discussion/readActivityService';
import type { Manga } from '../../types/Manga';
import './MangaDetailPage.css';
import { MangaDetailBody } from './detail/MangaDetailBody';
import { MangaDetailHero } from './detail/MangaDetailHero';
import { MangaDetailPreview } from './detail/MangaDetailPreview';
import { buildHeroData } from './detail/mangaDetailData';
import { useMangaLiveData } from './detail/useMangaLiveData';
import { addMangaToList } from './addMangaToList';
import { getEffectiveChapterCount, shouldAutoComplete } from './mangaUtils';
import { dbRef, paths, userPath } from '../../services/db/ref';
import { t } from '../../services/i18n';

export const MangaDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const { isMobile } = useDeviceType();
  const { mangaList, hiddenMangaList, toggleHideManga } = useMangaList();
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

  const [editChapter, setEditChapter] = useState(manga?.currentChapter || 0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notesValue, setNotesValue] = useState(manga?.notes || '');
  const [notesStatus, setNotesStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const notesFocusedRef = useRef(false);
  const notesSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [customPlatform, setCustomPlatform] = useState('');
  const [showCustomPlatform, setShowCustomPlatform] = useState(false);

  const { anilistData, mangadexInfo, chapterInfo } = useMangaLiveData({ user, anilistId, manga });

  // Sync local edit state when manga data changes from Firebase. Cannot be a
  // pure useMemo since editChapter is also driven by local stepper clicks.
  const mangaChapter = manga?.currentChapter;
  const mangaNotes = manga?.notes;

  useEffect(() => {
    if (mangaChapter !== undefined) setEditChapter(mangaChapter);
  }, [mangaChapter]);
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

  const handleChapterChange = useCallback(
    async (newChapter: number) => {
      if (!user || !manga) return;
      // Live-Daten (mangadexInfo, chapterInfo) als Fallback einrechnen, bevor
      // der Firebase-Write von latestChapterAvailable durch ist — sonst klemmt
      // der Counter auf dem veralteten manga.chapters-Wert.
      const latestFromReleases = chapterInfo?.recentChapters?.length
        ? Math.max(...chapterInfo.recentChapters.map((c) => c.chapter))
        : 0;
      const effectiveMax = getEffectiveChapterCount(
        manga,
        mangadexInfo?.latestChapter,
        latestFromReleases
      );
      const clamped = effectiveMax
        ? Math.max(0, Math.min(newChapter, effectiveMax))
        : Math.max(0, newChapter);
      const previousChapter = editChapter;
      setEditChapter(clamped);

      const updates: Record<string, unknown> = {
        currentChapter: clamped,
        lastReadAt: new Date().toISOString(),
      };

      if (manga.readStatus === 'planned' && clamped > 0) {
        updates.readStatus = 'reading';
        if (!manga.startedAt) updates.startedAt = new Date().toISOString();
      }

      if (shouldAutoComplete(manga, effectiveMax, manga.currentChapter, clamped)) {
        updates.readStatus = 'completed';
        updates.completedAt = new Date().toISOString();
      }

      await dbRef(paths.mangaItem(user.uid, anilistId)).update(updates);

      if (clamped > previousChapter) {
        await logChapterRead(user.uid, manga, clamped, previousChapter);
      }
    },
    [user, manga, anilistId, editChapter, mangadexInfo, chapterInfo]
  );

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
    },
    [user, manga, anilistId]
  );

  const handleReread = useCallback(async () => {
    if (!user || !manga) return;
    const now = new Date().toISOString();
    await dbRef(paths.mangaItem(user.uid, anilistId)).update({
      readStatus: 'reading',
      currentChapter: 0,
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

  const handleDelete = useCallback(async () => {
    if (!user) return;
    await dbRef(paths.mangaItem(user.uid, anilistId)).remove();
    navigate('/manga');
  }, [user, anilistId, navigate]);

  const heroData = useMemo(
    () => buildHeroData(anilistId, manga, anilistData),
    [anilistId, manga, anilistData]
  );

  // Noch nicht in der Sammlung → AniList-Vorschau mit Hinzufügen-Knopf
  if (!manga) {
    if (!anilistData) {
      return (
        <PageLayout>
          <LoadingSpinner text={t('Laden...')} />
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
            await addMangaToList(user.uid, anilistData, nextNmr);
          } finally {
            setAdding(false);
          }
        }}
      />
    );
  }

  const userRating = user ? manga.rating?.[user.uid] || 0 : 0;

  // Effective total chapters: MAX aus allen Quellen. AniList's chapters ist
  // bei laufenden Serien oft veraltet (z.B. Vagabond meldet 2 statt 326),
  // also MangaUpdates-Daten dazunehmen statt First-truthy-Wins.
  const latestFromReleases = chapterInfo?.recentChapters?.length
    ? Math.max(...chapterInfo.recentChapters.map((c) => c.chapter))
    : 0;
  const effectiveChapters = getEffectiveChapterCount(
    manga,
    mangadexInfo?.latestChapter,
    latestFromReleases
  );
  const progress =
    effectiveChapters && effectiveChapters > 0
      ? Math.min((editChapter / effectiveChapters) * 100, 100)
      : 0;

  return (
    <PageLayout>
      <MangaDetailHero
        data={heroData}
        currentTheme={currentTheme}
        isMobile={isMobile}
        owned={{
          manga,
          editChapter,
          effectiveChapters: effectiveChapters || null,
          progress,
          userRating,
          nextChapterDate: chapterInfo?.estimatedNextDate ?? null,
          onChapterChange: handleChapterChange,
          onRate: scrollToRating,
        }}
      />

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
        onChapterChange={handleChapterChange}
        onRating={handleRating}
        onPlatformSelect={handlePlatformSelect}
        onNotesChange={handleNotesChange}
        onNotesFocus={handleNotesFocus}
        onNotesBlur={handleNotesBlur}
        onReread={handleReread}
        onToggleHide={() => toggleHideManga(anilistId, !manga.hidden)}
        onDelete={handleDelete}
      />
    </PageLayout>
  );
};
