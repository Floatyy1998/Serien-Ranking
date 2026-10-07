import { BookmarkBorder } from '@mui/icons-material';
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMangaList } from '../../../contexts/MangaListContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { getUpNext, mangaTotalChapters } from '../../../lib/manga/overview';
import { t } from '../../../services/i18n';
import { MangaPosterCard } from '../components/MangaPosterCard';
import { MangaPosterRow } from '../components/MangaPosterRow';

export const UpNextSection: React.FC = React.memo(() => {
  const { mangaList } = useMangaList();
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const planned = useMemo(() => getUpNext(mangaList).slice(0, 20), [mangaList]);

  if (planned.length === 0) return null;

  return (
    <MangaPosterRow
      count={planned.length}
      icon={<BookmarkBorder />}
      iconColor={currentTheme.secondary || currentTheme.accent}
      title={t('Als Nächstes lesen')}
      onSeeAll={() => navigate('/manga/reading-list')}
    >
      {planned.map((manga) => {
        const total = mangaTotalChapters(manga);
        return (
          <MangaPosterCard
            key={manga.anilistId}
            title={manga.title}
            poster={manga.poster}
            format={manga.format}
            countryOfOrigin={manga.countryOfOrigin}
            score={manga.averageScore ? (manga.averageScore / 10).toFixed(1) : undefined}
            meta={total > 0 ? t('{n} Kapitel', { n: total }) : manga.genres?.[0]}
            onClick={() => navigate(`/manga/${manga.anilistId}`)}
          />
        );
      })}
    </MangaPosterRow>
  );
});
