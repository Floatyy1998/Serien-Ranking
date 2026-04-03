import {
  Add,
  Delete,
  Edit,
  Link,
  MenuBook,
  OpenInNew,
  Remove,
  Star,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import firebase from 'firebase/compat/app';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { BackButton, PageHeader, PageLayout } from '../../components/ui';
import { useMangaList } from '../../contexts/MangaListContext';
import { useTheme } from '../../contexts/ThemeContextDef';
import { useDeviceType } from '../../hooks/useDeviceType';
import { getMangaById } from '../../services/anilistService';
import { addMangaToList } from './addMangaToList';
import {
  getMangaDexInfo,
  getMangaDexChapterDates,
  type MangaDexInfo,
  type MangaDexChapterInfo,
} from '../../services/mangadexService';
import { logChapterRead, logMangaRating } from '../../services/readActivityService';
import type { AniListMangaSearchResult, Manga } from '../../types/Manga';
import '../SeriesDetail/SeriesDetailPage.css';
import './MangaDetailPage.css';

const STATUS_OPTIONS: { value: Manga['readStatus']; label: string; color: string }[] = [
  { value: 'reading', label: 'Lese ich', color: '#3b82f6' },
  { value: 'completed', label: 'Abgeschlossen', color: '#22c55e' },
  { value: 'paused', label: 'Pausiert', color: '#f59e0b' },
  { value: 'dropped', label: 'Abgebrochen', color: '#ef4444' },
  { value: 'planned', label: 'Geplant', color: '#8b5cf6' },
];

import { ANILIST_STATUS_LABELS, getDisplayFormat } from './mangaUtils';

const PLATFORM_OPTIONS = [
  'MangaDex',
  'Viz',
  'Webtoon',
  'Tapas',
  'Crunchyroll',
  'ComiXology',
  'Shonen Jump',
  'MangaPlus',
];

export const MangaDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const { isMobile } = useDeviceType();
  const { mangaList, toggleHideManga } = useMangaList();
  const navigate = useNavigate();

  const anilistId = Number(id);
  const manga = mangaList.find((m) => m.anilistId === anilistId);

  const [anilistData, setAnilistData] = useState<AniListMangaSearchResult | null>(null);
  const [editChapter, setEditChapter] = useState(manga?.currentChapter || 0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(manga?.notes || '');
  const [customPlatform, setCustomPlatform] = useState('');
  const [showCustomPlatform, setShowCustomPlatform] = useState(false);
  const [mangadexInfo, setMangadexInfo] = useState<MangaDexInfo | null>(null);
  const [chapterInfo, setChapterInfo] = useState<MangaDexChapterInfo | null>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  // Sync local edit state when manga data changes from Firebase
  const mangaChapter = manga?.currentChapter;
  const mangaNotes = manga?.notes;
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (mangaChapter !== undefined) setEditChapter(mangaChapter);
  }, [mangaChapter]);
  useEffect(() => {
    setNotesValue(mangaNotes || '');
  }, [mangaNotes]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (anilistId) {
      getMangaById(anilistId)
        .then(setAnilistData)
        .catch(() => {});
    }
  }, [anilistId]);

  // Extract stable values for effect deps
  const mangaTitle = manga?.title;
  const mangaChapters = manga?.chapters;
  const mangaStatus = manga?.status;

  // Fetch latest chapter from MangaDex for ongoing manga without chapter count
  useEffect(() => {
    if (!user || !mangaTitle || mangaChapters || mangaStatus !== 'RELEASING') return;
    getMangaDexInfo(mangaTitle)
      .then((info) => {
        setMangadexInfo(info);
        if (info.latestChapter && info.latestChapter > 0) {
          firebase
            .database()
            .ref(`${user.uid}/manga/${anilistId}/latestChapterAvailable`)
            .set(info.latestChapter);
        }
      })
      .catch(() => {});
  }, [user, mangaTitle, mangaChapters, mangaStatus, anilistId]);

  // Fetch chapter release dates from MangaDex for releasing manga
  useEffect(() => {
    if (!mangaTitle || mangaStatus !== 'RELEASING') return;
    getMangaDexChapterDates(mangaTitle)
      .then(setChapterInfo)
      .catch(() => {});
  }, [mangaTitle, mangaStatus]);

  const updateField = useCallback(
    async (field: string, value: unknown) => {
      if (!user || !manga) return;
      await firebase.database().ref(`${user.uid}/manga/${anilistId}/${field}`).set(value);
    },
    [user, manga, anilistId]
  );

  const handleChapterChange = useCallback(
    async (newChapter: number) => {
      if (!user || !manga) return;
      const effectiveMax = manga.chapters || manga.latestChapterAvailable || null;
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

      if (manga.chapters && clamped >= manga.chapters) {
        updates.readStatus = 'completed';
        updates.completedAt = new Date().toISOString();
      }

      await firebase.database().ref(`${user.uid}/manga/${anilistId}`).update(updates);

      // Log activity only for increments
      if (clamped > previousChapter) {
        await logChapterRead(user.uid, manga, clamped, previousChapter);
      }
    },
    [user, manga, anilistId, editChapter]
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

      await firebase.database().ref(`${user.uid}/manga/${anilistId}`).update(updates);
    },
    [user, manga, anilistId]
  );

  const handleRating = useCallback(
    async (rating: number) => {
      if (!user || !manga) return;
      const currentRating = manga.rating?.[user.uid];
      if (currentRating === rating) {
        await firebase.database().ref(`${user.uid}/manga/${anilistId}/rating/${user.uid}`).remove();
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
    await firebase.database().ref(`${user.uid}/manga/${anilistId}`).remove();
    navigate('/manga');
  }, [user, anilistId, navigate]);

  // Not in user's list yet - show AniList preview with Add button
  if (!manga) {
    if (!anilistData) {
      return (
        <PageLayout>
          <PageHeader title="Manga" />
          <div style={{ textAlign: 'center', padding: 40, opacity: 0.5 }}>Laden...</div>
        </PageLayout>
      );
    }

    const previewFormat = getDisplayFormat(anilistData.countryOfOrigin, anilistData.format);
    const previewDesc = (anilistData.description || '').replace(/<[^>]*>/g, '');
    const previewTitle = anilistData.title.english || anilistData.title.romaji;

    return (
      <PageLayout>
        {anilistData.bannerImage && (
          <div className="manga-detail-banner">
            <img src={anilistData.bannerImage} alt="" />
            <div className="manga-detail-banner-fade" />
          </div>
        )}

        <PageHeader
          title={previewTitle}
          gradientFrom={currentTheme.primary}
          gradientTo={currentTheme.accent}
          subtitle={previewFormat}
          icon={<MenuBook />}
        />

        <div className="manga-detail-content">
          <div className="manga-detail-info-row">
            <img
              className="manga-detail-poster"
              src={anilistData.coverImage.large}
              alt={previewTitle}
            />
            <div className="manga-detail-info">
              {anilistData.title.romaji && anilistData.title.romaji !== previewTitle && (
                <div
                  className="manga-detail-alt-title"
                  style={{ color: currentTheme.text.secondary }}
                >
                  {anilistData.title.romaji}
                </div>
              )}
              <div className="manga-detail-meta">
                {anilistData.status && (
                  <span className="manga-detail-meta-item">
                    {ANILIST_STATUS_LABELS[anilistData.status] || anilistData.status}
                  </span>
                )}
                {anilistData.chapters && (
                  <span className="manga-detail-meta-item">{anilistData.chapters} Kapitel</span>
                )}
                {anilistData.volumes && (
                  <span className="manga-detail-meta-item">{anilistData.volumes} Bände</span>
                )}
                {anilistData.averageScore && (
                  <span className="manga-detail-meta-item">⭐ {anilistData.averageScore}%</span>
                )}
              </div>
              {anilistData.genres && anilistData.genres.length > 0 && (
                <div className="manga-detail-genres">
                  {anilistData.genres.slice(0, 5).map((g) => (
                    <span
                      key={g}
                      className="manga-detail-genre"
                      style={{
                        background: `${currentTheme.primary}20`,
                        color: currentTheme.primary,
                      }}
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Add to list button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={async () => {
              if (!user) return;
              const nextNmr =
                mangaList.length > 0 ? Math.max(...mangaList.map((m) => m.nmr)) + 1 : 1;
              await addMangaToList(user.uid, anilistData, nextNmr);
            }}
            style={{
              width: '100%',
              padding: '14px 0',
              borderRadius: 14,
              border: 'none',
              background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
              color: '#fff',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginBottom: 20,
              boxShadow: `0 4px 20px ${currentTheme.primary}40`,
            }}
          >
            <Add style={{ fontSize: 20 }} />
            Zur Sammlung hinzufügen
          </motion.button>

          {/* Description */}
          {previewDesc && (
            <Section bg={`${currentTheme.text.primary}08`} delay={0.1}>
              <SectionTitle color={currentTheme.text.primary}>Beschreibung</SectionTitle>
              <p
                className="manga-detail-description"
                style={{ color: currentTheme.text.secondary }}
              >
                {previewDesc}
              </p>
            </Section>
          )}
        </div>
      </PageLayout>
    );
  }

  const displayData = anilistData;
  const description = displayData?.description || manga.description || '';
  const cleanDescription = description.replace(/<[^>]*>/g, '');
  const userRating = user ? manga.rating?.[user.uid] || 0 : 0;

  // Effective total chapters: AniList > Firebase (from MangaDex) > live MangaDex > null
  const effectiveChapters =
    manga.chapters || manga.latestChapterAvailable || mangadexInfo?.latestChapter || null;
  const progress =
    effectiveChapters && effectiveChapters > 0
      ? Math.min((editChapter / effectiveChapters) * 100, 100)
      : 0;

  // Related manga from AniList
  const recommendations = displayData?.recommendations?.edges?.slice(0, 6) || [];
  const staff = displayData?.staff?.edges || [];
  const externalLinks = displayData?.externalLinks || [];
  const relations = displayData?.relations?.edges?.filter((e) => e.node.type === 'MANGA') || [];

  const displayFormat = getDisplayFormat(manga.countryOfOrigin, manga.format);

  return (
    <PageLayout>
      {/* ─── Hero ─── */}
      <div
        style={{ position: 'relative', overflow: 'hidden', minHeight: isMobile ? undefined : 420 }}
      >
        {/* Backdrop: blurred poster on mobile, actual banner on desktop */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
            backgroundImage: `url(${isMobile ? manga.bannerImage || manga.poster : manga.bannerImage || manga.poster})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
            filter: isMobile ? 'blur(50px) brightness(0.25) saturate(1.8)' : 'brightness(0.35)',
            transform: isMobile ? 'scale(1.3)' : 'none',
          }}
        />
        {/* Gradient */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: isMobile ? '60%' : '80%',
            zIndex: 1,
            background: `linear-gradient(transparent, ${currentTheme.background.default})`,
          }}
        />
        {/* Vignette on desktop */}
        {!isMobile && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 1,
              background:
                'radial-gradient(ellipse 80% 100% at 50% 50%, transparent 40%, rgba(10,14,26,0.6) 100%)',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Back button */}
        <div
          style={{
            position: 'absolute',
            top: 'calc(12px + env(safe-area-inset-top))',
            left: isMobile ? 12 : 20,
            zIndex: 10,
          }}
        >
          <BackButton style={{ backdropFilter: 'blur(10px)' }} />
        </div>

        {/* Content */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            paddingTop: 'calc(64px + env(safe-area-inset-top))',
            paddingBottom: isMobile ? 20 : 36,
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'center' : 'stretch',
            gap: isMobile ? 0 : 32,
            ...(isMobile
              ? {}
              : {
                  maxWidth: 1100,
                  margin: '0 auto',
                  paddingLeft: 48,
                  paddingRight: 48,
                }),
          }}
        >
          {/* Poster */}
          <img
            src={manga.poster}
            alt={manga.title}
            style={{
              width: isMobile ? 150 : 220,
              height: isMobile ? 220 : 325,
              borderRadius: isMobile ? 14 : 16,
              objectFit: 'cover',
              flexShrink: 0,
              boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 6px 20px rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.06)',
              marginBottom: isMobile ? 20 : 0,
            }}
          />

          {/* Info - glassmorphic on desktop */}
          <div
            style={{
              ...(isMobile
                ? { width: '100%' }
                : {
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column' as const,
                    background: 'rgba(10, 14, 26, 0.55)',
                    backdropFilter: 'blur(24px) saturate(1.4)',
                    WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
                    borderRadius: 20,
                    padding: '24px 28px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  }),
            }}
          >
            <h1
              style={{
                fontSize: isMobile ? 24 : 32,
                fontWeight: 800,
                fontFamily: 'var(--font-display)',
                margin: isMobile ? '0 20px 4px' : '0 0 6px',
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
                color: '#fff',
                textAlign: isMobile ? ('center' as const) : ('left' as const),
              }}
            >
              {manga.title}
            </h1>

            {manga.titleRomaji && manga.titleRomaji !== manga.title && (
              <div
                style={{
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.4)',
                  textAlign: isMobile ? 'center' : 'left',
                  padding: isMobile ? '0 20px' : 0,
                  marginBottom: 2,
                }}
              >
                {manga.titleRomaji}
              </div>
            )}

            {/* Meta */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: isMobile ? 'center' : 'flex-start',
                gap: '3px 8px',
                fontSize: 13,
                color: 'rgba(255,255,255,0.55)',
                marginTop: 8,
                padding: isMobile ? '0 20px' : 0,
              }}
            >
              <span style={{ fontWeight: 600, color: currentTheme.primary }}>{displayFormat}</span>
              {manga.status && <span>{ANILIST_STATUS_LABELS[manga.status] || manga.status}</span>}
              {effectiveChapters && <span>{effectiveChapters} Kapitel</span>}
              {manga.averageScore && <span>⭐ {manga.averageScore}%</span>}
            </div>

            {/* Staff */}
            {staff.length > 0 && (
              <div
                style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.3)',
                  marginTop: 6,
                  textAlign: isMobile ? 'center' : 'left',
                }}
              >
                {staff
                  .filter(
                    (s) =>
                      s.role.toLowerCase().includes('story') || s.role.toLowerCase().includes('art')
                  )
                  .slice(0, 2)
                  .map((s) => s.node.name.full)
                  .join(' · ')}
              </div>
            )}

            {/* Genres */}
            {manga.genres && manga.genres.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: isMobile ? 'center' : 'flex-start',
                  gap: 6,
                  padding: isMobile ? '0 20px' : 0,
                  marginTop: 12,
                }}
              >
                {manga.genres.slice(0, 5).map((g) => (
                  <span
                    key={g}
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      padding: '4px 12px',
                      borderRadius: 999,
                      color: 'rgba(255,255,255,0.7)',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}

            {/* Chapter counter + Progress - pushed to bottom on desktop */}
            <div
              style={{
                marginTop: isMobile ? 14 : 'auto',
                padding: isMobile ? '0 20px' : 0,
                paddingTop: isMobile ? 0 : 16,
              }}
            >
              {/* Chapter progress */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isMobile ? 'center' : 'flex-start',
                    gap: 2,
                  }}
                >
                  <button
                    onClick={() => handleChapterChange(editChapter - 1)}
                    className="manga-hero-stepper"
                    style={{ color: 'rgba(255,255,255,0.3)' }}
                  >
                    <Remove style={{ fontSize: 20 }} />
                  </button>
                  <input
                    type="text"
                    inputMode="numeric"
                    defaultValue={editChapter}
                    key={editChapter}
                    onFocus={(e) => e.target.select()}
                    onBlur={(e) => {
                      const v = parseInt(e.target.value, 10);
                      if (!isNaN(v) && v >= 1) {
                        const clamped = effectiveChapters ? Math.min(v, effectiveChapters) : v;
                        handleChapterChange(clamped);
                        e.target.value = String(clamped);
                      } else {
                        e.target.value = String(editChapter);
                      }
                    }}
                    onInput={(e) => {
                      const el = e.target as HTMLInputElement;
                      el.style.width = `${Math.max(el.value.length, 1) * 15 + 6}px`;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                    }}
                    className="manga-detail-counter-input manga-hero-chapter-input"
                    style={{
                      width: `${Math.max(String(editChapter).length, 1) * 15 + 6}px`,
                    }}
                  />
                  <button
                    onClick={() => handleChapterChange(editChapter + 1)}
                    className="manga-hero-stepper"
                    style={{ color: 'rgba(255,255,255,0.3)' }}
                  >
                    <Add style={{ fontSize: 20 }} />
                  </button>
                  {effectiveChapters && (
                    <span
                      style={{
                        color: 'rgba(255,255,255,0.2)',
                        fontSize: 13,
                        fontWeight: 500,
                        marginLeft: 4,
                      }}
                    >
                      von {effectiveChapters} Kapiteln
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                {effectiveChapters && effectiveChapters > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    <div
                      style={{
                        flex: 1,
                        height: 4,
                        borderRadius: 2,
                        background: 'rgba(255,255,255,0.08)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${progress}%`,
                          borderRadius: 2,
                          background: `linear-gradient(90deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                          transition: 'width 0.5s ease',
                          boxShadow: `0 0 8px ${currentTheme.primary}50`,
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
                      {Math.round(progress)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="manga-detail-content">
        {/* Chapter Releases (MangaDex) */}
        {chapterInfo && chapterInfo.recentChapters.length > 0 && manga.status === 'RELEASING' && (
          <Section bg={`${currentTheme.text.primary}08`} delay={0.12}>
            <SectionTitle color={currentTheme.text.primary}>Kapitel-Releases</SectionTitle>

            {/* Estimated next release */}
            {chapterInfo.estimatedNextDate &&
              new Date(chapterInfo.estimatedNextDate) > new Date() && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 12,
                    background: `${currentTheme.primary}15`,
                    border: `1px solid ${currentTheme.primary}30`,
                    marginBottom: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <div style={{ fontSize: 20 }}>📅</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: currentTheme.primary }}>
                      Nächstes Kapitel ~
                      {new Date(chapterInfo.estimatedNextDate).toLocaleDateString('de-DE', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                    {chapterInfo.avgDaysBetweenReleases && (
                      <div
                        style={{ fontSize: 11, color: currentTheme.text.secondary, opacity: 0.7 }}
                      >
                        Erscheint ca. alle {chapterInfo.avgDaysBetweenReleases} Tage
                      </div>
                    )}
                  </div>
                </div>
              )}

            {/* Recent chapters */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {chapterInfo.recentChapters.map((ch) => (
                <div
                  key={ch.chapter}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '6px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: currentTheme.text.primary,
                      minWidth: 50,
                    }}
                  >
                    Kap. {ch.chapter}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      fontSize: 12,
                      color: currentTheme.text.secondary,
                      opacity: 0.7,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {ch.title || ''}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: currentTheme.text.secondary,
                      opacity: 0.5,
                      flexShrink: 0,
                    }}
                  >
                    {new Date(ch.publishedAt).toLocaleDateString('de-DE', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Status */}
        <Section bg={`${currentTheme.text.primary}08`} delay={0.15}>
          <SectionTitle color={currentTheme.text.primary}>Status</SectionTitle>
          <div className="manga-detail-status-grid">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`manga-detail-status-btn ${manga.readStatus === opt.value ? 'manga-detail-status-btn--active' : ''}`}
                onClick={() => handleStatusChange(opt.value)}
                style={
                  manga.readStatus === opt.value
                    ? { borderColor: opt.color, background: `${opt.color}20`, color: opt.color }
                    : { color: currentTheme.text.secondary }
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        </Section>

        {/* Rating */}
        <Section bg={`${currentTheme.text.primary}08`} delay={0.2}>
          <SectionTitle color={currentTheme.text.primary}>Bewertung</SectionTitle>
          <div className="manga-detail-rating">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
              <button
                key={star}
                className="manga-detail-star-btn"
                onClick={() => handleRating(star)}
              >
                <Star
                  style={{
                    fontSize: 28,
                    color: star <= userRating ? '#f59e0b' : `${currentTheme.text.primary}25`,
                    transition: 'color 0.15s',
                  }}
                />
              </button>
            ))}
          </div>
          {userRating > 0 && (
            <div
              style={{
                textAlign: 'center',
                marginTop: 8,
                fontSize: 14,
                color: currentTheme.text.secondary,
              }}
            >
              {userRating}/10
            </div>
          )}
        </Section>

        {/* Reading Platform */}
        <Section bg={`${currentTheme.text.primary}08`} delay={0.25}>
          <SectionTitle color={currentTheme.text.primary}>Lese-Plattform</SectionTitle>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {PLATFORM_OPTIONS.map((p) => (
              <button
                key={p}
                className={`manga-detail-status-btn ${manga.readingPlatform === p ? 'manga-detail-status-btn--active' : ''}`}
                onClick={() => handlePlatformSelect(p)}
                style={
                  manga.readingPlatform === p
                    ? {
                        borderColor: currentTheme.primary,
                        background: `${currentTheme.primary}20`,
                        color: currentTheme.primary,
                      }
                    : { color: currentTheme.text.secondary }
                }
              >
                {p}
              </button>
            ))}
            {!showCustomPlatform ? (
              <button
                className="manga-detail-status-btn"
                onClick={() => setShowCustomPlatform(true)}
                style={{ color: currentTheme.text.secondary }}
              >
                + Andere
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  value={customPlatform}
                  onChange={(e) => setCustomPlatform(e.target.value)}
                  placeholder="Plattform..."
                  style={{
                    padding: '6px 10px',
                    borderRadius: 8,
                    border: `1px solid ${currentTheme.primary}40`,
                    background: 'transparent',
                    color: currentTheme.text.primary,
                    fontSize: 13,
                    outline: 'none',
                    width: 120,
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customPlatform.trim()) {
                      handlePlatformSelect(customPlatform.trim());
                      setCustomPlatform('');
                    }
                  }}
                />
              </div>
            )}
          </div>
          {manga.readingPlatform && !PLATFORM_OPTIONS.includes(manga.readingPlatform) && (
            <div
              style={{
                marginTop: 8,
                fontSize: 12,
                color: currentTheme.primary,
                opacity: 0.8,
              }}
            >
              Aktuell: {manga.readingPlatform}
            </div>
          )}
        </Section>

        {/* Notes */}
        <Section bg={`${currentTheme.text.primary}08`} delay={0.3}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <SectionTitle color={currentTheme.text.primary}>Notizen</SectionTitle>
            <button
              onClick={() => {
                if (editingNotes) handleSaveNotes();
                else setEditingNotes(true);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: currentTheme.primary,
                cursor: 'pointer',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Edit style={{ fontSize: 14 }} />
              {editingNotes ? 'Speichern' : 'Bearbeiten'}
            </button>
          </div>
          {editingNotes ? (
            <textarea
              ref={notesRef}
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              placeholder="Deine Notizen zu diesem Manga..."
              style={{
                width: '100%',
                minHeight: 80,
                padding: 12,
                borderRadius: 10,
                border: `1px solid ${currentTheme.primary}30`,
                background: 'rgba(255,255,255,0.03)',
                color: currentTheme.text.primary,
                fontSize: 14,
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'var(--font-body)',
              }}
            />
          ) : (
            <p
              style={{
                fontSize: 14,
                color: currentTheme.text.secondary,
                opacity: manga.notes ? 1 : 0.4,
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              {manga.notes || 'Keine Notizen vorhanden.'}
            </p>
          )}
        </Section>

        {/* Description */}
        {cleanDescription && (
          <Section bg={`${currentTheme.text.primary}08`} delay={0.35}>
            <SectionTitle color={currentTheme.text.primary}>Beschreibung</SectionTitle>
            <p className="manga-detail-description" style={{ color: currentTheme.text.secondary }}>
              {cleanDescription}
            </p>
          </Section>
        )}

        {/* Relations */}
        {relations.length > 0 && (
          <Section bg={`${currentTheme.text.primary}08`} delay={0.4}>
            <SectionTitle color={currentTheme.text.primary}>Verwandte Titel</SectionTitle>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
              {relations.map((rel) => (
                <div
                  key={rel.node.id}
                  onClick={() => navigate(`/manga/${rel.node.id}`)}
                  style={{ width: 90, flexShrink: 0, cursor: 'pointer' }}
                >
                  <img
                    src={rel.node.coverImage.large}
                    alt={rel.node.title.english || rel.node.title.romaji}
                    style={{
                      width: '100%',
                      aspectRatio: '2/3',
                      objectFit: 'cover',
                      borderRadius: 8,
                    }}
                    loading="lazy"
                  />
                  <div
                    style={{
                      fontSize: 10,
                      marginTop: 4,
                      color: currentTheme.text.secondary,
                      opacity: 0.6,
                      textTransform: 'uppercase',
                    }}
                  >
                    {rel.relationType.replace(/_/g, ' ')}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: currentTheme.text.primary,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {rel.node.title.english || rel.node.title.romaji}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <Section bg={`${currentTheme.text.primary}08`} delay={0.45}>
            <SectionTitle color={currentTheme.text.primary}>Empfehlungen</SectionTitle>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
              {recommendations.map((rec) => {
                const m = rec.node.mediaRecommendation;
                return (
                  <div
                    key={m.id}
                    onClick={() => navigate(`/manga/${m.id}`)}
                    style={{ width: 90, flexShrink: 0, cursor: 'pointer' }}
                  >
                    <img
                      src={m.coverImage.large}
                      alt={m.title.english || m.title.romaji}
                      style={{
                        width: '100%',
                        aspectRatio: '2/3',
                        objectFit: 'cover',
                        borderRadius: 8,
                      }}
                      loading="lazy"
                    />
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        marginTop: 4,
                        color: currentTheme.text.primary,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {m.title.english || m.title.romaji}
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* External Links */}
        {externalLinks.length > 0 && (
          <Section bg={`${currentTheme.text.primary}08`} delay={0.5}>
            <SectionTitle color={currentTheme.text.primary}>Links</SectionTitle>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <a
                href={`https://anilist.co/manga/${anilistId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="manga-detail-link-btn"
                style={{ color: currentTheme.primary, borderColor: `${currentTheme.primary}30` }}
              >
                <Link style={{ fontSize: 14 }} /> AniList
                <OpenInNew style={{ fontSize: 12, opacity: 0.5 }} />
              </a>
              {externalLinks.slice(0, 5).map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="manga-detail-link-btn"
                  style={{
                    color: currentTheme.text.secondary,
                    borderColor: `${currentTheme.text.primary}15`,
                  }}
                >
                  <Link style={{ fontSize: 14 }} /> {link.site}
                  <OpenInNew style={{ fontSize: 12, opacity: 0.5 }} />
                </a>
              ))}
            </div>
          </Section>
        )}

        {/* Actions: Hide / Delete */}
        <Section delay={0.55}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            <button
              className="manga-detail-action-btn"
              onClick={() => toggleHideManga(anilistId, !manga.hidden)}
              style={{ color: currentTheme.text.secondary }}
            >
              {manga.hidden ? (
                <Visibility style={{ fontSize: 18 }} />
              ) : (
                <VisibilityOff style={{ fontSize: 18 }} />
              )}
              {manga.hidden ? 'Einblenden' : 'Verstecken'}
            </button>

            {!showDeleteConfirm ? (
              <button
                className="manga-detail-action-btn"
                onClick={() => setShowDeleteConfirm(true)}
                style={{ color: '#ef4444' }}
              >
                <Delete style={{ fontSize: 18 }} />
                Entfernen
              </button>
            ) : (
              <div className="manga-detail-delete-confirm">
                <span style={{ color: currentTheme.text.secondary, fontSize: 14 }}>
                  Wirklich entfernen?
                </span>
                <button
                  className="manga-detail-delete-confirm-btn"
                  onClick={handleDelete}
                  style={{ background: '#ef444420', color: '#ef4444' }}
                >
                  Ja
                </button>
                <button
                  className="manga-detail-delete-confirm-btn"
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{
                    background: `${currentTheme.text.primary}10`,
                    color: currentTheme.text.secondary,
                  }}
                >
                  Nein
                </button>
              </div>
            )}
          </div>
        </Section>
      </div>
    </PageLayout>
  );
};

// ─── Helper Components ──────────────────────────────

const Section = ({
  children,
  bg,
  delay = 0,
}: {
  children: React.ReactNode;
  bg?: string;
  delay?: number;
}) => (
  <motion.div
    style={{ borderRadius: 16, padding: 16, marginBottom: 12, background: bg }}
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
  >
    {children}
  </motion.div>
);

const SectionTitle = ({ children, color }: { children: React.ReactNode; color: string }) => (
  <div
    style={{
      fontSize: 15,
      fontWeight: 700,
      marginBottom: 12,
      fontFamily: 'var(--font-display)',
      color,
    }}
  >
    {children}
  </div>
);
