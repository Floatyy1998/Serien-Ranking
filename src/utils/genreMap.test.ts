import { describe, expect, it } from 'vitest';
import { mapGenreIds } from './genreMap';

/**
 * Characterization-Tests für mapGenreIds (src/utils/genreMap.ts).
 *
 * Pinnt das IST-Verhalten fest:
 * - internes GENRE_MAP ist NICHT exportiert; nur mapGenreIds ist testbar
 * - ein einziges gemischtes Vokabular für Film- UND Serien-Genre-Ids (kein getrenntes Mapping)
 * - unbekannte Ids werden VOR dem Slice gefiltert (verbrauchen also keinen Slot)
 * - Default max = 2, Join mit ', '
 */

describe('mapGenreIds — Film-Vokabular (TMDB movie genre ids)', () => {
  it('mappt 28 auf "Action" (englisches Label beibehalten)', () => {
    expect(mapGenreIds([28])).toBe('Action');
  });

  it('mappt 12 auf das deutsche Label "Abenteuer"', () => {
    expect(mapGenreIds([12])).toBe('Abenteuer');
  });

  it('mappt die eingedeutschten Film-Labels korrekt (Krimi, Dokumentation, Familie, Historie)', () => {
    expect(mapGenreIds([80], 1)).toBe('Krimi');
    expect(mapGenreIds([99], 1)).toBe('Dokumentation');
    expect(mapGenreIds([10751], 1)).toBe('Familie');
    expect(mapGenreIds([36], 1)).toBe('Historie');
  });

  it('mappt Musik, Romantik, Krieg auf deutsche Labels', () => {
    expect(mapGenreIds([10402], 1)).toBe('Musik');
    expect(mapGenreIds([10749], 1)).toBe('Romantik');
    expect(mapGenreIds([10752], 1)).toBe('Krieg');
  });

  it('behält englische/neutrale Labels bei (Comedy, Drama, Horror, Thriller, Western)', () => {
    expect(mapGenreIds([35], 1)).toBe('Comedy');
    expect(mapGenreIds([18], 1)).toBe('Drama');
    expect(mapGenreIds([27], 1)).toBe('Horror');
    expect(mapGenreIds([53], 1)).toBe('Thriller');
    expect(mapGenreIds([37], 1)).toBe('Western');
  });

  it('mappt 878 auf "Sci-Fi" und 10770 auf "TV-Film"', () => {
    expect(mapGenreIds([878], 1)).toBe('Sci-Fi');
    expect(mapGenreIds([10770], 1)).toBe('TV-Film');
  });

  it('mappt 16 auf "Animation", 14 auf "Fantasy", 9648 auf "Mystery"', () => {
    expect(mapGenreIds([16], 1)).toBe('Animation');
    expect(mapGenreIds([14], 1)).toBe('Fantasy');
    expect(mapGenreIds([9648], 1)).toBe('Mystery');
  });
});

describe('mapGenreIds — Serien-Vokabular (TMDB tv genre ids)', () => {
  it('mappt 10759 auf "Action und Abenteuer" (TV-Variante, deutsch)', () => {
    expect(mapGenreIds([10759])).toBe('Action und Abenteuer');
  });

  it('mappt 10765 auf "Sci-Fi & Fantasy" (mit &, nicht "und")', () => {
    expect(mapGenreIds([10765])).toBe('Sci-Fi & Fantasy');
  });

  it('mappt 10768 auf das ENGLISCHE "War & Politics" — nicht übersetzt wie Film-Pendant 10752 "Krieg"', () => {
    // Befund: inkonsistente Übersetzung TV vs Film wird hier bewusst festgepinnt.
    expect(mapGenreIds([10768])).toBe('War & Politics');
    expect(mapGenreIds([10752])).toBe('Krieg');
  });

  it('mappt Kids, News, Reality, Soap, Talk unübersetzt', () => {
    expect(mapGenreIds([10762], 1)).toBe('Kids');
    expect(mapGenreIds([10763], 1)).toBe('News');
    expect(mapGenreIds([10764], 1)).toBe('Reality');
    expect(mapGenreIds([10766], 1)).toBe('Soap');
    expect(mapGenreIds([10767], 1)).toBe('Talk');
  });

  it('erlaubt gemischte Film-+Serien-Ids in einem Aufruf (ein gemeinsames Vokabular)', () => {
    expect(mapGenreIds([18, 10765], 2)).toBe('Drama, Sci-Fi & Fantasy');
  });
});

describe('mapGenreIds — unbekannte Ids', () => {
  it('liefert leeren String für eine einzelne unbekannte Id', () => {
    expect(mapGenreIds([99999])).toBe('');
  });

  it('filtert unbekannte Ids heraus, bekannte bleiben erhalten', () => {
    expect(mapGenreIds([99999, 18, 12345, 35])).toBe('Drama, Comedy');
  });

  it('unbekannte Ids verbrauchen KEINEN Slot des max-Limits (Filter vor Slice)', () => {
    // Zwei unbekannte vorneweg, trotzdem kommen beide bekannten durch (max = 2).
    expect(mapGenreIds([1, 2, 28, 12])).toBe('Action, Abenteuer');
  });

  it('kennt die echte TMDB-TV-Id 10766 nur als "Soap", aber 0 / negative / NaN Ids fallen raus', () => {
    expect(mapGenreIds([0, -5, NaN, 10766], 4)).toBe('Soap');
  });

  it('mappt gebrochene Zahlen nicht (28.5 ist kein Key, obwohl 28 existiert)', () => {
    expect(mapGenreIds([28.5])).toBe('');
  });
});

describe('mapGenreIds — max-Parameter und Trunkierung', () => {
  it('begrenzt per Default auf 2 Genres', () => {
    expect(mapGenreIds([28, 12, 16, 35])).toBe('Action, Abenteuer');
  });

  it('respektiert ein explizites max von 1', () => {
    expect(mapGenreIds([28, 12, 16], 1)).toBe('Action');
  });

  it('respektiert ein max größer als die Trefferanzahl (kein Padding, kein Fehler)', () => {
    expect(mapGenreIds([28, 12], 10)).toBe('Action, Abenteuer');
  });

  it('max = 0 liefert leeren String', () => {
    expect(mapGenreIds([28, 12], 0)).toBe('');
  });

  it('negatives max verhält sich wie Array.prototype.slice: schneidet vom ENDE ab', () => {
    // Befund: kein Guard gegen negatives max — slice(0, -1) droppt das letzte Genre.
    expect(mapGenreIds([28, 12, 16], -1)).toBe('Action, Abenteuer');
    expect(mapGenreIds([28, 12, 16], -3)).toBe('');
  });
});

describe('mapGenreIds — Reihenfolge, Duplikate, Sonderfälle', () => {
  it('leeres Array liefert leeren String', () => {
    expect(mapGenreIds([])).toBe('');
  });

  it('behält die Eingabe-Reihenfolge bei (keine Sortierung)', () => {
    expect(mapGenreIds([37, 28], 2)).toBe('Western, Action');
    expect(mapGenreIds([28, 37], 2)).toBe('Action, Western');
  });

  it('dedupliziert NICHT — doppelte Ids erscheinen doppelt', () => {
    expect(mapGenreIds([18, 18], 2)).toBe('Drama, Drama');
  });

  it('joint mit ", " (Komma + Leerzeichen)', () => {
    expect(mapGenreIds([27, 53], 2)).toBe('Horror, Thriller');
  });

  it('liefert immer einen String zurück, nie undefined/null', () => {
    expect(typeof mapGenreIds([])).toBe('string');
    expect(typeof mapGenreIds([424242])).toBe('string');
  });
});
