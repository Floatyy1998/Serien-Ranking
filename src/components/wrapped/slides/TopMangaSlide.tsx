import React from 'react';
import { dateLocale, t } from '../../../services/i18n';
import type { MangaWrappedStats, TopMangaEntry } from '../../../types/Wrapped';
import { TopList, type SlideProps } from '../kit';
import { fmt } from '../kitHelpers';

const monthName = (month: number) =>
  new Date(2000, month, 1).toLocaleDateString(dateLocale(), { month: 'long' });

const amount = (entry: TopMangaEntry): string =>
  [
    entry.chapters > 0 ? t('{n} Kapitel', { n: entry.chapters }) : '',
    entry.volumes ? (entry.volumes === 1 ? t('1 Band') : t('{n} Bände', { n: entry.volumes })) : '',
  ]
    .filter(Boolean)
    .join(', ');

export const TopMangaSlide: React.FC<{ manga: MangaWrappedStats } & SlideProps> = ({
  manga,
  active,
}) => {
  const [top, ...rest] = manga.topManga.slice(0, 5);
  if (!top) return null;
  const byChapters = manga.totalChapters > 0;
  const total = byChapters
    ? `${fmt(manga.totalChapters)} ${t('Kapitel aus {n} Manga gelesen', { n: manga.uniqueManga })}`
    : `${fmt(manga.totalVolumes ?? 0)} ${t('Bände aus {n} Manga gelesen', { n: manga.uniqueManga })}`;
  const month = byChapters
    ? t('Lesemonat: {month} mit {n} Kapiteln', {
        month: monthName(manga.mostReadMonth),
        n: manga.mostReadMonthChapters,
      })
    : t('Lesemonat: {month} mit {n} Bänden', {
        month: monthName(manga.mostReadMonth),
        n: manga.mostReadMonthVolumes ?? 0,
      });
  return (
    <TopList
      active={active}
      kicker={t('Deine Top Manga')}
      hero={{ key: top.anilistId, title: top.title, heroImage: top.poster, value: amount(top) }}
      rest={rest.map((m) => ({
        key: m.anilistId,
        title: m.title,
        image: m.poster,
        value: amount(m),
      }))}
      note={`${total}. ${month}`}
    />
  );
};

export default TopMangaSlide;
