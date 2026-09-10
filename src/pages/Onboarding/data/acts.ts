/** Die Akte des Onboardings — Reihenfolge und Beschriftung des Programms. */
export type ActStep = 'welcome' | 'series' | 'movies' | 'subscriptions' | 'pet' | 'done';

export const ACTS: { key: ActStep; num: string; label: string; sub: string }[] = [
  { key: 'welcome', num: '01', label: 'Kuration', sub: 'Richtungen wählen' },
  { key: 'series', num: '02', label: 'Serien', sub: 'Deine Favoriten' },
  { key: 'movies', num: '03', label: 'Filme', sub: 'Kino-Highlights' },
  { key: 'subscriptions', num: '04', label: 'Abos', sub: 'Was streamst du' },
  { key: 'pet', num: '05', label: 'Pet', sub: 'Dein Begleiter' },
  { key: 'done', num: '06', label: 'Premiere', sub: 'Vorhang auf' },
];

export const ACT_COUNT = ACTS.length;
