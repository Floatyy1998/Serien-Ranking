import { AutoStories, LocalLibrary } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import { tapScaleSmall } from '../../../lib/motion';
import { t } from '../../../services/i18n';
import { useReadingOverview } from '../../Books/hooks/useReadingOverview';
import { ReadingOverviewSections } from '../../Books/sections/ReadingOverviewSections';
import { ActivityMarquee } from '../cards/ActivityMarquee';
import type { HomeConfig } from '../hooks/useHomeConfig';
import { QuickActionsSection, SecondaryActionsSection } from './HomeActionSections';

/** Entdecken und Verlauf zeigen nur Serien und Filme — hier stattdessen Freunde und Aktivität. */
const READER_QUICK_ACTIONS = {
  quickActionsOrder: ['friends', 'activity', 'ratings'],
  hiddenQuickActions: [],
};

/** Startseite beim Schwerpunkt „Manga & Bücher": Lese-Übersicht plus Freunde, Bestenliste, Badges, Pet. */
export const ReadingHomeSections = ({ config }: { config: HomeConfig }) => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const overview = useReadingOverview();
  const empty = overview.bookCount === 0 && overview.mangaCount === 0;

  return (
    <>
      <ActivityMarquee />
      <QuickActionsSection config={READER_QUICK_ACTIONS} navigate={navigate} />
      {empty ? (
        <section className="bk-section bk-pad">
          <div
            className="liquid-glass"
            style={{
              borderRadius: 20,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div style={{ color: currentTheme.text.secondary, fontWeight: 700, fontSize: 17 }}>
              {t('Was liest du gerade?')}
            </div>
            <div style={{ color: currentTheme.text.muted, fontSize: 14, lineHeight: 1.5 }}>
              {t(
                'Leg dein erstes Buch oder deinen ersten Manga an – hier siehst du dann deinen Lesestand.'
              )}
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[
                {
                  key: 'books',
                  icon: <LocalLibrary />,
                  label: t('Bücher suchen'),
                  to: '/books/search',
                },
                {
                  key: 'manga',
                  icon: <AutoStories />,
                  label: t('Manga suchen'),
                  to: '/manga/search',
                },
              ].map((action) => (
                <motion.button
                  key={action.key}
                  type="button"
                  whileTap={tapScaleSmall}
                  className="bk-pod"
                  onClick={() => navigate(action.to)}
                  style={{
                    flex: '1 1 140px',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '12px 14px',
                    color: currentTheme.text.secondary,
                    fontWeight: 600,
                  }}
                >
                  <span style={{ color: currentTheme.primary, display: 'flex' }}>
                    {action.icon}
                  </span>
                  {action.label}
                </motion.button>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <ReadingOverviewSections data={overview} />
      )}
      <SecondaryActionsSection config={config} navigate={navigate} />
    </>
  );
};
