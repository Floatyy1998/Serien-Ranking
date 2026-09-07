import { describe, expect, it } from 'vitest';
import { isSafeHttpUrl, storageUrlOrNull } from './safeUrl';

describe('isSafeHttpUrl', () => {
  it('akzeptiert http und https', () => {
    expect(isSafeHttpUrl('https://tv-rank.de/bild.png')).toBe(true);
    expect(isSafeHttpUrl('http://example.com')).toBe(true);
  });

  it('lehnt gefährliche Schemata ab', () => {
    expect(isSafeHttpUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeHttpUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(isSafeHttpUrl('blob:https://tv-rank.de/abc')).toBe(false);
  });

  it('lehnt Nicht-Strings und Leeres ab', () => {
    expect(isSafeHttpUrl('')).toBe(false);
    expect(isSafeHttpUrl(null)).toBe(false);
    expect(isSafeHttpUrl(42)).toBe(false);
  });

  it('löst relative Pfade gegen die eigene Domain auf', () => {
    expect(isSafeHttpUrl('/pets')).toBe(true);
  });
});

describe('storageUrlOrNull', () => {
  it('lässt Uploads aus dem eigenen Bucket durch', () => {
    const url = 'https://firebasestorage.googleapis.com/v0/b/serien-ranking.appspot.com/o/x.png';
    expect(storageUrlOrNull(url)).toBe(url);
  });

  it('verwirft fremde Hosts und Schemata', () => {
    expect(storageUrlOrNull('javascript:alert(1)')).toBeNull();
    expect(storageUrlOrNull('https://evil.example/x.png')).toBeNull();
    expect(
      storageUrlOrNull('https://firebasestorage.googleapis.com/v0/b/anderer-bucket/o/x')
    ).toBeNull();
    expect(storageUrlOrNull(undefined)).toBeNull();
  });
});
