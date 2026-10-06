import {
  ArrowBack,
  ChatBubbleOutlined,
  PersonAddRounded,
  ListAlt,
  CompareArrows,
  ExpandLess,
  ExpandMore,
  Movie as MovieIcon,
  Star,
  Tv as TvIcon,
} from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useOptimizedFriends } from '../../contexts/OptimizedFriendsContext';
import { useTheme } from '../../contexts/ThemeContext';
import { dbGet, userPath } from '../../services/db/ref';
import {
  BackButton,
  EmptyState,
  NameBadges,
  Skeleton,
  SkeletonPosterRow,
  PageHeader,
  PageLayout,
  ProfileItemCard,
  QuickFilter,
  ScrollToTopButton,
  SearchInput,
  TabSwitcher,
  UserAvatar,
} from '../../components/ui';
import type { ProfileCardProvider } from '../../components/ui';
import { getImageUrl } from '../../utils/imageUrl';
import { getOptimalTextColor } from '../../theme/colorUtils';
import { t } from '../../services/i18n';
import {
  calculateFriendRating,
  calculateProgress,
  useFriendProfileData,
} from './useFriendProfileData';
import type { FriendItem } from './useFriendProfileData';
import { friendAddKey, useFriendAddToList } from '../../hooks/social/useFriendAddToList';
import { useFriendCurrentlyWatching } from './useFriendCurrentlyWatching';
import { useFriendAnticipation } from './useFriendAnticipation';
import { useFriendPet } from './useFriendPet';
import { FriendCurrentlyWatchingCard } from './FriendCurrentlyWatchingCard';
import { FriendAnticipationSection } from './FriendAnticipationSection';
import { FriendPetCard } from './FriendPetCard';
import { IncomingRequestActions } from './IncomingRequestActions';
import { FriendComparisonCard } from './FriendComparisonCard';
import { useFriendComparison } from './useFriendComparison';
import { useFriendFolders } from './useFriendFolders';
import { RatingFolderGrid } from '../Ratings/RatingFolderGrid';
import type { FolderPreview } from '../Ratings/ratingsHelpers';
import { folderItemKey } from '../../lib/rating/ratingFolders';
import './FriendProfilePage.css';
import { tapScale } from '../../lib/motion';

interface RestrictedProfile {
  username?: string;
  displayName?: string;
  photoURL?: string;
}

export const FriendProfilePage = memo(() => {
  const { currentTheme } = useTheme();
  const onPrimary = getOptimalTextColor(currentTheme.primary);
  const navigate = useNavigate();
  const { user } = useAuth() || {};
  const {
    friends,
    loading: friendsLoading,
    sentRequests,
    friendRequests,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
  } = useOptimizedFriends();

  const {
    loading,
    friendId,
    friendName,
    activeTab,
    setActiveTab,
    openFolderId,
    setOpenFolderId,
    filters,
    setFilters,
    ratedSeries,
    ratedMovies,
    allSeries,
    allMovies,
    currentItems,
    averageRating,
    itemsWithRatingCount,
    scrollRef,
    handleItemClick,
    navigateToTasteMatch,
  } = useFriendProfileData();

  const { addingKey, isInOwnList, addToOwnList } = useFriendAddToList();

  const isSelf = !!user?.uid && user.uid === friendId;
  const friendEntry = friends.find((f) => f.uid === friendId);
  const isFriend = friends.some((f) => f.uid === friendId);
  const restricted = !friendsLoading && !!friendId && !isSelf && !isFriend;

  const [restrictedProfile, setRestrictedProfile] = useState<RestrictedProfile | null>(null);
  const [publicProfileId, setPublicProfileId] = useState<string | null>(null);
  const [publicChecked, setPublicChecked] = useState(false);
  const [requestState, setRequestState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  useEffect(() => {
    if (!restricted || !friendId) return;
    dbGet<RestrictedProfile>(`userSearchIndex/${friendId}`)
      .then((p) => setRestrictedProfile(p))
      .catch(() => {});
  }, [restricted, friendId]);

  // Wer sein Profil oeffentlich geschaltet hat, ist auch ohne Freundschaft
  // einsehbar — die Rules geben series/movies dann frei, die Seite zeigt dann
  // die volle Ansicht ohne die Freundes-Teile.
  useEffect(() => {
    if (!restricted || !friendId) {
      setPublicProfileId(null);
      setPublicChecked(false);
      return;
    }
    let cancelled = false;
    Promise.all([
      dbGet<boolean>(userPath(friendId, 'isPublicProfile')),
      dbGet<string>(userPath(friendId, 'publicProfileId')),
    ])
      .then(([isPublic, publicId]) => {
        if (cancelled) return;
        setPublicProfileId(isPublic === true && publicId ? publicId : null);
        setPublicChecked(true);
      })
      .catch(() => {
        if (!cancelled) setPublicChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, [restricted, friendId]);

  const publicViewer = restricted && !!publicProfileId;
  const locked = restricted && publicChecked && !publicProfileId;

  const alreadyRequested =
    requestState === 'sent' ||
    sentRequests.some((r) => r.toUserId === friendId && r.status === 'pending');

  const handleSendRequest = async () => {
    if (!friendId || requestState === 'sending') return;
    setRequestState('sending');
    // friendId ist die uid der Seite — damit klappt die Anfrage auch, wenn
    // das Konto keinen oder einen abweichenden Benutzernamen hat.
    const ok = await sendFriendRequest(restrictedProfile?.username || '', friendId);
    setRequestState(ok ? 'sent' : 'error');
  };

  const incomingRequest = friendRequests.find(
    (r) => r.fromUserId === friendId && r.status === 'pending'
  );
  const [responding, setResponding] = useState(false);
  const respondToRequest = async (accept: boolean) => {
    if (!incomingRequest || responding) return;
    setResponding(true);
    try {
      await (accept ? acceptFriendRequest : declineFriendRequest)(incomingRequest.id);
    } finally {
      setResponding(false);
    }
  };

  const requestLabel = alreadyRequested
    ? t('Anfrage gesendet ✓')
    : requestState === 'sending'
      ? t('Sende…')
      : requestState === 'error'
        ? t('Fehler — nochmal versuchen')
        : t('Freundschaftsanfrage senden');

  const darfSehen = !!friendId;
  const currentlyWatching = useFriendCurrentlyWatching(
    restricted || !darfSehen ? undefined : friendId
  );
  // Die Bibliothek ist für Freunde oder bei öffentlichem Profil lesbar.
  const libraryVisible = publicViewer || (!restricted && darfSehen);
  const anticipation = useFriendAnticipation(libraryVisible ? friendId : undefined);
  const friendPet = useFriendPet(restricted ? undefined : friendId);
  const comparison = useFriendComparison(restricted && !publicViewer ? undefined : friendId);
  const friendFolders = useFriendFolders(restricted || !darfSehen ? undefined : friendId);
  const folders = friendFolders.folders;
  const openFolder =
    activeTab === 'lists' ? (folders.find((f) => f.id === openFolderId) ?? null) : null;

  const folderPreviews = useMemo(() => {
    const byKey = new Map<string, { rating: number; poster: string }>();
    const collect = (items: FriendItem[], kind: 'series' | 'movie') => {
      for (const item of items) {
        const r = parseFloat(calculateFriendRating(item));
        byKey.set(folderItemKey(kind, item.id), {
          rating: isNaN(r) ? 0 : r,
          poster: getImageUrl(item.poster),
        });
      }
    };
    collect(allSeries, 'series');
    collect(allMovies, 'movie');
    const previews: Record<string, FolderPreview> = {};
    for (const f of folders) {
      const entries = [...f.items]
        .map((key) => byKey.get(key))
        .filter((e): e is { rating: number; poster: string } => !!e);
      previews[f.id] = {
        count: entries.length,
        posters: entries
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 4)
          .map((e) => e.poster),
      };
    }
    return previews;
  }, [folders, allSeries, allMovies]);

  const folderItems = useMemo(() => {
    if (!openFolder) return [];
    const inFolder = (item: FriendItem, kind: 'series' | 'movie') =>
      openFolder.items.has(folderItemKey(kind, item.id));
    return [
      ...ratedSeries.filter((item) => inFolder(item, 'series')),
      ...ratedMovies.filter((item) => inFolder(item, 'movie')),
    ].sort(
      (a, b) =>
        (parseFloat(calculateFriendRating(b)) || 0) - (parseFloat(calculateFriendRating(a)) || 0)
    );
  }, [openFolder, ratedSeries, ratedMovies]);

  useEffect(() => {
    if (activeTab === 'lists' && !friendFolders.loading && folders.length === 0) {
      setActiveTab('series');
    }
  }, [activeTab, friendFolders.loading, folders.length, setActiveTab]);

  const showFolderOverview = activeTab === 'lists' && !openFolder;
  const gridItems = activeTab === 'lists' ? folderItems : currentItems;

  const [insightsOpen, setInsightsOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem('friendInsightsCollapsed') !== '1';
    } catch {
      return true;
    }
  });
  const toggleInsights = () => {
    setInsightsOpen((open) => {
      const next = !open;
      try {
        localStorage.setItem('friendInsightsCollapsed', next ? '0' : '1');
      } catch {
        // ignore quota / privacy mode
      }
      return next;
    });
  };

  if (locked) {
    const shownName = restrictedProfile?.displayName || restrictedProfile?.username || t('Profil');
    return (
      <PageLayout>
        <PageHeader title={shownName} sticky={false} />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            padding: '48px 24px',
            textAlign: 'center',
          }}
        >
          <UserAvatar
            userId={friendId ?? ''}
            username={shownName}
            photoURL={restrictedProfile?.photoURL}
            size={96}
            navigable={false}
          />
          <h2 style={{ margin: 0, color: currentTheme.text.primary, fontSize: 20 }}>{shownName}</h2>
          <p style={{ margin: 0, color: currentTheme.text.muted, maxWidth: 320, lineHeight: 1.5 }}>
            {t(
              'Dieses Profil ist privat. Bibliothek, Bewertungen und Aktivität sehen nur Freunde.'
            )}
          </p>
          {incomingRequest ? (
            <IncomingRequestActions
              name={shownName}
              responding={responding}
              onRespond={respondToRequest}
            />
          ) : (
            <motion.button
              whileTap={tapScale}
              onClick={handleSendRequest}
              disabled={
                alreadyRequested || requestState === 'sending' || !restrictedProfile?.username
              }
              style={{
                border: 'none',
                borderRadius: 999,
                padding: '12px 24px',
                fontWeight: 700,
                fontSize: 15,
                cursor: alreadyRequested ? 'default' : 'pointer',
                color: onPrimary,
                background: alreadyRequested
                  ? currentTheme.background.surface
                  : `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
                opacity: alreadyRequested ? 0.7 : 1,
              }}
            >
              <span style={{ color: alreadyRequested ? currentTheme.text.muted : onPrimary }}>
                {requestLabel}
              </span>
            </motion.button>
          )}
        </div>
      </PageLayout>
    );
  }

  if (loading || friendsLoading || (restricted && !publicChecked)) {
    return (
      <PageLayout
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          role="status"
          aria-label={t('Lade Profil')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
            width: '100%',
          }}
        >
          <Skeleton width={96} height={96} shape="circle" />
          <Skeleton width={160} height={20} shape="text" />
          <Skeleton width={220} height={14} shape="text" />
          <div style={{ height: 12 }} />
          <SkeletonPosterRow count={4} posterWidth={110} />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div ref={scrollRef} className="fp-page">
        {/* Profil-Kopf: Name links, Avatar rechts, Aktionen, Bewertungs-Stat */}
        <header className="fp-hero">
          <div
            className="fp-hero-glow"
            style={{
              background: `radial-gradient(70% 100% at 85% 0%, ${currentTheme.primary}20, transparent 72%)`,
            }}
            aria-hidden
          />
          <div className="fp-hero-top">
            <BackButton />
            <h1 className="fp-hero-name">
              <span
                style={{
                  backgroundImage: `linear-gradient(90deg, ${currentTheme.text.primary}, ${currentTheme.primary})`,
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                {friendName}
              </span>
              <NameBadges uid={friendId} />
            </h1>
            <div className="fp-hero-rating">
              <span className="fp-hero-rating-val" style={{ color: currentTheme.text.secondary }}>
                <span className="fp-hero-avg" style={{ color: currentTheme.text.muted }}>
                  {'Ø'}
                </span>
                <Star style={{ fontSize: 15, color: currentTheme.accent }} />
                {averageRating.toFixed(1)}
              </span>
              <span className="fp-hero-rating-cnt" style={{ color: currentTheme.text.muted }}>
                {t('{n} bewertet', { n: itemsWithRatingCount })}
              </span>
            </div>
            <div className="fp-hero-avatar">
              <UserAvatar
                userId={friendId ?? ''}
                username={friendName}
                photoURL={friendEntry?.photoURL || restrictedProfile?.photoURL}
                size={40}
                navigable={false}
              />
              {friendEntry?.isOnline && <span className="fp-hero-dot" />}
            </div>
          </div>

          {publicViewer && incomingRequest ? (
            <IncomingRequestActions
              name={friendName}
              responding={responding}
              onRespond={respondToRequest}
            />
          ) : publicViewer ? (
            <div className="fp-hero-actions">
              <motion.button
                whileTap={tapScale}
                onClick={handleSendRequest}
                disabled={alreadyRequested || requestState === 'sending'}
                className="fp-hero-btn"
                style={
                  alreadyRequested
                    ? {
                        border: `1px solid ${currentTheme.text.muted}40`,
                        color: currentTheme.text.muted,
                        cursor: 'default',
                      }
                    : {
                        background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
                        color: onPrimary,
                      }
                }
              >
                <PersonAddRounded style={{ fontSize: 19 }} />
                {requestLabel}
              </motion.button>
            </div>
          ) : (
            <div className="fp-hero-actions">
              <motion.button
                whileTap={tapScale}
                onClick={() => friendId && navigate(`/chat/${friendId}`)}
                className="fp-hero-btn fp-hero-btn--ghost"
                style={{
                  border: `1px solid ${currentTheme.primary}55`,
                  color: currentTheme.primary,
                }}
              >
                <ChatBubbleOutlined style={{ fontSize: 19 }} />
                {t('Chat')}
              </motion.button>
              <motion.button
                whileTap={tapScale}
                onClick={navigateToTasteMatch}
                className="fp-hero-btn"
                style={{
                  background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
                  color: onPrimary,
                }}
              >
                <CompareArrows style={{ fontSize: 19 }} />
                Match
              </motion.button>
            </div>
          )}
        </header>

        {/* Friend Insights — Currently Watching, Pet, Anticipation */}
        {friendId && (
          <div className="fp-insights">
            <button
              className="fp-insights-toggle"
              onClick={toggleInsights}
              style={{ color: currentTheme.text.muted }}
            >
              <span>{insightsOpen ? t('Insights ausblenden') : t('Insights einblenden')}</span>
              {insightsOpen ? (
                <ExpandLess style={{ fontSize: 18 }} />
              ) : (
                <ExpandMore style={{ fontSize: 18 }} />
              )}
            </button>
            <AnimatePresence initial={false}>
              {insightsOpen && (
                <motion.div
                  key="insights-body"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div className="fp-insights-content">
                    <div
                      className={`fp-insights-row fp-insights-row--${publicViewer ? 1 : darfSehen ? 3 : 2}`}
                    >
                      {!darfSehen || publicViewer ? null : currentlyWatching.data ? (
                        <FriendCurrentlyWatchingCard
                          friendName={friendName}
                          data={currentlyWatching.data}
                        />
                      ) : (
                        <div className="fp-insights-placeholder">
                          <div className="fp-insights-placeholder-title">
                            {t('Nichts Aktuelles')}
                          </div>
                          <div className="fp-insights-placeholder-text">
                            {currentlyWatching.loading
                              ? t('Lade Aktivität …')
                              : t('{name} hat in den letzten 14 Tagen nichts geschaut.', {
                                  name: friendName,
                                })}
                          </div>
                        </div>
                      )}
                      {publicViewer ? null : friendPet.pet ? (
                        <FriendPetCard friendUid={friendId} pet={friendPet.pet} />
                      ) : (
                        <div className="fp-insights-placeholder">
                          <div className="fp-insights-placeholder-title">{t('Kein Pet')}</div>
                          <div className="fp-insights-placeholder-text">
                            {friendPet.loading
                              ? t('Lade Pet …')
                              : t('{name} hat noch kein aktives Pet.', { name: friendName })}
                          </div>
                        </div>
                      )}
                      {/* Gesamtvergleich — aggregierte Zahlen */}
                      <FriendComparisonCard
                        friendName={friendName}
                        own={comparison.own}
                        friend={comparison.friend}
                        loading={comparison.loading}
                      />
                    </div>
                    {anticipation.items.length > 0 ? (
                      <FriendAnticipationSection
                        friendName={friendName}
                        items={anticipation.items}
                      />
                    ) : (
                      !anticipation.loading && (
                        <div className="fp-insights-placeholder fp-insights-placeholder--wide">
                          <div className="fp-insights-placeholder-title">
                            {t('Keine kommenden Folgen')}
                          </div>
                          <div className="fp-insights-placeholder-text">
                            {t('Auf {name}s Liste sind keine Folgen mit Termin in Sicht.', {
                              name: friendName,
                            })}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Suche über die Bewertungen des Freundes (beide Tabs) */}
        <div className="fp-search-wrap">
          <SearchInput
            value={filters.search || ''}
            onChange={(v) => setFilters((prev) => ({ ...prev, search: v }))}
            placeholder={t('Serien & Filme durchsuchen...')}
          />
        </div>

        {/* Quick Filter */}
        {!showFolderOverview && (
          <QuickFilter
            onFilterChange={setFilters}
            isMovieMode={activeTab === 'movies'}
            isRatingsMode={true}
            hasBottomNav={false}
            initialFilters={filters}
          />
        )}

        {/* Tab Switcher */}
        <TabSwitcher
          className="fp-tabs"
          tabs={[
            { id: 'series', label: t('Serien'), icon: TvIcon, count: ratedSeries.length },
            { id: 'movies', label: t('Filme'), icon: MovieIcon, count: ratedMovies.length },
            ...(folders.length > 0
              ? [{ id: 'lists', label: t('Listen'), icon: ListAlt, count: folders.length }]
              : []),
          ]}
          activeTab={activeTab}
          onTabChange={(id) => {
            setActiveTab(id as typeof activeTab);
            if (id !== 'lists') setOpenFolderId(null);
          }}
        />

        {/* Items Grid */}
        <div className="fp-grid-wrapper">
          {openFolder && (
            <div className="rf-bar">
              <button
                type="button"
                className="rf-icon-btn"
                onClick={() => setOpenFolderId(null)}
                aria-label={t('Alle Listen')}
                style={{
                  borderColor: currentTheme.border.default,
                  color: currentTheme.text.secondary,
                }}
              >
                <ArrowBack style={{ fontSize: 20 }} />
              </button>
              <div className="rf-bar__text">
                <span className="rf-bar__name" style={{ color: currentTheme.text.primary }}>
                  {openFolder.name}
                </span>
                <span className="rf-bar__count" style={{ color: currentTheme.text.muted }}>
                  {folderItems.length === 1
                    ? t('1 Titel')
                    : t('{n} Titel', { n: folderItems.length })}
                </span>
              </div>
            </div>
          )}
          <AnimatePresence mode="wait">
            {showFolderOverview ? (
              <motion.div
                key="folders"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <RatingFolderGrid
                  theme={currentTheme}
                  folders={folders}
                  previews={folderPreviews}
                  onOpen={setOpenFolderId}
                />
              </motion.div>
            ) : gridItems.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <EmptyState
                  icon={<Star style={{ fontSize: '56px' }} />}
                  title={
                    activeTab === 'lists'
                      ? t('Keine Titel gefunden')
                      : activeTab === 'series'
                        ? t('Keine Serien gefunden')
                        : t('Keine Filme gefunden')
                  }
                  description={
                    activeTab === 'lists'
                      ? t('Diese Liste ist leer.')
                      : activeTab === 'series'
                        ? t('{name} hat noch keine Serien bewertet', { name: friendName })
                        : t('{name} hat noch keine Filme bewertet', { name: friendName })
                  }
                  iconColor={currentTheme.text.muted}
                />
              </motion.div>
            ) : (
              <motion.div
                key={openFolder ? `grid-${openFolder.id}` : 'grid'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fp-grid"
              >
                {gridItems.map((item, index) => {
                  const isMovie = 'release_date' in item && !item.seasons?.length;
                  const rating = parseFloat(calculateFriendRating(item));
                  const progress = isMovie ? 0 : calculateProgress(item);
                  const providers = (
                    item.provider?.provider && item.provider.provider.length > 0
                      ? Array.from(new Set(item.provider.provider.map((p) => p.name)))
                          .map((name) => item.provider?.provider.find((p) => p.name === name))
                          .filter(Boolean)
                      : []
                  ) as ProfileCardProvider[];
                  const genreList = (item.genres || item.genre?.genres || []).filter(
                    (g) => g.toLowerCase() !== 'all'
                  );
                  const genres =
                    genreList.length > 0 ? genreList.slice(0, 2).join(', ') : undefined;
                  const year =
                    isMovie && item.release_date ? item.release_date.slice(0, 4) : undefined;

                  const addType = isMovie ? 'movie' : 'series';

                  return (
                    <ProfileItemCard
                      key={item.id}
                      mediaId={item.id}
                      title={item.title}
                      posterUrl={getImageUrl(item.poster)}
                      isMovie={isMovie}
                      rating={isNaN(rating) ? 0 : rating}
                      progress={progress > 0 ? progress : undefined}
                      providers={providers}
                      year={year}
                      genres={genres}
                      index={index}
                      currentTheme={currentTheme}
                      onClick={() => handleItemClick(item, addType)}
                      inList={isInOwnList(addType, item.id)}
                      adding={addingKey === friendAddKey(addType, item.id)}
                      onAdd={isSelf ? undefined : () => void addToOwnList(item, addType)}
                    />
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <ScrollToTopButton scrollContainerSelector=".mobile-content" />
    </PageLayout>
  );
});

FriendProfilePage.displayName = 'FriendProfilePage';
