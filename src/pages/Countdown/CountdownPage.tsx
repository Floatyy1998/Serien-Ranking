import { useNavigate } from 'react-router-dom';
import { CalendarMonth } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { useSeriesCountdowns } from '../../hooks/useSeriesCountdowns';
import { PageHeader, LoadingSpinner, EmptyState, PageLayout } from '../../components/ui';
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
      gradientColors={[currentTheme.primary, 'var(--theme-secondary-gradient, #a855f7)']}
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
          <div className="cd-list">
            <CountdownHeroCard item={hero} onClick={() => navigate(`/series/${hero.seriesId}`)} />

            {rest.length > 0 && (
              <>
                <p className="cd-section-label" style={{ color: currentTheme.text.muted }}>
                  Weitere ({rest.length})
                </p>
                {rest.map((item, i) => (
                  <CountdownListItem
                    key={item.seriesId}
                    item={item}
                    index={i}
                    onClick={() => navigate(`/series/${item.seriesId}`)}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </PageLayout>
  );
};
