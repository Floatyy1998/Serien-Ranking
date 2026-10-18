import {
  BarChart,
  DynamicFeed,
  Group,
  Explore,
  History,
  LocalLibrary,
  MenuBook,
  Schedule,
  Star,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useBooksList } from '../../../contexts/BooksListContext';
import { useMangaList } from '../../../contexts/MangaListContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { readingQuickStats } from '../../../lib/reading/quickStats';
import { t } from '../../../services/i18n';
import './ReadingQuickActions.css';
import { READING_QUICK_ACTION_LABELS } from '../data/readingSectionLabels';

interface ReadingQuickActionsProps {
  order: string[];
  hidden: string[];
  showBooks: boolean;
  showManga: boolean;
}

/** Schnellzugriffe der Lesen-Seite: Freunde, Aktivität und die Lese-Seiten für Bücher und Manga zusammen. */
export const ReadingQuickActions: React.FC<ReadingQuickActionsProps> = React.memo(
  ({ order, hidden, showBooks, showManga }) => {
    const { currentTheme } = useTheme();
    const { user } = useAuth() || {};
    const { bookList } = useBooksList();
    const { mangaList } = useMangaList();
    const navigate = useNavigate();

    const stats = useMemo(
      () => readingQuickStats(showBooks ? bookList : [], showManga ? mangaList : [], user?.uid),
      [bookList, mangaList, showBooks, showManga, user?.uid]
    );

    const actions: Record<
      string,
      { icon: React.ReactNode; path: string; color: string; stat?: string; hint: string }
    > = {
      friends: {
        icon: <Group />,
        path: '/activity?tab=friends',
        hint: t('Deine Leute'),
        color: currentTheme.status.info.main,
      },
      activity: {
        icon: <DynamicFeed />,
        path: '/activity',
        hint: t('Was los ist'),
        color: currentTheme.primary,
      },
      'reading-list': {
        icon: <MenuBook />,
        path: '/reading/list',
        hint: t('Läuft gerade'),
        color: currentTheme.accent,
        stat: stats.reading ? t('{n} aktiv', { n: stats.reading }) : undefined,
      },
      library: {
        icon: <LocalLibrary />,
        path: '/reading/library',
        hint: t('Dein Regal'),
        color: currentTheme.status.warning,
        stat: stats.titles ? t('{n} Titel', { n: stats.titles }) : undefined,
      },
      discover: {
        icon: <Explore />,
        path: '/reading/discover',
        hint: t('Neues finden'),
        color: currentTheme.status.success,
      },
      ratings: {
        icon: <Star />,
        path: '/reading/ratings',
        hint: t('Wertungen'),
        color: currentTheme.status.warning,
        stat: stats.rated ? t('{n} bewertet', { n: stats.rated }) : undefined,
      },
      stats: {
        icon: <BarChart />,
        path: '/reading/stats',
        hint: t('Dein Lesejahr'),
        color: currentTheme.status.info.main,
        stat: stats.finished ? t('{n} beendet', { n: stats.finished }) : undefined,
      },
      history: {
        icon: <History />,
        path: '/reading/history',
        hint: t('Gelesenes'),
        color: currentTheme.status.error,
      },
      'catch-up': {
        icon: <Schedule />,
        path: '/reading/catch-up',
        hint: t('Was offen ist'),
        color: currentTheme.status.success,
        stat: stats.open ? t('{n} offen', { n: stats.open }) : undefined,
      },
    };

    const visible = order.filter((id) => !hidden.includes(id) && actions[id]);
    if (visible.length === 0) return null;

    return (
      <nav className="rqa" aria-label={t('Schnellzugriff')}>
        {visible.map((id) => {
          const action = actions[id];
          return (
            <motion.button
              key={id}
              type="button"
              whileTap={{ opacity: 0.7 }}
              className="rqa-tile"
              onClick={() => navigate(action.path)}
              style={{ '--rqa-color': action.color } as React.CSSProperties}
            >
              <span className="rqa-icon">{action.icon}</span>
              <span className="rqa-text">
                <span className="rqa-label" style={{ color: currentTheme.text.secondary }}>
                  {READING_QUICK_ACTION_LABELS[id]}
                </span>
                <span className="rqa-stat" style={{ color: currentTheme.text.muted }}>
                  {action.stat ?? action.hint}
                </span>
              </span>
            </motion.button>
          );
        })}
      </nav>
    );
  }
);
