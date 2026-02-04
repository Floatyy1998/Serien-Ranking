import { AutoAwesome, OpenInNew, Star, TrendingUp } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w185';

interface RecommendationsTabProps {
  recommendations: Array<{
    series: {
      id: number;
      title: string;
      poster: string | null;
      voteAverage: number;
    };
    actors: Array<{
      id: number;
      name: string;
    }>;
  }>;
  loadingRecommendations: boolean;
}

export const RecommendationsTab = ({ recommendations, loadingRecommendations }: RecommendationsTabProps) => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();

  return (
    <motion.div
      key="recommendations"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      style={{ padding: '0 20px 100px', position: 'relative', zIndex: 5 }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '20px',
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          background: `linear-gradient(135deg, ${currentTheme.primary}20, #8b5cf620)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <TrendingUp style={{ color: currentTheme.primary, fontSize: '22px' }} />
        </div>
        <h2 style={{
          margin: 0,
          fontSize: '18px',
          fontWeight: 700,
          color: currentTheme.text.primary,
        }}>
          Basierend auf deinen Lieblings-Schauspielern
        </h2>
      </div>

      {loadingRecommendations ? (
        <LoadingSpinner size={50} text="Lade Empfehlungen..." />
      ) : recommendations.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: currentTheme.background.surface,
            borderRadius: '20px',
            border: `1px solid ${currentTheme.border.default}`,
          }}
        >
          <AutoAwesome style={{ fontSize: '48px', color: currentTheme.text.muted, marginBottom: '16px' }} />
          <p style={{ color: currentTheme.text.muted, fontSize: '15px', margin: 0 }}>
            Keine Empfehlungen gefunden
          </p>
        </motion.div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {recommendations.map((rec, index) => (
            <motion.div
              key={rec.series.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/series/${rec.series.id}`)}
              style={{
                display: 'flex',
                gap: '14px',
                padding: '14px',
                background: currentTheme.background.card,
                borderRadius: '16px',
                cursor: 'pointer',
                border: `1px solid ${currentTheme.border.default}`,
                boxShadow: `0 4px 12px ${currentTheme.background.default}40`,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Subtle gradient overlay */}
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '100px',
                height: '100%',
                background: `linear-gradient(90deg, transparent, ${currentTheme.primary}05)`,
                pointerEvents: 'none',
              }} />

              <div style={{
                width: '65px',
                height: '95px',
                borderRadius: '10px',
                background: rec.series.poster
                  ? `url(${TMDB_IMAGE_BASE}${rec.series.poster})`
                  : `linear-gradient(135deg, ${currentTheme.primary}40, #8b5cf640)`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                flexShrink: 0,
                boxShadow: `0 4px 12px ${currentTheme.background.default}60`,
              }} />

              <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: '15px',
                    fontWeight: 700,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: currentTheme.text.primary,
                  }}>
                    {rec.series.title}
                  </h3>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.2), rgba(255, 152, 0, 0.2))',
                    padding: '3px 8px',
                    borderRadius: '8px',
                    flexShrink: 0,
                  }}>
                    <Star style={{ fontSize: '12px', color: '#ffc107' }} />
                    <span style={{ fontSize: '12px', color: '#ffc107', fontWeight: 600 }}>
                      {rec.series.voteAverage.toFixed(1)}
                    </span>
                  </div>
                </div>

                <p style={{
                  margin: '0 0 10px 0',
                  fontSize: '13px',
                  color: currentTheme.primary,
                  fontWeight: 600,
                }}>
                  {rec.actors.length} deiner Schauspieler
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {rec.actors.slice(0, 3).map(actor => (
                    <span
                      key={actor.id}
                      style={{
                        fontSize: '11px',
                        background: `linear-gradient(135deg, ${currentTheme.background.surfaceHover}, ${currentTheme.background.surface})`,
                        padding: '4px 10px',
                        borderRadius: '10px',
                        color: currentTheme.text.secondary,
                        fontWeight: 500,
                      }}
                    >
                      {actor.name}
                    </span>
                  ))}
                  {rec.actors.length > 3 && (
                    <span style={{
                      fontSize: '11px',
                      background: `${currentTheme.primary}20`,
                      padding: '4px 10px',
                      borderRadius: '10px',
                      color: currentTheme.primary,
                      fontWeight: 600,
                    }}>
                      +{rec.actors.length - 3}
                    </span>
                  )}
                </div>
              </div>

              <OpenInNew style={{
                fontSize: '18px',
                opacity: 0.3,
                alignSelf: 'center',
                color: currentTheme.text.muted,
              }} />
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};
