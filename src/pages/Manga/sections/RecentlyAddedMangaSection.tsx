import { LibraryAdd } from '@mui/icons-material';
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMangaList } from '../../../contexts/MangaListContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { mangaProgressPercent } from '../../../lib/manga/overview';
import { t } from '../../../services/i18n';
import { MangaPosterCard } from '../components/MangaPosterCard';
import { MangaPosterRow } from '../components/MangaPosterRow';
import { formatRelativeDay } from '../mangaUtils';

export const RecentlyAddedMangaSection: React.FC = React.memo(() => {
  const { mangaList } = useMangaList();
  const { currentTheme } = useTheme();
  const navigate = useNavigate();

  const [mountTime] = useState(() => Date.now());
  const recentManga = useMemo(() => {
    const fourteenDaysAgo = mountTime - 14 * 24 * 60 * 60 * 1000;
    return mangaList
      .filter((m) => m.addedAt && new Date(m.addedAt).getTime() > fourteenDaysAgo)
      .sort((a, b) => new Date(b.addedAt || '').getTime() - new Date(a.addedAt || '').getTime())
      .slice(0, 15);
  }, [mangaList, mountTime]);

  if (recentManga.length === 0) return null;

  return (
    <MangaPosterRow
      count={recentManga.length}
      icon={<LibraryAdd />}
      iconColor={currentTheme.accent}
      title={t('Kürzlich hinzugefügt')}
    >
      {recentManga.map((manga) => (
        <MangaPosterCard
          key={manga.anilistId}
          title={manga.title}
          poster={manga.poster}
          format={manga.format}
          countryOfOrigin={manga.countryOfOrigin}
          meta={manga.addedAt ? formatRelativeDay(manga.addedAt, mountTime) : undefined}
          progress={mangaProgressPercent(manga)}
          onClick={() => navigate(`/manga/${manga.anilistId}`)}
        />
      ))}
    </MangaPosterRow>
  );
});
