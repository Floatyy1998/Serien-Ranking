/**
 * WatchJourneyPage - Premium Watch Journey Experience
 *
 * Zeigt deine Watch-Trends mit professionellen Recharts-Visualisierungen
 */

import {
  AutoGraph,
  Category,
  ExpandMore,
  MovieFilter,
  Schedule,
  Subscriptions,
  Timeline,
  TrendingUp,
} from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../App';
import { useTheme } from '../../contexts/ThemeContext';
import {
  calculateMultiYearTrends,
  calculateWatchJourney,
  MultiYearTrendsData,
  WatchJourneyData,
} from '../../services/watchJourneyService';
import { BackButton, GradientText } from '../../components/ui';
import { ACCENT_COLORS } from './ActivityTab';
import { ActivityTab } from './ActivityTab';
import { GenreTab } from './GenreTab';
import { HeatmapTab } from './HeatmapTab';
import { InsightsTab } from './InsightsTab';
import { ProviderTab } from './ProviderTab';
import { SerienTab } from './SerienTab';
import { TrendsTab } from './TrendsTab';
import { TabType } from './types';

// Available years (from 2025 to current year)
const getAvailableYears = () => {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear; y >= 2026; y--) {
    years.push(y);
  }
  return years;
};

export const WatchJourneyPage: React.FC = () => {
  const { user } = useAuth()!;
  const { currentTheme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<WatchJourneyData | null>(null);
  const [trendsData, setTrendsData] = useState<MultiYearTrendsData | null>(null);

  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const tabParam = searchParams.get('tab') as TabType;
    const validTabs: TabType[] = [
      'genre',
      'provider',
      'heatmap',
      'activity',
      'trends',
      'serien',
      'insights',
    ];
    return tabParam && validTabs.includes(tabParam) ? tabParam : 'trends';
  });

  const [chartWidth, setChartWidth] = useState(window.innerWidth - 40);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showYearPicker, setShowYearPicker] = useState(false);

  const availableYears = getAvailableYears();

  // Theme-basierte Farben
  const primaryColor = currentTheme.primary;
  const bgDefault = currentTheme.background.default;
  const bgSurface = currentTheme.background.surface;
  const textPrimary = currentTheme.text.primary;
  const textSecondary = currentTheme.text.secondary;

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      try {
        setLoading(true);
        // Load single year data and multi-year trends in parallel
        const [journeyData, multiYearData] = await Promise.all([
          calculateWatchJourney(user.uid, selectedYear),
          calculateMultiYearTrends(user.uid, availableYears),
        ]);
        setData(journeyData);
        setTrendsData(multiYearData);
      } catch (error) {
        console.error('Error loading watch journey:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user, selectedYear]);

  useEffect(() => {
    const updateWidth = () => setChartWidth(window.innerWidth - 40);
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Sync activeTab with URL parameters
  useEffect(() => {
    setSearchParams({ tab: activeTab }, { replace: true });
  }, [activeTab, setSearchParams]);

  if (loading) {
    return (
      <div
        style={{
          height: '100vh',
          background: bgDefault,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '28px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative background for loading */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '10%',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${primaryColor}20, transparent 70%)`,
            filter: 'blur(60px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '20%',
            right: '10%',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${ACCENT_COLORS.movies}15, transparent 70%)`,
            filter: 'blur(60px)',
          }}
        />

        {/* Animated loading icon */}
        <div style={{ position: 'relative' }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            style={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              border: `3px solid ${primaryColor}20`,
              borderTopColor: primaryColor,
              position: 'absolute',
              top: -10,
              left: -10,
            }}
          />
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${primaryColor}30, ${ACCENT_COLORS.movies}20)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)',
            }}
          >
            <TrendingUp style={{ fontSize: 36, color: primaryColor }} />
          </motion.div>
        </div>

        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{
              color: textPrimary,
              fontSize: 20,
              fontWeight: 700,
              margin: 0,
              marginBottom: '8px',
            }}
          >
            Analysiere Watch-History...
          </motion.p>
          <p style={{ color: textSecondary, fontSize: 14, margin: 0 }}>
            Berechne deine persönlichen Trends
          </p>
        </div>
      </div>
    );
  }

  if (!data || data.totalEpisodes + data.totalMovies === 0) {
    return (
      <div
        style={{
          height: '100vh',
          background: bgDefault,
          display: 'flex',
          flexDirection: 'column',
          padding: '20px',
        }}
      >
        {/* Header mit Year Picker auch im Empty State */}
        <div
          style={{
            paddingTop: 'env(safe-area-inset-top)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '20px',
          }}
        >
          <BackButton />
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: textPrimary }}>
              Watch Journey
            </h1>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowYearPicker(!showYearPicker)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              borderRadius: '12px',
              border: `1px solid ${primaryColor}40`,
              background: `${primaryColor}15`,
              color: textPrimary,
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {selectedYear}
            <motion.div
              animate={{ rotate: showYearPicker ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ExpandMore style={{ fontSize: 20 }} />
            </motion.div>
          </motion.button>
        </div>

        {/* Year Picker Dropdown */}
        <AnimatePresence>
          {showYearPicker && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ marginBottom: 16, overflow: 'hidden' }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  padding: '16px',
                  borderRadius: '16px',
                  background: bgSurface,
                  border: `1px solid ${currentTheme.border.default}`,
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                }}
              >
                {availableYears.map((year) => (
                  <motion.button
                    key={year}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedYear(year);
                      setShowYearPicker(false);
                    }}
                    style={{
                      padding: '14px 28px',
                      borderRadius: '12px',
                      border:
                        selectedYear === year ? 'none' : `1px solid ${currentTheme.border.default}`,
                      background: selectedYear === year ? primaryColor : bgSurface,
                      color: selectedYear === year ? 'white' : textPrimary,
                      fontSize: 18,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {year}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State Content */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <TrendingUp style={{ fontSize: 80, color: `${textSecondary}30`, marginBottom: 24 }} />
          <h2 style={{ color: textPrimary, fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
            Keine Daten für {selectedYear}
          </h2>
          <p style={{ color: textSecondary, textAlign: 'center', maxWidth: 300, lineHeight: 1.6 }}>
            {selectedYear === new Date().getFullYear()
              ? 'Schau Serien und Filme, um deine persönliche Watch Journey zu sehen!'
              : 'Wähle ein anderes Jahr oder schau mehr Content!'}
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'trends' as TabType, label: 'Trends', icon: <Timeline style={{ fontSize: 18 }} /> },
    {
      id: 'activity' as TabType,
      label: 'Aktivität',
      icon: <TrendingUp style={{ fontSize: 18 }} />,
    },
    { id: 'serien' as TabType, label: 'Serien', icon: <MovieFilter style={{ fontSize: 18 }} /> },
    { id: 'insights' as TabType, label: 'Insights', icon: <AutoGraph style={{ fontSize: 18 }} /> },
    { id: 'genre' as TabType, label: 'Genres', icon: <Category style={{ fontSize: 18 }} /> },
    {
      id: 'provider' as TabType,
      label: 'Streaming',
      icon: <Subscriptions style={{ fontSize: 18 }} />,
    },
    { id: 'heatmap' as TabType, label: 'Zeiten', icon: <Schedule style={{ fontSize: 18 }} /> },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: bgDefault,
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* Decorative Background Gradients */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-5%',
            left: '-20%',
            width: '60%',
            height: '40%',
            borderRadius: '50%',
            background: `radial-gradient(ellipse, ${primaryColor}12 0%, transparent 70%)`,
            filter: 'blur(40px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '30%',
            right: '-15%',
            width: '50%',
            height: '40%',
            borderRadius: '50%',
            background: `radial-gradient(ellipse, ${ACCENT_COLORS.movies}10 0%, transparent 70%)`,
            filter: 'blur(40px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '10%',
            left: '20%',
            width: '50%',
            height: '35%',
            borderRadius: '50%',
            background: `radial-gradient(ellipse, ${ACCENT_COLORS.time}08 0%, transparent 70%)`,
            filter: 'blur(40px)',
          }}
        />
      </div>

      <div style={{ paddingBottom: '120px', position: 'relative', zIndex: 1 }}>
        {/* Premium Glassmorphism Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            padding: '16px 20px',
            paddingTop: 'calc(16px + env(safe-area-inset-top))',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            background: `${bgDefault}90`,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <BackButton />
          <div style={{ flex: 1 }}>
            <GradientText as="h1" to={ACCENT_COLORS.movies} style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 800,
              }}>
              Watch Journey
            </GradientText>
            <p style={{ margin: 0, fontSize: 12, color: textSecondary, marginTop: '2px' }}>
              Deine Trends & Insights
            </p>
          </div>

          {/* Premium Year Picker Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowYearPicker(!showYearPicker)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 18px',
              borderRadius: '14px',
              border: 'none',
              background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)`,
              color: 'white',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: `0 4px 15px ${primaryColor}40`,
            }}
          >
            {selectedYear}
            <motion.div
              animate={{ rotate: showYearPicker ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ExpandMore style={{ fontSize: 20 }} />
            </motion.div>
          </motion.button>
        </motion.div>

        {/* Year Picker Dropdown */}
        <AnimatePresence>
          {showYearPicker && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                margin: '0 20px 16px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  padding: '16px',
                  borderRadius: '16px',
                  background: bgSurface,
                  border: `1px solid ${currentTheme.border.default}`,
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                }}
              >
                {availableYears.map((year) => (
                  <motion.button
                    key={year}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedYear(year);
                      setShowYearPicker(false);
                    }}
                    style={{
                      padding: '14px 28px',
                      borderRadius: '12px',
                      border:
                        selectedYear === year ? 'none' : `1px solid ${currentTheme.border.default}`,
                      background: selectedYear === year ? primaryColor : bgSurface,
                      color: selectedYear === year ? 'white' : textPrimary,
                      fontSize: 18,
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: selectedYear === year ? `0 4px 15px ${primaryColor}40` : 'none',
                    }}
                  >
                    {year}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Premium Tabs - Full width desktop, scrollable mobile */}
        <div
          style={{
            padding: '0 16px 24px',
            overflowX: 'auto',
            overflowY: 'hidden',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 0,
              padding: 0,
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              width: '100%',
              overflow: 'hidden',
            }}
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    flex: '1 1 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    padding: '12px 8px',
                    borderRadius: 0,
                    border: 'none',
                    background: isActive
                      ? `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)`
                      : 'transparent',
                    color: isActive ? 'white' : 'rgba(255, 255, 255, 0.5)',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: isActive ? `0 2px 8px ${primaryColor}40` : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {tab.icon}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Active Tab Title */}
        <div style={{ padding: '0 16px 16px' }}>
          <h2
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 700,
              color: 'white',
            }}
          >
            {tabs.find((t) => t.id === activeTab)?.label}
          </h2>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'trends' && trendsData && (
            <motion.div
              key="trends"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <TrendsTab data={trendsData} />
            </motion.div>
          )}
          {activeTab === 'activity' && (
            <motion.div
              key="activity"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ActivityTab data={data} />
            </motion.div>
          )}
          {activeTab === 'serien' && (
            <motion.div
              key="serien"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <SerienTab data={data} />
            </motion.div>
          )}
          {activeTab === 'insights' && (
            <motion.div
              key="insights"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <InsightsTab data={data} />
            </motion.div>
          )}
          {activeTab === 'genre' && (
            <motion.div
              key="genre"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <GenreTab data={data} />
            </motion.div>
          )}
          {activeTab === 'provider' && (
            <motion.div
              key="provider"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ProviderTab data={data} />
            </motion.div>
          )}
          {activeTab === 'heatmap' && (
            <motion.div
              key="heatmap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <HeatmapTab data={data} width={chartWidth + 40} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default WatchJourneyPage;
