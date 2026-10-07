import { AutoAwesome, Tune } from '@mui/icons-material';
import { motion } from 'framer-motion';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SectionHeader } from '../../components/ui';
import { CaseOpeningOverlay } from '../../components/pet/CaseOpeningOverlay';
import { useAuth } from '../../contexts/AuthContext';
import { useMangaList } from '../../contexts/MangaListContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useEnhancedFirebaseCache } from '../../hooks/data/useEnhancedFirebaseCache';
import { useMangaLayout } from '../../hooks/manga/useMangaLayout';
import {
  useMangaPopular,
  useMangaTopRated,
  useMangaTrending,
} from '../../hooks/manga/useMangaTrending';
import { tapScaleSmall } from '../../lib/motion';
import { t } from '../../services/i18n';
import { useOwnPhotoURL } from '../../services/profile/ownProfilePhoto';
import { useUnifiedNotifications } from '../HomePage/hooks/useUnifiedNotifications';
import { NotificationSheet } from '../HomePage/sheets/NotificationSheet';
import './MangaPage.css';
import './components/MangaCards.css';
import { ContinueReadingSection } from './sections/ContinueReadingSection';
import { GenrePicksSection } from './sections/GenrePicksSection';
import { HiddenMangaCard } from './sections/HiddenMangaCard';
import { MangaCarouselSection } from './sections/MangaCarouselSection';
import { MangaCatchUpCard } from './sections/MangaCatchUpCard';
import { MangaCollectionSection } from './sections/MangaCollectionSection';
import { MangaDeck } from './sections/MangaDeck';
import { MangaQuickActions } from './sections/MangaQuickActions';
import { MangaRatingQueueCard } from './sections/MangaRatingQueueCard';
import { MangaRereadCard } from './sections/MangaRereadCard';
import { MangaStatsSection } from './sections/MangaStatsSection';
import { NewChaptersSection } from './sections/NewChaptersSection';
import { RecentlyAddedMangaSection } from './sections/RecentlyAddedMangaSection';
import { UpNextSection } from './sections/UpNextSection';

// Kurze persönliche Reihen laufen auf breiten Screens nebeneinander statt vor leerer Fläche.
const SHELF_SECTIONS = new Set(['new-chapters', 'recently-added', 'up-next']);

const FOR_YOU_CARDS: Record<string, React.ReactNode> = {
  'catch-up': <MangaCatchUpCard key="catch-up" />,
  'rating-queue': <MangaRatingQueueCard key="rating-queue" />,
  reread: <MangaRereadCard key="reread" />,
  hidden: <HiddenMangaCard key="hidden" />,
};

export const MangaPage = () => {
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const { mangaList, hiddenMangaList } = useMangaList();
  const navigate = useNavigate();
  const layout = useMangaLayout();
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
  const photoURL = useOwnPhotoURL(userData?.photoURL || user?.photoURL);
  const collectionRef = useRef<HTMLElement>(null);

  const trendingItems = useMangaTrending();
  const popularItems = useMangaPopular();
  const topRatedItems = useMangaTopRated();
  const ownedIds = useMemo(
    () => new Set([...mangaList, ...hiddenMangaList].map((m) => m.anilistId)),
    [mangaList, hiddenMangaList]
  );

  const scrollToCollection = useCallback(() => {
    collectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const hasManga = mangaList.length > 0;
  const visibleSections = layout.sections.order.filter(
    (id) => !layout.sections.hidden.includes(id)
  );

  const renderSection = (id: string) => {
    switch (id) {
      case 'quick-actions':
        return hasManga ? (
          <MangaQuickActions key={id} order={layout.quick.order} hidden={layout.quick.hidden} />
        ) : null;
      case 'continue-reading':
        return (
          <ContinueReadingSection
            key={id}
            onFilterReading={() => navigate('/manga/reading-list')}
          />
        );
      case 'new-chapters':
        return <NewChaptersSection key={id} />;
      case 'recently-added':
        return <RecentlyAddedMangaSection key={id} />;
      case 'up-next':
        return <UpNextSection key={id} />;
      case 'genre-picks':
        return hasManga ? <GenrePicksSection key={id} /> : null;
      case 'trending':
        return (
          <MangaCarouselSection
            key={id}
            variant="trending"
            items={trendingItems}
            ownedIds={ownedIds}
            title="Trending"
            onSeeAll={() => navigate('/manga/discover')}
            iconColor={currentTheme.primary}
          />
        );
      case 'popular':
        return (
          <MangaCarouselSection
            key={id}
            variant="popular"
            items={popularItems}
            ownedIds={ownedIds}
            title={t('Beliebt')}
            onSeeAll={() => navigate('/manga/discover?category=popular')}
            iconColor={currentTheme.status?.error || currentTheme.accent}
          />
        );
      case 'top-rated':
        return (
          <MangaCarouselSection
            key={id}
            variant="top-rated"
            items={topRatedItems}
            ownedIds={ownedIds}
            title={t('Top bewertet')}
            onSeeAll={() => navigate('/manga/discover?category=top_rated')}
            iconColor={currentTheme.accent}
          />
        );
      case 'for-you': {
        if (!hasManga && hiddenMangaList.length === 0) return null;
        const cards = layout.forYou.order
          .filter((card) => !layout.forYou.hidden.includes(card))
          .map((card) => FOR_YOU_CARDS[card]);
        if (cards.length === 0) return null;
        return (
          <section key={id} className="manga-section manga-for-you">
            <SectionHeader
              icon={<AutoAwesome />}
              iconColor={currentTheme.status?.warning || currentTheme.accent}
              title={t('Für dich')}
            />
            <div className="manga-for-you-grid">{cards}</div>
          </section>
        );
      }
      case 'stats':
        return <MangaStatsSection key={id} />;
      case 'collection':
        return <MangaCollectionSection key={id} ref={collectionRef} />;
      default:
        return null;
    }
  };

  return (
    <div className="manga-page" style={{ background: currentTheme.background.default }}>
      <MangaDeck
        photoURL={photoURL}
        displayName={user?.displayName ?? undefined}
        totalUnreadBadge={notifs.totalUnreadBadge}
        onNotificationsOpen={() => setShowNotifications(true)}
        onShowCollection={scrollToCollection}
      />

      {visibleSections.reduce<React.ReactNode[]>((nodes, id, index) => {
        if (!SHELF_SECTIONS.has(id)) {
          nodes.push(renderSection(id));
        } else if (index === 0 || !SHELF_SECTIONS.has(visibleSections[index - 1])) {
          const run: string[] = [];
          for (
            let i = index;
            i < visibleSections.length && SHELF_SECTIONS.has(visibleSections[i]);
            i++
          ) {
            run.push(visibleSections[i]);
          }
          nodes.push(
            <div key={`shelves-${id}`} className="manga-shelves">
              {run.map(renderSection)}
            </div>
          );
        }
        return nodes;
      }, [])}

      <div className="manga-page-footer">
        <motion.button
          type="button"
          whileTap={tapScaleSmall}
          className="manga-customize-btn"
          onClick={() => navigate('/manga/layout')}
          style={{ color: currentTheme.text.secondary }}
        >
          <Tune style={{ fontSize: 18, color: currentTheme.primary }} />
          {t('Übersicht anpassen')}
        </motion.button>
      </div>

      <NotificationSheet
        isOpen={showNotifications}
        onClose={() => {
          setShowNotifications(false);
          notifs.handleMarkAllNotificationsRead();
        }}
        notifications={notifs.unifiedNotifications}
        onMarkAllRead={notifs.handleMarkAllNotificationsRead}
        onMarkAsRead={notifs.markAsRead}
        onDismissAnnouncement={notifs.dismissAnnouncement}
        onAcceptRequest={notifs.acceptFriendRequest}
        onDeclineRequest={notifs.declineFriendRequest}
        onAcceptRecommendation={notifs.acceptRecommendation}
        onDeclineRecommendation={notifs.declineRecommendation}
        onOpenCaseOpening={setCaseOpeningDrop}
      />

      <CaseOpeningOverlay dropData={caseOpeningDrop} onClose={() => setCaseOpeningDrop(null)} />
    </div>
  );
};
