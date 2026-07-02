import { Subscriptions as SubscriptionsIcon } from '@mui/icons-material';
import { useState } from 'react';
import { PageHeader, PageLayout } from '../../components/ui';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useTheme } from '../../contexts/ThemeContextDef';
import { useProviderLogos } from '../../hooks/useProviderLogos';
import { useSubscriptionsData } from '../../hooks/useSubscriptionsData';
import { ActiveSubscriptionCard } from './components/ActiveSubscriptionCard';
import { InactiveProvidersSection } from './components/InactiveProvidersSection';
import { SubscriptionInsights } from './components/SubscriptionInsights';
import { ThresholdControl } from './components/ThresholdControl';
import { WatchlistGapsSection } from './components/WatchlistGapsSection';
import './SubscriptionsPage.css';

export const SubscriptionsPage = () => {
  const { currentTheme } = useTheme();
  const providerLogos = useProviderLogos();
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const [moveMenuFor, setMoveMenuFor] = useState<number | null>(null);
  const {
    loading,
    insights,
    activeInsights,
    unusedInsights,
    totalMonthlySpend,
    wastedMonthlySpend,
    watchlistGaps,
    unusedThresholdDays,
    setUnusedThreshold,
    updateProvider,
    setSeriesOverride,
    seriesOverrides,
  } = useSubscriptionsData();

  const accent = currentTheme.accent || currentTheme.primary;
  const border = currentTheme.border.default;
  const muted = currentTheme.text.muted;

  const inactiveInsights = insights.filter((i) => !i.active);

  return (
    <PageLayout>
      <div
        className="sub-page-bg"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% -20%, ${currentTheme.primary}35, transparent),
            radial-gradient(ellipse 60% 40% at 80% 10%, ${accent}1f, transparent)
          `,
        }}
      />

      <PageHeader
        title="Streaming-Abos"
        gradientFrom={currentTheme.text.primary}
        gradientTo={currentTheme.primary}
        icon={<SubscriptionsIcon style={{ fontSize: 26, color: accent }} />}
      />

      <div className="sub-content">
        {/* Insights */}
        <SubscriptionInsights
          activeCount={activeInsights.length}
          unusedInsights={unusedInsights}
          totalMonthlySpend={totalMonthlySpend}
          wastedMonthlySpend={wastedMonthlySpend}
          unusedThresholdDays={unusedThresholdDays}
        />

        {/* Threshold */}
        <ThresholdControl
          unusedThresholdDays={unusedThresholdDays}
          onThresholdChange={setUnusedThreshold}
        />

        {/* Active subscriptions */}
        <div className="sub-section">
          <div className="sub-section-head">
            <h2 className="sub-section-title" style={{ color: currentTheme.text.primary }}>
              Deine Abos
            </h2>
            <span className="sub-section-count" style={{ color: muted }}>
              {activeInsights.length} aktiv
            </span>
          </div>

          {loading && <LoadingSpinner size={36} />}

          {!loading && activeInsights.length === 0 && (
            <div className="sub-empty" style={{ borderColor: border, color: muted }}>
              Noch keine Abos markiert. Wähle unten aus, welche Dienste du gerade hast.
            </div>
          )}

          {!loading && activeInsights.length > 0 && (
            <div className="sub-active-list">
              {activeInsights.map((insight) => (
                <ActiveSubscriptionCard
                  key={insight.name}
                  insight={insight}
                  logoPath={providerLogos[insight.name]}
                  unusedThresholdDays={unusedThresholdDays}
                  activeInsights={activeInsights}
                  expanded={expandedProvider === insight.name}
                  onToggleExpand={() =>
                    setExpandedProvider(expandedProvider === insight.name ? null : insight.name)
                  }
                  moveMenuFor={moveMenuFor}
                  onMoveMenuChange={setMoveMenuFor}
                  seriesOverrides={seriesOverrides}
                  updateProvider={updateProvider}
                  setSeriesOverride={setSeriesOverride}
                />
              ))}
            </div>
          )}
        </div>

        {/* Inactive subscriptions */}
        {!loading && inactiveInsights.length > 0 && (
          <InactiveProvidersSection
            inactiveInsights={inactiveInsights}
            providerLogos={providerLogos}
            onActivate={(name) => updateProvider(name, { active: true })}
          />
        )}

        {/* Watchlist gaps */}
        <WatchlistGapsSection watchlistGaps={watchlistGaps} activeCount={activeInsights.length} />
      </div>
    </PageLayout>
  );
};
