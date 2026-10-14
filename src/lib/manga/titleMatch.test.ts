import { describe, expect, it } from 'vitest';
import {
  findExactTitleMatch,
  hasDirectTitleMatch,
  hasLeadingTitleMatch,
  matchesMangaTitle,
  pickRelevantAliasHits,
  sortExactTitleFirst,
} from './titleMatch';

const werewolves = {
  id: 180320,
  title: {
    romaji: 'Werewolves: Hyanggie Ikkeullin Neukdaedeul',
    english: 'Werewolves Going Crazy Over Me',
    native: null,
  },
  synonyms: ['La Bien-aimée des loups-garous', 'Aullidos de pasión'],
};

const beau = {
  id: 130861,
  title: { romaji: 'Minamgwa Yasu', english: 'The Beau and the Beast', native: null },
};

describe('matchesMangaTitle', () => {
  it('trifft englischen Titel unabhängig von Groß-/Kleinschreibung und Satzzeichen', () => {
    expect(matchesMangaTitle(werewolves, 'werewolves going crazy over me!')).toBe(true);
  });

  it('trifft Synonyme ohne Akzente', () => {
    expect(matchesMangaTitle(werewolves, 'la bien aimee des loups garous')).toBe(true);
  });

  it('lässt Teiltreffer erst ab 4 Zeichen gelten', () => {
    expect(matchesMangaTitle(werewolves, 'Werewolves')).toBe(true);
    expect(matchesMangaTitle(beau, 'The')).toBe(false);
  });

  it('trifft deutsche Webtoon-Titel nicht, die AniList nicht kennt', () => {
    expect(matchesMangaTitle(werewolves, 'Werwölfe sind verrückt nach mir')).toBe(false);
  });

  it('ignoriert leere Eingaben', () => {
    expect(matchesMangaTitle(beau, ' - ')).toBe(false);
  });
});

describe('hasDirectTitleMatch', () => {
  it('erkennt, ob irgendein Ergebnis direkt passt', () => {
    expect(hasDirectTitleMatch([beau, werewolves], 'Beau and the Beast')).toBe(true);
    expect(hasDirectTitleMatch([beau, werewolves], 'Der Schöne und das Biest')).toBe(false);
    expect(hasDirectTitleMatch([], 'Beau')).toBe(false);
  });
});

describe('hasLeadingTitleMatch', () => {
  const notYet = {
    title: { romaji: 'Sagwineun Geon Anya', english: 'Not Boyfriends Yet', native: null },
  };

  it('zählt nur Titel, die mit der Eingabe beginnen', () => {
    expect(hasLeadingTitleMatch([werewolves], 'Werewolves Going')).toBe(true);
    expect(hasLeadingTitleMatch([notYet], 'Boyfriends')).toBe(false);
    expect(hasLeadingTitleMatch([notYet], ' ')).toBe(false);
  });
});

describe('sortExactTitleFirst', () => {
  it('zieht exakte Titeltreffer stabil nach vorn', () => {
    const a = { title: { romaji: 'A', english: 'Not Boyfriends Yet', native: null } };
    const b = { title: { romaji: 'B', english: 'Boyfriends.', native: null } };
    const c = { title: { romaji: 'C', english: 'Alpha Boyfriends', native: null } };
    expect(sortExactTitleFirst([a, b, c], 'boyfriends')).toEqual([b, a, c]);
  });
});

describe('findExactTitleMatch', () => {
  it('liefert nur exakte Titeltreffer', () => {
    expect(findExactTitleMatch([werewolves, beau], 'The Beau and the Beast')).toBe(beau);
    expect(findExactTitleMatch([werewolves, beau], 'The Beau')).toBeNull();
  });

  it('gleicht auch Romaji-Titel ab', () => {
    expect(findExactTitleMatch([beau], 'Minamgwa Yasu')).toBe(beau);
  });
});

describe('pickRelevantAliasHits', () => {
  const hits = [
    { title: 'Werewolves Going Crazy Over Me', hitTitle: 'Werwölfe sind verrückt nach mir' },
    {
      title: 'Cool na Otto wo Koi ni Otosu Houhou',
      hitTitle: 'Wie ich meinen Ehemann verrückt nach mir mache',
    },
    { title: 'Werewolves Going Crazy Over Me', hitTitle: 'Werewolves Going Crazy Over Me' },
  ];

  it('behält nur Treffer, deren gefundener Titel zur Eingabe passt', () => {
    expect(pickRelevantAliasHits(hits, 'Werwölfe sind verrückt nach mir')).toEqual([hits[0]]);
  });

  it('akzeptiert Teiltreffer und entfernt doppelte Haupttitel', () => {
    expect(pickRelevantAliasHits(hits, 'werwolfe')).toEqual([hits[0]]);
  });

  it('behält verschiedene Serien gleichen Titels, wenn ihre IDs bekannt sind', () => {
    const sameTitle = [
      { id: 1, title: 'Boyfriends.', hitTitle: 'Boyfriends.' },
      { id: 2, title: 'Boyfriends', hitTitle: 'Boyfriends' },
      { id: 1, title: 'Boyfriends.', hitTitle: 'Boyfriends.' },
    ];
    expect(pickRelevantAliasHits(sameTitle, 'Boyfriends')).toEqual(sameTitle.slice(0, 2));
  });

  it('zieht exakte Titeltreffer vor die Begrenzung', () => {
    const ranked = [
      ...Array.from({ length: 6 }, (_, i) => ({
        id: i + 1,
        title: `Boyfriends Story ${i}`,
        hitTitle: `Boyfriends Story ${i}`,
      })),
      { id: 99, title: 'Boyfriends.', hitTitle: 'Boyfriends.' },
    ];
    expect(pickRelevantAliasHits(ranked, 'boyfriends')[0].id).toBe(99);
  });

  it('begrenzt die Anzahl', () => {
    const many = Array.from({ length: 8 }, (_, i) => ({
      title: `Biest ${i}`,
      hitTitle: `Das Biest ${i}`,
    }));
    expect(pickRelevantAliasHits(many, 'Biest', 3)).toHaveLength(3);
  });
});
