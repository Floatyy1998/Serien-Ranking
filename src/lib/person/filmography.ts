import { t } from '../../services/i18n';

export type CreditMediaType = 'series' | 'movie';

export interface TmdbPersonCredit {
  id: number;
  media_type?: string;
  adult?: boolean;
  video?: boolean;
  title?: string;
  name?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  popularity?: number;
  vote_average?: number;
  vote_count?: number;
  genre_ids?: number[];
  character?: string;
  episode_count?: number;
  order?: number;
  job?: string;
  department?: string;
}

export interface FilmographyEntry {
  key: string;
  id: number;
  type: CreditMediaType;
  title: string;
  posterPath?: string;
  backdropPath?: string;
  date: string;
  year: string;
  popularity: number;
  voteAverage: number;
  voteCount: number;
  characters: string[];
  jobs: string[];
  episodeCount: number;
  acting: boolean;
  score: number;
}

export type FilmographySort = 'known' | 'newest';

const EXCLUDED_TV_GENRES = new Set([10763, 10764, 10767]);
const SELF_ROLE = /^(self|himself|herself|themselves)\b|\(archive footage\)/i;
const KEY_JOBS = new Set([
  'Director',
  'Creator',
  'Screenplay',
  'Writer',
  'Teleplay',
  'Novel',
  'Story',
  'Idea',
  'Original Music Composer',
]);
const PRODUCER_JOBS = new Set(['Producer', 'Executive Producer', 'Co-Producer']);
const IGNORED_JOBS = new Set(['Thanks', 'Special Thanks', 'In Memory Of']);

function creditWeight(credit: TmdbPersonCredit, isCast: boolean): number {
  if (isCast) {
    if (credit.media_type === 'tv') {
      const episodes = credit.episode_count ?? 0;
      return episodes >= 8 ? 1 : episodes >= 3 ? 0.6 : 0.3;
    }
    const order = credit.order;
    if (order === undefined) return 0.6;
    return order <= 4 ? 1 : order <= 12 ? 0.6 : 0.35;
  }
  if (KEY_JOBS.has(credit.job || '')) return 1;
  return PRODUCER_JOBS.has(credit.job || '') ? 0.4 : 0.25;
}

function isRelevant(credit: TmdbPersonCredit, isCast: boolean): boolean {
  if (credit.adult || credit.video) return false;
  if (credit.media_type !== 'tv' && credit.media_type !== 'movie') return false;
  if (!(credit.title || credit.name)) return false;
  if (credit.media_type === 'tv' && credit.genre_ids?.some((g) => EXCLUDED_TV_GENRES.has(g))) {
    return false;
  }
  if (!isCast) return !IGNORED_JOBS.has(credit.job || '');
  return !SELF_ROLE.test((credit.character || '').trim());
}

export function buildFilmography(
  cast: TmdbPersonCredit[] = [],
  crew: TmdbPersonCredit[] = []
): FilmographyEntry[] {
  const entries = new Map<string, FilmographyEntry>();
  const add = (credit: TmdbPersonCredit, isCast: boolean) => {
    if (!isRelevant(credit, isCast)) return;
    const type: CreditMediaType = credit.media_type === 'tv' ? 'series' : 'movie';
    const key = `${type}-${credit.id}`;
    const weight = creditWeight(credit, isCast);
    const voteCount = credit.vote_count ?? 0;
    let entry = entries.get(key);
    if (!entry) {
      const date = (type === 'series' ? credit.first_air_date : credit.release_date) || '';
      entry = {
        key,
        id: credit.id,
        type,
        title:
          (type === 'series' ? credit.name || credit.title : credit.title || credit.name) || '',
        posterPath: credit.poster_path || undefined,
        backdropPath: credit.backdrop_path || undefined,
        date,
        year: date.slice(0, 4),
        popularity: credit.popularity ?? 0,
        voteAverage: credit.vote_average ?? 0,
        voteCount,
        characters: [],
        jobs: [],
        episodeCount: 0,
        acting: false,
        score: 0,
      };
      entries.set(key, entry);
    }
    if (isCast) {
      entry.acting = true;
      const character = (credit.character || '').trim();
      if (character && !entry.characters.includes(character)) entry.characters.push(character);
      entry.episodeCount = Math.max(entry.episodeCount, credit.episode_count ?? 0);
    } else if (credit.job && !entry.jobs.includes(credit.job)) {
      entry.jobs.push(credit.job);
    }
    entry.score = Math.max(entry.score, weight * voteCount);
  };
  cast.forEach((c) => add(c, true));
  crew.forEach((c) => add(c, false));
  return [...entries.values()];
}

export function sortFilmography(
  entries: FilmographyEntry[],
  sort: FilmographySort
): FilmographyEntry[] {
  const list = [...entries];
  if (sort === 'newest') {
    return list.sort((a, b) => {
      if (!a.date !== !b.date) return a.date ? -1 : 1;
      return b.date.localeCompare(a.date) || b.popularity - a.popularity;
    });
  }
  return list.sort((a, b) => b.score - a.score || b.popularity - a.popularity);
}

export function pickHeroBackdrop(entries: FilmographyEntry[]): string | undefined {
  return sortFilmography(
    entries.filter((e) => e.backdropPath),
    'known'
  )[0]?.backdropPath;
}

export function ageInYears(birthday?: string | null, until?: string | null): number | null {
  if (!birthday) return null;
  const born = new Date(`${birthday}T00:00:00`);
  const end = until ? new Date(`${until}T00:00:00`) : new Date();
  if (Number.isNaN(born.getTime()) || Number.isNaN(end.getTime())) return null;
  let age = end.getFullYear() - born.getFullYear();
  const beforeBirthday =
    end.getMonth() < born.getMonth() ||
    (end.getMonth() === born.getMonth() && end.getDate() < born.getDate());
  if (beforeBirthday) age -= 1;
  return age >= 0 ? age : null;
}

const JOB_LABELS: Record<string, () => string> = {
  Director: () => t('Regie'),
  Screenplay: () => t('Drehbuch'),
  Writer: () => t('Drehbuch'),
  Teleplay: () => t('Drehbuch'),
  Creator: () => t('Idee'),
  Story: () => t('Idee'),
  Idea: () => t('Idee'),
  Characters: () => t('Figuren'),
  Novel: () => t('Romanvorlage'),
  Producer: () => t('Produktion'),
  'Executive Producer': () => t('Ausführende Produktion'),
  'Co-Producer': () => t('Produktion'),
  'Original Music Composer': () => t('Musik'),
  Music: () => t('Musik'),
  'Director of Photography': () => t('Kamera'),
  Editor: () => t('Schnitt'),
};

const DEPARTMENT_LABELS: Record<string, () => string> = {
  Acting: () => t('Schauspiel'),
  Directing: () => t('Regie'),
  Writing: () => t('Drehbuch'),
  Production: () => t('Produktion'),
  Sound: () => t('Musik'),
  Camera: () => t('Kamera'),
  Editing: () => t('Schnitt'),
  Art: () => t('Szenenbild'),
  'Costume & Make-Up': () => t('Kostüm & Maske'),
  'Visual Effects': () => t('Visuelle Effekte'),
};

export const jobLabel = (job: string): string => JOB_LABELS[job]?.() ?? job;

export const departmentLabel = (department?: string): string =>
  department ? (DEPARTMENT_LABELS[department]?.() ?? department) : '';

export function roleLine(entry: FilmographyEntry): string {
  if (entry.characters.length > 0) return t('als {rolle}', { rolle: entry.characters[0] });
  if (entry.jobs.length > 0) {
    return [...new Set(entry.jobs.map(jobLabel))].join(', ');
  }
  return '';
}
