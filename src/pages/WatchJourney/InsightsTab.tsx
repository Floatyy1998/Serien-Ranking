import { LocalFireDepartment, Replay, Timer } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import type { WatchJourneyData } from '../../services/watchJourneyService';
import { wjCard, wjHero } from './watchJourneyStyles';
import { t } from '../../services/i18n';

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

  const topRewatched = useMemo(() => {
    return [...data.seriesStats]
      .filter((s) => s.rewatchEpisodes > 0)
      .sort((a, b) => b.rewatchEpisodes - a.rewatchEpisodes)
      .slice(0, 5);
  }, [data.seriesStats]);

  const topBinged = useMemo(() => {
    return [...data.seriesStats]
      .filter((s) => s.bingeEpisodes > 0)
      .sort((a, b) => b.bingeEpisodes - a.bingeEpisodes)
      .slice(0, 5);
  }, [data.seriesStats]);

  return (
    <div style={{ paddingBottom: 40 }}>
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
                {t('BINGE-STATISTIKEN')}
              </p>
              <h2 style={{ color: textPrimary, fontSize: 24, fontWeight: 800, margin: 0 }}>
                {t('{n} Sessions', { n: data.bingeSessionCount })}
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
              <div style={{ color: textSecondary, fontSize: 11 }}>{t('Episoden gebinged')}</div>
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
              <div style={{ color: textSecondary, fontSize: 11 }}>{t('Ø pro Session')}</div>
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
              <div style={{ color: textSecondary, fontSize: 11 }}>{t('Längste Session')}</div>
            </div>
          </div>

          {topBinged.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <p style={{ color: textSecondary, fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
                {t('MEIST GEBINGED')}
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
                      {t('{n} Ep.', { n: series.bingeEpisodes })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>

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
                {t('REWATCH-STATISTIKEN')}
              </p>
              <h2 style={{ color: textPrimary, fontSize: 24, fontWeight: 800, margin: 0 }}>
                {t('{n} Rewatches', { n: data.rewatchCount })}
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
              <div style={{ color: textSecondary, fontSize: 11 }}>{t('Rewatch-Zeit')}</div>
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
              <div style={{ color: textSecondary, fontSize: 11 }}>{t('deiner Zeit')}</div>
            </div>
          </div>

          {topRewatched.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <p style={{ color: textSecondary, fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
                {t('COMFORT-SERIEN')}
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
                      {t('{n}× rewatch', { n: series.rewatchEpisodes })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={wjHero(currentTheme)}
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
              {t('Episodenlängen-Verteilung')}
            </h3>
            <p style={{ color: textSecondary, fontSize: 12, margin: 0 }}>
              Ø {t('{n} Min', { n: data.avgEpisodeRuntime })} · {data.shortestEpisode}–
              {t('{n} Min', { n: data.longestEpisode })}
            </p>
          </div>
        </div>

        {/* Histogram — bars and labels separated so labels don't eat bar height */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100 }}>
          {runtimeDistribution.map((bucket, index) => (
            <motion.div
              key={bucket.label}
              initial={{ height: 0 }}
              animate={{ height: Math.round((bucket.percentage / 100) * 100) }}
              transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
              style={{
                flex: 1,
                background: `linear-gradient(180deg, ${runtimeColor}, ${runtimeColor}60)`,
                borderRadius: '8px 8px 0 0',
                minHeight: bucket.count > 0 ? 4 : 2,
              }}
            />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          {runtimeDistribution.map((bucket) => (
            <div key={bucket.label} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ color: textSecondary, fontSize: 11 }}>{bucket.label}</div>
              <div style={{ color: runtimeColor, fontSize: 12, fontWeight: 600 }}>
                {bucket.count === 1
                  ? t('{n} Serie', { n: bucket.count })
                  : t('{n} Serien', { n: bucket.count })}
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', color: textSecondary, fontSize: 11, marginTop: 8 }}>
          {t('Minuten pro Episode')}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{ ...wjCard(currentTheme), margin: '0 var(--space-5)' }}
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
          {t('Deine Rekorde')}
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
            <div style={{ color: textSecondary, fontSize: 12 }}>{t('Episoden insgesamt')}</div>
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
            <div style={{ color: textSecondary, fontSize: 12 }}>{t('Verschiedene Serien')}</div>
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
            <div style={{ color: textSecondary, fontSize: 12 }}>{t('Längste Binge-Session')}</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
