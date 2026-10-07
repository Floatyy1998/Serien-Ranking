import {
  BarChart,
  Explore,
  History,
  MenuBook,
  Schedule,
  Star,
  Timeline,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMangaList } from '../../../contexts/MangaListContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { mangaUnreadChapters } from '../../../lib/manga/overview';
import { tapScale } from '../../../lib/motion';
import { t } from '../../../services/i18n';
import { MANGA_QUICK_ACTION_LABELS } from '../data/mangaSectionLabels';

interface MangaQuickActionsProps {
  order: string[];
  hidden: string[];
}

export const MangaQuickActions: React.FC<MangaQuickActionsProps> = React.memo(
  ({ order, hidden }) => {
    const { currentTheme } = useTheme();
    const { mangaList } = useMangaList();
    const navigate = useNavigate();

    const stats = useMemo(() => {
      let reading = 0;
      let chapters = 0;
      let open = 0;
      let rated = 0;
      for (const m of mangaList) {
        if (m.readStatus === 'reading') {
          reading += 1;
          open += mangaUnreadChapters(m);
        }
        chapters += m.currentChapter || 0;
        if (Object.keys(m.rating || {}).length > 0) rated += 1;
      }
      return { reading, chapters, open, rated };
    }, [mangaList]);

    const actions: Record<
      string,
      { icon: React.ReactNode; path: string; color: string; stat?: string }
    > = {
      'reading-list': {
        icon: <MenuBook />,
        path: '/manga/reading-list',
        color: currentTheme.primary,
        stat: stats.reading ? t('{n} aktiv', { n: stats.reading }) : undefined,
      },
      discover: {
        icon: <Explore />,
        path: '/manga/discover',
        color: currentTheme.status?.info?.main || currentTheme.accent,
      },
      ratings: {
        icon: <Star />,
        path: '/manga/ratings',
        color: currentTheme.status?.warning || currentTheme.accent,
        stat: stats.rated ? t('{n} bewertet', { n: stats.rated }) : undefined,
      },
      stats: {
        icon: <BarChart />,
        path: '/manga/stats',
        color: currentTheme.accent,
        stat: stats.chapters ? t('{n} Kap.', { n: stats.chapters }) : undefined,
      },
      journey: {
        icon: <Timeline />,
        path: '/manga/journey',
        color: currentTheme.status?.error || currentTheme.primary,
      },
      history: {
        icon: <History />,
        path: '/manga/recently-read',
        color: currentTheme.secondary || currentTheme.primary,
      },
      'catch-up': {
        icon: <Schedule />,
        path: '/manga/catch-up',
        color: currentTheme.status?.success || currentTheme.accent,
        stat: stats.open ? t('{n} offen', { n: stats.open }) : undefined,
      },
    };

    const visible = order.filter((id) => !hidden.includes(id) && actions[id]);
    if (visible.length === 0) return null;

    return (
      <nav className="manga-quick" aria-label={t('Schnellzugriff')}>
        {visible.map((id) => {
          const action = actions[id];
          return (
            <motion.button
              key={id}
              type="button"
              whileTap={tapScale}
              className="manga-quick-tile liquid-glass"
              onClick={() => navigate(action.path)}
              style={{ '--tile-color': action.color } as React.CSSProperties}
            >
              <span className="manga-quick-icon">{action.icon}</span>
              <span className="manga-quick-text">
                <span className="manga-quick-label">{MANGA_QUICK_ACTION_LABELS[id]}</span>
                {action.stat && (
                  <span className="manga-quick-stat" style={{ color: currentTheme.text.muted }}>
                    {action.stat}
                  </span>
                )}
              </span>
            </motion.button>
          );
        })}
      </nav>
    );
  }
);
