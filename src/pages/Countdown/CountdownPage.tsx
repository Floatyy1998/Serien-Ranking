import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarMonth } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContextDef';
import { useSeriesCountdowns } from '../../hooks/useSeriesCountdowns';
import { PageHeader, LoadingSpinner, EmptyState, PageLayout } from '../../components/ui';
import { staggerContainer, staggerItem } from '../../lib/motion';
import { CountdownHeroCard } from './CountdownHeroCard';
import { CountdownListItem } from './CountdownListItem';
import './CountdownPage.css';

export const CountdownPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const { countdowns, loading } = useSeriesCountdowns();

  const hero = countdowns[0];
  const rest = countdowns.slice(1);

  return (
    <PageLayout
      gradientColors={[currentTheme.primary, currentTheme.accent]}
      style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}
    >
      <PageHeader title="Countdown" icon={<CalendarMonth style={{ fontSize: 28 }} />} />

      <div className="cd-content">
        {loading && <LoadingSpinner text="Countdowns werden geladen..." />}

        {!loading && countdowns.length === 0 && (
          <EmptyState
            icon={<CalendarMonth style={{ fontSize: 48 }} />}
            title="Keine kommenden Staffeln"
            description="Sobald Serien in deiner Liste neue Staffeln ankündigen, siehst du sie hier"
            iconColor={currentTheme.text.secondary}
          />
        )}

        {!loading && hero && (
          <motion.div
            className="cd-list"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={staggerItem}>
              <CountdownHeroCard
                item={hero}
                onClick={() => {
                  navigate(`/series/${hero.seriesId}`);
                }}
              />
            </motion.div>

            {rest.length > 0 && (
              <>
                <motion.p
                  variants={staggerItem}
                  className="cd-section-label"
                  style={{ color: currentTheme.text.muted }}
                >
                  Weitere ({rest.length})
                </motion.p>
                {rest.map((item, i) => (
                  <motion.div key={item.seriesId} variants={staggerItem}>
                    <CountdownListItem
                      item={item}
                      index={i}
                      onClick={() => {
                        navigate(`/series/${item.seriesId}`);
                      }}
                    />
                  </motion.div>
                ))}
              </>
            )}
          </motion.div>
        )}
      </div>
    </PageLayout>
  );
};
