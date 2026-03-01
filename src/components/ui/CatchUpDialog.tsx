import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { Series } from '../../types/Series';

interface CatchUpDialogProps {
  open: boolean;
  onClose: () => void;
  series: Series;
  onConfirm: (seasonIndex: number, episodeIndex: number) => void;
}

export const CatchUpDialog = ({ open, onClose, series, onConfirm }: CatchUpDialogProps) => {
  const { currentTheme } = useTheme();
  const [selectedSeason, setSelectedSeason] = useState(0);
  const [selectedEpisode, setSelectedEpisode] = useState(0);

  const seasons = useMemo(() => {
    if (!series?.seasons) return [];
    return Array.isArray(series.seasons)
      ? series.seasons
      : (Object.values(series.seasons) as typeof series.seasons);
  }, [series]);

  const currentSeasonEpisodes = useMemo(() => {
    const season = seasons[selectedSeason];
    if (!season?.episodes) return [];
    return Array.isArray(season.episodes)
      ? season.episodes
      : (Object.values(season.episodes) as typeof season.episodes);
  }, [seasons, selectedSeason]);

  const getEpisodes = (season: (typeof seasons)[number]) => {
    if (!season?.episodes) return [];
    return Array.isArray(season.episodes)
      ? season.episodes
      : (Object.values(season.episodes) as typeof season.episodes);
  };

  // Calculate how many episodes will be marked
  const episodesToMark = useMemo(() => {
    let count = 0;
    for (let sIdx = 0; sIdx < seasons.length; sIdx++) {
      const eps = getEpisodes(seasons[sIdx]);
      if (sIdx < selectedSeason) {
        count += eps.filter((ep) => !ep.watched).length;
      } else if (sIdx === selectedSeason) {
        for (let eIdx = 0; eIdx < selectedEpisode; eIdx++) {
          if (eps[eIdx] && !eps[eIdx].watched) count++;
        }
      }
    }
    return count;
  }, [seasons, selectedSeason, selectedEpisode]);

  // Preview text
  const previewText = useMemo(() => {
    if (episodesToMark === 0) return 'Keine neuen Episoden zu markieren';
    const parts: string[] = [];
    if (selectedSeason > 0) {
      parts.push(selectedSeason === 1 ? 'S1 komplett' : `S1-S${selectedSeason} komplett`);
    }
    if (selectedEpisode > 0) {
      parts.push(
        selectedEpisode === 1
          ? `S${selectedSeason + 1}E01`
          : `S${selectedSeason + 1}E01-E${String(selectedEpisode).padStart(2, '0')}`
      );
    }
    return `Markiert ${episodesToMark} Episoden als gesehen (${parts.join(' + ')})`;
  }, [episodesToMark, selectedSeason, selectedEpisode]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: currentTheme.background.card || currentTheme.background.default,
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '24px',
          width: '100%',
          maxWidth: '360px',
        }}
      >
        <h3
          style={{
            fontSize: '18px',
            fontWeight: 700,
            margin: '0 0 20px 0',
            color: currentTheme.text.primary,
          }}
        >
          Ich bin bei...
        </h3>

        {/* Season Picker */}
        <div style={{ marginBottom: '14px' }}>
          <label
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: currentTheme.text.muted,
              marginBottom: '6px',
              display: 'block',
            }}
          >
            Staffel
          </label>
          <select
            value={selectedSeason}
            onChange={(e) => {
              setSelectedSeason(Number(e.target.value));
              setSelectedEpisode(0);
            }}
            style={{
              width: '100%',
              padding: '10px 12px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              color: currentTheme.text.primary,
              fontSize: '14px',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {seasons.map((season, idx) => (
              <option key={idx} value={idx}>
                Staffel {season.seasonNumber + 1} ({season.episodes?.length || 0} Episoden)
              </option>
            ))}
          </select>
        </div>

        {/* Episode Picker */}
        <div style={{ marginBottom: '18px' }}>
          <label
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: currentTheme.text.muted,
              marginBottom: '6px',
              display: 'block',
            }}
          >
            Episode
          </label>
          <select
            value={selectedEpisode}
            onChange={(e) => setSelectedEpisode(Number(e.target.value))}
            style={{
              width: '100%',
              padding: '10px 12px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              color: currentTheme.text.primary,
              fontSize: '14px',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {currentSeasonEpisodes.map((ep, idx) => (
              <option key={idx} value={idx + 1}>
                Episode {idx + 1}
                {ep.name ? ` - ${ep.name}` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Preview */}
        <div
          style={{
            padding: '12px',
            background: `${currentTheme.primary}15`,
            borderRadius: '10px',
            marginBottom: '20px',
            border: `1px solid ${currentTheme.primary}30`,
          }}
        >
          <p
            style={{
              fontSize: '13px',
              color: currentTheme.text.secondary,
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {previewText}
          </p>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              color: currentTheme.text.primary,
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Abbrechen
          </button>
          <button
            onClick={() => {
              if (episodesToMark > 0) {
                onConfirm(selectedSeason, selectedEpisode);
                onClose();
              }
            }}
            disabled={episodesToMark === 0}
            style={{
              flex: 1,
              padding: '12px',
              background:
                episodesToMark > 0
                  ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.primary}cc)`
                  : 'rgba(255, 255, 255, 0.05)',
              border: 'none',
              borderRadius: '10px',
              color: episodesToMark > 0 ? 'white' : currentTheme.text.muted,
              fontSize: '14px',
              fontWeight: 600,
              cursor: episodesToMark > 0 ? 'pointer' : 'default',
              opacity: episodesToMark > 0 ? 1 : 0.5,
            }}
          >
            Markieren
          </button>
        </div>
      </motion.div>
    </div>
  );
};
