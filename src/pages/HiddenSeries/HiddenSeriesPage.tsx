import { Visibility } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSeriesList } from '../../contexts/SeriesListContext';
import { useTheme } from '../../contexts/ThemeContext';
import { PageHeader, PageLayout } from '../../components/ui';
import { getImageUrl } from '../../utils/imageUrl';
import { t } from '../../services/i18n';
import { tapScaleTight } from '../../lib/motion';
import './HiddenSeriesPage.css';

// Static inline styles hoisted out of render (no per-render allocation)
const CONTENT_WRAPPER_STYLE: React.CSSProperties = { position: 'relative', zIndex: 1 };
const EMPTY_STATE_STYLE: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '60px 20px',
  textAlign: 'center',
};
const EMPTY_TITLE_STYLE: React.CSSProperties = {
  margin: '0 0 8px',
  fontSize: '20px',
  fontWeight: 700,
  fontFamily: 'var(--font-display)',
};
const LIST_CONTAINER_STYLE: React.CSSProperties = { padding: '0 20px 120px' };
const POSTER_WRAPPER_STYLE: React.CSSProperties = {
  width: '64px',
  minWidth: '64px',
  aspectRatio: '2/3',
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
};
const POSTER_IMG_STYLE: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};
const ITEM_CONTENT_STYLE: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  gap: '6px',
};
const UNHIDE_ICON_STYLE: React.CSSProperties = { fontSize: '16px' };

export const HiddenSeriesPage: React.FC = () => {
  const navigate = useNavigate();
  const { hiddenSeriesList, toggleHideSeries } = useSeriesList();
  const { currentTheme } = useTheme();

  const handleUnhide = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleHideSeries(id, false);
  };

  const seriesWithStats = useMemo(() => {
    return hiddenSeriesList.map((series) => {
      let watchedEpisodes = 0;
      let totalEpisodes = 0;
      series.seasons?.forEach((season) => {
        season.episodes?.forEach((ep) => {
          totalEpisodes++;
          if (ep.watched) watchedEpisodes++;
        });
      });
      return { series, watchedEpisodes, totalEpisodes };
    });
  }, [hiddenSeriesList]);

  return (
    <PageLayout
      style={{
        height: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        color: currentTheme.text.primary,
      }}
    >
      <div style={CONTENT_WRAPPER_STYLE}>
        <PageHeader
          title={t('Pausiert')}
          gradientFrom={currentTheme.text.primary}
          gradientTo={currentTheme.text.secondary}
          sticky={false}
          actions={
            hiddenSeriesList.length > 0 ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  background: `linear-gradient(135deg, ${currentTheme.primary}20, ${currentTheme.accent}20)`,
                  border: `1px solid ${currentTheme.primary}40`,
                  fontSize: '14px',
                  fontWeight: 600,
                  color: currentTheme.primary,
                }}
              >
                {hiddenSeriesList.length === 1
                  ? t('1 Serie')
                  : t('{n} Serien', { n: hiddenSeriesList.length })}
              </motion.div>
            ) : undefined
          }
        />

        {/* Empty State */}
        {hiddenSeriesList.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={EMPTY_STATE_STYLE}
          >
            <motion.div
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50px',
                background: `linear-gradient(135deg, ${currentTheme.primary}20, ${currentTheme.accent}20)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px',
              }}
            >
              <Visibility style={{ fontSize: '48px', color: currentTheme.primary }} />
            </motion.div>
            <h2 style={EMPTY_TITLE_STYLE}>{t('Alles aktiv')}</h2>
            <p
              style={{
                margin: 0,
                color: currentTheme.text.secondary,
                fontSize: '15px',
                maxWidth: '280px',
                lineHeight: 1.5,
              }}
            >
              {t(
                'Du schaust gerade alle deine Serien. Serien, die du nicht weiterschaust, erscheinen hier.'
              )}
            </p>
          </motion.div>
        )}

        {/* Series List */}
        <div style={LIST_CONTAINER_STYLE}>
          <AnimatePresence mode="popLayout">
            {seriesWithStats.map(({ series, watchedEpisodes, totalEpisodes }, index) => {
              const progress =
                totalEpisodes > 0 ? Math.round((watchedEpisodes / totalEpisodes) * 100) : 0;

              return (
                <motion.div
                  key={series.id}
                  className="hidden-series-card"
                  role="button"
                  tabIndex={0}
                  aria-label={t('{title} öffnen', { title: series.title })}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, height: 0, marginBottom: 0, overflow: 'hidden' }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  onClick={() => {
                    navigate(`/series/${series.id}`);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/series/${series.id}`);
                    }
                  }}
                  style={{
                    // Native virtualization: skip layout/paint of offscreen rows
                    contentVisibility: 'auto',
                    containIntrinsicBlockSize: 'auto 124px',
                    display: 'flex',
                    gap: '14px',
                    padding: '14px',
                    background: currentTheme.background.surface,
                    borderRadius: '20px',
                    marginBottom: '12px',
                    cursor: 'pointer',
                    border: `1px solid ${currentTheme.border.default}`,
                    boxShadow:
                      '0 4px 16px -4px rgba(0, 0, 0, 0.4), 0 2px 6px -2px rgba(0, 0, 0, 0.3)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Poster */}
                  <div style={POSTER_WRAPPER_STYLE}>
                    <img
                      src={getImageUrl(series.poster?.poster, 'w342')}
                      alt={series.title}
                      loading="lazy"
                      decoding="async"
                      style={POSTER_IMG_STYLE}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.opacity = '0';
                      }}
                    />
                  </div>

                  {/* Content */}
                  <div style={ITEM_CONTENT_STYLE}>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: '15px',
                        fontWeight: 700,
                        color: currentTheme.text.primary,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {series.title}
                    </h3>
                    <span style={{ fontSize: '13px', color: currentTheme.text.muted }}>
                      {t('{watched}/{total} gesehen · {open} offen', {
                        watched: watchedEpisodes,
                        total: totalEpisodes,
                        open: totalEpisodes - watchedEpisodes,
                      })}
                    </span>
                    {/* Progress bar */}
                    <div
                      style={{
                        height: '4px',
                        borderRadius: '2px',
                        background: `${currentTheme.text.muted}15`,
                        overflow: 'hidden',
                      }}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.6, delay: index * 0.08, ease: 'easeOut' }}
                        style={{
                          height: '100%',
                          borderRadius: '2px',
                          background: `linear-gradient(90deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Unhide button */}
                  <motion.button
                    className="hidden-series-unhide"
                    aria-label={t('{title} weiterschauen', { title: series.title })}
                    whileTap={tapScaleTight}
                    onClick={(e) => handleUnhide(series.id, e)}
                    style={{
                      alignSelf: 'center',
                      padding: '10px 14px',
                      background: `linear-gradient(135deg, ${currentTheme.primary}15, ${currentTheme.primary}08)`,
                      border: `1px solid ${currentTheme.primary}35`,
                      borderRadius: '12px',
                      color: currentTheme.primary,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '13px',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    <Visibility style={UNHIDE_ICON_STYLE} />
                    {t('Weiter')}
                  </motion.button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </PageLayout>
  );
};
