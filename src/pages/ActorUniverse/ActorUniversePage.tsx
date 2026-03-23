import { AutoAwesome, RecordVoiceOver, Star, TrendingUp } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContextDef';
import { BackButton, GradientText } from '../../components/ui';
import { RecommendationsTab } from './RecommendationsTab';
import { TopActorsTab } from './TopActorsTab';
import { GalaxyMapTab } from './GalaxyMapTab';
import { ActorDetailModal } from './ActorDetailModal';
import { LoadingScreen } from './LoadingScreen';
import { StatsBanner } from './StatsBanner';
import type { TabId } from './useActorUniverseData';
import { useActorUniverseData } from './useActorUniverseData';
import './ActorUniversePage.css';

// Tab configuration
const TABS: { id: TabId; label: string; icon: typeof TrendingUp }[] = [
  { id: 'recommendations', label: 'Empfehlungen', icon: TrendingUp },
  { id: 'top', label: 'Top Actors', icon: Star },
  { id: 'map', label: 'Galaxy Map', icon: AutoAwesome },
];

export const ActorUniversePage = () => {
  const { currentTheme } = useTheme();

  const {
    actors,
    connections,
    topActors,
    recommendations,
    stats,
    loading,
    progress,
    loadingRecommendations,
    hideVoiceActors,
    toggleVoiceActors,
    selectedActor,
    setSelectedActor,
    hoveredActor,
    setHoveredActor,
    activeTab,
    setActiveTab,
    getActorConnections,
  } = useActorUniverseData();

  if (loading && actors.length === 0) {
    return <LoadingScreen progress={progress} />;
  }

  return (
    <div className="au-page" style={{ backgroundColor: currentTheme.background.default }}>
      {/* Decorative background */}
      <div
        className="au-bg-decoration au-bg-decoration--fixed"
        style={{
          background: `radial-gradient(ellipse at 20% 10%, ${currentTheme.primary}12 0%, transparent 40%),
                       radial-gradient(ellipse at 80% 90%, ${currentTheme.accent}12 0%, transparent 40%)`,
        }}
      />

      {/* Header */}
      <header
        className="au-header au-header--sticky"
        style={{
          background: `linear-gradient(180deg, ${currentTheme.background.card}f5 0%, ${currentTheme.background.card}00 100%)`,
        }}
      >
        <div className="au-header-row au-header-row--main">
          <BackButton
            style={{
              background: `linear-gradient(135deg, ${currentTheme.background.surface}, ${currentTheme.background.surfaceHover})`,
              border: `1px solid ${currentTheme.border.default}`,
              color: currentTheme.text.primary,
              boxShadow: `0 2px 8px ${currentTheme.background.default}80`,
            }}
          />
          <div style={{ flex: 1 }}>
            <GradientText
              as="h1"
              style={{
                fontSize: '22px',
                fontWeight: 800,
                fontFamily: 'var(--font-display)',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AutoAwesome
                style={{
                  fontSize: '24px',
                  color: currentTheme.accent,
                  WebkitTextFillColor: currentTheme.accent,
                }}
              />
              Actor Universe
            </GradientText>
            <p className="au-subtitle" style={{ color: currentTheme.text.muted }}>
              {stats.totalActors} Schauspieler • {stats.actorsInMultipleSeries} in mehreren Serien
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="au-tabs">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                }}
                whileTap={{ scale: 0.95 }}
                className="au-tab-btn"
                style={{
                  background: isActive
                    ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`
                    : `rgba(255,255,255,0.05)`,
                  border: isActive ? 'none' : `1px solid ${currentTheme.border.default}`,
                  color: isActive ? currentTheme.text.secondary : currentTheme.text.muted,
                  fontWeight: isActive ? 700 : 500,
                  boxShadow: isActive ? `0 4px 15px ${currentTheme.primary}40` : 'none',
                }}
              >
                <Icon style={{ fontSize: '16px' }} />
                {tab.label}
              </motion.button>
            );
          })}

          {/* Voice Actor Toggle */}
          <motion.button
            onClick={() => {
              toggleVoiceActors();
            }}
            whileTap={{ scale: 0.95 }}
            title={hideVoiceActors ? 'Voice Actors anzeigen' : 'Voice Actors ausblenden'}
            className="au-voice-toggle"
            style={{
              background: hideVoiceActors
                ? `rgba(255,255,255,0.05)`
                : `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
              border: hideVoiceActors ? `1px solid ${currentTheme.border.default}` : 'none',
              color: hideVoiceActors ? currentTheme.text.muted : currentTheme.text.secondary,
              boxShadow: !hideVoiceActors ? `0 4px 15px ${currentTheme.primary}40` : 'none',
            }}
          >
            <RecordVoiceOver style={{ fontSize: '18px' }} />
          </motion.button>
        </div>
      </header>

      {/* Stats Banner */}
      {stats.mostConnectedPair && <StatsBanner mostConnectedPair={stats.mostConnectedPair} />}

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'recommendations' && (
          <RecommendationsTab
            recommendations={recommendations}
            loadingRecommendations={loadingRecommendations}
          />
        )}

        {activeTab === 'top' && (
          <TopActorsTab topActors={topActors} actors={actors} onSelectActor={setSelectedActor} />
        )}

        {activeTab === 'map' && (
          <GalaxyMapTab
            actors={actors}
            connections={connections}
            hoveredActor={hoveredActor}
            onHoverActor={setHoveredActor}
            onSelectActor={setSelectedActor}
            getActorConnections={getActorConnections}
          />
        )}
      </AnimatePresence>

      {/* Actor Detail Modal */}
      <ActorDetailModal
        selectedActor={selectedActor}
        actors={actors}
        onClose={() => setSelectedActor(null)}
        onSelectActor={setSelectedActor}
        getActorConnections={getActorConnections}
      />
    </div>
  );
};
