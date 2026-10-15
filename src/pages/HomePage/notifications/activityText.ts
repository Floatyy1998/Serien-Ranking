import {
  countByAction,
  type ActivityAction,
  type ActivityBundle,
  type ActivityMedia,
  type BundledTitle,
} from '../../../lib/social/activityBundles';
import { dateLocale, t } from '../../../services/i18n';

export const formatActivityRating = (title: BundledTitle): string | null =>
  title.rating ? `${title.rating}/10` : null;

export const titleSentence = (title: BundledTitle): string => {
  const name = title.title || t('Unbekannt');
  switch (title.actions[0]) {
    case 'rated': {
      const rating = formatActivityRating(title);
      const base = t('hat "{title}" bewertet', { title: name });
      return rating ? `${base} (${rating})` : base;
    }
    case 'finished':
      return t('hat "{title}" fertig gelesen', { title: name });
    case 'watchlist':
      return t('hat "{title}" auf die Watchlist gesetzt', { title: name });
    default:
      return t('hat "{title}" hinzugefügt', { title: name });
  }
};

const LEAD: Record<ActivityAction, (n: number) => string> = {
  added: (n) => t('hat {n} Titel hinzugefügt', { n }),
  rated: (n) => t('hat {n} Titel bewertet', { n }),
  watchlist: (n) => t('hat {n} Titel auf die Watchlist gesetzt', { n }),
  finished: (n) => t('hat {n} Titel fertig gelesen', { n }),
};

const TAIL: Record<ActivityAction, (n: number) => string> = {
  added: (n) => t('{n} hinzugefügt', { n }),
  rated: (n) => t('{n} bewertet', { n }),
  watchlist: (n) => t('{n} auf der Watchlist', { n }),
  finished: (n) => t('{n} fertig gelesen', { n }),
};

/** „hat 11 Titel hinzugefügt · 2 bewertet" bzw. der Satz zum einzelnen Titel. */
export const bundleSentence = (bundle: ActivityBundle): string => {
  if (bundle.titles.length === 1) return titleSentence(bundle.titles[0]);
  const [first, ...rest] = countByAction(bundle);
  return [LEAD[first[0]](first[1]), ...rest.map(([action, n]) => TAIL[action](n))].join(' · ');
};

export const actionLabel = (
  action: Exclude<ActivityAction, 'added'>,
  title: BundledTitle
): string => {
  switch (action) {
    case 'rated':
      return formatActivityRating(title) ?? t('bewertet');
    case 'finished':
      return t('ausgelesen');
    default:
      return t('Watchlist');
  }
};

const MEDIA_ORDER: ActivityMedia[] = ['series', 'movie', 'manga', 'book'];

const MEDIA_COUNT: Record<ActivityMedia, (n: number) => string> = {
  series: (n) => (n === 1 ? t('1 Serie') : t('{n} Serien', { n })),
  movie: (n) => (n === 1 ? t('1 Film') : t('{n} Filme', { n })),
  manga: (n) => (n === 1 ? t('1 Manga') : t('{n} Manga', { n })),
  book: (n) => (n === 1 ? t('1 Buch') : t('{n} Bücher', { n })),
};

/** „6 Serien", „3 Filme" … je Medium eines Bündels. */
export const mediaBreakdown = (bundle: ActivityBundle): { media: ActivityMedia; label: string }[] =>
  MEDIA_ORDER.flatMap((media) => {
    const n = bundle.titles.filter((title) => title.media === media).length;
    return n ? [{ media, label: MEDIA_COUNT[media](n) }] : [];
  });

/** Ab dieser Spanne zeigt die Karte Anfang und Ende statt nur „vor 50 Min". */
export const BUNDLE_SPAN_MIN_MS = 15 * 60_000;

/** „13:20–14:12" bzw. „Mo., 22:10 – Di., 01:05" — null, wenn alles in einem Rutsch kam. */
export const bundleTimeRange = (bundle: ActivityBundle): string | null => {
  if (bundle.latest - bundle.earliest < BUNDLE_SPAN_MIN_MS) return null;
  const start = new Date(bundle.earliest);
  const end = new Date(bundle.latest);
  const sameDay = start.toDateString() === end.toDateString();
  const format = new Intl.DateTimeFormat(dateLocale(), {
    ...(sameDay ? {} : { weekday: 'short' as const }),
    hour: '2-digit',
    minute: '2-digit',
  });
  return sameDay
    ? `${format.format(start)}–${format.format(end)}`
    : `${format.format(start)} – ${format.format(end)}`;
};

/** Wann ein einzelner Titel dazukam: „14:05", „Gestern 14:05" oder „Mo., 14:05". */
export const titleTime = (timestamp: number, now: number = Date.now()): string => {
  const at = new Date(timestamp);
  const clock = new Intl.DateTimeFormat(dateLocale(), { hour: '2-digit', minute: '2-digit' });
  const today = new Date(now);
  if (at.toDateString() === today.toDateString()) return clock.format(at);
  today.setDate(today.getDate() - 1);
  if (at.toDateString() === today.toDateString()) return `${t('Gestern')} ${clock.format(at)}`;
  return new Intl.DateTimeFormat(dateLocale(), {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(at);
};

export const mediaLabel = (title: BundledTitle): string =>
  title.media === 'movie'
    ? t('Film')
    : title.media === 'manga'
      ? t('Manga')
      : title.media === 'book'
        ? t('Buch')
        : t('Serie');
