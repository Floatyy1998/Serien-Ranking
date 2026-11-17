import { describe, expect, it } from 'vitest';
import {
  isVolumeOwned,
  mangaOwnership,
  ownedVolumeNumbers,
  ownedVolumesLabel,
  toggleVolumeFields,
} from './ownedVolumes';

const NOW = '2026-11-17T10:00:00.000Z';
const EARLIER = '2026-01-01T00:00:00.000Z';

describe('ownedVolumes', () => {
  it('liest die Bände sortiert und ignoriert fremde Schlüssel', () => {
    const manga = { ownedVolumes: { v113: NOW, v2: NOW, x: NOW, v0: NOW } };
    expect(ownedVolumeNumbers(manga)).toEqual([2, 113]);
  });

  it('unterscheidet nichts, einzelne Bände und die ganze Reihe', () => {
    expect(mangaOwnership({})).toBe('none');
    expect(mangaOwnership({ ownedAt: EARLIER })).toBe('all');
    expect(mangaOwnership({ ownedAt: EARLIER, ownedVolumes: { v3: NOW } })).toBe('some');
    expect(isVolumeOwned({ ownedAt: EARLIER }, 7)).toBe(true);
    expect(isVolumeOwned({ ownedAt: EARLIER, ownedVolumes: { v3: NOW } }, 7)).toBe(false);
  });

  it('stellt den ersten Band ins Regal und markiert damit den Manga', () => {
    expect(toggleVolumeFields({}, 113, 113, NOW)).toEqual({
      'ownedVolumes/v113': NOW,
      ownedAt: NOW,
    });
  });

  it('lässt beim weiteren Band das Datum des Manga stehen', () => {
    const manga = { ownedAt: EARLIER, ownedVolumes: { v1: EARLIER } };
    expect(toggleVolumeFields(manga, 2, 10, NOW)).toEqual({ 'ownedVolumes/v2': NOW });
  });

  it('nimmt einen Band heraus und räumt beim letzten ganz auf', () => {
    const two = { ownedAt: EARLIER, ownedVolumes: { v1: EARLIER, v2: NOW } };
    expect(toggleVolumeFields(two, 2, 10, NOW)).toEqual({ 'ownedVolumes/v2': null });
    const one = { ownedAt: EARLIER, ownedVolumes: { v1: EARLIER } };
    expect(toggleVolumeFields(one, 1, 10, NOW)).toEqual({ ownedAt: null, ownedVolumes: null });
  });

  it('macht aus der ganzen Reihe einzelne Bände, wenn einer herausgenommen wird', () => {
    expect(toggleVolumeFields({ ownedAt: EARLIER }, 2, 3, NOW)).toEqual({
      ownedVolumes: { v1: EARLIER, v3: EARLIER },
    });
    expect(toggleVolumeFields({ ownedAt: EARLIER }, 1, 1, NOW)).toEqual({
      ownedAt: null,
      ownedVolumes: null,
    });
  });

  it('beschriftet den Besitz', () => {
    expect(ownedVolumesLabel({})).toBe('');
    expect(ownedVolumesLabel({ ownedAt: EARLIER })).toBe('Ganze Reihe im Besitz');
    expect(ownedVolumesLabel({ ownedVolumes: { v113: NOW } })).toBe('Band 113 im Besitz');
    expect(ownedVolumesLabel({ ownedVolumes: { v1: NOW, v2: NOW } }, 14)).toBe('2 Bände im Besitz');
    expect(ownedVolumesLabel({ ownedVolumes: { v1: NOW, v2: NOW } }, 2)).toBe(
      'Alle 2 Bände im Besitz'
    );
  });
});
