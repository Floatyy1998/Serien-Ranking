import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('firebase/compat/app', () => ({
  default: {
    database: () => ({
      ref: () => ({ once: async () => ({ val: () => null }) }),
    }),
  },
}));

import { adjustBrightness, updateThemeColorMeta, loadSavedTheme } from './themeHelpers';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('adjustBrightness', () => {
  it('ungültige/leere Eingaben → Default-Grün', () => {
    expect(adjustBrightness('', 10)).toBe('#00d123');
    expect(adjustBrightness('nichthex', 10)).toBe('#00d123');
    expect(adjustBrightness('#12345', 10)).toBe('#00d123'); // 5 Stellen
  });

  it('Betrag 0 lässt die Farbe unverändert', () => {
    expect(adjustBrightness('#808080', 0)).toBe('#808080');
  });

  it('hellt um Prozent auf', () => {
    expect(adjustBrightness('#808080', 10)).toBe('#9a9a9a');
  });

  it('funktioniert ohne führendes #', () => {
    expect(adjustBrightness('808080', 0)).toBe('#808080');
  });

  it('clamped bei Weiß (kein Overflow)', () => {
    expect(adjustBrightness('#ffffff', 50)).toBe('#ffffff');
  });

  it('clamped bei Schwarz (kein Underflow)', () => {
    expect(adjustBrightness('#000000', -50)).toBe('#000000');
  });
});

describe('updateThemeColorMeta', () => {
  it('setzt den content des Meta-Tags, wenn vorhanden', () => {
    const meta = { content: '' } as HTMLMetaElement;
    vi.stubGlobal('document', { getElementById: vi.fn(() => meta) });
    updateThemeColorMeta('#123456');
    expect(meta.content).toBe('#123456');
  });

  it('ohne Meta-Tag → kein Fehler', () => {
    vi.stubGlobal('document', { getElementById: vi.fn(() => null) });
    expect(() => updateThemeColorMeta('#000000')).not.toThrow();
  });
});

describe('loadSavedTheme', () => {
  const stubDom = () => {
    const setProperty = vi.fn();
    const meta = { content: '' } as HTMLMetaElement;
    vi.stubGlobal('document', {
      documentElement: { style: { setProperty } },
      getElementById: vi.fn(() => meta),
    });
    return { setProperty, meta };
  };

  it('ohne lokales Theme und ohne userId → Defaults angewendet', async () => {
    const { setProperty, meta } = stubDom();
    vi.stubGlobal('localStorage', { getItem: vi.fn(() => null), setItem: vi.fn() });

    await loadSavedTheme();

    expect(setProperty).toHaveBeenCalledWith('--theme-primary', '#00d123');
    expect(setProperty).toHaveBeenCalledWith('--theme-background', '#000000');
    expect(setProperty).toHaveBeenCalledWith('--theme-surface', '#0f0f0f');
    expect(meta.content).toBe('#000000');
  });

  it('mit gültigem lokalem Theme → Custom-Farben angewendet', async () => {
    const { setProperty, meta } = stubDom();
    const theme = {
      primaryColor: '#ff0000',
      accentColor: '#00ff00',
      backgroundColor: '#111111',
      surfaceColor: '#222222',
    };
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => JSON.stringify(theme)),
      setItem: vi.fn(),
    });

    await loadSavedTheme();

    expect(setProperty).toHaveBeenCalledWith('--theme-primary', '#ff0000');
    expect(setProperty).toHaveBeenCalledWith('--theme-accent', '#00ff00');
    expect(setProperty).toHaveBeenCalledWith('--theme-background', '#111111');
    expect(setProperty).toHaveBeenCalledWith('--theme-surface', '#222222');
    expect(meta.content).toBe('#111111');
  });

  it('korruptes JSON im localStorage → fällt auf Defaults zurück', async () => {
    const { setProperty } = stubDom();
    vi.stubGlobal('localStorage', { getItem: vi.fn(() => '{kaputt'), setItem: vi.fn() });

    await loadSavedTheme();

    expect(setProperty).toHaveBeenCalledWith('--theme-primary', '#00d123');
  });

  it('ungültige Theme-Farben werden durch Defaults ersetzt', async () => {
    const { setProperty } = stubDom();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => JSON.stringify({ primaryColor: 'kaputt', backgroundColor: '#abcabc' })),
      setItem: vi.fn(),
    });

    await loadSavedTheme();

    expect(setProperty).toHaveBeenCalledWith('--theme-primary', '#00d123'); // ungültig → Default
    expect(setProperty).toHaveBeenCalledWith('--theme-background', '#abcabc'); // gültig → übernommen
  });
});
