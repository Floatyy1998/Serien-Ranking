import { FiberNew } from '@mui/icons-material';
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMangaList } from '../../../contexts/MangaListContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { getNewChapterEntries } from '../../../lib/manga/overview';
import { t } from '../../../services/i18n';
import { MangaPosterCard } from '../components/MangaPosterCard';
import { MangaPosterRow } from '../components/MangaPosterRow';
import { formatRelativeDay } from '../mangaUtils';

export const NewChaptersSection: React.FC = React.memo(() => {
  const { mangaList } = useMangaList();
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const [now] = useState(() => Date.now());
  const entries = useMemo(() => getNewChapterEntries(mangaList, now), [mangaList, now]);

  if (entries.length === 0) return null;

  return (
    <MangaPosterRow
      count={entries.length}
      icon={<FiberNew />}
      iconColor={currentTheme.status?.success || currentTheme.accent}
      title={t('Neue Kapitel')}
      onSeeAll={() => navigate('/manga/catch-up')}
    >
      {entries.map(({ manga, unread, releasedAt }) => (
        <MangaPosterCard
          key={manga.anilistId}
          title={manga.title}
          poster={manga.poster}
          format={manga.format}
          countryOfOrigin={manga.countryOfOrigin}
          highlight={t('+{n} neu', { n: unread })}
          meta={t('Erschienen {when}', { when: formatRelativeDay(releasedAt) })}
          onClick={() => navigate(`/manga/${manga.anilistId}`)}
        />
      ))}
    </MangaPosterRow>
  );
});
