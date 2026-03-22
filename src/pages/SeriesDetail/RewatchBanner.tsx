import Repeat from '@mui/icons-material/Repeat';
import { motion } from 'framer-motion';
import { ProgressBar } from '../../components/ui';
import {
  getNextRewatchEpisode,
  getRewatchProgress,
  getRewatchRound,
} from '../../lib/validation/rewatch.utils';

interface RewatchBannerProps {
  series: any;
  warningColor: string;
  currentTheme: any;
  setSelectedSeasonIndex: (i: number) => void;
  setShowRewatchDialog: (d: any) => void;
  handleStopRewatch: () => void;
}

export function RewatchBanner({
  series,
  warningColor,
  currentTheme,
  setSelectedSeasonIndex,
  setShowRewatchDialog,
  handleStopRewatch,
}: RewatchBannerProps) {
  const rewatchRound = getRewatchRound(series);
  const rewatchProgress = getRewatchProgress(series);
  const rewatchPercent =
    rewatchProgress.total > 0
      ? Math.round((rewatchProgress.current / rewatchProgress.total) * 100)
      : 0;
  const nextEp = getNextRewatchEpisode(series);

  return (
    <div
      style={{
        background: `${warningColor}15`,
        border: `1px solid ${warningColor}40`,
        borderRadius: '12px',
        padding: '12px 16px',
        marginBottom: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Repeat style={{ fontSize: '16px', color: warningColor }} />
          <span style={{ fontSize: '15px', fontWeight: 600 }}>Rewatch #{rewatchRound}</span>
        </div>
        <span
          style={{
            fontSize: '13px',
            color: currentTheme.text?.muted || 'rgba(255,255,255,0.5)',
          }}
        >
          {rewatchProgress.current}/{rewatchProgress.total} Episoden
        </span>
      </div>
      <ProgressBar value={rewatchPercent} color={warningColor} toColor={warningColor} height={6} />
      {nextEp && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            const sIdx = series.seasons.findIndex(
              (s: any) => s.seasonNumber === nextEp.seasonNumber
            );
            if (sIdx >= 0) {
              setSelectedSeasonIndex(sIdx);
              setShowRewatchDialog({
                show: true,
                type: 'episode',
                item: series.seasons[sIdx].episodes[nextEp.episodeIndex],
                seasonNumber: nextEp.seasonNumber + 1,
                episodeNumber: nextEp.episodeIndex + 1,
              });
            }
          }}
          style={{
            padding: '8px 14px',
            background: `${warningColor}25`,
            border: `1px solid ${warningColor}60`,
            borderRadius: '8px',
            color: warningColor,
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          Nächste: S{nextEp.seasonNumber + 1} E{nextEp.episodeIndex + 1} — {nextEp.name}
        </motion.button>
      )}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={handleStopRewatch}
        style={{
          padding: '6px 12px',
          background: 'transparent',
          border: `1px solid ${warningColor}40`,
          borderRadius: '8px',
          color: currentTheme.text?.muted || 'rgba(255,255,255,0.5)',
          fontSize: '13px',
          cursor: 'pointer',
          alignSelf: 'flex-end',
        }}
      >
        Rewatch beenden
      </motion.button>
    </div>
  );
}
