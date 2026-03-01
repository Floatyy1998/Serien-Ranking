import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronLeft, ChevronRight, ExpandMore } from '@mui/icons-material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useAuth } from '../../App';
import { useSeriesList } from '../../contexts/OptimizedSeriesListProvider';
import { useTheme } from '../../contexts/ThemeContext';
import { useWeeklyEpisodes, getWeekNumber, WeeklyEpisode } from '../../hooks/useWeeklyEpisodes';
import { PageHeader, PageLayout } from '../../components/ui';
import './CalendarPage.css';

const WEEKDAYS_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

function formatDate(date: Date): string {
  return date.toLocaleDateString('de-DE', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Europe/Berlin',
  });
}

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const CalendarPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth()!;
  const { seriesList } = useSeriesList();
  const { currentTheme } = useTheme();
  const [weekOffset, setWeekOffset] = useState(0);
  const [watchlistOnly, setWatchlistOnly] = useState<boolean>(() => {
    return localStorage.getItem('calendarWatchlistOnly') === 'true';
  });

  const { schedule, monday, sunday, totalEpisodes, watchedCount } = useWeeklyEpisodes(
    seriesList,
    weekOffset,
    watchlistOnly
  );

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = useCallback((groupKey: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) next.delete(groupKey);
      else next.add(groupKey);
      return next;
    });
  }, []);

  // Fetch backdrops from TMDB
  const [backdrops, setBackdrops] = useState<Record<number, string>>({});
  const backdropCache = useRef<Record<number, string>>({});

  const seriesIdsInSchedule = useMemo(() => {
    const ids = new Set<number>();
    for (const [, episodes] of schedule.entries()) {
      for (const ep of episodes) ids.add(ep.seriesId);
    }
    return Array.from(ids);
  }, [schedule]);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_API_TMDB;
    if (!apiKey || seriesIdsInSchedule.length === 0) return;

    const toFetch = seriesIdsInSchedule.filter((id) => !backdropCache.current[id]);
    if (toFetch.length === 0) return;

    toFetch.forEach((id) => {
      fetch(`https://api.themoviedb.org/3/tv/${id}?api_key=${apiKey}&language=de-DE`)
        .then((res) => res.json())
        .then((data) => {
          if (data.backdrop_path) {
            const url = `https://image.tmdb.org/t/p/w780${data.backdrop_path}`;
            backdropCache.current[id] = url;
            setBackdrops((prev) => ({ ...prev, [id]: url }));
          }
        })
        .catch(() => {});
    });
  }, [seriesIdsInSchedule]);

  const todayKey = toDateKey(new Date());
  const kwNumber = getWeekNumber(monday);

  // Group episodes by series within each day
  const groupedSchedule = useMemo(() => {
    const result = new Map<
      string,
      { seriesId: number; seriesTitle: string; episodes: WeeklyEpisode[] }[]
    >();
    for (const [dateKey, episodes] of schedule.entries()) {
      const seriesMap = new Map<number, WeeklyEpisode[]>();
      for (const ep of episodes) {
        const existing = seriesMap.get(ep.seriesId);
        if (existing) existing.push(ep);
        else seriesMap.set(ep.seriesId, [ep]);
      }
      const groups = Array.from(seriesMap.values()).map((eps) => ({
        seriesId: eps[0].seriesId,
        seriesTitle: eps[0].seriesTitle,
        episodes: eps,
      }));
      result.set(dateKey, groups);
    }
    return result;
  }, [schedule]);

  const handleMarkWatched = async (
    seriesNmr: number,
    seasonIndex: number,
    episodeIndex: number
  ) => {
    if (!user) return;
    try {
      const basePath = `${user.uid}/serien/${seriesNmr}/seasons/${seasonIndex}/episodes/${episodeIndex}`;
      const now = new Date().toISOString();
      const updates: Record<string, unknown> = {};
      updates[`${basePath}/watched`] = true;
      updates[`${basePath}/watchCount`] = firebase.database.ServerValue.increment(1);
      updates[`${basePath}/lastWatchedAt`] = now;

      const firstRef = firebase
        .database()
        .ref(
          `${user.uid}/serien/${seriesNmr}/seasons/${seasonIndex}/episodes/${episodeIndex}/firstWatchedAt`
        );
      const snap = await firstRef.once('value');
      if (!snap.val()) {
        updates[`${basePath}/firstWatchedAt`] = now;
      }

      await firebase.database().ref().update(updates);
    } catch (error) {
      console.error('Failed to mark episode:', error);
    }
  };

  const weekNav = (
    <div className="cal-week-switcher">
      <button className="cal-arrow-btn" onClick={() => setWeekOffset((o) => o - 1)}>
        <ChevronLeft style={{ fontSize: '20px' }} />
      </button>
      <button
        className={`cal-week-chip ${weekOffset === 0 ? 'is-current' : ''}`}
        onClick={() => setWeekOffset(0)}
        style={
          weekOffset === 0
            ? { borderColor: `${currentTheme.primary}60`, color: currentTheme.primary }
            : {}
        }
      >
        KW {kwNumber} · {formatDate(monday)} – {formatDate(sunday)}
      </button>
      <button className="cal-arrow-btn" onClick={() => setWeekOffset((o) => o + 1)}>
        <ChevronRight style={{ fontSize: '20px' }} />
      </button>
    </div>
  );

  return (
    <PageLayout>
      <div className="calendar-page">
        <PageHeader title="TV-Kalender" />

        {/* Desktop: compact toolbar */}
        <div className="cal-toolbar-desktop">
          <div className="cal-toolbar-left">
            {['Alle Serien', 'Watchlist'].map((label) => {
              const isActive =
                (label === 'Watchlist' && watchlistOnly) ||
                (label === 'Alle Serien' && !watchlistOnly);
              return (
                <button
                  key={label}
                  className="cal-filter-chip"
                  onClick={() => {
                    const next = label === 'Watchlist';
                    setWatchlistOnly(next);
                    localStorage.setItem('calendarWatchlistOnly', String(next));
                  }}
                  style={
                    isActive
                      ? {
                          background: `${currentTheme.primary}20`,
                          color: currentTheme.primary,
                          borderColor: `${currentTheme.primary}50`,
                        }
                      : {}
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="cal-toolbar-center">
            <button className="cal-arrow-btn" onClick={() => setWeekOffset((o) => o - 1)}>
              <ChevronLeft style={{ fontSize: '18px' }} />
            </button>
            <button
              className={`cal-week-chip ${weekOffset === 0 ? 'is-current' : ''}`}
              onClick={() => setWeekOffset(0)}
              style={
                weekOffset === 0
                  ? { borderColor: `${currentTheme.primary}60`, color: currentTheme.primary }
                  : {}
              }
            >
              KW {kwNumber} · {formatDate(monday)} – {formatDate(sunday)}
            </button>
            <button className="cal-arrow-btn" onClick={() => setWeekOffset((o) => o + 1)}>
              <ChevronRight style={{ fontSize: '18px' }} />
            </button>
          </div>
          <div className="cal-toolbar-right">
            {totalEpisodes > 0 && (
              <>
                <div
                  className="cal-stat-item"
                  style={{
                    background: `${currentTheme.primary}15`,
                    color: currentTheme.primary,
                  }}
                >
                  {totalEpisodes} gesamt
                </div>
                <div
                  className="cal-stat-item"
                  style={{
                    background: `${currentTheme.status.success}15`,
                    color: currentTheme.status.success,
                  }}
                >
                  {watchedCount} gesehen
                </div>
                <div className="cal-stat-item">{totalEpisodes - watchedCount} offen</div>
              </>
            )}
          </div>
        </div>

        {/* Mobile: original layout */}
        <div className="cal-mobile-header">
          {weekNav}

          <div className="cal-filter-row">
            {['Alle Serien', 'Watchlist'].map((label) => {
              const isActive =
                (label === 'Watchlist' && watchlistOnly) ||
                (label === 'Alle Serien' && !watchlistOnly);
              return (
                <button
                  key={label}
                  className="cal-filter-chip"
                  onClick={() => {
                    const next = label === 'Watchlist';
                    setWatchlistOnly(next);
                    localStorage.setItem('calendarWatchlistOnly', String(next));
                  }}
                  style={
                    isActive
                      ? {
                          background: `${currentTheme.primary}20`,
                          color: currentTheme.primary,
                          borderColor: `${currentTheme.primary}50`,
                        }
                      : {}
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>

          {totalEpisodes > 0 && (
            <div className="cal-stats">
              <div
                className="cal-stat-item"
                style={{
                  background: `${currentTheme.primary}15`,
                  color: currentTheme.primary,
                }}
              >
                {totalEpisodes} gesamt
              </div>
              <div
                className="cal-stat-item"
                style={{
                  background: `${currentTheme.status.success}15`,
                  color: currentTheme.status.success,
                }}
              >
                {watchedCount} gesehen
              </div>
              <div className="cal-stat-item">{totalEpisodes - watchedCount} offen</div>
            </div>
          )}
        </div>

        {/* Days */}
        <div className="cal-content">
          {Array.from(groupedSchedule.entries()).map(([dateKey, groups], dayIndex) => {
            const isToday = dateKey === todayKey;
            const dayDate = new Date(dateKey + 'T00:00:00');
            const hasEpisodes = groups.length > 0;

            return (
              <div
                key={dateKey}
                className={`cal-day ${isToday ? 'is-today' : ''} ${!hasEpisodes ? 'is-empty' : ''}`}
              >
                {/* Day header */}
                <div className="cal-day-label">
                  <span
                    className={`cal-day-weekday ${isToday ? 'is-today' : ''}`}
                    style={isToday ? { color: currentTheme.primary } : {}}
                  >
                    {WEEKDAYS_SHORT[dayIndex]}
                  </span>
                  <span
                    className={`cal-day-number ${isToday ? 'is-today' : ''}`}
                    style={
                      isToday
                        ? { background: currentTheme.primary, color: '#fff' }
                        : { color: currentTheme.text.primary }
                    }
                  >
                    {dayDate.getDate()}
                  </span>
                  {!hasEpisodes && <span className="cal-day-none">—</span>}
                </div>

                {/* Episodes */}
                {hasEpisodes && (
                  <div className="cal-day-episodes">
                    {groups.map((group) => {
                      const isSingle = group.episodes.length === 1;
                      const groupKey = `${dateKey}-${group.seriesId}`;
                      const isExpanded = expandedGroups.has(groupKey);
                      const watchedInGroup = group.episodes.filter((e) => e.watched).length;
                      const allWatched = watchedInGroup === group.episodes.length;

                      if (isSingle) {
                        const ep = group.episodes[0];
                        return (
                          <div
                            key={groupKey}
                            className={`cal-ep${ep.premiereType ? ' cal-ep-premiere' : ''}`}
                            style={{
                              borderLeftColor: ep.premiereType
                                ? currentTheme.status.warning
                                : ep.watched
                                  ? currentTheme.status.success
                                  : currentTheme.primary,
                            }}
                            onClick={() =>
                              navigate(
                                `/episode/${ep.seriesId}/s/${ep.seasonNumber}/e/${ep.episodeNumber}`
                              )
                            }
                          >
                            <div className="cal-ep-poster-wrap">
                              <img
                                src={backdrops[ep.seriesId] || ep.poster}
                                alt=""
                                className="cal-ep-poster"
                              />
                              {ep.premiereType && (
                                <span
                                  className="cal-ep-premiere-overlay"
                                  style={{
                                    background: `${currentTheme.status.warning}dd`,
                                  }}
                                >
                                  {ep.premiereType === 'season-start' ? 'Staffelstart' : 'Rückkehr'}
                                </span>
                              )}
                              {ep.watched ? (
                                <div
                                  className="cal-ep-status-overlay"
                                  style={{
                                    background: `${currentTheme.status.success}cc`,
                                    color: '#fff',
                                  }}
                                >
                                  <Check style={{ fontSize: '14px' }} />
                                </div>
                              ) : (
                                <button
                                  className="cal-ep-mark-overlay"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkWatched(
                                      ep.seriesNmr,
                                      ep.seasonIndex,
                                      ep.episodeIndex
                                    );
                                  }}
                                  style={{ borderColor: 'rgba(255,255,255,0.5)' }}
                                />
                              )}
                              <div className="cal-ep-poster-info">
                                <span className="cal-ep-title">{ep.seriesTitle}</span>
                                <span
                                  className="cal-ep-episode"
                                  style={{
                                    color: ep.premiereType
                                      ? currentTheme.status.warning
                                      : 'rgba(255,255,255,0.7)',
                                  }}
                                >
                                  S{String(ep.seasonNumber).padStart(2, '0')}E
                                  {String(ep.episodeNumber).padStart(2, '0')}
                                  {ep.premiereType && (
                                    <span
                                      className="cal-ep-premiere-badge"
                                      style={{
                                        background: `${currentTheme.status.warning}20`,
                                        color: currentTheme.status.warning,
                                      }}
                                    >
                                      {ep.premiereType === 'season-start'
                                        ? 'Staffelstart'
                                        : 'Rückkehr'}
                                    </span>
                                  )}
                                </span>
                                <span className="cal-ep-name">{ep.episodeName}</span>
                              </div>
                            </div>
                            {/* Mobile: poster + info (hidden on desktop) */}
                            <img
                              src={ep.poster}
                              alt=""
                              className="cal-ep-poster cal-ep-poster-mobile"
                            />
                            <div className="cal-ep-info cal-ep-info-mobile">
                              <span
                                className="cal-ep-title"
                                style={{ color: currentTheme.text.primary }}
                              >
                                {ep.seriesTitle}
                              </span>
                              <span
                                className="cal-ep-episode"
                                style={{
                                  color: ep.premiereType
                                    ? currentTheme.status.warning
                                    : currentTheme.primary,
                                }}
                              >
                                S{String(ep.seasonNumber).padStart(2, '0')}E
                                {String(ep.episodeNumber).padStart(2, '0')}
                                {ep.premiereType && (
                                  <span
                                    className="cal-ep-premiere-badge"
                                    style={{
                                      background: `${currentTheme.status.warning}20`,
                                      color: currentTheme.status.warning,
                                    }}
                                  >
                                    {ep.premiereType === 'season-start'
                                      ? 'Staffelstart'
                                      : 'Rückkehr'}
                                  </span>
                                )}
                              </span>
                              <span
                                className="cal-ep-name"
                                style={{ color: currentTheme.text.secondary }}
                              >
                                {ep.episodeName}
                              </span>
                            </div>
                            {ep.watched ? (
                              <div
                                className="cal-ep-status cal-ep-status-mobile"
                                style={{
                                  background: `${currentTheme.status.success}18`,
                                  color: currentTheme.status.success,
                                }}
                              >
                                <Check style={{ fontSize: '16px' }} />
                              </div>
                            ) : (
                              <button
                                className="cal-ep-mark cal-ep-mark-mobile"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkWatched(ep.seriesNmr, ep.seasonIndex, ep.episodeIndex);
                                }}
                                style={{ borderColor: `${currentTheme.text.muted}40` }}
                              />
                            )}
                          </div>
                        );
                      }

                      // Multi-episode group
                      const firstEp = group.episodes[0];
                      const lastEp = group.episodes[group.episodes.length - 1];

                      const groupPremiereType = group.episodes.find(
                        (ep) => ep.premiereType
                      )?.premiereType;

                      return (
                        <div
                          key={groupKey}
                          className={`cal-ep-group${groupPremiereType ? ' cal-ep-premiere' : ''} ${isExpanded ? 'is-open' : ''}`}
                          style={{
                            borderLeftColor: groupPremiereType
                              ? currentTheme.status.warning
                              : allWatched
                                ? currentTheme.status.success
                                : currentTheme.primary,
                          }}
                        >
                          <div
                            className="cal-ep cal-ep-group-header"
                            onClick={() => toggleGroup(groupKey)}
                          >
                            <div className="cal-ep-poster-wrap">
                              {(backdrops[group.seriesId] || group.episodes[0]?.poster) && (
                                <img
                                  src={backdrops[group.seriesId] || group.episodes[0]?.poster}
                                  alt=""
                                  className="cal-ep-poster"
                                />
                              )}
                              {groupPremiereType && (
                                <span
                                  className="cal-ep-premiere-overlay"
                                  style={{
                                    background: `${currentTheme.status.warning}dd`,
                                  }}
                                >
                                  {groupPremiereType === 'season-start'
                                    ? 'Staffelstart'
                                    : 'Rückkehr'}
                                </span>
                              )}
                              {allWatched && (
                                <div
                                  className="cal-ep-status-overlay"
                                  style={{
                                    background: `${currentTheme.status.success}cc`,
                                    color: '#fff',
                                  }}
                                >
                                  <Check style={{ fontSize: '14px' }} />
                                </div>
                              )}
                              <div className="cal-ep-poster-info">
                                <span className="cal-ep-title">{group.seriesTitle}</span>
                                <span
                                  className="cal-ep-episode"
                                  style={{
                                    color: groupPremiereType
                                      ? currentTheme.status.warning
                                      : 'rgba(255,255,255,0.7)',
                                  }}
                                >
                                  S{String(firstEp.seasonNumber).padStart(2, '0')} E
                                  {String(firstEp.episodeNumber).padStart(2, '0')}–E
                                  {String(lastEp.episodeNumber).padStart(2, '0')}
                                </span>
                                <span className="cal-ep-name">
                                  {group.episodes.length} Folgen · {watchedInGroup} gesehen
                                </span>
                              </div>
                            </div>
                            {/* Mobile: poster + info */}
                            {group.episodes[0]?.poster && (
                              <img
                                src={group.episodes[0].poster}
                                alt=""
                                className="cal-ep-poster cal-ep-poster-mobile"
                              />
                            )}
                            <div className="cal-ep-info cal-ep-info-mobile">
                              <span
                                className="cal-ep-title"
                                style={{ color: currentTheme.text.primary }}
                              >
                                {group.seriesTitle}
                              </span>
                              <span
                                className="cal-ep-episode"
                                style={{
                                  color: groupPremiereType
                                    ? currentTheme.status.warning
                                    : currentTheme.primary,
                                }}
                              >
                                S{String(firstEp.seasonNumber).padStart(2, '0')} E
                                {String(firstEp.episodeNumber).padStart(2, '0')}–E
                                {String(lastEp.episodeNumber).padStart(2, '0')}
                                {groupPremiereType && (
                                  <span
                                    className="cal-ep-premiere-badge"
                                    style={{
                                      background: `${currentTheme.status.warning}20`,
                                      color: currentTheme.status.warning,
                                    }}
                                  >
                                    {groupPremiereType === 'season-start'
                                      ? 'Staffelstart'
                                      : 'Rückkehr'}
                                  </span>
                                )}
                              </span>
                              <span
                                className="cal-ep-name"
                                style={{ color: currentTheme.text.secondary }}
                              >
                                {group.episodes.length} Folgen · {watchedInGroup} gesehen
                              </span>
                            </div>
                            <div
                              className="cal-ep-expand-mobile"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                flexShrink: 0,
                              }}
                            >
                              {allWatched && (
                                <div
                                  className="cal-ep-status"
                                  style={{
                                    background: `${currentTheme.status.success}18`,
                                    color: currentTheme.status.success,
                                  }}
                                >
                                  <Check style={{ fontSize: '16px' }} />
                                </div>
                              )}
                              <ExpandMore
                                style={{
                                  fontSize: '20px',
                                  color: currentTheme.text.muted,
                                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
                                  transition: 'transform 0.2s',
                                }}
                              />
                            </div>
                          </div>
                          {isExpanded && (
                            <div className="cal-ep-group-list">
                              {group.episodes.map((ep) => (
                                <div
                                  key={`${ep.seriesId}-${ep.seasonIndex}-${ep.episodeIndex}`}
                                  className="cal-ep-sub"
                                  onClick={() =>
                                    navigate(
                                      `/episode/${ep.seriesId}/s/${ep.seasonNumber}/e/${ep.episodeNumber}`
                                    )
                                  }
                                >
                                  <span
                                    className="cal-ep-sub-nr"
                                    style={{ color: currentTheme.primary }}
                                  >
                                    E{String(ep.episodeNumber).padStart(2, '0')}
                                  </span>
                                  <span
                                    className="cal-ep-sub-name"
                                    style={{ color: currentTheme.text.secondary }}
                                  >
                                    {ep.episodeName}
                                  </span>
                                  {ep.watched ? (
                                    <div
                                      className="cal-ep-status small"
                                      style={{
                                        background: `${currentTheme.status.success}18`,
                                        color: currentTheme.status.success,
                                      }}
                                    >
                                      <Check style={{ fontSize: '14px' }} />
                                    </div>
                                  ) : (
                                    <button
                                      className="cal-ep-mark small"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMarkWatched(
                                          ep.seriesNmr,
                                          ep.seasonIndex,
                                          ep.episodeIndex
                                        );
                                      }}
                                      style={{ borderColor: `${currentTheme.text.muted}40` }}
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {totalEpisodes === 0 && (
          <div className="cal-empty">
            <p style={{ color: currentTheme.text.muted }}>Keine Episoden in dieser Woche</p>
          </div>
        )}
      </div>
    </PageLayout>
  );
};
