import Check from '@mui/icons-material/Check';
import GridView from '@mui/icons-material/GridView';
import List from '@mui/icons-material/List';
import Repeat from '@mui/icons-material/Repeat';
import { motion, type PanInfo } from 'framer-motion';
import { useCallback, useState } from 'react';
import type { useNavigate } from 'react-router-dom';
import {
  getImplicitRewatchRound,
  hasActiveRewatch,
  hasAnySeasonFullyWatched,
} from '../../lib/validation/rewatch.utils';
import type { DynamicTheme } from '../../theme/dynamicTheme';
import type { Series } from '../../types/Series';
import { RewatchBanner } from './RewatchBanner';
import { SeasonTabs } from './SeasonTabs';
import type { useSeriesData } from './useSeriesData';

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
  navigate: ReturnType<typeof useNavigate>;
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
  navigate,
}: SeasonsSectionProps) {
  const [episodeView, setEpisodeView] = useState<'list' | 'grid'>('list');
  const selectedSeason = series.seasons[selectedSeasonIndex];

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
          <span style={{ color: currentTheme.text.primary }}>Staffeln</span>
        </h3>
        <motion.button
          whileTap={{ scale: 0.95 }}
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
          Alle verwalten
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
          whileTap={{ scale: 0.95 }}
          onClick={() => handleStartRewatch()}
          style={{
            width: '100%',
            padding: '12px',
            background: `${warningColor}20`,
            border: `1px solid ${warningColor}50`,
            borderRadius: '10px',
            color: warningColor,
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '12px',
          }}
        >
          <Repeat style={{ fontSize: '18px' }} />
          Rewatch starten
        </motion.button>
      )}

      {/* Implicit Rewatch Detection */}
      {(() => {
        const implicitRound = getImplicitRewatchRound(series);
        if (implicitRound === 0) return null;
        return (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleStartRewatch(true)}
            style={{
              width: '100%',
              padding: '12px',
              background: `${warningColor}20`,
              border: `1px solid ${warningColor}50`,
              borderRadius: '10px',
              color: warningColor,
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '12px',
            }}
          >
            <Repeat style={{ fontSize: '18px' }} />
            Rewatch fortsetzen
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
                Staffel {selectedSeason.seasonNumber + 1}
              </div>
              <div style={{ fontSize: '13px', color: currentTheme.text.muted }}>
                {watchedEpisodes}/{totalEpisodes} Episoden
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* View toggle */}
              <button
                onClick={() => setEpisodeView(episodeView === 'list' ? 'grid' : 'list')}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '8px',
                  padding: '4px',
                  color: currentTheme.text.secondary,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title={episodeView === 'list' ? 'Grid-Ansicht' : 'Listen-Ansicht'}
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
                return (
                  <div
                    key={episode.id}
                    onClick={() => {
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
                    {/* Number / check indicator */}
                    <div
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
                      }}
                    >
                      {episode.watched ? <Check style={{ fontSize: '15px' }} /> : episodeIndex + 1}
                    </div>

                    {/* Episode info */}
                    <div className="episode-list-info">
                      <div className="episode-list-title">Episode {episodeIndex + 1}</div>
                      {episode.name && <div className="episode-list-subtitle">{episode.name}</div>}
                    </div>

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
                return (
                  <motion.div
                    key={episode.id}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
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
                    }}
                    className="episode-cell"
                    style={{
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
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
