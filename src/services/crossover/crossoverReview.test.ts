import { describe, expect, it, vi } from 'vitest';
import type { CatalogSeason } from '../../types/CatalogTypes';
import type { CrossoverEntry } from '../../types/Crossover';

const ep = (name: string, airstamp: string) => ({ id: null, name, airstamp });
const filler = (n: number) => Array.from({ length: n }, (_, i) => ep(`F${i + 1}`, ''));

const seasons: Record<string, Record<string, CatalogSeason>> = {
  '253391': {
    '0': {
      episodes: [
        ...filler(11),
        ep('Plus Eins', '2026-03-14T00:00:00+00:00'),
        ep('Pistolen gegen Schläuche (I)', '2026-04-04T00:00:00+00:00'),
        ep('Stärke zeigen', '2026-04-11T00:30:00+00:00'),
      ],
    } as unknown as CatalogSeason,
  },
  '202297': {
    '3': {
      episodes: [
        ...filler(12),
        ep('Die Feuerwehr (II)', '2026-04-04T01:00:00+00:00'),
        ep('Warum nicht jetzt?', '2026-04-11T01:30:00+00:00'),
      ],
    } as unknown as CatalogSeason,
  },
};

vi.mock('../catalog/staticCatalog', () => ({
  fetchStaticCatalogSeasons: vi.fn(async (id: number) => seasons[String(id)] ?? null),
  fetchCatalogEpisodeNames: vi.fn(async () => ({
    '253391': { '1': [...Array(12).fill(undefined), 'The Finest (I)'] },
    '202297': { '4': [...Array(12).fill(undefined), 'The Bravest (II)'] },
  })),
}));
vi.mock('../firebase/userDisplayData', () => ({
  fetchPublicUserFields: vi.fn(async () => ({
    username: null,
    displayName: 'Bärbel',
    photoURL: null,
  })),
}));
vi.mock('../db/ref', () => ({ dbRef: vi.fn(), userPath: vi.fn() }));
vi.mock('../notifications/pushQueue', () => ({ queuePush: vi.fn() }));

const { buildCrossoverReviewJson } = await import('./crossoverReview');

const submission: CrossoverEntry = {
  title: 'No Way In / No Way Out',
  kind: 'crossover',
  parts: [
    { id: 253391, t: 'Sheriff Country', s: 1, e: 13, n: 'Pistolen gegen Schläuche (I)' },
    { id: 202297, t: 'Fire Country', s: 4, e: 13, n: 'Die Feuerwehr (II)' },
  ],
  createdBy: 'Ozz7OYbo',
  createdAt: Date.UTC(2026, 9, 18),
  source: 'community',
  status: 'pending',
};

describe('buildCrossoverReviewJson', () => {
  it('gleicht jeden Teil mit dem Katalog ab (DE/EN-Titel, Datum, Nachbarn)', async () => {
    const json = JSON.parse(await buildCrossoverReviewJson('-P4EZ', submission));
    expect(json.eingereichtVon).toEqual({ uid: 'Ozz7OYbo', name: 'Bärbel' });
    expect(json.teile[0].katalog).toMatchObject({
      folgeGefunden: true,
      titel: 'Pistolen gegen Schläuche (I)',
      titelEn: 'The Finest (I)',
      ausstrahlung: '2026-04-04T00:00:00+00:00',
      titelStimmtMitEintrag: true,
      vorherigeFolge: { folge: 12, titel: 'Plus Eins' },
      naechsteFolge: { folge: 14, titel: 'Stärke zeigen' },
    });
    expect(json.teile[1].katalog).toMatchObject({ titelEn: 'The Bravest (II)', folge: 13 });
    expect(json.automatischePruefung).toEqual({
      alleFolgenGefunden: true,
      reihenfolgeNachSendedatum: true,
    });
  });

  it('meldet fehlende Folgen und falsche Reihenfolge', async () => {
    const json = JSON.parse(
      await buildCrossoverReviewJson('x', {
        ...submission,
        parts: [submission.parts[1], { ...submission.parts[0], e: 99 }],
      })
    );
    expect(json.teile[1].katalog.folgeGefunden).toBe(false);
    expect(json.automatischePruefung.alleFolgenGefunden).toBe(false);
  });
});
