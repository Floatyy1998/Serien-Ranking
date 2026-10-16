import { AutoStories, LocalLibrary, MenuBook } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { GradientText } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { tapScaleSmall } from '../../lib/motion';
import { t } from '../../services/i18n';
import { ReadingSwitch } from '../../components/reading/ReadingSwitch';
import './components/books.css';
import { useReadingOverview } from './hooks/useReadingOverview';
import { ReadingOverviewSections } from './sections/ReadingOverviewSections';

export const ReadingHubPage = () => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const overview = useReadingOverview();
  const { bookCount, mangaCount } = overview;

  return (
    <div className="bk-page" style={{ background: currentTheme.background.default }}>
      <header className="bk-deck-wrap">
        <ReadingSwitch active="all" />
        <div className="bk-deck liquid-glass">
          <div
            className="bk-deck-glow"
            aria-hidden
            style={{
              background: `radial-gradient(ellipse, ${currentTheme.accent}30, transparent 70%)`,
            }}
          />
          <div className="bk-deck-top">
            <div style={{ minWidth: 0 }}>
              <GradientText
                as="h1"
                from={currentTheme.primary}
                to={currentTheme.accent}
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(22px, 1.2vw + 16px, 30px)',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <AutoStories style={{ fontSize: '0.95em', color: currentTheme.primary }} />
                {t('Lesen')}
              </GradientText>
              <p className="bk-deck-sub" style={{ color: currentTheme.text.secondary }}>
                {t('Bücher und Manga an einem Ort')}
              </p>
            </div>
          </div>
          <div className="bk-deck-row">
            {[
              {
                key: 'books',
                icon: <LocalLibrary />,
                label: t('Bücher'),
                value: bookCount,
                to: '/books',
              },
              {
                key: 'manga',
                icon: <MenuBook />,
                label: 'Manga',
                value: mangaCount,
                to: '/manga',
              },
            ].map((tile) => (
              <motion.button
                key={tile.key}
                type="button"
                whileTap={tapScaleSmall}
                className="bk-pod"
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  gap: 10,
                  padding: '10px 14px',
                }}
                onClick={() => navigate(tile.to, { replace: true })}
              >
                <span style={{ color: currentTheme.primary, display: 'flex' }}>{tile.icon}</span>
                <span
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
                >
                  <span className="bk-pod-value" style={{ color: currentTheme.text.secondary }}>
                    {tile.value}
                  </span>
                  <span className="bk-pod-label" style={{ color: currentTheme.text.muted }}>
                    {tile.label}
                  </span>
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      </header>

      <ReadingOverviewSections data={overview} />
    </div>
  );
};
