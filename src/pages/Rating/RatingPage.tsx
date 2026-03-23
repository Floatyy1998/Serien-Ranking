import { Delete, Save, Star } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContextDef';
import { BackButton } from '../../components/ui';
import { useRatingData } from './useRatingData';
import { OverallRatingSection } from './OverallRatingSection';
import { GenreRatingSection } from './GenreRatingSection';
import { RatingSnackbar } from './RatingSnackbar';
import './RatingPage.css';

export const RatingPage = () => {
  const { currentTheme } = useTheme();
  const {
    item,
    activeTab,
    setActiveTab,
    overallRating,
    genreRatings,
    isSaving,
    snackbar,
    handleRatingChange,
    handleGenreRatingChange,
    handleSave,
    handleDelete,
  } = useRatingData();

  if (!item) {
    return (
      <div className="rate-page">
        <div
          className="rate-header"
          style={{
            background: `linear-gradient(180deg, ${currentTheme.primary}33 0%, transparent 100%)`,
          }}
        >
          <BackButton />
          <h1>Nicht gefunden</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="rate-page">
      {/* Header */}
      <div
        className="rate-header"
        style={{
          background: `linear-gradient(180deg, ${currentTheme.primary}33 0%, transparent 100%)`,
        }}
      >
        <BackButton />
        <div className="rate-header-info">
          <h1 className="rate-header-title">{item.title}</h1>
          <div className="rate-badge">
            <Star style={{ fontSize: 16 }} />
            <span>{overallRating.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="rate-tabs">
        <button
          className={`rate-tab-btn ${activeTab === 'overall' ? 'active' : ''}`}
          onClick={() => setActiveTab('overall')}
        >
          Gesamtbewertung
        </button>
        {Object.keys(genreRatings).length > 0 && (
          <button
            className={`rate-tab-btn ${activeTab === 'genre' ? 'active' : ''}`}
            onClick={() => setActiveTab('genre')}
          >
            Genres
          </button>
        )}
      </div>

      {/* Rating Content */}
      <div className="rate-content">
        <AnimatePresence mode="wait">
          {activeTab === 'overall' ? (
            <OverallRatingSection
              overallRating={overallRating}
              onRatingChange={handleRatingChange}
            />
          ) : (
            <GenreRatingSection
              genreRatings={genreRatings}
              onGenreRatingChange={handleGenreRatingChange}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Actions */}
      <div className="rate-actions">
        <motion.button
          className="rate-action-btn delete"
          onClick={handleDelete}
          whileTap={{ scale: 0.95 }}
          disabled={isSaving}
        >
          <Delete />
          <span>Löschen</span>
        </motion.button>

        <motion.button
          className="rate-action-btn save"
          onClick={handleSave}
          whileTap={{ scale: 0.95 }}
          disabled={isSaving}
        >
          <Save />
          <span>Speichern</span>
        </motion.button>
      </div>

      {/* Snackbar */}
      <RatingSnackbar open={snackbar.open} message={snackbar.message} />
    </div>
  );
};
