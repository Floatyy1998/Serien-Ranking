import { Subscriptions as SubscriptionsIcon } from '@mui/icons-material';
import { useState } from 'react';
import { EmptyState, PageHeader, PageLayout, Skeleton } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { useProviderLogos } from '../../hooks/useProviderLogos';
import { useSubscriptionsData } from '../../hooks/useSubscriptionsData';
import { t } from '../../services/i18n';
import { ActiveSubscriptionCard } from './components/ActiveSubscriptionCard';
import { CostOptimizerSection } from './components/CostOptimizerSection';
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
        title={t('Streaming-Abos')}
        gradientFrom={currentTheme.text.primary}
        gradientTo={currentTheme.primary}
        icon={<SubscriptionsIcon style={{ fontSize: 26, color: accent }} />}
      />

      <div className="sub-content">
        {/* Insights (erst nach dem Laden — sonst kurz irreführend "0 Abos / 0,00 €") */}
        {!loading && (
          <SubscriptionInsights
            activeCount={activeInsights.length}
            unusedInsights={unusedInsights}
            totalMonthlySpend={totalMonthlySpend}
            wastedMonthlySpend={wastedMonthlySpend}
            unusedThresholdDays={unusedThresholdDays}
          />
        )}

        {/* Cost optimizer: €/Stunde-Ranking + Pausier-Vorschläge */}
        {!loading && (
          <CostOptimizerSection
            activeInsights={activeInsights}
            unusedThresholdDays={unusedThresholdDays}
            providerLogos={providerLogos}
            updateProvider={updateProvider}
          />
        )}

        {/* Threshold */}
        <ThresholdControl
          unusedThresholdDays={unusedThresholdDays}
          onThresholdChange={setUnusedThreshold}
        />

        {/* Active subscriptions */}
        <div className="sub-section">
          <div className="sub-section-head">
            <h2 className="sub-section-title" style={{ color: currentTheme.text.primary }}>
              {t('Deine Abos')}
            </h2>
            <span className="sub-section-count" style={{ color: muted }}>
              {t('{n} aktiv', { n: activeInsights.length })}
            </span>
          </div>

          {loading && (
            <div className="sub-skeleton-list" role="status" aria-label={t('Abos werden geladen')}>
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="sub-skeleton-card">
                  <Skeleton width={42} height={42} shape="card" />
                  <div className="sub-skeleton-card-body">
                    <Skeleton width="55%" height={14} shape="text" />
                    <Skeleton width="80%" height={11} shape="text" />
                  </div>
                  <Skeleton width={64} height={28} shape="pill" />
                </div>
              ))}
            </div>
          )}

          {!loading && activeInsights.length === 0 && (
            <EmptyState
              icon={<SubscriptionsIcon style={{ fontSize: 48 }} />}
              title={t('Noch keine Abos markiert')}
              description={t('Wähle unten aus, welche Streaming-Dienste du gerade abonniert hast.')}
              iconColor={currentTheme.text.secondary}
            />
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
