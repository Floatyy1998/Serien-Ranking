import { AnimatePresence, motion } from 'framer-motion';
import type { GenreRatingStage as Stage } from '../../../hooks/rating/useGenreRatingStage';
import { GenreRatingDetails } from './GenreRatingDetails';
import { RatingControls } from './RatingControls';

/**
 * Gesamtregler plus aufklappbare Stufe je Genre — die gemeinsame Bewertungs-UI
 * von `QuickRatingSheet` und `RatingQueueSheet`. Den Zustand hält
 * `useGenreRatingStage`, gespeichert wird beim Aufrufer.
 */
export const GenreRatingStage: React.FC<{ stage: Stage }> = ({ stage }) => (
  <>
    <RatingControls value={stage.rating} onChange={stage.setOverall} />

    <AnimatePresence initial={false}>
      {stage.expanded && (
        <motion.div
          key="genre-detail"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{ overflow: 'hidden' }}
        >
          <GenreRatingDetails
            ownGenres={stage.ownGenres}
            otherGenres={stage.otherGenres}
            values={stage.genreValues}
            onChange={stage.setGenre}
            onLevel={stage.level}
            overall={stage.rating}
            differs={stage.differs}
          />
        </motion.div>
      )}
    </AnimatePresence>
  </>
);
