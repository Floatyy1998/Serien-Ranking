import Firebase from 'firebase/compat/app';
import 'firebase/compat/analytics';

let analyticsInstance: ReturnType<typeof Firebase.analytics> | null = null;

const CONSENT_KEY = 'analytics-consent';

export function getAnalyticsConsent(): boolean | null {
  const value = localStorage.getItem(CONSENT_KEY);
  if (value === null) return null;
  return value === 'true';
}

export function setAnalyticsConsent(accepted: boolean) {
  localStorage.setItem(CONSENT_KEY, String(accepted));
  if (accepted) {
    initAnalytics();
    trackAnalyticsConsentChanged(accepted);
  } else {
    analyticsInstance = null;
  }
}

function initAnalytics() {
  if (analyticsInstance) return;
  try {
    if (Firebase.apps.length > 0) {
      analyticsInstance = Firebase.analytics();
    } else {
      console.warn('[Analytics] No Firebase app initialized');
    }
  } catch (e) {
    console.error('[Analytics] Init failed:', e);
  }
}

/** Initialize analytics if user previously consented */
export function initAnalyticsIfConsented() {
  if (getAnalyticsConsent() === true) {
    initAnalytics();
  }
}

export function logEvent(eventName: string, params?: Record<string, unknown>) {
  if (!analyticsInstance) {
    console.warn('[Analytics] Event dropped (no instance):', eventName);
    return;
  }
  analyticsInstance.logEvent(eventName, params);
}

export function logPageView(pageName: string) {
  logEvent('page_view', { page_title: pageName });
}

// --- Auth Events ---
export const trackLogin = (method: string) => logEvent('login', { method });
export const trackLoginError = (error: string) => logEvent('login_error', { error });
export const trackRegister = (method: string) => logEvent('sign_up', { method });
export const trackRegisterError = (error: string) => logEvent('register_error', { error });
export const trackLogout = () => logEvent('logout');

// --- Series & Movie Events ---
export const trackSeriesAdded = (id: string, name: string, source: string) =>
  logEvent('series_added', { series_id: id, series_name: name, source });
export const trackSeriesDeleted = (id: string, name: string) =>
  logEvent('series_deleted', { series_id: id, series_name: name });
export const trackMovieAdded = (id: string, name: string, source: string) =>
  logEvent('movie_added', { movie_id: id, movie_name: name, source });
export const trackMovieDeleted = (id: string, name: string) =>
  logEvent('movie_deleted', { movie_id: id, movie_name: name });

// --- Episode Events ---
export const trackEpisodeWatched = (
  seriesName: string,
  season: number,
  episode: number,
  extra?: {
    tmdbId?: string | number;
    genres?: string[];
    runtime?: number;
    isRewatch?: boolean;
    source?: string;
  }
) => {
  const now = new Date();
  logEvent('episode_watched', {
    series_name: seriesName,
    season: String(season),
    episode: String(episode),
    hour: String(now.getHours()),
    day_of_week: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()],
    tmdb_id: extra?.tmdbId ? String(extra.tmdbId) : '',
    genres: extra?.genres?.join(',') || '',
    runtime_min: extra?.runtime ? String(Math.round(extra.runtime)) : '',
    is_rewatch: String(!!extra?.isRewatch),
    source: extra?.source || 'app',
  });
};
export const trackEpisodeUnwatched = (seriesName: string, season: number, episode: number) =>
  logEvent('episode_unwatched', { series_name: seriesName, season, episode });
export const trackSeasonToggled = (seriesName: string, season: number, action: string) =>
  logEvent('season_toggled', { series_name: seriesName, season, action });
export const trackCatchUpUsed = (seriesName: string, count: number) =>
  logEvent('catch_up_used', { series_name: seriesName, episodes_marked: count });

// --- Rating Events ---
export const trackRatingSaved = (id: string, type: string, rating: number) =>
  logEvent('rating_saved', { item_id: id, item_type: type, rating });
export const trackRatingDeleted = (id: string, type: string) =>
  logEvent('rating_deleted', { item_id: id, item_type: type });

// --- Search & Discovery ---
export const trackSearch = (query: string, resultCount: number) =>
  logEvent('search', { search_term: query, result_count: resultCount });
export const trackSearchResultClicked = (id: string, type: string, position: number) =>
  logEvent('search_result_clicked', { item_id: id, item_type: type, position });
export const trackDiscoverTabSwitched = (tab: string) => logEvent('discover_tab_switched', { tab });
export const trackGenreFiltered = (genre: string) => logEvent('genre_filtered', { genre });

// --- Social Events ---
export const trackFriendRequestSent = (friendName: string) =>
  logEvent('friend_request_sent', { friend_name: friendName });
export const trackFriendRequestAccepted = (friendName: string) =>
  logEvent('friend_request_accepted', { friend_name: friendName });
export const trackFriendRequestDeclined = () => logEvent('friend_request_declined');
export const trackFriendRemoved = () => logEvent('friend_removed');
export const trackDiscussionPosted = (seriesName: string) =>
  logEvent('discussion_posted', { series_name: seriesName });
export const trackTasteMatchViewed = (friendName: string) =>
  logEvent('taste_match_viewed', { friend_name: friendName });

// --- Watchlist & Navigation ---
export const trackWatchlistToggled = (id: string, action: 'add' | 'remove') =>
  logEvent('watchlist_toggled', { item_id: id, action });
export const trackSortChanged = (page: string, sortOption: string) =>
  logEvent('sort_changed', { page, sort_option: sortOption });
export const trackFilterChanged = (page: string, filter: string) =>
  logEvent('filter_changed', { page, filter });
export const trackTabSwitched = (page: string, tab: string) =>
  logEvent('tab_switched', { page, tab });

// --- Personalization ---
export const trackThemeSelected = (theme: string) => logEvent('theme_selected', { theme });
export const trackThemeCustomized = () => logEvent('theme_customized');
export const trackHomeLayoutChanged = (section: string, enabled: boolean) =>
  logEvent('home_layout_changed', { section, enabled });
export const trackHomeSectionReordered = () => logEvent('home_section_reordered');

// --- Features ---
export const trackBadgeViewed = (badge: string) => logEvent('badge_viewed', { badge });
export const trackBadgeEarned = (badge: string) => logEvent('badge_earned', { badge });
export const trackPetCreated = (type: string) => logEvent('pet_created', { pet_type: type });
export const trackPetInteraction = (action: string) => logEvent('pet_interaction', { action });
export const trackRewatchStarted = (seriesName: string) =>
  logEvent('rewatch_started', { series_name: seriesName });
export const trackRewatchStopped = (seriesName: string) =>
  logEvent('rewatch_stopped', { series_name: seriesName });
export const trackWrappedViewed = (slide: number) =>
  logEvent('wrapped_slide_viewed', { slide_number: slide });
export const trackWrappedShared = () => logEvent('wrapped_shared');

// --- Calendar ---
export const trackCalendarNavigated = (direction: string) =>
  logEvent('calendar_navigated', { direction });
export const trackCalendarFilterToggled = (watchlistOnly: boolean) =>
  logEvent('calendar_filter_toggled', { watchlist_only: watchlistOnly });

// --- Settings ---
export const trackProfilePhotoUploaded = () => logEvent('profile_photo_uploaded');
export const trackPublicProfileToggled = (enabled: boolean) =>
  logEvent('public_profile_toggled', { enabled });
export const trackPublicLinkCopied = () => logEvent('public_link_copied');

// --- Onboarding ---
export const trackOnboardingStarted = () => logEvent('onboarding_started');
export const trackOnboardingCompleted = (seriesCount: number, movieCount: number) =>
  logEvent('onboarding_completed', { series_count: seriesCount, movie_count: movieCount });

// --- Engagement ---
export const trackSeriesHiddenToggled = (action: 'hide' | 'show') =>
  logEvent('series_hidden_toggled', { action });
export const trackNotificationDismissed = (type: string) =>
  logEvent('notification_dismissed', { type });

// --- Discover & Browse ---
export const trackDiscoverCategoryChanged = (category: string) =>
  logEvent('discover_category_changed', { category });
export const trackDiscoverSearchToggled = (open: boolean) =>
  logEvent('discover_search_toggled', { open });
export const trackDiscoverSearchQuery = (query: string) =>
  logEvent('discover_search_query', { query });
export const trackDiscoverItemClicked = (id: string, type: string, source: string) =>
  logEvent('discover_item_clicked', { item_id: id, item_type: type, source });

// --- Series Detail ---
export const trackSeasonSelected = (seriesName: string, season: number) =>
  logEvent('season_selected', { series_name: seriesName, season });
export const trackSeriesDetailTabSwitched = (tab: string) =>
  logEvent('series_detail_tab_switched', { tab });
export const trackEpisodeClicked = (seriesName: string, season: number, episode: number) =>
  logEvent('episode_clicked', { series_name: seriesName, season, episode });
export const trackStreamingProviderClicked = (provider: string, seriesName: string) =>
  logEvent('streaming_provider_clicked', { provider, series_name: seriesName });
export const trackTrailerPlayed = (itemName: string, type: string) =>
  logEvent('trailer_played', { item_name: itemName, item_type: type });
export const trackCastMemberClicked = (actorName: string) =>
  logEvent('cast_member_clicked', { actor_name: actorName });

// --- Movie Detail ---
export const trackMovieDetailTabSwitched = (tab: string) =>
  logEvent('movie_detail_tab_switched', { tab });
export const trackMovieWatchlistToggled = (id: string, action: 'add' | 'remove') =>
  logEvent('movie_watchlist_toggled', { movie_id: id, action });

// --- Activity & Social ---
export const trackActivityTabSwitched = (tab: string) => logEvent('activity_tab_switched', { tab });
export const trackActivityFilterChanged = (filter: string) =>
  logEvent('activity_filter_changed', { filter });
export const trackActivityEntryClicked = (type: string) =>
  logEvent('activity_entry_clicked', { type });
export const trackAddFriendDialogOpened = () => logEvent('add_friend_dialog_opened');
export const trackFriendProfileClicked = (friendName: string) =>
  logEvent('friend_profile_clicked', { friend_name: friendName });
export const trackDiscussionClicked = (discussionId: string) =>
  logEvent('discussion_clicked', { discussion_id: discussionId });
export const trackDiscussionLiked = (discussionId: string) =>
  logEvent('discussion_liked', { discussion_id: discussionId });
export const trackDiscussionUnliked = (discussionId: string) =>
  logEvent('discussion_unliked', { discussion_id: discussionId });
export const trackReplyPosted = (discussionId: string) =>
  logEvent('reply_posted', { discussion_id: discussionId });
export const trackReplyLiked = (replyId: string, liked: boolean) =>
  logEvent('reply_liked', { reply_id: replyId, liked });
export const trackSpoilerFlagged = (itemId: string, itemType: string) =>
  logEvent('spoiler_flagged', { item_id: itemId, item_type: itemType });

// --- Discussion Feed ---
export const trackDiscussionFeedFilterChanged = (filter: string) =>
  logEvent('discussion_feed_filter_changed', { filter });
export const trackDiscussionFeedEntryClicked = (seriesName: string) =>
  logEvent('discussion_feed_entry_clicked', { series_name: seriesName });

// --- Calendar ---
export const trackCalendarEpisodeMarked = (seriesName: string) =>
  logEvent('calendar_episode_marked', { series_name: seriesName });
export const trackCalendarGroupExpanded = (date: string) =>
  logEvent('calendar_group_expanded', { date });

// --- Countdown ---
export const trackCountdownClicked = (seriesName: string) =>
  logEvent('countdown_clicked', { series_name: seriesName });

// --- Watch Next ---
export const trackWatchNextSortChanged = (sortOption: string) =>
  logEvent('watch_next_sort_changed', { sort_option: sortOption });
export const trackWatchNextCustomOrderToggled = (enabled: boolean) =>
  logEvent('watch_next_custom_order_toggled', { enabled });
export const trackWatchNextEditModeToggled = (enabled: boolean) =>
  logEvent('watch_next_edit_mode_toggled', { enabled });
export const trackWatchNextProviderFiltered = (provider: string) =>
  logEvent('watch_next_provider_filtered', { provider });
export const trackWatchNextEpisodeSwiped = (seriesName: string, action: string) =>
  logEvent('watch_next_episode_swiped', { series_name: seriesName, action });
export const trackWatchNextReorderUsed = () => logEvent('watch_next_reorder_used');

// --- Catch Up ---
export const trackCatchUpSortChanged = (sortOption: string) =>
  logEvent('catch_up_sort_changed', { sort_option: sortOption });
export const trackCatchUpSeriesClicked = (seriesName: string) =>
  logEvent('catch_up_series_clicked', { series_name: seriesName });

// --- Hidden Series ---
export const trackHiddenSeriesUnhidden = (seriesName: string) =>
  logEvent('hidden_series_unhidden', { series_name: seriesName });
export const trackHiddenSeriesClicked = (seriesName: string) =>
  logEvent('hidden_series_clicked', { series_name: seriesName });

// --- Recently Watched ---
export const trackRecentlyWatchedTimeRangeChanged = (days: number) =>
  logEvent('recently_watched_time_range_changed', { days });
export const trackRecentlyWatchedSearched = (query: string) =>
  logEvent('recently_watched_searched', { query });
export const trackRecentlyWatchedSeriesExpanded = (seriesId: number, expanded: boolean) =>
  logEvent('recently_watched_series_expanded', { series_id: seriesId, expanded });

// --- Ratings Page ---
export const trackRatingsTabSwitched = (tab: string) => logEvent('ratings_tab_switched', { tab });
export const trackRatingsFilterChanged = (filter: string) =>
  logEvent('ratings_filter_changed', { filter });
export const trackRatingsItemClicked = (id: string, type: string) =>
  logEvent('ratings_item_clicked', { item_id: id, item_type: type });

// --- Badges ---
export const trackBadgeCategoryTabSwitched = (category: string) =>
  logEvent('badge_category_tab_switched', { category });
export const trackBadgeCheckTriggered = () => logEvent('badge_check_triggered');
export const trackBadgeCardClicked = (badge: string) => logEvent('badge_card_clicked', { badge });

// --- Pets ---
export const trackPetSelected = (type: string, name: string) =>
  logEvent('pet_selected', { pet_type: type, pet_name: name });
export const trackPetReleased = (type: string, level: number) =>
  logEvent('pet_released', { pet_type: type, level });
export const trackPetCustomized = (action: string, value: string) =>
  logEvent('pet_customized', { action, value });

// --- Leaderboard ---
export const trackLeaderboardModeChanged = (mode: string) =>
  logEvent('leaderboard_mode_changed', { mode });
export const trackLeaderboardCategoryChanged = (category: string) =>
  logEvent('leaderboard_category_changed', { category });
export const trackLeaderboardUserClicked = (userName: string) =>
  logEvent('leaderboard_user_clicked', { user_name: userName });

// --- Stats ---
export const trackStatsActorUniverseClicked = () => logEvent('stats_actor_universe_clicked');

// --- Actor Universe ---
export const trackActorUniverseTabSwitched = (tab: string) =>
  logEvent('actor_universe_tab_switched', { tab });
export const trackActorUniverseVoiceToggled = (enabled: boolean) =>
  logEvent('actor_universe_voice_toggled', { enabled });
export const trackActorSelected = (actorName: string) =>
  logEvent('actor_selected', { actor_name: actorName });

// --- Watch Journey ---
export const trackWatchJourneyTabSwitched = (tab: string) =>
  logEvent('watch_journey_tab_switched', { tab });
export const trackWatchJourneyYearChanged = (year: number) =>
  logEvent('watch_journey_year_changed', { year });

// --- Wrapped ---
export const trackWrappedSlideNavigated = (slideType: string, slideIndex: number) =>
  logEvent('wrapped_slide_navigated', { slide_type: slideType, slide_index: slideIndex });

// --- TasteMatch ---
export const trackTasteMatchTabSwitched = (tab: string) =>
  logEvent('taste_match_tab_switched', { tab });
export const trackTasteMatchShared = (friendName: string) =>
  logEvent('taste_match_shared', { friend_name: friendName });
export const trackTasteMatchItemClicked = (id: string, type: string) =>
  logEvent('taste_match_item_clicked', { item_id: id, item_type: type });

// --- Friend Profile ---
export const trackFriendProfileTabSwitched = (tab: string) =>
  logEvent('friend_profile_tab_switched', { tab });
export const trackFriendProfileFilterChanged = (filter: string) =>
  logEvent('friend_profile_filter_changed', { filter });
export const trackFriendProfileTasteMatchClicked = (friendName: string) =>
  logEvent('friend_profile_taste_match_clicked', { friend_name: friendName });

// --- Public Profile ---
export const trackPublicProfileTabSwitched = (tab: string) =>
  logEvent('public_profile_tab_switched', { tab });
export const trackPublicProfileItemClicked = (id: string, type: string) =>
  logEvent('public_profile_item_clicked', { item_id: id, item_type: type });

// --- Home Page ---
export const trackHomeCardClicked = (section: string, itemName: string) =>
  logEvent('home_card_clicked', { section, item_name: itemName });
export const trackHomeSectionScrolled = (section: string) =>
  logEvent('home_section_scrolled', { section });
export const trackHomeAnnouncementDismissed = (announcement: string) =>
  logEvent('home_announcement_dismissed', { announcement });
export const trackHomeAnnouncementClicked = (announcement: string) =>
  logEvent('home_announcement_clicked', { announcement });

// --- Profile Menu ---
export const trackProfileMenuItemClicked = (item: string) =>
  logEvent('profile_menu_item_clicked', { item });

// --- Episode Discussion ---
export const trackEpisodeDiscussionNavigated = (direction: 'prev' | 'next') =>
  logEvent('episode_discussion_navigated', { direction });
export const trackEpisodeDiscussionWatchToggled = (seriesName: string, watched: boolean) =>
  logEvent('episode_discussion_watch_toggled', { series_name: seriesName, watched });

// --- Onboarding ---
export const trackOnboardingStepChanged = (step: string) =>
  logEvent('onboarding_step_changed', { step });
export const trackOnboardingSearched = (query: string, type: string) =>
  logEvent('onboarding_searched', { query, type });
export const trackOnboardingItemSelected = (type: string, title: string) =>
  logEvent('onboarding_item_selected', { item_type: type, item_title: title });

// --- Consent ---
export const trackAnalyticsConsentChanged = (accepted: boolean) =>
  logEvent('analytics_consent_changed', { accepted });

// --- Swipe Gestures ---
export const trackEpisodeSwipeCompleted = (seriesName: string, direction: string, source: string) =>
  logEvent('episode_swipe_completed', { series_name: seriesName, direction, source });

// --- Video/Media ---
export const trackVideoPlayed = (videoTitle: string, itemName: string) =>
  logEvent('video_played', { video_title: videoTitle, item_name: itemName });

// --- Patch Notes ---
export const trackPatchNotesViewed = (version: string, featureTitle: string) =>
  logEvent('patch_notes_viewed', { version, feature_title: featureTitle });

// --- Quick Filter ---
export const trackQuickFilterSelected = (page: string, filter: string) =>
  logEvent('quick_filter_selected', { page, filter });

// --- Scroll to Top ---
export const trackScrollToTopUsed = (page: string) => logEvent('scroll_to_top_used', { page });

// --- Empty State ---
export const trackEmptyStateViewed = (page: string, context: string) =>
  logEvent('empty_state_viewed', { page, context });

// --- Share ---
export const trackContentShared = (type: string, method: string) =>
  logEvent('content_shared', { content_type: type, method });

// --- Error Events ---
export const trackError = (page: string, error: string) => logEvent('app_error', { page, error });
export const trackJsError = (message: string, source: string, line?: number) =>
  logEvent('js_error', {
    error_message: String(message).slice(0, 100),
    error_source: String(source).slice(0, 100),
    line_number: line,
  });
export const trackUnhandledRejection = (reason: string) =>
  logEvent('unhandled_rejection', { reason: String(reason).slice(0, 100) });
export const trackApiError = (url: string, status: number, method: string) =>
  logEvent('api_error', {
    request_url: String(url).slice(0, 100),
    status_code: status,
    method,
  });

/** Install global error handlers that forward to analytics */
export function installGlobalErrorTracking() {
  // JS runtime errors
  window.addEventListener('error', (event) => {
    trackJsError(
      event.message || 'Unknown error',
      event.filename || window.location.pathname,
      event.lineno
    );
  });

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason instanceof Error ? event.reason.message : String(event.reason);
    trackUnhandledRejection(reason);
  });

  // Intercept fetch to track HTTP errors (4xx/5xx)
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const response = await originalFetch.apply(this, args);
    if (response.status >= 400) {
      const url =
        typeof args[0] === 'string'
          ? args[0]
          : args[0] instanceof Request
            ? args[0].url
            : String(args[0]);
      const method = (typeof args[1] === 'object' && args[1]?.method) || 'GET';
      trackApiError(url, response.status, String(method));
    }
    return response;
  };
}
