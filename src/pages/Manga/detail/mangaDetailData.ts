import { dateLocale, t } from '../../../services/i18n';
import type { AniListMangaSearchResult, Manga } from '../../../types/Manga';
import {
  ANILIST_STATUS_LABELS,
  getDisplayFormat,
  getDisplayFormatKey,
  getStatusLabel,
} from '../mangaUtils';

/** Alles, was Hero und Info-Sektionen zeigen — egal ob der Manga in der Sammlung ist. */
export interface MangaHeroData {
  anilistId: number;
  title: string;
  altTitle?: string;
  poster: string;
  banner?: string;
  formatLabel: string;
  formatKey: string;
  statusLabel: string;
  statusKey?: string;
  chapters: number | null;
  volumes: number | null;
  score: number | null;
  startLabel: string;
  year?: number;
  countryOfOrigin?: string;
  genres: string[];
  authors: string[];
  description: string;
}

export const COUNTRY_LABELS: Record<string, string> = {
  JP: t('Japan'),
  KR: t('Südkorea'),
  CN: t('China'),
  TW: t('Taiwan'),
};

export const RELATION_LABELS: Record<string, string> = {
  SEQUEL: t('Fortsetzung'),
  PREQUEL: t('Vorgeschichte'),
  SIDE_STORY: t('Nebengeschichte'),
  SPIN_OFF: t('Spin-off'),
  ALTERNATIVE: t('Alternative Version'),
  ADAPTATION: t('Adaption'),
  PARENT: t('Hauptgeschichte'),
  SUMMARY: t('Zusammenfassung'),
  SOURCE: t('Vorlage'),
  CHARACTER: t('Gleiche Figuren'),
  COMPILATION: t('Sammelband'),
  CONTAINS: t('Enthält'),
  OTHER: t('Sonstiges'),
};

/** AniList liefert HTML mit <br>, <i> und Quellenangaben — für die Anzeige glätten. */
export function cleanMangaDescription(raw: string | null | undefined): string {
  if (!raw) return '';
  const text = raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
  return text
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const formatStart = (year?: number | null, month?: number | null, day?: number | null) => {
  if (!year) return '';
  if (!month) return String(year);
  return new Date(year, month - 1, day || 1).toLocaleDateString(dateLocale(), {
    month: 'long',
    year: 'numeric',
  });
};

const parseIsoDate = (iso?: string) => {
  const match = iso?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? { year: +match[1], month: +match[2], day: +match[3] } : null;
};

const pickAuthors = (anilist: AniListMangaSearchResult | null): string[] => {
  const edges = anilist?.staff?.edges || [];
  const names: string[] = [];
  for (const edge of edges) {
    const role = edge.role.toLowerCase();
    if (!role.includes('story') && !role.includes('art')) continue;
    const name = edge.node.name.full;
    if (name && !names.includes(name)) names.push(name);
    if (names.length >= 2) break;
  }
  return names;
};

export function buildHeroData(
  anilistId: number,
  manga: Manga | undefined,
  anilist: AniListMangaSearchResult | null
): MangaHeroData {
  const title = manga?.title || anilist?.title.english || anilist?.title.romaji || '';
  const romaji = manga?.titleRomaji || anilist?.title.romaji || undefined;
  const country = manga?.countryOfOrigin || anilist?.countryOfOrigin;
  const format = manga?.format || anilist?.format;
  const start = anilist?.startDate?.year
    ? anilist.startDate
    : parseIsoDate(manga?.startDate || undefined);
  const statusKey = manga?.status || anilist?.status || undefined;
  const statusLabel = manga
    ? getStatusLabel(manga)
    : statusKey
      ? ANILIST_STATUS_LABELS[statusKey] || statusKey
      : '';

  return {
    anilistId,
    title,
    altTitle: romaji && romaji !== title ? romaji : undefined,
    poster: manga?.poster || anilist?.coverImage.large || '',
    banner: anilist?.bannerImage || manga?.bannerImage || undefined,
    formatLabel: getDisplayFormat(country, format),
    formatKey: getDisplayFormatKey(country, format),
    statusLabel,
    statusKey,
    chapters: anilist?.chapters ?? manga?.chapters ?? null,
    volumes: anilist?.volumes ?? manga?.volumes ?? null,
    score: anilist?.averageScore ?? manga?.averageScore ?? null,
    startLabel: formatStart(start?.year, start?.month, start?.day),
    year: start?.year || undefined,
    countryOfOrigin: country,
    genres: (anilist?.genres || manga?.genres || []).filter((g) => g && g.trim()),
    authors: pickAuthors(anilist),
    description: cleanMangaDescription(anilist?.description || manga?.description),
  };
}
