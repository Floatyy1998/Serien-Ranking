import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { PageHeader, PageLayout } from '../../components/ui';
import { useMangaList } from '../../contexts/MangaListContext';
import { useTheme } from '../../contexts/ThemeContextDef';
import { useDeviceType } from '../../hooks/useDeviceType';
import { logChapterRead, logMangaRating } from '../../services/readActivityService';
import type { Manga } from '../../types/Manga';
import '../SeriesDetail/SeriesDetailPage.css';
import './MangaDetailPage.css';
import { MangaDetailBody } from './detail/MangaDetailBody';
import { MangaDetailHero } from './detail/MangaDetailHero';
import { MangaDetailPreview } from './detail/MangaDetailPreview';
import { useMangaLiveData } from './detail/useMangaLiveData';
import { addMangaToList } from './addMangaToList';
import { getEffectiveChapterCount } from './mangaUtils';
import { dbRef, paths, userPath } from '../../lib/db/ref';

export const MangaDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const { isMobile } = useDeviceType();
  const { mangaList, toggleHideManga } = useMangaList();
  const navigate = useNavigate();

  const anilistId = Number(id);
  const manga = mangaList.find((m) => m.anilistId === anilistId);

  const [editChapter, setEditChapter] = useState(manga?.currentChapter || 0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(manga?.notes || '');
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
    setNotesValue(mangaNotes || '');
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

      // Nur auto-completen, wenn der vorherige Wert noch unter effectiveMax lag.
      // Schutz gegen stale Total-Werte: wenn manga.currentChapter bereits >=
      // effectiveMax, ist effectiveMax offensichtlich nicht aktuell (z.B.
      // AniList chapters=2 bei Vagabond, bevor Live-Quellen ankommen).
      if (effectiveMax && manga.currentChapter < effectiveMax && clamped >= effectiveMax) {
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

  const handleSaveNotes = useCallback(async () => {
    await updateField('notes', notesValue);
    setEditingNotes(false);
  }, [updateField, notesValue]);

  const handleDelete = useCallback(async () => {
    if (!user) return;
    await dbRef(paths.mangaItem(user.uid, anilistId)).remove();
    navigate('/manga');
  }, [user, anilistId, navigate]);

  // Not in user's list yet → AniList preview with Add button
  if (!manga) {
    if (!anilistData) {
      return (
        <PageLayout>
          <PageHeader title="Manga" />
          <div style={{ textAlign: 'center', padding: 40, opacity: 0.5 }}>Laden...</div>
        </PageLayout>
      );
    }

    return (
      <MangaDetailPreview
        anilistData={anilistData}
        currentTheme={currentTheme}
        anilistId={anilistId}
        onAdd={async () => {
          if (!user) return;
          const nextNmr = mangaList.length > 0 ? Math.max(...mangaList.map((m) => m.nmr)) + 1 : 1;
          await addMangaToList(user.uid, anilistData, nextNmr);
        }}
      />
    );
  }

  const displayData = anilistData;
  const description = displayData?.description || manga.description || '';
  const cleanDescription = description.replace(/<[^>]*>/g, '');
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

  const staff = displayData?.staff?.edges || [];

  return (
    <PageLayout>
      <MangaDetailHero
        manga={manga}
        currentTheme={currentTheme}
        isMobile={isMobile}
        editChapter={editChapter}
        effectiveChapters={effectiveChapters || null}
        progress={progress}
        staff={staff}
        onChapterChange={handleChapterChange}
      />

      <MangaDetailBody
        manga={manga}
        anilistId={anilistId}
        currentTheme={currentTheme}
        chapterInfo={chapterInfo}
        displayData={displayData}
        cleanDescription={cleanDescription}
        userRating={userRating}
        editingNotes={editingNotes}
        setEditingNotes={setEditingNotes}
        notesValue={notesValue}
        setNotesValue={setNotesValue}
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
        onSaveNotes={handleSaveNotes}
        onToggleHide={() => toggleHideManga(anilistId, !manga.hidden)}
        onDelete={handleDelete}
      />
    </PageLayout>
  );
};
