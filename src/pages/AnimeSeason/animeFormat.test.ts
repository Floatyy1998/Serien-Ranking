import { describe, expect, it } from 'vitest';
import type { SeasonAnime } from '../../services/anilistSeasonService';
import {
  buildMetaLine,
  continuationLabel,
  datePillText,
  dayLabel,
  formatBadgeDe,
  formatLabelDe,
  formatStartLong,
  franchiseTitle,
  isSameDay,
  relativeDayLabel,
  shortCountdown,
  startDateToDate,
  stripDescription,
  stripSeasonSuffix,
} from './animeFormat';

function makeAnime(overrides: Partial<SeasonAnime> = {}): SeasonAnime {
  return {
    id: 1,
    idMal: null,
    title: { romaji: 'Title', english: 'Title' },
    coverImage: null,
    bannerImage: null,
    episodes: null,
    format: 'TV',
    genres: null,
    averageScore: null,
    popularity: null,
    siteUrl: '',
    status: null,
    description: null,
    startDate: null,
    studios: null,
    nextAiringEpisode: null,
    relations: null,
    externalLinks: null,
    ...overrides,
  } as SeasonAnime;
}

describe('formatLabelDe', () => {
  it('mappt bekannte Formate auf deutsche Labels', () => {
    expect(formatLabelDe('MOVIE')).toBe('Film');
    expect(formatLabelDe('TV_SHORT')).toBe('Kurzserie');
    expect(formatLabelDe('OVA')).toBe('OVA');
  });

  it('null bleibt null', () => {
    expect(formatLabelDe(null)).toBeNull();
  });

  it('unbekanntes Format wird durchgereicht', () => {
    expect(formatLabelDe('WEIRD')).toBe('WEIRD');
  });
});

describe('formatBadgeDe', () => {
  it('TV/ONA/null → "Serie"', () => {
    expect(formatBadgeDe('TV')).toBe('Serie');
    expect(formatBadgeDe('ONA')).toBe('Serie');
    expect(formatBadgeDe(null)).toBe('Serie');
  });

  it('sonst deutsches Label', () => {
    expect(formatBadgeDe('MOVIE')).toBe('Film');
    expect(formatBadgeDe('OVA')).toBe('OVA');
  });
});

describe('shortCountdown', () => {
  it('<= 0 → "jetzt"', () => {
    expect(shortCountdown(0)).toBe('jetzt');
    expect(shortCountdown(-5)).toBe('jetzt');
  });

  it('Tage', () => {
    expect(shortCountdown(2 * 86400)).toBe('2d');
  });

  it('Stunden', () => {
    expect(shortCountdown(2 * 3600)).toBe('2h');
  });

  it('Minuten', () => {
    expect(shortCountdown(12 * 60)).toBe('12min');
  });

  it('rundet Sub-Minuten auf mindestens 1min', () => {
    expect(shortCountdown(30)).toBe('1min');
  });
});

describe('startDateToDate', () => {
  it('null ohne Jahr/Monat', () => {
    expect(startDateToDate(null)).toBeNull();
    expect(startDateToDate({ year: 2026, month: null, day: null })).toBeNull();
  });

  it('Tag fällt auf den 1., wenn fehlend', () => {
    const d = startDateToDate({ year: 2026, month: 7, day: null });
    expect(d?.getFullYear()).toBe(2026);
    expect(d?.getMonth()).toBe(6);
    expect(d?.getDate()).toBe(1);
  });

  it('vollständiges Datum', () => {
    const d = startDateToDate({ year: 2026, month: 7, day: 4 });
    expect(d?.getDate()).toBe(4);
  });
});

describe('isSameDay', () => {
  it('true bei gleichem Kalendertag', () => {
    expect(isSameDay(new Date(2026, 6, 4, 1), new Date(2026, 6, 4, 23))).toBe(true);
  });

  it('false bei unterschiedlichem Tag', () => {
    expect(isSameDay(new Date(2026, 6, 4), new Date(2026, 6, 5))).toBe(false);
  });
});

describe('stripDescription', () => {
  it('leerer/null Input → ""', () => {
    expect(stripDescription(null)).toBe('');
    expect(stripDescription('')).toBe('');
  });

  it('strippt Tags, dekodiert Entities und bündelt Whitespace', () => {
    expect(stripDescription('<b>Hallo</b>&amp;<br>Welt   &quot;X&quot;')).toBe('Hallo& Welt "X"');
  });

  it('dekodiert Apostroph- und Winkel-Entities', () => {
    expect(stripDescription('a&#39;b &lt;c&gt;')).toBe("a'b <c>");
  });
});

describe('buildMetaLine', () => {
  it('Studio · Episoden · Rating', () => {
    const anime = makeAnime({
      studios: { nodes: [{ name: 'MAPPA' }] },
      episodes: 12,
      averageScore: 82,
    });
    expect(buildMetaLine(anime)).toBe('MAPPA · 12 Ep. · ★ 8.2');
  });

  it('tmdbRating gewinnt über AniList-averageScore', () => {
    const anime = makeAnime({ averageScore: 82, episodes: 12 });
    expect(buildMetaLine(anime, undefined, 9.1)).toContain('★ 9.1');
  });

  it('sinceLabel ersetzt den Studio-Namen', () => {
    const anime = makeAnime({ studios: { nodes: [{ name: 'MAPPA' }] } });
    expect(buildMetaLine(anime, 'Frühling 2026')).toContain('seit Frühling 2026');
  });

  it('Filme lassen die Episodenzahl weg', () => {
    const anime = makeAnime({ format: 'MOVIE', episodes: 1, averageScore: 80 });
    expect(buildMetaLine(anime)).not.toContain('Ep.');
  });
});

describe('continuationLabel', () => {
  it('erkennt "Season N"', () => {
    expect(
      continuationLabel(makeAnime({ title: { romaji: '', english: 'Attack on Titan Season 2' } }))
    ).toBe('Staffel 2');
  });

  it('erkennt "Nnd Season"', () => {
    expect(
      continuationLabel(makeAnime({ title: { romaji: '', english: 'Overlord 2nd Season' } }))
    ).toBe('Staffel 2');
  });

  it('erkennt "Final Season"', () => {
    expect(
      continuationLabel(makeAnime({ title: { romaji: '', english: 'Show Final Season' } }))
    ).toBe('Finale Staffel');
  });

  it('erkennt römische Ziffer am Titelende', () => {
    expect(continuationLabel(makeAnime({ title: { romaji: '', english: 'Overlord IV' } }))).toBe(
      'Staffel 4'
    );
  });

  it('kombiniert Staffel und Part', () => {
    expect(
      continuationLabel(makeAnime({ title: { romaji: '', english: 'Show Season 3 Part 2' } }))
    ).toBe('Staffel 3 · Part 2');
  });

  it('nur PREQUEL-Relation → "Fortsetzung"', () => {
    const anime = makeAnime({
      title: { romaji: '', english: 'Neuer Titel' },
      relations: { edges: [{ relationType: 'PREQUEL' }] },
    });
    expect(continuationLabel(anime)).toBe('Fortsetzung');
  });

  it('völlig neue Serie → null', () => {
    expect(
      continuationLabel(makeAnime({ title: { romaji: '', english: 'Brand New Anime' } }))
    ).toBeNull();
  });
});

describe('stripSeasonSuffix', () => {
  it('entfernt "Season N"', () => {
    expect(stripSeasonSuffix('Saga of Tanya the Evil Season 2')).toBe('Saga of Tanya the Evil');
  });

  it('entfernt "Part N"', () => {
    expect(stripSeasonSuffix('Show Part 2')).toBe('Show');
  });

  it('entfernt römische Ziffer und Untertitel-Trenner', () => {
    expect(stripSeasonSuffix('Mushoku Tensei III')).toBe('Mushoku Tensei');
  });

  it('lässt Titel ohne Suffix unangetastet', () => {
    expect(stripSeasonSuffix('One Piece')).toBe('One Piece');
  });
});

describe('franchiseTitle', () => {
  it('extrahiert den Basistitel vor dem Arc-Untertitel', () => {
    expect(franchiseTitle('Tokyo Revengers: Santen Sensou-hen')).toBe('Tokyo Revengers');
  });

  it('schützt kurze Präfixe wie "Re:ZERO" (idx < 4)', () => {
    expect(franchiseTitle('Re:ZERO')).toBeNull();
  });

  it('kein Doppelpunkt → null', () => {
    expect(franchiseTitle('One Piece')).toBeNull();
  });
});

describe('dayLabel / datePillText', () => {
  it('dayLabel: "WOCHENTAG · N. MONAT" (Großbuchstaben)', () => {
    expect(dayLabel(new Date(2026, 6, 3))).toMatch(/^[A-ZÄÖÜ]+ · 3\. [A-ZÄÖÜ]+$/);
  });

  it('datePillText: "KURZTAG · N. MONAT" ohne Punkt', () => {
    const text = datePillText(new Date(2026, 6, 4));
    expect(text).toMatch(/^[A-ZÄÖÜ]+ · 4\. [A-ZÄÖÜ]+$/);
    expect(text).not.toContain('.·');
  });
});

describe('relativeDayLabel', () => {
  const now = new Date(2026, 6, 4, 15, 0, 0);

  it('gestern/heute/morgen', () => {
    expect(relativeDayLabel(new Date(2026, 6, 3), now)).toBe('Gestern');
    expect(relativeDayLabel(new Date(2026, 6, 4, 9), now)).toBe('Heute');
    expect(relativeDayLabel(new Date(2026, 6, 5), now)).toBe('Morgen');
  });

  it('"in N Tagen" bis 13 Tage', () => {
    expect(relativeDayLabel(new Date(2026, 6, 9), now)).toBe('in 5 Tagen');
  });

  it('außerhalb des Fensters → null', () => {
    expect(relativeDayLabel(new Date(2026, 6, 20), now)).toBeNull();
    expect(relativeDayLabel(new Date(2026, 6, 1), now)).toBeNull();
  });
});

describe('formatStartLong', () => {
  it('ohne Jahr im selben Kalenderjahr', () => {
    const now = new Date(2026, 6, 1);
    const text = formatStartLong(new Date(2026, 6, 4), now);
    expect(text.startsWith('Startet ')).toBe(true);
    expect(text).not.toMatch(/2026/);
  });

  it('mit Jahr, wenn Zieljahr abweicht', () => {
    const now = new Date(2026, 6, 1);
    const text = formatStartLong(new Date(2027, 0, 4), now);
    expect(text).toContain('2027');
  });
});
