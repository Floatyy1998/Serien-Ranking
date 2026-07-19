import { Delete, Save, Star } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { t } from '../../services/i18n';
import { BackButton, Dialog } from '../../components/ui';
import { useRatingEditorData } from './useRatingEditorData';
import { OverallRatingSection } from './OverallRatingSection';
import { GenreRatingSection } from './GenreRatingSection';
import { RatingSnackbar } from './RatingSnackbar';
import './RatingEditorPage.css';
import { tapScale } from '../../lib/motion';

export const RatingEditorPage = () => {
  const { currentTheme } = useTheme();
  const {
    item,
    activeTab,
    setActiveTab,
    overallRating,
    genreRatings,
    isSaving,
    snackbar,
    deleteConfirmOpen,
    handleRatingChange,
    handleGenreRatingChange,
    handleSave,
    handleDelete,
    confirmDelete,
    cancelDelete,
  } = useRatingEditorData();

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
          <h1>{t('Nicht gefunden')}</h1>
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
          {t('Gesamtbewertung')}
        </button>
        {Object.keys(genreRatings).length > 0 && (
          <button
            className={`rate-tab-btn ${activeTab === 'genre' ? 'active' : ''}`}
            onClick={() => setActiveTab('genre')}
          >
            {t('Genres')}
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
          whileTap={tapScale}
          disabled={isSaving}
        >
          <Delete />
          <span>{t('Löschen')}</span>
        </motion.button>

        <motion.button
          className="rate-action-btn save"
          onClick={handleSave}
          whileTap={tapScale}
          disabled={isSaving}
        >
          <Save />
          <span>{t('Speichern')}</span>
        </motion.button>
      </div>

      {/* Snackbar */}
      <RatingSnackbar open={snackbar.open} message={snackbar.message} />

      {/* Delete confirmation */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={cancelDelete}
        title={t('Bewertung löschen')}
        message={t('Bewertung für "{title}" wirklich löschen?', { title: item.title ?? '' })}
        type="warning"
        actions={[
          { label: t('Abbrechen'), onClick: cancelDelete, variant: 'secondary' },
          { label: t('Löschen'), onClick: confirmDelete, variant: 'danger' },
        ]}
      />
    </div>
  );
};
