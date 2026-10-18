import { FiberNew } from '@mui/icons-material';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMangaList } from '../../../contexts/MangaListContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { coverAtSize } from '../../../lib/books/bookSearchMapping';
import { PLACEHOLDER_SVG } from '../../../lib/image/posterPlaceholder';
import { getNewChapterEntries } from '../../../lib/manga/overview';
import { t } from '../../../services/i18n';
import { useOpenByTitle, useOpenResult } from '../../Books/discover/DiscoverParts';
import type { SeriesProgress } from '../../Books/hooks/useNextVolumes';
import { useSeriesPartBooks } from '../../Books/hooks/useSeriesPartBooks';
import { MangaPosterCard } from '../../Manga/components/MangaPosterCard';
import { MangaPosterRow } from '../../Manga/components/MangaPosterRow';
import { formatRelativeDay } from '../../Manga/mangaUtils';

interface NewForYouRowProps {
  showBooks: boolean;
  showManga: boolean;
  /** Nächste Bände deiner Buchreihen (aus `useBookSections`). */
  nextVolumes: SeriesProgress[];
}

const volumeState = (next: SeriesProgress['next']): string =>
  next.state === 'upcoming' && next.daysUntil
    ? next.daysUntil === 1
      ? t('Erscheint morgen')
      : t('Erscheint in {n} Tagen', { n: next.daysUntil })
    : next.state === 'available'
      ? t('Schon erschienen')
      : t('Termin offen');

/** Neu für dich: frische Manga-Kapitel und der nächste Band deiner Buchreihen in einer Reihe. */
export const NewForYouRow = ({ showBooks, showManga, nextVolumes }: NewForYouRowProps) => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const { mangaList } = useMangaList();
  const [now] = useState(() => Date.now());
  const chapters = useMemo(
    () => (showManga ? getNewChapterEntries(mangaList, now) : []),
    [mangaList, now, showManga]
  );
  const volumes = useMemo(() => (showBooks ? nextVolumes : []), [showBooks, nextVolumes]);
  const lookups = useMemo(
    () => volumes.map((item) => ({ part: item.next.part, author: item.author })),
    [volumes]
  );
  const found = useSeriesPartBooks(lookups);
  const { open } = useOpenByTitle();
  const openResult = useOpenResult();

  if (chapters.length === 0 && volumes.length === 0) return null;

  return (
    <MangaPosterRow
      icon={<FiberNew />}
      iconColor={currentTheme.status?.success || currentTheme.accent}
      title={t('Neu für dich')}
      onSeeAll={chapters.length > 0 ? () => navigate('/manga/catch-up') : undefined}
    >
      {chapters.map(({ manga, unread, releasedAt }) => (
        <MangaPosterCard
          key={`m-${manga.anilistId}`}
          title={manga.title}
          poster={manga.poster}
          format={manga.format}
          countryOfOrigin={manga.countryOfOrigin}
          highlight={t('+{n} neu', { n: unread })}
          meta={t('Erschienen {when}', { when: formatRelativeDay(releasedAt) })}
          onClick={() => navigate(`/manga/${manga.anilistId}`)}
        />
      ))}
      {volumes.map((item) => {
        const { part } = item.next;
        const match = found[part.wikidataId];
        return (
          <MangaPosterCard
            key={`b-${item.seriesId}`}
            title={part.title}
            poster={coverAtSize(match?.cover, 'M') || match?.coverFallback || PLACEHOLDER_SVG}
            badge={t('Band {n}', { n: part.position })}
            highlight={item.next.state === 'available' ? t('Neu') : undefined}
            meta={volumeState(item.next)}
            onClick={() => (match ? openResult(match) : void open(part.title, item.author))}
          />
        );
      })}
    </MangaPosterRow>
  );
};
