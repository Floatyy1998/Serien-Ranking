import { LocalFireDepartment, Replay, Timer } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContextDef';
import type { WatchJourneyData } from '../../services/watchJourneyService';

interface InsightsTabProps {
  data: WatchJourneyData;
}

export const InsightsTab: React.FC<InsightsTabProps> = ({ data }) => {
  const { currentTheme } = useTheme();
  const textPrimary = currentTheme.text.primary;
  const textSecondary = currentTheme.text.secondary;
  const bgSurface = currentTheme.background.surface;
  const bingeColor = '#ff4d6d'; // Coral – distinct from genre/provider/accent
  const rewatchColor = '#7b2cbf'; // Deep purple – distinct from genre/provider/accent
  const runtimeColor = '#4cc9f0'; // Sky blue – distinct from genre/provider/accent
  const recordAccent = '#7b2cbf';
  const recordSuccess = '#4cc9f0';
  const recordSecondary = '#ff4d6d';

  // Runtime distribution for histogram
  const runtimeDistribution = useMemo(() => {
    const buckets = [
      { label: '< 30', min: 0, max: 30, count: 0 },
      { label: '30-45', min: 30, max: 45, count: 0 },
      { label: '45-60', min: 45, max: 60, count: 0 },
      { label: '60-90', min: 60, max: 90, count: 0 },
      { label: '> 90', min: 90, max: Infinity, count: 0 },
    ];

    data.seriesStats.forEach((series) => {
      const bucket = buckets.find((b) => series.avgRuntime >= b.min && series.avgRuntime < b.max);
      if (bucket) bucket.count += 1;
    });

    const maxCount = Math.max(...buckets.map((b) => b.count));
    return buckets.map((b) => ({
      ...b,
      percentage: maxCount > 0 ? (b.count / maxCount) * 100 : 0,
    }));
  }, [data.seriesStats]);

  // Top rewatched series
  const topRewatched = useMemo(() => {
    return [...data.seriesStats]
      .filter((s) => s.rewatchEpisodes > 0)
      .sort((a, b) => b.rewatchEpisodes - a.rewatchEpisodes)
      .slice(0, 5);
  }, [data.seriesStats]);

  // Top binged series
  const topBinged = useMemo(() => {
    return [...data.seriesStats]
      .filter((s) => s.bingeEpisodes > 0)
      .sort((a, b) => b.bingeEpisodes - a.bingeEpisodes)
      .slice(0, 5);
  }, [data.seriesStats]);

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Binge Stats Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          margin: '0 20px 24px',
          padding: '24px',
          borderRadius: '24px',
          background: `linear-gradient(135deg, ${bingeColor}30, ${bingeColor}10)`,
          border: `1px solid ${bingeColor}50`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -30,
            right: -30,
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: bingeColor,
            opacity: 0.15,
            filter: 'blur(30px)',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <LocalFireDepartment style={{ color: bingeColor, fontSize: 32 }} />
            <div>
              <p
                style={{
                  color: textSecondary,
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: 1,
                  margin: 0,
                }}
              >
                BINGE-STATISTIKEN
              </p>
              <h2 style={{ color: textPrimary, fontSize: 24, fontWeight: 800, margin: 0 }}>
                {data.bingeSessionCount} Sessions
              </h2>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <div
              style={{
                textAlign: 'center',
                padding: '16px',
                background: `${currentTheme.text.muted}08`,
                borderRadius: 12,
              }}
            >
              <div style={{ color: bingeColor, fontSize: 24, fontWeight: 700 }}>
                {data.bingeEpisodeCount}
              </div>
              <div style={{ color: textSecondary, fontSize: 11 }}>Episoden gebinged</div>
            </div>
            <div
              style={{
                textAlign: 'center',
                padding: '16px',
                background: `${currentTheme.text.muted}08`,
                borderRadius: 12,
              }}
            >
              <div style={{ color: bingeColor, fontSize: 24, fontWeight: 700 }}>
                {data.avgBingeLength}
              </div>
              <div style={{ color: textSecondary, fontSize: 11 }}>Ø pro Session</div>
            </div>
            <div
              style={{
                textAlign: 'center',
                padding: '16px',
                background: `${currentTheme.text.muted}08`,
                borderRadius: 12,
              }}
            >
              <div style={{ color: bingeColor, fontSize: 24, fontWeight: 700 }}>
                {data.longestBinge}
              </div>
              <div style={{ color: textSecondary, fontSize: 11 }}>Längste Session</div>
            </div>
          </div>

          {/* Top Binged Series */}
          {topBinged.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <p style={{ color: textSecondary, fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
                MEIST GEBINGED
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {topBinged.map((series, index) => (
                  <div
                    key={series.seriesId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '8px 12px',
                      background: `${currentTheme.text.muted}08`,
                      borderRadius: 8,
                    }}
                  >
                    <span style={{ color: bingeColor, fontWeight: 700, width: 20 }}>
                      {index + 1}
                    </span>
                    <span style={{ color: textPrimary, flex: 1, fontSize: 13 }}>
                      {series.title}
                    </span>
                    <span style={{ color: bingeColor, fontWeight: 600, fontSize: 13 }}>
                      {series.bingeEpisodes} Ep.
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Rewatch Stats Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          margin: '0 20px 24px',
          padding: '24px',
          borderRadius: '24px',
          background: `linear-gradient(135deg, ${rewatchColor}30, ${rewatchColor}10)`,
          border: `1px solid ${rewatchColor}50`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -30,
            right: -30,
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: rewatchColor,
            opacity: 0.15,
            filter: 'blur(30px)',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <Replay style={{ color: rewatchColor, fontSize: 32 }} />
            <div>
              <p
                style={{
                  color: textSecondary,
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: 1,
                  margin: 0,
                }}
              >
                REWATCH-STATISTIKEN
              </p>
              <h2 style={{ color: textPrimary, fontSize: 24, fontWeight: 800, margin: 0 }}>
                {data.rewatchCount} Rewatches
              </h2>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            <div
              style={{
                textAlign: 'center',
                padding: '16px',
                background: `${currentTheme.text.muted}08`,
                borderRadius: 12,
              }}
            >
              <div style={{ color: rewatchColor, fontSize: 24, fontWeight: 700 }}>
                {Math.round(data.rewatchMinutes / 60)}h
              </div>
              <div style={{ color: textSecondary, fontSize: 11 }}>Rewatch-Zeit</div>
            </div>
            <div
              style={{
                textAlign: 'center',
                padding: '16px',
                background: `${currentTheme.text.muted}08`,
                borderRadius: 12,
              }}
            >
              <div style={{ color: rewatchColor, fontSize: 24, fontWeight: 700 }}>
                {data.rewatchPercentage}%
              </div>
              <div style={{ color: textSecondary, fontSize: 11 }}>deiner Zeit</div>
            </div>
          </div>

          {/* Top Rewatched Series */}
          {topRewatched.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <p style={{ color: textSecondary, fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
                COMFORT-SERIEN
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {topRewatched.map((series, index) => (
                  <div
                    key={series.seriesId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '8px 12px',
                      background: `${currentTheme.text.muted}08`,
                      borderRadius: 8,
                    }}
                  >
                    <span style={{ color: rewatchColor, fontWeight: 700, width: 20 }}>
                      {index + 1}
                    </span>
                    <span style={{ color: textPrimary, flex: 1, fontSize: 13 }}>
                      {series.title}
                    </span>
                    <span style={{ color: rewatchColor, fontWeight: 600, fontSize: 13 }}>
                      {series.rewatchEpisodes}× rewatch
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Runtime Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          margin: '0 20px 24px',
          padding: '24px',
          borderRadius: '24px',
          background: bgSurface,
          border: `1px solid ${currentTheme.border.default}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <Timer style={{ color: runtimeColor, fontSize: 28 }} />
          <div>
            <h3
              style={{
                color: textPrimary,
                fontSize: 16,
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                margin: 0,
              }}
            >
              Episodenlängen-Verteilung
            </h3>
            <p style={{ color: textSecondary, fontSize: 12, margin: 0 }}>
              Ø {data.avgEpisodeRuntime} Min · {data.shortestEpisode}–{data.longestEpisode} Min
            </p>
          </div>
        </div>

        {/* Histogram */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
          {runtimeDistribution.map((bucket, index) => (
            <div key={bucket.label} style={{ flex: 1, textAlign: 'center' }}>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${bucket.percentage}%` }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                style={{
                  background: `linear-gradient(180deg, ${runtimeColor}, ${runtimeColor}60)`,
                  borderRadius: '8px 8px 0 0',
                  minHeight: bucket.count > 0 ? 20 : 4,
                  marginBottom: 8,
                }}
              />
              <div style={{ color: textSecondary, fontSize: 11 }}>{bucket.label}</div>
              <div style={{ color: runtimeColor, fontSize: 12, fontWeight: 600 }}>
                {bucket.count} {bucket.count === 1 ? 'Serie' : 'Serien'}
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', color: textSecondary, fontSize: 11, marginTop: 8 }}>
          Minuten pro Episode
        </div>
      </motion.div>

      {/* Personal Records */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{
          margin: '0 20px',
          padding: '20px',
          borderRadius: '20px',
          background: bgSurface,
          border: `1px solid ${currentTheme.border.default}`,
        }}
      >
        <h3
          style={{
            color: textPrimary,
            fontSize: 16,
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            margin: '0 0 16px',
          }}
        >
          Deine Rekorde
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              background: bgSurface,
              border: `1px solid ${currentTheme.border.default}`,
              textAlign: 'center',
            }}
          >
            <div style={{ color: recordAccent, fontSize: 28, fontWeight: 700 }}>
              {data.totalEpisodes}
            </div>
            <div style={{ color: textSecondary, fontSize: 12 }}>Episoden insgesamt</div>
          </div>

          <div
            style={{
              padding: 16,
              borderRadius: 12,
              background: bgSurface,
              border: `1px solid ${currentTheme.border.default}`,
              textAlign: 'center',
            }}
          >
            <div style={{ color: recordSuccess, fontSize: 28, fontWeight: 700 }}>
              {Math.round(data.totalMinutes / 60)}h
            </div>
            <div style={{ color: textSecondary, fontSize: 12 }}>Watchtime</div>
          </div>

          <div
            style={{
              padding: 16,
              borderRadius: 12,
              background: bgSurface,
              border: `1px solid ${currentTheme.border.default}`,
              textAlign: 'center',
            }}
          >
            <div style={{ color: recordSecondary, fontSize: 28, fontWeight: 700 }}>
              {data.uniqueSeriesCount}
            </div>
            <div style={{ color: textSecondary, fontSize: 12 }}>Verschiedene Serien</div>
          </div>

          <div
            style={{
              padding: 16,
              borderRadius: 12,
              background: bgSurface,
              border: `1px solid ${currentTheme.border.default}`,
              textAlign: 'center',
            }}
          >
            <div style={{ color: bingeColor, fontSize: 28, fontWeight: 700 }}>
              {data.longestBinge}
            </div>
            <div style={{ color: textSecondary, fontSize: 12 }}>Längste Binge-Session</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
