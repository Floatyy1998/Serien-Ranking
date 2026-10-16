// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { resolveReadingPath, setReadingTab } from './readingTab';

afterEach(() => localStorage.clear());

describe('resolveReadingPath', () => {
  it('öffnet beim ersten Mal „Alle"', () => {
    expect(resolveReadingPath()).toBe('/reading');
  });

  it('merkt sich den zuletzt genutzten Reiter', () => {
    setReadingTab('manga');
    expect(resolveReadingPath()).toBe('/manga');
    setReadingTab('books');
    expect(resolveReadingPath()).toBe('/books');
  });
});
