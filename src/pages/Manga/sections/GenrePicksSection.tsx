import { AutoAwesome } from '@mui/icons-material';
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useMangaList } from '../../../contexts/MangaListContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useMangaGenrePicks } from '../../../hooks/manga/useMangaGenrePicks';
import { getTopGenres } from '../../../lib/manga/overview';
import { t } from '../../../services/i18n';
import { MangaPosterCard } from '../components/MangaPosterCard';
import { MangaPosterRow } from '../components/MangaPosterRow';

export const GenrePicksSection: React.FC = React.memo(() => {
  const { mangaList, hiddenMangaList } = useMangaList();
  const { user } = useAuth() || {};
  const { currentTheme } = useTheme();
  const navigate = useNavigate();

  const topGenres = useMemo(() => getTopGenres(mangaList, user?.uid, 3), [mangaList, user?.uid]);
  const [pick, setPick] = useState(0);
  const genre = topGenres[Math.min(pick, topGenres.length - 1)];
  const ownedIds = useMemo(
    () => new Set([...mangaList, ...hiddenMangaList].map((m) => m.anilistId)),
    [mangaList, hiddenMangaList]
  );
  const items = useMangaGenrePicks(genre, ownedIds);

  if (!genre || items.length === 0) return null;

  return (
    <MangaPosterRow
      icon={<AutoAwesome />}
      iconColor={currentTheme.primary}
      title={t('Weil du {genre} magst', { genre })}
      subheader={
        topGenres.length > 1 ? (
          <div className="manga-pill-row" role="tablist" aria-label={t('Genre wählen')}>
            {topGenres.map((g, i) => (
              <button
                key={g}
                type="button"
                role="tab"
                aria-selected={g === genre}
                className={`manga-pill ${g === genre ? 'manga-pill--active' : ''}`}
                onClick={() => setPick(i)}
              >
                {g}
              </button>
            ))}
          </div>
        ) : undefined
      }
    >
      {items.map((item) => (
        <MangaPosterCard
          key={item.id}
          title={item.title.english || item.title.romaji}
          poster={item.coverImage.large}
          format={item.format}
          countryOfOrigin={item.countryOfOrigin}
          score={item.averageScore ? (item.averageScore / 10).toFixed(1) : undefined}
          meta={item.genres
            ?.filter((g) => g !== genre)
            .slice(0, 2)
            .join(', ')}
          onClick={() => navigate(`/manga/${item.id}`)}
        />
      ))}
    </MangaPosterRow>
  );
});
