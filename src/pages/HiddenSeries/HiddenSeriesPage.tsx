import { Visibility } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSeriesList } from '../../contexts/OptimizedSeriesListProvider';
import { useTheme } from '../../contexts/ThemeContext';
import { PageHeader, PageLayout } from '../../components/ui';
import { getImageUrl } from '../../utils/imageUrl';

export const HiddenSeriesPage: React.FC = () => {
  const navigate = useNavigate();
  const { hiddenSeriesList, toggleHideSeries } = useSeriesList();
  const { currentTheme } = useTheme();

  const handleUnhide = async (nmr: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleHideSeries(nmr, false);
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
    <PageLayout style={{ height: '100vh', overflowY: 'auto', overflowX: 'hidden', color: currentTheme.text.primary }}>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <PageHeader
          title="Pausiert"
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
                  background: `linear-gradient(135deg, ${currentTheme.primary}20, #8b5cf620)`,
                  border: `1px solid ${currentTheme.primary}40`,
                  fontSize: '13px',
                  fontWeight: 600,
                  color: currentTheme.primary,
                }}
              >
                {hiddenSeriesList.length} {hiddenSeriesList.length === 1 ? 'Serie' : 'Serien'}
              </motion.div>
            ) : undefined
          }
        />

        {/* Empty State */}
        {hiddenSeriesList.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 20px',
              textAlign: 'center',
            }}
          >
            <motion.div
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50px',
                background: `linear-gradient(135deg, ${currentTheme.primary}20, #8b5cf620)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px',
              }}
            >
              <Visibility style={{ fontSize: '48px', color: currentTheme.primary }} />
            </motion.div>
            <h2 style={{
              margin: '0 0 8px',
              fontSize: '20px',
              fontWeight: 700,
            }}>
              Alles aktiv
            </h2>
            <p style={{
              margin: 0,
              color: currentTheme.text.muted,
              fontSize: '15px',
              maxWidth: '280px',
              lineHeight: 1.5,
            }}>
              Du schaust gerade alle deine Serien. Serien, die du nicht weiterschaust, erscheinen hier.
            </p>
          </motion.div>
        )}

        {/* Series List */}
        <div style={{ padding: '0 20px 120px' }}>
          <AnimatePresence mode="popLayout">
            {seriesWithStats.map(({ series, watchedEpisodes, totalEpisodes }, index) => {
              const progress = totalEpisodes > 0 ? Math.round((watchedEpisodes / totalEpisodes) * 100) : 0;

              return (
                <motion.div
                  key={series.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, height: 0, marginBottom: 0, overflow: 'hidden' }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  onClick={() => navigate(`/series/${series.id}`)}
                  style={{
                    display: 'flex',
                    gap: '14px',
                    padding: '14px',
                    background: currentTheme.background.surface,
                    borderRadius: '20px',
                    marginBottom: '12px',
                    cursor: 'pointer',
                    border: `1px solid ${currentTheme.border.default}`,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Poster */}
                  <div
                    style={{
                      width: '64px',
                      minWidth: '64px',
                      aspectRatio: '2/3',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    }}
                  >
                    <img
                      src={getImageUrl(series.poster?.poster, 'w342', '')}
                      alt={series.title}
                      loading="lazy"
                      decoding="async"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.opacity = '0';
                      }}
                    />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '6px' }}>
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
                    <span style={{ fontSize: '12px', color: currentTheme.text.muted }}>
                      {watchedEpisodes}/{totalEpisodes} gesehen · {totalEpisodes - watchedEpisodes} offen
                    </span>
                    {/* Progress bar */}
                    <div style={{
                      height: '4px',
                      borderRadius: '2px',
                      background: `${currentTheme.text.muted}15`,
                      overflow: 'hidden',
                    }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.6, delay: index * 0.08, ease: 'easeOut' }}
                        style={{
                          height: '100%',
                          borderRadius: '2px',
                          background: `linear-gradient(90deg, ${currentTheme.primary}, #8b5cf6)`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Unhide button */}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => handleUnhide(series.nmr, e)}
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
                      fontSize: '12px',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    <Visibility style={{ fontSize: '16px' }} />
                    Weiter
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
