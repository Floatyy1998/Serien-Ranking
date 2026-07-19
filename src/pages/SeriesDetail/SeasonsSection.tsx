import Check from '@mui/icons-material/Check';
import GridView from '@mui/icons-material/GridView';
import List from '@mui/icons-material/List';
import Repeat from '@mui/icons-material/Repeat';
import { Tooltip } from '@mui/material';
import { motion, type PanInfo } from 'framer-motion';
import { useCallback, useState } from 'react';
import type { useNavigate } from 'react-router-dom';
import { FillerChip } from '../../components/ui/FillerChip';
import {
  getImplicitRewatchRound,
  hasActiveRewatch,
  hasAnySeasonFullyWatched,
} from '../../lib/validation/rewatch.utils';
import { fillerLookupKey, type FillerEpisode } from '../../services/animeFillerService';
import type { DynamicTheme } from '../../theme/dynamicTheme';
import { getOptimalTextColor } from '../../theme/colorUtils';
import type { Series } from '../../types/Series';
import { RewatchBanner } from './RewatchBanner';
import { SeasonTabs } from './SeasonTabs';
import type { useSeriesData } from './useSeriesData';
import { tapScale } from '../../lib/motion';
import { t } from '../../services/i18n';

interface SeasonsSectionProps {
  series: NonNullable<ReturnType<typeof useSeriesData>['series']>;
  selectedSeasonIndex: number;
  setSelectedSeasonIndex: (i: number) => void;
  setShowRewatchDialog: (d: {
    show: boolean;
    type: 'episode' | 'season';
    item: Series['seasons'][number]['episodes'][number] | null;
    seasonNumber?: number;
    episodeNumber?: number;
  }) => void;
  episodeDiscussionCounts: Record<number, number>;
  warningColor: string;
  currentTheme: DynamicTheme;
  handleStopRewatch: () => void;
  handleStartRewatch: (continueExisting?: boolean) => void;
  handleEpisodeQuickToggle: (seasonIndex: number, episodeIndex: number) => Promise<void>;
  navigate: ReturnType<typeof useNavigate>;
  fillerByKey?: Map<string, FillerEpisode>;
}

function formatDate(input: string | undefined | null): string | null {
  if (!input) return null;
  const d = new Date(input);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function EpisodeDateMeta({
  airDate,
  firstWatchedAt,
  mutedColor,
  accentColor,
}: {
  airDate?: string;
  firstWatchedAt?: string;
  mutedColor: string;
  accentColor: string;
}) {
  const air = formatDate(airDate);
  const seen = formatDate(firstWatchedAt);
  if (!air && !seen) return null;
  return (
    <div className="episode-list-meta">
      {air && (
        <span style={{ color: mutedColor }}>{t('Erstausstrahlung {date}', { date: air })}</span>
      )}
      {air && seen && <span style={{ color: mutedColor, opacity: 0.4 }}>·</span>}
      {seen && <span style={{ color: accentColor }}>{t('Gesehen {date}', { date: seen })}</span>}
    </div>
  );
}

export function SeasonsSection({
  series,
  selectedSeasonIndex,
  setSelectedSeasonIndex,
  setShowRewatchDialog,
  episodeDiscussionCounts,
  warningColor,
  currentTheme,
  handleStopRewatch,
  handleStartRewatch,
  handleEpisodeQuickToggle,
  navigate,
  fillerByKey,
}: SeasonsSectionProps) {
  const [episodeView, setEpisodeView] = useState<'list' | 'grid'>('list');
  const safeSeasonIndex = Math.min(
    Math.max(selectedSeasonIndex, 0),
    Math.max(series.seasons.length - 1, 0)
  );
  const selectedSeason = series.seasons[safeSeasonIndex];

  const handleSeasonSwipe = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const threshold = 50;
      if (Math.abs(info.offset.x) < threshold || Math.abs(info.velocity.x) < 100) return;

      if (info.offset.x < 0 && selectedSeasonIndex < series.seasons.length - 1) {
        setSelectedSeasonIndex(selectedSeasonIndex + 1);
      } else if (info.offset.x > 0 && selectedSeasonIndex > 0) {
        setSelectedSeasonIndex(selectedSeasonIndex - 1);
      }
    },
    [selectedSeasonIndex, series.seasons.length, setSelectedSeasonIndex]
  );

  if (!selectedSeason) return null;

  const watchedEpisodes = selectedSeason?.episodes?.filter((ep) => ep.watched).length || 0;
  const totalEpisodes = selectedSeason?.episodes?.length || 0;
  const seasonProgress =
    totalEpisodes > 0 ? Math.round((watchedEpisodes / totalEpisodes) * 100) : 0;

  return (
    <div style={{ padding: '0 20px 20px' }}>
      {/* Section Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}
      >
        <h3
          style={{
            fontSize: '18px',
            fontWeight: 600,
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <List fontSize="small" style={{ color: currentTheme.accent }} />
          <span style={{ color: currentTheme.text.primary }}>{t('Staffeln')}</span>
        </h3>
        <motion.button
          whileTap={tapScale}
          onClick={() => navigate(`/episodes/${series.id}`)}
          style={{
            padding: '6px 12px',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '8px',
            color: currentTheme.text.secondary,
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {t('Alle verwalten')}
        </motion.button>
      </div>

      {/* Rewatch Progress Banner */}
      {hasActiveRewatch(series) && (
        <RewatchBanner
          series={series}
          warningColor={warningColor}
          currentTheme={currentTheme}
          setSelectedSeasonIndex={setSelectedSeasonIndex}
          setShowRewatchDialog={setShowRewatchDialog}
          handleStopRewatch={handleStopRewatch}
        />
      )}

      {/* Start Rewatch Button */}
      {hasAnySeasonFullyWatched(series) && !hasActiveRewatch(series) && (
        <motion.button
          whileTap={tapScale}
          onClick={() => handleStartRewatch()}
          style={{
            // Kompakter Pill statt Vollbreite-Streifen (mind. 44px Touch-Höhe).
            width: 'auto',
            minHeight: 44,
            padding: '10px 22px',
            background: `${warningColor}20`,
            border: `1px solid ${warningColor}50`,
            borderRadius: '999px',
            boxShadow: 'var(--glass-specular)',
            color: warningColor,
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '12px',
          }}
        >
          <Repeat style={{ fontSize: '18px' }} />
          {t('Rewatch starten')}
        </motion.button>
      )}

      {/* Implicit Rewatch Detection */}
      {(() => {
        const implicitRound = getImplicitRewatchRound(series);
        if (implicitRound === 0) return null;
        return (
          <motion.button
            whileTap={tapScale}
            onClick={() => handleStartRewatch(true)}
            style={{
              width: 'auto',
              minHeight: 44,
              padding: '10px 22px',
              background: `${warningColor}20`,
              border: `1px solid ${warningColor}50`,
              borderRadius: '999px',
              boxShadow: 'var(--glass-specular)',
              color: warningColor,
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '12px',
            }}
          >
            <Repeat style={{ fontSize: '18px' }} />
            {t('Rewatch fortsetzen')}
          </motion.button>
        );
      })()}

      {/* Selected Season Content */}
      <div
        style={{
          background: currentTheme.background.paper,
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px',
          padding: '16px',
          overflow: 'hidden',
        }}
      >
        {/* Season Tabs */}
        <SeasonTabs
          seasons={series.seasons}
          selectedSeasonIndex={selectedSeasonIndex}
          onSelectSeason={setSelectedSeasonIndex}
        />
        {/* Swipeable season content */}
        <motion.div
          key={selectedSeasonIndex}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.03}
          dragMomentum={false}
          dragSnapToOrigin
          onDragEnd={handleSeasonSwipe}
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          style={{ touchAction: 'pan-y' }}
        >
          {/* Season header with view toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
            }}
          >
            <div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: currentTheme.text.primary }}>
                {t('Staffel {n}', { n: selectedSeason.seasonNumber + 1 })}
              </div>
              <div style={{ fontSize: '13px', color: currentTheme.text.muted }}>
                {t('{watched}/{total} Episoden', {
                  watched: watchedEpisodes,
                  total: totalEpisodes,
                })}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* View toggle */}
              <button
                type="button"
                onClick={() => setEpisodeView(episodeView === 'list' ? 'grid' : 'list')}
                aria-label={
                  episodeView === 'list'
                    ? t('Zur Grid-Ansicht wechseln')
                    : t('Zur Listen-Ansicht wechseln')
                }
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '4px',
                  minWidth: 44,
                  minHeight: 44,
                  color: currentTheme.text.secondary,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title={episodeView === 'list' ? t('Grid-Ansicht') : t('Listen-Ansicht')}
              >
                {episodeView === 'list' ? (
                  <GridView style={{ fontSize: '16px' }} />
                ) : (
                  <List style={{ fontSize: '16px' }} />
                )}
              </button>
              <div
                style={{
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  fontSize: '13px',
                  fontWeight: 600,
                  background:
                    seasonProgress === 100
                      ? `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.accent} 100%)`
                      : 'rgba(255,255,255,0.1)',
                  color:
                    seasonProgress === 100
                      ? getOptimalTextColor(currentTheme.primary)
                      : currentTheme.text.secondary,
                }}
              >
                {seasonProgress}%
              </div>
            </div>
          </div>

          {/* Episode List View (default) */}
          {episodeView === 'list' && (
            <div className="episode-list">
              {selectedSeason.episodes?.map((episode, episodeIndex) => {
                const discussionCount = episodeDiscussionCounts[episodeIndex + 1] || 0;
                const isRewatched = episode.watched && (episode.watchCount || 1) > 1;
                const fillerInfo = fillerByKey?.get(
                  fillerLookupKey(selectedSeason.seasonNumber + 1, episodeIndex + 1)
                );
                const activateRow = () => {
                  if (episode.watched) {
                    setShowRewatchDialog({
                      show: true,
                      type: 'episode',
                      item: episode,
                      seasonNumber: selectedSeason.seasonNumber + 1,
                      episodeNumber: episodeIndex + 1,
                    });
                  } else {
                    navigate(
                      `/episode/${series.id}/s/${selectedSeason.seasonNumber + 1}/e/${episodeIndex + 1}`
                    );
                  }
                };
                return (
                  <div
                    key={episode.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`${t('Episode {n}', { n: episodeIndex + 1 })}${episode.name ? `: ${episode.name}` : ''} — ${
                      episode.watched ? t('gesehen, Optionen anzeigen') : t('Details öffnen')
                    }`}
                    onClick={activateRow}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        activateRow();
                      }
                    }}
                    className={`episode-list-item ${episode.watched ? 'episode-list-item--watched' : 'episode-list-item--unwatched'}`}
                    style={
                      episode.watched
                        ? {
                            background: 'rgba(255,255,255,0.04)',
                            borderLeft: `3px solid ${isRewatched ? currentTheme.accent : currentTheme.primary}`,
                          }
                        : undefined
                    }
                  >
                    {/* Number / check toggle */}
                    <Tooltip
                      title={
                        isRewatched
                          ? t('Optionen anzeigen')
                          : episode.watched
                            ? t('Als nicht gesehen markieren')
                            : t('Als gesehen markieren')
                      }
                      arrow
                      enterDelay={400}
                      enterTouchDelay={0}
                      leaveTouchDelay={1500}
                    >
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.85 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isRewatched) {
                            setShowRewatchDialog({
                              show: true,
                              type: 'episode',
                              item: episode,
                              seasonNumber: selectedSeason.seasonNumber + 1,
                              episodeNumber: episodeIndex + 1,
                            });
                            return;
                          }
                          void handleEpisodeQuickToggle(safeSeasonIndex, episodeIndex);
                        }}
                        aria-label={
                          episode.watched
                            ? t('Episode {n} als nicht gesehen markieren', { n: episodeIndex + 1 })
                            : t('Episode {n} als gesehen markieren', { n: episodeIndex + 1 })
                        }
                        className="episode-list-number"
                        style={{
                          background: episode.watched
                            ? isRewatched
                              ? `${currentTheme.accent}18`
                              : `${currentTheme.primary}18`
                            : 'rgba(255,255,255,0.06)',
                          color: episode.watched
                            ? isRewatched
                              ? currentTheme.accent
                              : currentTheme.primary
                            : currentTheme.text.muted,
                          border: episode.watched
                            ? 'none'
                            : `1px dashed ${currentTheme.text.muted}55`,
                          cursor: 'pointer',
                        }}
                      >
                        {episode.watched ? (
                          <Check style={{ fontSize: '15px' }} />
                        ) : (
                          episodeIndex + 1
                        )}
                      </motion.button>
                    </Tooltip>

                    {/* Episode info */}
                    <div className="episode-list-info">
                      <div className="episode-list-title">
                        {t('Episode {n}', { n: episodeIndex + 1 })}
                      </div>
                      {episode.name && <div className="episode-list-subtitle">{episode.name}</div>}
                    </div>

                    {/* Date meta — right-aligned on desktop, hidden on mobile (shown
                        as wrapped below row on small screens via CSS media query) */}
                    <EpisodeDateMeta
                      airDate={episode.air_date}
                      firstWatchedAt={episode.firstWatchedAt}
                      mutedColor={currentTheme.text.muted}
                      accentColor={currentTheme.accent}
                    />

                    {/* Filler / Recap marker */}
                    {fillerInfo && (
                      <FillerChip filler={fillerInfo.filler} recap={fillerInfo.recap} />
                    )}

                    {/* Rewatch badge */}
                    {isRewatched && (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          color: currentTheme.accent,
                          background: `${currentTheme.accent}12`,
                          padding: '2px 8px',
                          borderRadius: '6px',
                        }}
                      >
                        ×{episode.watchCount}
                      </span>
                    )}

                    {/* Discussion dot */}
                    {discussionCount > 0 && (
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: currentTheme.primary,
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Episode Grid View (compact) */}
          {episodeView === 'grid' && (
            <div className="episode-grid">
              {selectedSeason.episodes?.map((episode, episodeIndex) => {
                const discussionCount = episodeDiscussionCounts[episodeIndex + 1] || 0;
                const isRewatched = episode.watched && (episode.watchCount || 1) > 1;
                const fillerInfo = fillerByKey?.get(
                  fillerLookupKey(selectedSeason.seasonNumber + 1, episodeIndex + 1)
                );
                const fillerLabel = fillerInfo?.filler
                  ? ' · Filler'
                  : fillerInfo?.recap
                    ? ' · Recap'
                    : '';
                const fillerDotColor = fillerInfo?.filler
                  ? currentTheme.status.warning
                  : fillerInfo?.recap
                    ? currentTheme.primary
                    : null;
                return (
                  <Tooltip
                    key={episode.id}
                    title={
                      (isRewatched
                        ? t('Episode {n} – Optionen anzeigen', { n: episodeIndex + 1 })
                        : episode.watched
                          ? t('Episode {n} als nicht gesehen markieren', { n: episodeIndex + 1 })
                          : t('Episode {n} als gesehen markieren', { n: episodeIndex + 1 })) +
                      fillerLabel
                    }
                    arrow
                    enterDelay={400}
                    enterTouchDelay={0}
                    leaveTouchDelay={1500}
                  >
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.1 }}
                      whileTap={tapScale}
                      aria-label={
                        (isRewatched
                          ? t('Episode {n} – Optionen anzeigen', { n: episodeIndex + 1 })
                          : episode.watched
                            ? t('Episode {n} als nicht gesehen markieren', { n: episodeIndex + 1 })
                            : t('Episode {n} als gesehen markieren', { n: episodeIndex + 1 })) +
                        fillerLabel
                      }
                      onClick={() => {
                        if (isRewatched) {
                          setShowRewatchDialog({
                            show: true,
                            type: 'episode',
                            item: episode,
                            seasonNumber: selectedSeason.seasonNumber + 1,
                            episodeNumber: episodeIndex + 1,
                          });
                          return;
                        }
                        void handleEpisodeQuickToggle(safeSeasonIndex, episodeIndex);
                      }}
                      className="episode-cell"
                      style={{
                        padding: 0,
                        fontFamily: 'inherit',
                        background: episode.watched
                          ? isRewatched
                            ? `${warningColor}30`
                            : `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.accent} 100%)`
                          : 'rgba(255,255,255,0.1)',
                        border: episode.watched
                          ? isRewatched
                            ? `2px solid ${warningColor}`
                            : 'none'
                          : '1px solid rgba(255,255,255,0.2)',
                        color:
                          episode.watched && !isRewatched
                            ? getOptimalTextColor(currentTheme.primary)
                            : undefined,
                      }}
                    >
                      {episodeIndex + 1}
                      {isRewatched && (
                        <span
                          style={{
                            position: 'absolute',
                            top: '-5px',
                            right: '-6px',
                            background: warningColor,
                            borderRadius: '6px',
                            padding: '0 3px',
                            height: '12px',
                            fontSize: '8px',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: currentTheme.background.default,
                            lineHeight: 1,
                          }}
                        >
                          ×{episode.watchCount}
                        </span>
                      )}
                      {discussionCount > 0 && (
                        <span
                          style={{
                            position: 'absolute',
                            bottom: '-2px',
                            left: '-2px',
                            background: currentTheme.primary,
                            borderRadius: '50%',
                            width: '6px',
                            height: '6px',
                          }}
                        />
                      )}
                      {fillerDotColor && (
                        <span
                          aria-hidden
                          style={{
                            position: 'absolute',
                            top: '-3px',
                            left: '-3px',
                            background: fillerDotColor,
                            borderRadius: '50%',
                            width: '8px',
                            height: '8px',
                            boxShadow: `0 0 0 2px ${currentTheme.background.default}`,
                          }}
                        />
                      )}
                    </motion.button>
                  </Tooltip>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
