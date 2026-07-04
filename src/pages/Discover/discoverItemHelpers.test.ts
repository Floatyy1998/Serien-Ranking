import { describe, expect, it, vi } from 'vitest';
import { PLACEHOLDER_SVG, handleImgError } from './discoverItemHelpers';

describe('PLACEHOLDER_SVG', () => {
  it('ist eine data-URL für ein SVG', () => {
    expect(PLACEHOLDER_SVG.startsWith('data:image/svg+xml,')).toBe(true);
  });

  it('enthält den (URL-enkodierten) Fallback-Text "Kein Poster"', () => {
    expect(decodeURIComponent(PLACEHOLDER_SVG)).toContain('Kein Poster');
  });
});

describe('handleImgError', () => {
  it('setzt das src-Attribut des Bildes auf den Platzhalter', () => {
    const target = { src: 'https://broken.example/poster.jpg' };
    const event = { target } as unknown as React.SyntheticEvent<HTMLImageElement>;
    handleImgError(event);
    expect(target.src).toBe(PLACEHOLDER_SVG);
  });

  it('liest target genau einmal aus dem Event', () => {
    const target = { src: '' };
    const getter = vi.fn(() => target);
    const event = {
      get target() {
        return getter();
      },
    } as unknown as React.SyntheticEvent<HTMLImageElement>;
    handleImgError(event);
    expect(getter).toHaveBeenCalledTimes(1);
    expect(target.src).toBe(PLACEHOLDER_SVG);
  });
});
