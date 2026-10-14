import {
  countByAction,
  type ActivityAction,
  type ActivityBundle,
  type BundledTitle,
} from '../../../lib/social/activityBundles';
import { dateLocale, t } from '../../../services/i18n';

export const formatActivityRating = (title: BundledTitle): string | null => {
  if (!title.rating) return null;
  if (title.media === 'book') {
    return t('{n} von 5 Sternen', { n: (title.rating / 2).toLocaleString(dateLocale()) });
  }
  return `${title.rating}/10`;
};

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

export const mediaLabel = (title: BundledTitle): string =>
  title.media === 'movie'
    ? t('Film')
    : title.media === 'manga'
      ? t('Manga')
      : title.media === 'book'
        ? t('Buch')
        : t('Serie');
