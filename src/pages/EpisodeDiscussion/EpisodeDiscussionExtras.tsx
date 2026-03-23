import { Movie, NavigateBefore, NavigateNext } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { memo } from 'react';
import { DiscussionThread } from '../../components/Discussion';
import type { useTheme } from '../../contexts/ThemeContextDef';
import type { EpisodeNavigationInfo } from './useEpisodeDiscussion';

type Theme = ReturnType<typeof useTheme>['currentTheme'];

// ---------- Episode Navigation ----------
interface EpisodeNavigationProps {
  currentTheme: Theme;
  navigation: EpisodeNavigationInfo;
}

export const EpisodeNavigation = memo(({ currentTheme, navigation }: EpisodeNavigationProps) => (
  <div
    className="ed-nav"
    style={{
      background: currentTheme.background.surface,
      borderBottom: `1px solid ${currentTheme.border.default}`,
    }}
  >
    {/* Previous Episode */}
    <motion.button
      whileTap={{ scale: navigation.hasPrevEpisode ? 0.95 : 1 }}
      onClick={navigation.goToPrevEpisode}
      disabled={!navigation.hasPrevEpisode}
      className="ed-nav-btn"
      style={{
        background: currentTheme.background.card,
        border: `1px solid ${currentTheme.border.default}`,
        cursor: navigation.hasPrevEpisode ? 'pointer' : 'default',
        opacity: navigation.hasPrevEpisode ? 1 : 0.4,
      }}
    >
      <div
        className="ed-nav-icon-wrap"
        style={{
          background: navigation.hasPrevEpisode
            ? currentTheme.background.surfaceHover
            : currentTheme.background.surface,
        }}
      >
        <NavigateBefore className="ed-nav-icon" style={{ color: currentTheme.text.muted }} />
      </div>
      <div className="ed-nav-text">
        <p className="ed-nav-label" style={{ color: currentTheme.text.muted }}>
          Vorherige
        </p>
        <p className="ed-nav-episode" style={{ color: currentTheme.text.primary }}>
          {navigation.prevEpisodeLabel}
        </p>
      </div>
    </motion.button>

    {/* Next Episode */}
    <motion.button
      whileTap={{ scale: navigation.hasNextEpisode ? 0.95 : 1 }}
      onClick={navigation.goToNextEpisode}
      disabled={!navigation.hasNextEpisode}
      className="ed-nav-btn ed-nav-btn--next"
      style={{
        background: navigation.hasNextEpisode
          ? `linear-gradient(135deg, ${currentTheme.primary}12, ${currentTheme.accent}12)`
          : currentTheme.background.card,
        border: navigation.hasNextEpisode
          ? `1px solid ${currentTheme.primary}30`
          : `1px solid ${currentTheme.border.default}`,
        cursor: navigation.hasNextEpisode ? 'pointer' : 'default',
        opacity: navigation.hasNextEpisode ? 1 : 0.4,
      }}
    >
      <div className="ed-nav-text">
        <p className="ed-nav-label" style={{ color: currentTheme.text.muted }}>
          Nächste
        </p>
        <p className="ed-nav-episode" style={{ color: currentTheme.text.primary }}>
          {navigation.nextEpisodeLabel}
        </p>
      </div>
      <div
        className="ed-nav-icon-wrap"
        style={{
          background: navigation.hasNextEpisode
            ? `linear-gradient(135deg, ${currentTheme.primary}30, ${currentTheme.accent}30)`
            : currentTheme.background.surface,
        }}
      >
        <NavigateNext
          className="ed-nav-icon"
          style={{
            color: navigation.hasNextEpisode ? currentTheme.primary : currentTheme.text.muted,
          }}
        />
      </div>
    </motion.button>
  </div>
));
EpisodeNavigation.displayName = 'EpisodeNavigation';

// ---------- Overview Section ----------
interface OverviewSectionProps {
  currentTheme: Theme;
  episodeOverview: string;
}

export const OverviewSection = memo(({ currentTheme, episodeOverview }: OverviewSectionProps) => (
  <AnimatePresence>
    {episodeOverview && (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="ed-overview"
        style={{
          background: currentTheme.background.card,
          border: `1px solid ${currentTheme.border.default}`,
        }}
      >
        <div
          className="ed-overview-decoration"
          style={{
            background: `radial-gradient(circle, ${currentTheme.primary}10 0%, transparent 70%)`,
          }}
        />
        <h3 className="ed-overview-header" style={{ color: currentTheme.text.primary }}>
          <div
            className="ed-overview-icon-wrap"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.primary}20, ${currentTheme.accent}20)`,
            }}
          >
            <Movie className="ed-overview-icon" style={{ color: currentTheme.primary }} />
          </div>
          Handlung
        </h3>
        <p className="ed-overview-text" style={{ color: currentTheme.text.secondary }}>
          {episodeOverview}
        </p>
      </motion.div>
    )}
  </AnimatePresence>
));
OverviewSection.displayName = 'OverviewSection';

// ---------- Crew Section ----------
interface CrewSectionProps {
  currentTheme: Theme;
  directors: { id: number; name: string; job: string; profile_path: string | null }[];
  writers: { id: number; name: string; job: string; profile_path: string | null }[];
}

export const CrewSection = memo(({ currentTheme, directors, writers }: CrewSectionProps) => {
  if (directors.length === 0 && writers.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="ed-crew"
    >
      {directors.length > 0 && (
        <div
          className="ed-crew-card"
          style={{
            background: currentTheme.background.card,
            border: `1px solid ${currentTheme.border.default}`,
          }}
        >
          <h4 className="ed-crew-label" style={{ color: currentTheme.text.muted }}>
            Regie
          </h4>
          {directors.slice(0, 2).map((d, i) => (
            <p
              key={i}
              className="ed-crew-name"
              style={{
                color: currentTheme.text.primary,
                margin: i > 0 ? '6px 0 0 0' : 0,
              }}
            >
              {d.name}
            </p>
          ))}
        </div>
      )}
      {writers.length > 0 && (
        <div
          className="ed-crew-card"
          style={{
            background: currentTheme.background.card,
            border: `1px solid ${currentTheme.border.default}`,
          }}
        >
          <h4 className="ed-crew-label" style={{ color: currentTheme.text.muted }}>
            Drehbuch
          </h4>
          {writers.slice(0, 2).map((w, i) => (
            <p
              key={i}
              className="ed-crew-name"
              style={{
                color: currentTheme.text.primary,
                margin: i > 0 ? '6px 0 0 0' : 0,
              }}
            >
              {w.name}
            </p>
          ))}
        </div>
      )}
    </motion.div>
  );
});
CrewSection.displayName = 'CrewSection';

// ---------- Guest Stars Section ----------
interface GuestStarsSectionProps {
  currentTheme: Theme;
  guestStars: { id: number; name: string; character: string; profile_path: string | null }[];
  getProfileUrl: (path: string | null) => string;
}

export const GuestStarsSection = memo(
  ({ currentTheme, guestStars, getProfileUrl }: GuestStarsSectionProps) => {
    if (guestStars.length === 0) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="ed-guest-stars"
        style={{
          background: currentTheme.background.card,
          border: `1px solid ${currentTheme.border.default}`,
        }}
      >
        <h3 className="ed-guest-stars-header" style={{ color: currentTheme.text.primary }}>
          Gaststars
          <span
            className="ed-guest-stars-count"
            style={{
              color: currentTheme.primary,
              background: `${currentTheme.primary}15`,
            }}
          >
            {guestStars.length}
          </span>
        </h3>
        <div className="ed-guest-stars-scroll">
          {guestStars.slice(0, 15).map((star, index) => (
            <motion.div
              key={star.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              className="ed-guest-star-card"
            >
              <div
                className="ed-guest-star-avatar"
                style={{
                  background: currentTheme.background.surface,
                  border: `3px solid ${currentTheme.border.default}`,
                  boxShadow: `0 6px 16px ${currentTheme.background.default}80`,
                }}
              >
                {star.profile_path ? (
                  <img
                    src={getProfileUrl(star.profile_path)}
                    alt={star.name}
                    className="ed-guest-star-img"
                  />
                ) : (
                  <div
                    className="ed-guest-star-placeholder"
                    style={{
                      background: `linear-gradient(135deg, ${currentTheme.primary}30, ${currentTheme.accent}30)`,
                    }}
                  >
                    👤
                  </div>
                )}
              </div>
              <p className="ed-guest-star-name" style={{ color: currentTheme.text.primary }}>
                {star.name}
              </p>
              <p className="ed-guest-star-character" style={{ color: currentTheme.primary }}>
                {star.character}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }
);
GuestStarsSection.displayName = 'GuestStarsSection';

// ---------- Discussion Section ----------
interface DiscussionSectionProps {
  seriesId: string | undefined;
  seasonNumber: string | undefined;
  episodeNumber: string | undefined;
  seriesTitle: string;
  episodeName: string;
  posterPath: string | null | undefined;
  isWatched: boolean;
}

export const DiscussionSection = memo(
  ({
    seriesId,
    seasonNumber,
    episodeNumber,
    seriesTitle,
    episodeName,
    posterPath,
    isWatched,
  }: DiscussionSectionProps) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <DiscussionThread
        itemId={Number(seriesId)}
        itemType="episode"
        seasonNumber={Number(seasonNumber)}
        episodeNumber={Number(episodeNumber)}
        title="Episoden-Diskussion"
        isWatched={isWatched}
        feedMetadata={{
          itemTitle: seriesTitle,
          posterPath: posterPath || undefined,
          episodeTitle: episodeName,
        }}
      />
    </motion.div>
  )
);
DiscussionSection.displayName = 'DiscussionSection';
