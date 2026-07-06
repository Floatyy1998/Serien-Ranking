import { useState, type CSSProperties } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import type { Series } from '../../types/Series';
import { BottomSheet } from './BottomSheet';

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

  const seasons = !series?.seasons
    ? []
    : Array.isArray(series.seasons)
      ? series.seasons
      : (Object.values(series.seasons) as typeof series.seasons);

  const currentSeasonEpisodes = (() => {
    const season = seasons[selectedSeason];
    if (!season?.episodes) return [];
    return Array.isArray(season.episodes)
      ? season.episodes
      : (Object.values(season.episodes) as typeof season.episodes);
  })();

  // Calculate how many episodes will be marked
  const episodesToMark = (() => {
    const getEpisodes = (season: (typeof seasons)[number]) => {
      if (!season?.episodes) return [];
      return Array.isArray(season.episodes)
        ? season.episodes
        : (Object.values(season.episodes) as typeof season.episodes);
    };

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
  })();

  // Preview text
  const previewText = (() => {
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
  })();

  const selectStyle: CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    background: 'var(--glass-medium)',
    border: '1px solid var(--glass-border-light)',
    borderRadius: 'var(--radius-lg)',
    color: currentTheme.text.primary,
    fontSize: '15px',
    outline: 'none',
    cursor: 'pointer',
    transition: 'border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  const labelStyle: CSSProperties = {
    fontSize: 'var(--text-sm)',
    fontWeight: 600,
    color: currentTheme.text.muted,
    marginBottom: '6px',
    display: 'block',
  };

  return (
    <BottomSheet
      isOpen={open}
      onClose={onClose}
      maxWidth="400px"
      ariaLabel="Aktuellen Stand wählen"
    >
      <div style={{ padding: '8px 24px 24px' }}>
        <h3
          style={{
            fontSize: '18px',
            fontWeight: 800,
            fontFamily: 'var(--font-display)',
            margin: '0 0 20px 0',
            color: currentTheme.text.primary,
          }}
        >
          Ich bin bei...
        </h3>

        {/* Season Picker */}
        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>Staffel</label>
          <select
            value={selectedSeason}
            onChange={(e) => {
              setSelectedSeason(Number(e.target.value));
              setSelectedEpisode(0);
            }}
            style={selectStyle}
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
          <label style={labelStyle}>Episode</label>
          <select
            value={selectedEpisode}
            onChange={(e) => setSelectedEpisode(Number(e.target.value))}
            style={selectStyle}
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
            background: currentTheme.background.surface,
            borderRadius: 'var(--radius-lg)',
            marginBottom: '20px',
            border: `1px solid ${currentTheme.border.default}`,
          }}
        >
          <p
            style={{
              fontSize: 'var(--text-base)',
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
              background: 'var(--glass-medium)',
              border: '1px solid var(--glass-border-light)',
              borderRadius: 'var(--radius-lg)',
              color: currentTheme.text.primary,
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              backdropFilter: 'var(--blur-sm)',
              WebkitBackdropFilter: 'var(--blur-sm)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
                  : 'var(--glass-medium)',
              border: 'none',
              borderRadius: 'var(--radius-lg)',
              color: episodesToMark > 0 ? 'white' : currentTheme.text.muted,
              fontSize: '15px',
              fontWeight: 600,
              cursor: episodesToMark > 0 ? 'pointer' : 'default',
              opacity: episodesToMark > 0 ? 1 : 0.5,
            }}
          >
            Markieren
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};
