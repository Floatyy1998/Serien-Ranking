import {
  CompareArrows,
  ExpandLess,
  ExpandMore,
  Movie as MovieIcon,
  Star,
  Tv as TvIcon,
} from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useOptimizedFriends } from '../../contexts/OptimizedFriendsContext';
import { useTheme } from '../../contexts/ThemeContext';
import { dbGet } from '../../services/db/ref';
import {
  EmptyState,
  Skeleton,
  SkeletonPosterRow,
  PageHeader,
  PageLayout,
  ProfileItemCard,
  QuickFilter,
  ScrollToTopButton,
  TabSwitcher,
  UserAvatar,
} from '../../components/ui';
import type { ProfileCardProvider } from '../../components/ui';
import { getImageUrl } from '../../utils/imageUrl';
import { t } from '../../services/i18n';
import {
  calculateFriendRating,
  calculateProgress,
  useFriendProfileData,
} from './useFriendProfileData';
import { useFriendCurrentlyWatching } from './useFriendCurrentlyWatching';
import { useFriendAnticipation } from './useFriendAnticipation';
import { useFriendPet } from './useFriendPet';
import { FriendCurrentlyWatchingCard } from './FriendCurrentlyWatchingCard';
import { FriendAnticipationSection } from './FriendAnticipationSection';
import { FriendPetCard } from './FriendPetCard';
import './FriendProfilePage.css';
import { tapScale } from '../../lib/motion';

interface RestrictedProfile {
  username?: string;
  displayName?: string;
  photoURL?: string;
}

export const FriendProfilePage = memo(() => {
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const {
    friends,
    loading: friendsLoading,
    sentRequests,
    sendFriendRequest,
  } = useOptimizedFriends();

  const {
    loading,
    friendId,
    friendName,
    activeTab,
    setActiveTab,
    setFilters,
    ratedSeries,
    ratedMovies,
    currentItems,
    averageRating,
    itemsWithRatingCount,
    scrollRef,
    handleItemClick,
    navigateToTasteMatch,
  } = useFriendProfileData();

  const isSelf = !!user?.uid && user.uid === friendId;
  const isFriend = friends.some((f) => f.uid === friendId);
  const restricted = !friendsLoading && !!friendId && !isSelf && !isFriend;

  const [restrictedProfile, setRestrictedProfile] = useState<RestrictedProfile | null>(null);
  const [requestState, setRequestState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  useEffect(() => {
    if (!restricted || !friendId) return;
    dbGet<RestrictedProfile>(`userSearchIndex/${friendId}`)
      .then((p) => setRestrictedProfile(p))
      .catch(() => {});
  }, [restricted, friendId]);

  const alreadyRequested =
    requestState === 'sent' ||
    sentRequests.some((r) => r.toUserId === friendId && r.status === 'pending');

  const handleSendRequest = async () => {
    if (!restrictedProfile?.username || requestState === 'sending') return;
    setRequestState('sending');
    const ok = await sendFriendRequest(restrictedProfile.username);
    setRequestState(ok ? 'sent' : 'error');
  };

  const currentlyWatching = useFriendCurrentlyWatching(restricted ? undefined : friendId);
  const anticipation = useFriendAnticipation(restricted ? undefined : friendId);
  const friendPet = useFriendPet(restricted ? undefined : friendId);

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

  if (restricted) {
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
              color: '#000',
              background: alreadyRequested
                ? currentTheme.background.surface
                : `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
              opacity: alreadyRequested ? 0.7 : 1,
            }}
          >
            <span style={{ color: alreadyRequested ? currentTheme.text.muted : '#000' }}>
              {alreadyRequested
                ? t('Anfrage gesendet ✓')
                : requestState === 'sending'
                  ? t('Sende…')
                  : requestState === 'error'
                    ? t('Fehler — nochmal versuchen')
                    : t('Freundschaftsanfrage senden')}
            </span>
          </motion.button>
        </div>
      </PageLayout>
    );
  }

  if (loading || friendsLoading) {
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
      <div ref={scrollRef}>
        {/* Header */}
        <PageHeader
          title={friendName}
          sticky={false}
          subtitle={t('\u00D8 {avg} | {n} bewertet', {
            avg: averageRating.toFixed(1),
            n: itemsWithRatingCount,
          })}
          actions={
            <motion.button
              whileTap={tapScale}
              onClick={navigateToTasteMatch}
              className="fp-match-btn"
              style={{
                background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
              }}
            >
              <CompareArrows style={{ fontSize: 20 }} />
              Match
            </motion.button>
          }
        />

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
                    <div className="fp-insights-row">
                      {currentlyWatching.data ? (
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
                      {friendPet.pet ? (
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

        {/* Quick Filter */}
        <QuickFilter
          onFilterChange={setFilters}
          isMovieMode={activeTab === 'movies'}
          isRatingsMode={true}
          hasBottomNav={false}
        />

        {/* Tab Switcher */}
        <TabSwitcher
          tabs={[
            { id: 'series', label: t('Serien'), icon: TvIcon, count: ratedSeries.length },
            { id: 'movies', label: t('Filme'), icon: MovieIcon, count: ratedMovies.length },
          ]}
          activeTab={activeTab}
          onTabChange={(id) => setActiveTab(id as 'series' | 'movies')}
        />

        {/* Items Grid */}
        <div className="fp-grid-wrapper">
          <AnimatePresence mode="wait">
            {currentItems.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <EmptyState
                  icon={<Star style={{ fontSize: '56px' }} />}
                  title={
                    activeTab === 'series' ? t('Keine Serien gefunden') : t('Keine Filme gefunden')
                  }
                  description={
                    activeTab === 'series'
                      ? t('{name} hat noch keine Serien bewertet', { name: friendName })
                      : t('{name} hat noch keine Filme bewertet', { name: friendName })
                  }
                  iconColor={currentTheme.text.muted}
                />
              </motion.div>
            ) : (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fp-grid"
              >
                {currentItems.map((item, index) => {
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

                  return (
                    <ProfileItemCard
                      key={item.id}
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
                      onClick={() => handleItemClick(item, isMovie ? 'movie' : 'series')}
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
