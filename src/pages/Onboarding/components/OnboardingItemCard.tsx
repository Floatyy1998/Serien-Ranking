import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Add, Close, Star } from '@mui/icons-material';
import { useTheme } from '../../../contexts/ThemeContext';
import type { OnboardingItem } from '../hooks/useOnboardingSearch';

interface Props {
  item: OnboardingItem;
  isAdded: boolean;
  isAdding: boolean;
  onAdd: (item: OnboardingItem) => Promise<boolean>;
  onRemove: (item: OnboardingItem) => void;
  onSeasonSelect?: (item: OnboardingItem, season: number | 'all' | 'none') => void;
}

export const OnboardingItemCard: React.FC<Props> = ({ item, isAdded, isAdding, onAdd, onRemove, onSeasonSelect }) => {
  const { currentTheme } = useTheme();
  const [showModal, setShowModal] = useState(false);
  const [seasonCount, setSeasonCount] = useState<number | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<number | 'all' | 'none'>('none');

  const posterUrl = item.poster_path
    ? `https://image.tmdb.org/t/p/w185${item.poster_path}`
    : null;

  const year = (item.first_air_date || item.release_date || '').slice(0, 4);
  const rating = item.vote_average ? item.vote_average.toFixed(1) : null;
  const displayTitle = item.title || item.name || '';

  const handleAdd = async () => {
    if (isAdded || isAdding) return;
    const success = await onAdd(item);
    if (success && item.type === 'series') {
      // Fetch season count for picker
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/tv/${item.id}?api_key=${import.meta.env.VITE_API_TMDB}&language=de-DE`
        );
        if (res.ok) {
          const data = await res.json();
          setSeasonCount(data.number_of_seasons || 1);
          setShowModal(true);
        }
      } catch { /* ignore */ }
    }
  };

  const handleRemove = () => {
    onRemove(item);
    setShowModal(false);
    setSelectedSeason('none');
  };

  const handleSeasonChoice = (choice: number | 'all' | 'none') => {
    setSelectedSeason(choice);
    onSeasonSelect?.(item, choice);
  };

  const handleOpenModal = () => {
    if (item.type === 'series' && !seasonCount) {
      // Fetch season count if not already loaded
      fetch(
        `https://api.themoviedb.org/3/tv/${item.id}?api_key=${import.meta.env.VITE_API_TMDB}&language=de-DE`
      )
        .then(r => r.json())
        .then(data => {
          setSeasonCount(data.number_of_seasons || 1);
          setShowModal(true);
        })
        .catch(() => {});
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          position: 'relative',
          background: currentTheme.background.surface,
          borderRadius: 14,
          overflow: 'hidden',
          border: `1px solid ${isAdded ? currentTheme.primary + '40' : currentTheme.border.default}`,
        }}
      >
        {/* Loading overlay */}
        {isAdding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{
              width: 32,
              height: 32,
              border: `3px solid ${currentTheme.primary}40`,
              borderTop: `3px solid ${currentTheme.primary}`,
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}/>
          </motion.div>
        )}

        {/* Poster */}
        <div style={{ position: 'relative', paddingTop: '150%', background: `${currentTheme.primary}10` }}>
          {posterUrl && (
            <img
              src={posterUrl}
              alt={displayTitle}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          )}

          {/* Add/Remove button */}
          <button
            onClick={isAdded ? handleRemove : handleAdd}
            disabled={isAdding}
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              width: 32,
              height: 32,
              borderRadius: 8,
              border: 'none',
              background: isAdded
                ? `${currentTheme.status.success}dd`
                : `linear-gradient(135deg, ${currentTheme.primary}, #a855f7)`,
              color: 'white',
              cursor: isAdding ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isAdding ? 0.5 : 1,
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            {isAdded ? <Close style={{ fontSize: 18 }} /> : <Add style={{ fontSize: 20 }} />}
          </button>

          {/* Type badge */}
          <div
            style={{
              position: 'absolute',
              bottom: 6,
              left: 6,
              fontSize: 10,
              fontWeight: 600,
              color: 'white',
              background: item.type === 'series' ? `${currentTheme.primary}dd` : `${currentTheme.status.warning}dd`,
              padding: '3px 8px',
              borderRadius: 6,
            }}
          >
            {item.type === 'series' ? 'Serie' : 'Film'}
          </div>
        </div>

        {/* Info */}
        <div style={{ padding: '8px 10px' }}>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              fontWeight: 600,
              color: currentTheme.text.primary,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.3,
            }}
          >
            {displayTitle}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            {year && (
              <span style={{ fontSize: 11, color: currentTheme.text.muted }}>{year}</span>
            )}
            {rating && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 11, color: currentTheme.text.muted }}>
                <Star style={{ fontSize: 11, color: '#fbbf24' }} />
                {rating}
              </span>
            )}
          </div>
        </div>

        {/* Show picker button for added series */}
        {isAdded && item.type === 'series' && (
          <button
            onClick={handleOpenModal}
            style={{
              width: '100%',
              padding: '8px',
              background: `${currentTheme.primary}10`,
              border: 'none',
              borderTop: `1px solid ${currentTheme.border.default}`,
              color: currentTheme.primary,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {selectedSeason === 'none' ? 'Watchstand setzen' : selectedSeason === 'all' ? 'Alles gesehen' : `Bei S${selectedSeason}`}
          </button>
        )}
      </motion.div>

      {/* Season picker modal */}
      <AnimatePresence>
        {showModal && seasonCount && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.7)',
                zIndex: 9998,
              }}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 9999,
                background: currentTheme.background.surface,
                borderRadius: 20,
                padding: 24,
                minWidth: 300,
                maxWidth: 'calc(100vw - 40px)',
                maxHeight: 'calc(100vh - 40px)',
                overflow: 'auto',
                border: `1px solid ${currentTheme.border.default}`,
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: currentTheme.text.primary }}>
                    {displayTitle}
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: currentTheme.text.secondary }}>
                    Wo bist du bei dieser Serie?
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: currentTheme.text.muted,
                    fontSize: 24,
                    cursor: 'pointer',
                    padding: 0,
                    lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Season chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <SeasonChip
                  label="Nicht angefangen"
                  selected={selectedSeason === 'none'}
                  onClick={() => handleSeasonChoice('none')}
                  theme={currentTheme}
                />
                {Array.from({ length: seasonCount }, (_, i) => i + 1).map(s => (
                  <SeasonChip
                    key={s}
                    label={`Staffel ${s}`}
                    selected={selectedSeason === s}
                    onClick={() => handleSeasonChoice(s)}
                    theme={currentTheme}
                  />
                ))}
                <SeasonChip
                  label="Alles gesehen"
                  selected={selectedSeason === 'all'}
                  onClick={() => handleSeasonChoice('all')}
                  theme={currentTheme}
                />
              </div>

              {/* Done button */}
              <button
                onClick={() => setShowModal(false)}
                style={{
                  width: '100%',
                  marginTop: 20,
                  padding: '12px',
                  borderRadius: 12,
                  border: 'none',
                  background: `linear-gradient(135deg, ${currentTheme.primary}, #a855f7)`,
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Fertig
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

const SeasonChip: React.FC<{
  label: string;
  selected: boolean;
  onClick: () => void;
  theme: ReturnType<typeof useTheme>['currentTheme'];
}> = ({ label, selected, onClick, theme }) => (
  <button
    onClick={onClick}
    style={{
      padding: '10px 16px',
      borderRadius: 12,
      border: `2px solid ${selected ? theme.primary : theme.border.default}`,
      background: selected ? `${theme.primary}20` : 'transparent',
      color: selected ? theme.primary : theme.text.secondary,
      fontSize: 13,
      fontWeight: selected ? 600 : 400,
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      transition: 'all 0.15s ease',
    }}
  >
    {selected && '✓ '}{label}
  </button>
);
