import { beforeEach, describe, expect, it, vi } from 'vitest';

const fb = vi.hoisted(() => {
  const store = new Map<string, unknown>();
  let counter = 0;
  return {
    store,
    ref: (path: string) => ({
      push: async (value?: unknown) => {
        const key = `push-${++counter}`;
        if (value !== undefined) store.set(`${path}/${key}`, value);
        return { key };
      },
    }),
    reset: () => {
      store.clear();
      counter = 0;
    },
  };
});

vi.mock('firebase/compat/app', () => ({
  default: { database: () => ({ ref: fb.ref }) },
}));
vi.mock('firebase/compat/database', () => ({}));

const queuePush = vi.hoisted(() => vi.fn(async () => {}));
vi.mock('../notifications/pushQueue', () => ({ queuePush }));

import { canAskForBook, sendBookLoanRequest } from './bookLoanRequest';

const lsStore = new Map<string, string>();

beforeEach(() => {
  fb.reset();
  queuePush.mockClear();
  lsStore.clear();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => lsStore.get(k) ?? null,
    setItem: (k: string, v: string) => lsStore.set(k, v),
  });
});

const opts = {
  fromUid: 'anna',
  fromName: 'Anna',
  toUid: 'ben',
  bookId: 'gb-1',
  bookTitle: 'Dune',
  bookKey: 'dune|frank herbert',
};

describe('sendBookLoanRequest', () => {
  it('legt die Benachrichtigung beim Freund an und stößt den Push an', async () => {
    await sendBookLoanRequest(opts);
    const [[path, payload]] = [...fb.store.entries()] as [string, Record<string, unknown>][];
    expect(path).toMatch(/^users\/ben\/notifications\/push-/);
    expect(payload).toMatchObject({
      type: 'book_loan_request',
      read: false,
      data: { from: 'anna', fromName: 'Anna', bookId: 'gb-1', bookTitle: 'Dune' },
    });
    expect(String(payload.message)).toContain('Dune');
    expect(Object.keys(payload.titleL as object).sort()).toEqual(['en', 'es', 'fr', 'pt']);
    expect(queuePush).toHaveBeenCalledWith('ben', expect.objectContaining({ url: '/friend/anna' }));
  });

  it('sperrt eine zweite Anfrage für dasselbe Buch 24 Stunden', async () => {
    expect(canAskForBook('ben', opts.bookKey)).toBe(true);
    await sendBookLoanRequest(opts);
    expect(canAskForBook('ben', opts.bookKey)).toBe(false);
    expect(canAskForBook('ben', 'anderes|buch')).toBe(true);
    expect(canAskForBook('clara', opts.bookKey)).toBe(true);
  });
});
