import { describe, expect, it } from 'vitest';
import type { AniListMangaSearchResult, Manga } from '../../types/Manga';
import {
  anchoredVolumeGuess,
  groupMangaVolumes,
  mangaAsSearchResult,
  mangaVolumeGuess,
  matchSeries,
  pickSeriesMatch,
  splitVolume,
  type MangaLink,
} from './mangaVolume';

const anilist = (
  id: number,
  english: string,
  over: Partial<AniListMangaSearchResult> = {}
): AniListMangaSearchResult => ({
  id,
  title: { romaji: english, english, native: null },
  coverImage: { large: '', medium: '' },
  bannerImage: null,
  description: null,
  chapters: null,
  volumes: null,
  status: 'FINISHED',
  format: 'MANGA',
  countryOfOrigin: 'JP',
  genres: [],
  averageScore: null,
  startDate: { year: null, month: null, day: null },
  isAdult: false,
  ...over,
});

const comic = { categories: ['Comics & Graphic Novels'] };

describe('splitVolume', () => {
  it.each([
    ['One Piece 18', 'One Piece', 18],
    ['One Piece, Band 18', 'One Piece', 18],
    ['Spy x Family – Band 8', 'Spy x Family', 8],
    ['Spy x Family - Tome 1', 'Spy x Family', 1],
    ['SPY X FAMILY tom 9', 'SPY X FAMILY', 9],
    ['Spy x Family 02', 'Spy x Family', 2],
    ['Jujutsu Kaisen, Vol. 1', 'Jujutsu Kaisen', 1],
    ['Frieren – Nach dem Ende der Reise 3', 'Frieren – Nach dem Ende der Reise', 3],
    ['Spy x family 7 : mision 38', 'Spy x family', 7],
    ['One Piece 18: Ace', 'One Piece', 18],
    ['Re:Zero 3', 'Re:Zero', 3],
  ])('%s → %s, Band %d', (title, series, volume) => {
    expect(splitVolume(title)).toEqual({ series, volume });
  });

  it('lässt Titel ohne Bandangabe ganz', () => {
    expect(splitVolume('Naruto')).toEqual({ series: 'Naruto' });
    expect(splitVolume('Naruto (Sammelband)')).toEqual({ series: 'Naruto' });
    expect(splitVolume('Jujutsu Kaisen 0')).toEqual({ series: 'Jujutsu Kaisen 0' });
  });
});

describe('mangaVolumeGuess', () => {
  it('braucht ein Comic-Merkmal: Kategorie, DNB-Sachgruppe oder Manga-Verlag', () => {
    expect(mangaVolumeGuess({ id: 'a', title: 'One Piece 18', ...comic })).toEqual({
      series: 'One Piece',
      full: 'One Piece 18',
      volume: 18,
    });
    expect(
      mangaVolumeGuess({ id: 'b', title: 'Spy x family 15', categories: ['Comics'] })
    ).not.toBeNull();
    expect(
      mangaVolumeGuess({ id: 'c', title: 'Spy x Family – Band 16', publisher: 'Pegasus Manga' })
    ).not.toBeNull();
    expect(mangaVolumeGuess({ id: 'd', title: 'Der Herr der Ringe 1' })).toBeNull();
  });

  it('prüft ohne Merkmal nur im lockeren Modus (Manga-Suche per ISBN)', () => {
    expect(mangaVolumeGuess({ id: 'e', title: 'One Piece, Band 18' }, { loose: true })).toEqual({
      series: 'One Piece',
      full: 'One Piece, Band 18',
      volume: 18,
    });
  });

  it('lässt Romane und Light Novels Bücher bleiben', () => {
    expect(
      mangaVolumeGuess({
        id: 'f',
        title: 'One Piece - Heroines 1',
        subtitle: 'Novel zum Weltbestseller',
        ...comic,
      })
    ).toBeNull();
    expect(mangaVolumeGuess({ id: 'g', title: 'Overlord Light Novel 3', ...comic })).toBeNull();
    expect(
      mangaVolumeGuess({ id: 'h', title: 'Maus', subtitle: 'A Graphic Novel', ...comic })
    ).toEqual({ series: 'Maus' });
  });
});

describe('pickSeriesMatch', () => {
  const frieren = anilist(118586, 'Frieren: Beyond Journey’s End', {
    synonyms: ['Frieren – Nach dem Ende der Reise'],
  });
  const frierenNovel = anilist(179850, 'Frieren – Nach dem Ende der Reise', { format: 'NOVEL' });

  it('trifft auch über deutsche Synonyme und zieht Manga Romanen vor', () => {
    expect(pickSeriesMatch([frierenNovel, frieren], 'Frieren - Nach dem Ende der Reise')).toBe(
      frieren
    );
  });

  it('gleicht Satzzeichen an, nimmt aber keine Teiltreffer', () => {
    const kaiju = anilist(120760, 'Kaiju No.8');
    expect(pickSeriesMatch([kaiju], 'Kaiju No. 8')).toBe(kaiju);
    expect(pickSeriesMatch([kaiju], 'Kaiju')).toBeNull();
  });
});

describe('anchoredVolumeGuess', () => {
  const waneko = { id: 'w', title: 'Spy x family 2', publisher: 'Wydawnictwo W' };

  it('erkennt nummerierte Bände genau der gesuchten Reihe ohne Comic-Merkmal', () => {
    expect(anchoredVolumeGuess(waneko, 'Spy x Family')).toEqual({
      series: 'Spy x family',
      full: 'Spy x family 2',
      volume: 2,
    });
    expect(anchoredVolumeGuess(waneko, 'spy x family 7')).not.toBeNull();
    expect(anchoredVolumeGuess(waneko, '978-3-695-50430-5')).not.toBeNull();
  });

  it('rät nicht bei anderen Suchbegriffen oder Titeln ohne Bandnummer', () => {
    expect(anchoredVolumeGuess(waneko, 'Spy')).toBeNull();
    expect(anchoredVolumeGuess(waneko, undefined)).toBeNull();
    expect(anchoredVolumeGuess({ id: 'm', title: 'Les Misérables' }, 'Les Misérables')).toBeNull();
  });
});

describe('matchSeries', () => {
  it('markiert Reihen, die es gleichnamig als Manga und als Roman gibt', () => {
    const manga = anilist(1, 'Overlord');
    const novel = anilist(2, 'Overlord', { format: 'NOVEL' });
    expect(matchSeries([novel, manga], 'Overlord')).toEqual({ manga, ambiguous: true });
    expect(matchSeries([manga], 'Overlord')).toEqual({ manga, ambiguous: false });
  });
});

describe('groupMangaVolumes', () => {
  it('fasst Bände einer Reihe an der Stelle des ersten zusammen', () => {
    const onePiece: MangaLink = { manga: anilist(30013, 'One Piece') };
    const results = [
      { id: 'op18', title: 'One Piece 18' },
      { id: 'fan', title: 'Das inoffizielle One Piece Fan-Buch' },
      { id: 'op45', title: 'One Piece 45' },
    ];
    const entries = groupMangaVolumes(results, (r) =>
      r.id.startsWith('op') ? onePiece : undefined
    );
    expect(entries.map((e) => e.kind)).toEqual(['manga', 'book']);
    expect(entries[0].kind === 'manga' && entries[0].volumes.map((v) => v.id)).toEqual([
      'op18',
      'op45',
    ]);
  });
});

describe('mangaAsSearchResult', () => {
  it('macht aus einem eigenen Manga einen Suchtreffer', () => {
    const result = mangaAsSearchResult({
      anilistId: 30013,
      title: 'One Piece',
      titleRomaji: 'ONE PIECE',
      poster: 'p.jpg',
      startDate: '1997-07-22',
    } as Manga);
    expect(result.id).toBe(30013);
    expect(result.title.english).toBe('One Piece');
    expect(result.coverImage.large).toBe('p.jpg');
    expect(result.startDate).toEqual({ year: 1997, month: 7, day: 22 });
  });
});
