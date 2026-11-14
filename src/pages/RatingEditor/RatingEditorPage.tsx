import { useMemo } from 'react';
import { Delete, Save } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { t } from '../../services/i18n';
import { BackButton, Dialog } from '../../components/ui';
import {
  DetailStage,
  DetailTabs,
  ScoreRow,
  type ScoreItem,
} from '../../components/detail/kit/DetailKit';
import { Snackbar } from '../../components/ui/feedback/Snackbar';
import { tapScale } from '../../lib/motion';
import { getImageUrl, upgradeBackdropUrl } from '../../utils/imageUrl';
import { useRatingEditorData } from './useRatingEditorData';
import { OverallRatingSection } from './OverallRatingSection';
import { GenreRatingSection } from './GenreRatingSection';
import { buildRanking } from './ratingRanking';
import { verdictIndex, verdicts } from './verdicts';
import './RatingEditorPage.css';

const signed = (value: number) =>
  `${value > 0 ? '+' : value < 0 ? '−' : '±'}${Math.abs(value).toFixed(1)}`;

export const RatingEditorPage = () => {
  const {
    item,
    type,
    activeTab,
    setActiveTab,
    overallRating,
    savedRating,
    peers,
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

  const ranking = useMemo(() => buildRanking(peers ?? [], overallRating), [peers, overallRating]);

  if (!item) {
    return (
      <div className="re-page dk">
        <div className="re-missing">
          <BackButton />
          <h1>{t('Nicht gefunden')}</h1>
        </div>
      </div>
    );
  }

  const posterUrl = getImageUrl(item.poster, 'w500');
  const artUrl = item.backdrop ? upgradeBackdropUrl(getImageUrl(item.backdrop, 'w1280', '')) : '';
  const ownGenres = (item.genre?.genres || []).filter((genre) => genre && genre !== 'All');
  const year = (item.release_date || ('first_air_date' in item ? item.first_air_date : '') || '')
    .toString()
    .slice(0, 4);
  const verdict = verdicts[verdictIndex(overallRating)];
  const tmdb = 'vote_average' in item && item.vote_average > 0 ? item.vote_average : 0;
  const hasGenres = Object.keys(genreRatings).length > 0;
  const rated = ranking.total - 1;

  const scores: ScoreItem[] = [];
  if (savedRating > 0) {
    scores.push({ key: 'saved', label: t('Bisher'), value: savedRating.toFixed(1), own: true });
  }
  if (rated > 0) {
    scores.push({
      key: 'average',
      label: t('Dein Schnitt'),
      value: ranking.average.toFixed(1),
      sub: overallRating > 0 ? signed(overallRating - ranking.average) : undefined,
    });
  }
  if (tmdb > 0) {
    scores.push({
      key: 'tmdb',
      label: 'TMDB',
      value: tmdb.toFixed(1),
      sub: overallRating > 0 ? signed(overallRating - tmdb) : undefined,
      tone: '#01b4e4',
    });
  }

  return (
    <div className="re-page dk">
      <div className="re-scroll">
        <DetailStage
          art={artUrl || undefined}
          wash={posterUrl}
          poster={<img src={posterUrl} alt="" />}
          below={
            <>
              <div className="re-score">
                <span className="re-score__num">{overallRating.toFixed(1)}</span>
                <span className="re-score__side">
                  <span className="re-score__verdict">
                    {verdict ? t(verdict.label) : t('Noch nicht bewertet')}
                  </span>
                  <span className="re-score__of">{t('von 10')}</span>
                </span>
              </div>
              <ScoreRow items={scores} />
            </>
          }
        >
          <h1 className="dk-title">{item.title}</h1>
          <div className="dk-meta">
            <span>{type === 'movie' ? t('Film') : t('Serie')}</span>
            {year && <span>{year}</span>}
            {ownGenres.length > 0 && <span>{ownGenres.slice(0, 3).join(', ')}</span>}
          </div>
        </DetailStage>

        {hasGenres && (
          <DetailTabs
            tabs={[
              { key: 'overall', label: t('Gesamtbewertung') },
              { key: 'genre', label: t('Nach Genre') },
            ]}
            active={activeTab}
            onChange={setActiveTab}
            ariaLabel={t('Art der Bewertung')}
          />
        )}

        <div className="re-body">
          <AnimatePresence mode="wait">
            {activeTab === 'overall' ? (
              <OverallRatingSection
                overallRating={overallRating}
                onRatingChange={handleRatingChange}
                ranking={ranking}
                poster={item.poster?.poster}
                title={item.title}
                mediaType={type}
              />
            ) : (
              <GenreRatingSection
                genreRatings={genreRatings}
                onGenreRatingChange={handleGenreRatingChange}
                ownGenres={ownGenres}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="re-actions" data-fab style={{ bottom: '0px' }}>
        <motion.button
          type="button"
          className="re-action re-action--quiet"
          onClick={handleDelete}
          whileTap={tapScale}
          disabled={isSaving}
        >
          <Delete />
          <span>{t('Löschen')}</span>
        </motion.button>
        <motion.button
          type="button"
          className="re-action re-action--primary"
          onClick={handleSave}
          whileTap={tapScale}
          disabled={isSaving}
        >
          <Save />
          <span>{t('Speichern')}</span>
        </motion.button>
      </div>

      <Snackbar open={snackbar.open} message={snackbar.message} />

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
