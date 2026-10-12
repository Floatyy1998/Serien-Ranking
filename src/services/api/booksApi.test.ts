// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../i18n', () => ({ appLocale: 'de' }));

import { findBook } from './booksApi';

const doc = (title: string, author: string) => ({
  key: `/works/OL${title.length}W`,
  title,
  author_name: [author],
});

const respond = (docs: unknown[]) => new Response(JSON.stringify({ docs }), { status: 200 });

describe('findBook', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_GOOGLE_BOOKS_API_KEY', '');
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('sucht ohne Treffer für Titel + Autor noch einmal nur nach dem Titel', async () => {
    const fetchMock = vi.fn(async (url: string) =>
      respond(
        new URL(url).searchParams.get('q') === 'Der Hobbit'
          ? [doc('Der Hobbit', 'J.R.R. Tolkien')]
          : []
      )
    );
    vi.stubGlobal('fetch', fetchMock);
    expect((await findBook('Der Hobbit', 'J. R. R. Tolkien'))?.title).toBe('Der Hobbit');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('merkt sich Fehlschläge nicht', async () => {
    let docs: unknown[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => respond(docs))
    );
    expect(await findBook('Shrek!', 'William Steig')).toBeNull();
    docs = [doc('Shrek!', 'William Steig')];
    expect((await findBook('Shrek!', 'William Steig'))?.title).toBe('Shrek!');
  });
});
