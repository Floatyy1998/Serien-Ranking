import { describe, expect, it } from 'vitest';
import { HOME_DEFAULT_HIDDEN_BY_VERSION, HOME_LAYOUT_VERSION } from '../../config/homeSections';
import { defaultHomeConfig, sanitizeHomeConfig } from './homeLayout';

const v2 = HOME_DEFAULT_HIDDEN_BY_VERSION[2];

describe('sanitizeHomeConfig', () => {
  it('blendet bei neuen Konten die schlanke Vorgabe aus', () => {
    const config = defaultHomeConfig();
    expect(config.layoutVersion).toBe(HOME_LAYOUT_VERSION);
    expect(config.hiddenSections).toEqual(v2.hiddenSections);
    expect(config.hiddenForYou).toEqual(v2.hiddenForYou);
    expect(config.hiddenHeader).toEqual(['stat-pods']);
    expect(config.hiddenQuickActions).toEqual([]);
    expect(config.hiddenSecondaryActions).toEqual(['badges', 'pets']);
  });

  it('ergänzt alte Layouts ohne Version um die neuen Ausblendungen', () => {
    const config = sanitizeHomeConfig({ hiddenSections: ['countdown'] });
    expect(config.hiddenSections).toEqual(['countdown', ...(v2.hiddenSections ?? [])]);
    expect(config.hiddenHeader).toContain('stat-pods');
  });

  it('lässt Layouts der aktuellen Version unangetastet, auch wenn alles eingeblendet ist', () => {
    const config = sanitizeHomeConfig({ layoutVersion: HOME_LAYOUT_VERSION, hiddenSections: [] });
    expect(config.hiddenSections).toEqual([]);
    expect(config.hiddenHeader).toEqual([]);
  });

  it('filtert unbekannte IDs und ergänzt fehlende Sektionen in der Reihenfolge', () => {
    const config = sanitizeHomeConfig({
      layoutVersion: HOME_LAYOUT_VERSION,
      sectionOrder: ['stats', 'bogus', 'trending'],
      hiddenSections: ['bogus', 'stats'],
      hiddenHeader: ['bogus'],
    });
    expect(config.sectionOrder).not.toContain('bogus');
    expect(config.sectionOrder).toContain('rewatch-list');
    expect(config.hiddenSections).toEqual(['stats']);
    expect(config.hiddenHeader).toEqual([]);
  });
});
