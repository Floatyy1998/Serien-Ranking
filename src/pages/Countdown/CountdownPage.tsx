import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarMonth } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import {
  countdownKey,
  countdownPath,
  isMovieCountdown,
  useCountdowns,
  type CountdownItem,
} from '../../hooks/watch/useCountdowns';
import { t } from '../../services/i18n';
import {
  PageHeader,
  SkeletonListRow,
  EmptyState,
  PageLayout,
  TabSwitcher,
} from '../../components/ui';
import { staggerContainer, staggerItem } from '../../lib/motion';
import { useCatchUpPlans } from '../../hooks/watch/useCatchUpPlans';
import { CountdownHeroCard } from './CountdownHeroCard';
import { CountdownListItem } from './CountdownListItem';
import './CountdownPage.css';

type CountdownFilter = 'all' | 'series' | 'movies';

export const CountdownPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const { countdowns, seriesCountdowns, movieCountdowns, loading } = useCountdowns();
  const catchUpPlans = useCatchUpPlans(seriesCountdowns);
  const [filter, setFilter] = useState<CountdownFilter>('all');

  const mixed = seriesCountdowns.length > 0 && movieCountdowns.length > 0;
  const activeFilter = mixed ? filter : 'all';
  const visible: CountdownItem[] =
    activeFilter === 'series'
      ? seriesCountdowns
      : activeFilter === 'movies'
        ? movieCountdowns
        : countdowns;

  const hero = visible[0];
  const rest = visible.slice(1);
  const planFor = (item: CountdownItem) =>
    isMovieCountdown(item) ? undefined : catchUpPlans.get(item.seriesId);

  return (
    <PageLayout
      gradientColors={[currentTheme.primary, currentTheme.accent]}
      style={{ height: 'var(--vh, 100vh)', display: 'flex', flexDirection: 'column' }}
    >
      <PageHeader title="Countdown" icon={<CalendarMonth style={{ fontSize: 28 }} />} />

      <div className="cd-content">
        {loading && (
          <div
            style={{ padding: '0 16px' }}
            role="status"
            aria-label={t('Countdowns werden geladen')}
          >
            {Array.from({ length: 5 }, (_, i) => (
              <SkeletonListRow key={i} avatarShape="card" />
            ))}
          </div>
        )}

        {!loading && countdowns.length === 0 && (
          <EmptyState
            icon={<CalendarMonth style={{ fontSize: 48 }} />}
            title={t('Keine kommenden Starts')}
            description={t(
              'Sobald Serien in deiner Liste neue Staffeln ankündigen oder Filme einen Starttermin haben, siehst du sie hier'
            )}
            iconColor={currentTheme.text.secondary}
          />
        )}

        {!loading && mixed && (
          <TabSwitcher
            className="cd-tabs"
            tabs={[
              { id: 'all', label: t('Alle'), count: countdowns.length },
              { id: 'series', label: t('Serien'), count: seriesCountdowns.length },
              { id: 'movies', label: t('Filme'), count: movieCountdowns.length },
            ]}
            activeTab={activeFilter}
            onTabChange={(id) => setFilter(id as CountdownFilter)}
          />
        )}

        {!loading && hero && (
          <motion.div
            key={activeFilter}
            className="cd-list"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={staggerItem}>
              <CountdownHeroCard
                item={hero}
                onClick={() => {
                  navigate(countdownPath(hero));
                }}
                plan={planFor(hero)}
              />
            </motion.div>

            {rest.length > 0 && (
              <>
                <motion.p
                  variants={staggerItem}
                  className="cd-section-label"
                  style={{ color: currentTheme.text.muted }}
                >
                  {t('Weitere ({n})', { n: rest.length })}
                </motion.p>
                {rest.map((item, i) => (
                  <motion.div key={countdownKey(item)} variants={staggerItem}>
                    <CountdownListItem
                      item={item}
                      index={i}
                      onClick={() => {
                        navigate(countdownPath(item));
                      }}
                      plan={planFor(item)}
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
