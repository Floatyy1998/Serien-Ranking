import {
  AutoStories,
  BarChart,
  Explore,
  History,
  MenuBook,
  Search,
  Timeline,
  TrendingUp,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { GradientText, HeaderActions, SectionHeader } from '../../components/ui';
import { useMangaList } from '../../contexts/MangaListContext';
import { useTheme } from '../../contexts/ThemeContextDef';
import { useEnhancedFirebaseCache } from '../../hooks/useEnhancedFirebaseCache';
import { NotificationSheet } from '../HomePage/NotificationSheet';
import { CaseOpeningOverlay } from '../../components/pet/CaseOpeningOverlay';
import { useUnifiedNotifications } from '../HomePage/useUnifiedNotifications';
import { ContinueReadingSection } from './sections/ContinueReadingSection';
import { HiddenMangaCard } from './sections/HiddenMangaCard';
import { MangaCatchUpCard } from './sections/MangaCatchUpCard';
import { MangaStatsSection } from './sections/MangaStatsSection';
import { MangaCarouselSection } from './sections/MangaCarouselSection';
import { useMangaTrending, useMangaPopular, useMangaTopRated } from '../../hooks/useMangaTrending';
import { RecentlyAddedMangaSection } from './sections/RecentlyAddedMangaSection';
import type { Manga } from '../../types/Manga';
import {
  getEffectiveChapterCount,
  STATUS_COLORS,
  STATUS_LABELS,
  type AppTheme,
} from './mangaUtils';
import './MangaPage.css';

export const MangaPage = () => {
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const { mangaList, loading } = useMangaList();
  const navigate = useNavigate();
  const notifs = useUnifiedNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [caseOpeningDrop, setCaseOpeningDrop] = useState<{
    dropId: string;
    accessoryId: string;
    rarity: string;
  } | null>(null);

  const { data: userData } = useEnhancedFirebaseCache<{ photoURL?: string }>(
    user ? `users/${user.uid}` : '',
    { ttl: 5 * 60 * 1000, useRealtimeListener: true }
  );
  const photoURL = userData?.photoURL || user?.photoURL || null;
  const collectionRef = useRef<HTMLDivElement>(null);
  const [collectionFilter, setCollectionFilter] = useState('all');

  // Trending/Popular/Top hooks
  const trendingItems = useMangaTrending();
  const popularItems = useMangaPopular();
  const topRatedItems = useMangaTopRated();

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    mangaList.forEach((m) => {
      counts[m.readStatus] = (counts[m.readStatus] || 0) + 1;
    });
    return counts;
  }, [mangaList]);

  const quickStats = useMemo(() => {
    const totalChapters = mangaList.reduce((sum, m) => sum + m.currentChapter, 0);
    const reading = mangaList.filter((m) => m.readStatus === 'reading').length;
    const completed = mangaList.filter((m) => m.readStatus === 'completed').length;
    return { totalChapters, reading, completed };
  }, [mangaList]);

  const handleGoToReadingList = useCallback(() => {
    navigate('/manga/reading-list');
  }, [navigate]);

  const filtered = useMemo(
    () =>
      collectionFilter === 'all'
        ? mangaList
        : mangaList.filter((m) => m.readStatus === collectionFilter),
    [mangaList, collectionFilter]
  );

  return (
    <div
      style={{
        overflowY: 'auto',
        position: 'relative',
        minHeight: '100vh',
        background: currentTheme.background.default,
      }}
    >
      {/* ─── Header ────────────────────────── */}
      <header
        style={{
          background: `linear-gradient(180deg, ${currentTheme.primary}40 0%, ${currentTheme.primary}10 50%, transparent 100%)`,
          padding: '20px',
          paddingTop: 'calc(30px + env(safe-area-inset-top))',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 250, damping: 22 }}
          style={{ display: 'flex', alignItems: 'center', gap: 12 }}
        >
          <div style={{ flex: 1 }}>
            <GradientText
              as="h1"
              from={currentTheme.primary}
              to={currentTheme.accent}
              style={{
                fontSize: '22px',
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                letterSpacing: '-0.01em',
                margin: '0 0 4px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <AutoStories />
              Manga
            </GradientText>
            <p
              style={{
                color: currentTheme.text.secondary,
                fontSize: '15px',
                margin: 0,
                opacity: 0.7,
              }}
            >
              {mangaList.length > 0
                ? `${mangaList.length} Titel in deiner Sammlung`
                : 'Deine Manga-Sammlung'}
            </p>
          </div>

          <HeaderActions
            totalUnreadBadge={notifs.totalUnreadBadge}
            onNotificationsOpen={() => {
              setShowNotifications(true);
              notifs.handleMarkAllNotificationsRead();
            }}
            photoURL={photoURL}
          />
        </motion.div>
      </header>

      {/* ─── Search Bar ──────────────── */}
      <div style={{ padding: '0 20px', marginBottom: 20 }}>
        <motion.div
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/manga/search')}
          style={{
            background: currentTheme.background.surface,
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16,
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Search style={{ fontSize: 16, color: currentTheme.text.secondary, opacity: 0.5 }} />
          <span style={{ color: currentTheme.text.secondary, fontSize: 14, opacity: 0.5 }}>
            Manga, Manhwa, Manhua suchen...
          </span>
        </motion.div>
      </div>

      {/* ─── Quick Actions Grid ──────────────── */}
      {mangaList.length > 0 && (
        <div className="manga-quick-grid">
          <QuickTile
            icon={<MenuBook style={{ fontSize: 16 }} />}
            label="Leseliste"
            stat={`${quickStats.reading} aktiv`}
            onClick={() => navigate('/manga/reading-list')}
            theme={currentTheme}
            accent={currentTheme.primary}
          />
          <QuickTile
            icon={<Explore style={{ fontSize: 16 }} />}
            label="Entdecken"
            onClick={() => navigate('/manga/discover')}
            theme={currentTheme}
            accent="#3b82f6"
          />
          <QuickTile
            icon={<BarChart style={{ fontSize: 16 }} />}
            label="Bewertungen"
            onClick={() => navigate('/manga/ratings')}
            theme={currentTheme}
            accent={currentTheme.accent}
          />
          <QuickTile
            icon={<TrendingUp style={{ fontSize: 16 }} />}
            label="Statistiken"
            stat={`${quickStats.totalChapters} Kap.`}
            onClick={() => navigate('/manga/stats')}
            theme={currentTheme}
            accent={currentTheme.status?.warning || '#f59e0b'}
          />
          <QuickTile
            icon={<Timeline style={{ fontSize: 16 }} />}
            label="Journey"
            onClick={() => navigate('/manga/journey')}
            theme={currentTheme}
            accent={currentTheme.status?.error || '#ef4444'}
          />
          <QuickTile
            icon={<History style={{ fontSize: 16 }} />}
            label="Verlauf"
            onClick={() => navigate('/manga/recently-read')}
            theme={currentTheme}
            accent="rgba(255,255,255,0.5)"
          />
        </div>
      )}

      {/* ─── Continue Reading ────────────────────────── */}
      <ContinueReadingSection onFilterReading={handleGoToReadingList} />

      {/* ─── Recently Added ──────────────────────────── */}
      <RecentlyAddedMangaSection />

      {/* ─── Trending Carousel ───────────────────────── */}
      <MangaCarouselSection
        variant="trending"
        items={trendingItems}
        title="Trending"
        onSeeAll={() => navigate('/manga/discover')}
        iconColor={currentTheme.primary}
      />

      {/* ─── Popular Carousel ────────────────────────── */}
      <MangaCarouselSection
        variant="popular"
        items={popularItems}
        title="Beliebt"
        onSeeAll={() => navigate('/manga/discover')}
        iconColor={currentTheme.status?.error || '#ef4444'}
      />

      {/* ─── Top Rated Carousel ──────────────────────── */}
      <MangaCarouselSection
        variant="top-rated"
        items={topRatedItems}
        title="Top bewertet"
        onSeeAll={() => navigate('/manga/discover')}
        iconColor={currentTheme.accent}
      />

      {/* ─── For-You Cards ───────────────────────────── */}
      {mangaList.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <SectionHeader
            icon={<AutoStories />}
            iconColor={currentTheme.status?.warning || '#f59e0b'}
            title="Für dich"
          />
          <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <MangaCatchUpCard />
            <HiddenMangaCard />
          </div>
        </section>
      )}

      {/* ─── Stats ───────────────────────────────────── */}
      <MangaStatsSection />

      {/* ─── Collection Grid ─────────────────────────── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, opacity: 0.5 }}>Laden...</div>
      ) : mangaList.length > 0 ? (
        <section ref={collectionRef} style={{ marginBottom: 32 }}>
          <SectionHeader icon={<AutoStories />} iconColor={currentTheme.accent} title="Sammlung" />

          {/* Filter Tabs */}
          <div className="manga-filter-tabs" style={{ padding: '0 20px' }}>
            <button
              className={`manga-filter-tab ${collectionFilter === 'all' ? 'manga-filter-tab--active' : ''}`}
              onClick={() => setCollectionFilter('all')}
              style={
                collectionFilter === 'all'
                  ? { borderColor: currentTheme.primary, background: `${currentTheme.primary}20` }
                  : {}
              }
            >
              Alle ({mangaList.length})
            </button>
            {Object.entries(STATUS_LABELS).map(
              ([key, label]) =>
                (statusCounts[key] || 0) > 0 && (
                  <button
                    key={key}
                    className={`manga-filter-tab ${collectionFilter === key ? 'manga-filter-tab--active' : ''}`}
                    onClick={() => setCollectionFilter(key)}
                    style={
                      collectionFilter === key
                        ? { borderColor: STATUS_COLORS[key], background: `${STATUS_COLORS[key]}20` }
                        : {}
                    }
                  >
                    {label} ({statusCounts[key]})
                  </button>
                )
            )}
          </div>

          {/* Grid */}
          <div className="manga-collection-grid" style={{ padding: '0 20px', paddingBottom: 100 }}>
            {filtered.map((manga) => (
              <MangaCard
                key={manga.anilistId}
                manga={manga}
                onClick={() => navigate(`/manga/${manga.anilistId}`)}
                userId={user?.uid}
              />
            ))}
          </div>

          {filtered.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: 40,
                fontSize: 14,
                color: currentTheme.text.secondary,
                opacity: 0.6,
              }}
            >
              Keine Manga mit Filter &quot;{STATUS_LABELS[collectionFilter]}&quot;
            </div>
          )}
        </section>
      ) : (
        <div className="manga-empty">
          <div className="manga-empty-icon">📚</div>
          <div className="manga-empty-title" style={{ color: currentTheme.text.primary }}>
            Deine Manga-Sammlung
          </div>
          <div className="manga-empty-text" style={{ color: currentTheme.text.secondary }}>
            Suche oben nach Manga, Manhwa oder Manhua und füge sie zu deiner Sammlung hinzu.
          </div>
        </div>
      )}

      <NotificationSheet
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifs.unifiedNotifications}
        onMarkAllRead={notifs.handleMarkAllNotificationsRead}
        onMarkAsRead={notifs.markAsRead}
        onDismissAnnouncement={notifs.dismissAnnouncement}
        onAcceptRequest={notifs.acceptFriendRequest}
        onDeclineRequest={notifs.declineFriendRequest}
        onOpenCaseOpening={setCaseOpeningDrop}
      />

      <CaseOpeningOverlay dropData={caseOpeningDrop} onClose={() => setCaseOpeningDrop(null)} />
    </div>
  );
};

// ─── Quick Tile ─────────────────────────────────────

const QuickTile = ({
  icon,
  label,
  stat,
  onClick,
  theme,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  stat?: string;
  onClick: () => void;
  theme: AppTheme;
  accent: string;
}) => (
  <motion.button
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className="manga-quick-tile"
    style={{ color: theme.text.primary }}
  >
    <div style={{ color: accent, display: 'flex' }}>{icon}</div>
    <span className="manga-quick-tile__label">{label}</span>
    {stat && <span className="manga-quick-tile__stat">· {stat}</span>}
  </motion.button>
);

// ─── Manga Card ─────────────────────────────────────

const MangaCard = ({
  manga,
  onClick,
  userId,
}: {
  manga: Manga;
  onClick: () => void;
  userId?: string;
}) => {
  const totalChapters = getEffectiveChapterCount(manga);
  const progress =
    totalChapters && totalChapters > 0
      ? Math.min((manga.currentChapter / totalChapters) * 100, 100)
      : 0;

  const userRating = userId ? manga.rating?.[userId] || 0 : 0;

  return (
    <div className="manga-collection-item" onClick={onClick}>
      <div className="manga-collection-card">
        <img
          className="manga-collection-poster"
          src={manga.poster}
          alt={manga.title}
          loading="lazy"
        />
        <div className="manga-collection-overlay">
          {/* Top badges */}
          <div className="manga-collection-top">
            {manga.readStatus === 'completed' && (
              <span
                className="manga-collection-badge"
                style={{ background: STATUS_COLORS.completed }}
              >
                ✓
              </span>
            )}
            {userRating > 0 && <span className="manga-collection-rating">★ {userRating}</span>}
          </div>
          {/* Bottom info */}
          <div className="manga-collection-bottom">
            <div className="manga-collection-title">{manga.title}</div>
            {progress > 0 && (
              <div className="manga-collection-progress">
                <div className="manga-collection-progress-fill" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
