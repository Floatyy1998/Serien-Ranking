import { describe, expect, it } from 'vitest';
import { episodeSpoilerMask } from './spoilerMask';

describe('episodeSpoilerMask', () => {
  it('maskiert nichts bei Level 0', () => {
    expect(episodeSpoilerMask(0, false)).toEqual({ blurImage: false, hideText: false });
  });

  it('maskiert gesehene Folgen nie', () => {
    expect(episodeSpoilerMask(2, true)).toEqual({ blurImage: false, hideText: false });
  });

  it('blurrt bei Level 1 nur Bilder', () => {
    expect(episodeSpoilerMask(1, false)).toEqual({ blurImage: true, hideText: false });
  });

  it('versteckt bei Level 2 auch Text', () => {
    expect(episodeSpoilerMask(2, false)).toEqual({ blurImage: true, hideText: true });
  });
});
