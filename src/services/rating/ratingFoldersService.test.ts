import { beforeEach, describe, expect, it, vi } from 'vitest';

const fb = vi.hoisted(() => {
  const calls = {
    set: [] as { path?: string; val: unknown }[],
    update: [] as { path?: string; val: unknown }[],
    remove: [] as (string | undefined)[],
  };
  const makeRef = (path?: string) => ({
    set: async (val: unknown) => {
      calls.set.push({ path, val });
    },
    update: async (val: unknown) => {
      calls.update.push({ path, val });
    },
    remove: async () => {
      calls.remove.push(path);
    },
    push: () => ({ ...makeRef(`${path}/k1`), key: 'k1' }),
  });
  return { calls, makeRef };
});
vi.mock('firebase/compat/app', () => ({
  default: { database: () => ({ ref: (p?: string) => fb.makeRef(p) }) },
}));
vi.mock('firebase/compat/database', () => ({}));

const sub = vi.hoisted(() => ({ cb: null as null | ((snap: { val: () => unknown }) => void) }));
vi.mock('../db/subscribeValue', () => ({
  subscribeValue: (_ref: unknown, cb: (snap: { val: () => unknown }) => void) => {
    sub.cb = cb;
    return () => undefined;
  },
}));

import {
  createRatingFolder,
  createRewatchFolder,
  deleteRatingFolder,
  setRatingFolderItem,
  setRewatchListItem,
  restoreRatingFolder,
  saveRatingFolder,
  subscribeRatingFolders,
} from './ratingFoldersService';

beforeEach(() => {
  fb.calls.set.length = 0;
  fb.calls.update.length = 0;
  fb.calls.remove.length = 0;
});

describe('ratingFoldersService', () => {
  it('writes the rewatch list with its name so a fresh node stays visible', async () => {
    await setRewatchListItem('u1', 'm_7', true);
    expect(fb.calls.update[0]).toEqual({
      path: 'users/u1/ratingFolders/rewatch',
      val: { name: 'Nochmal schauen', 'items/m_7': true },
    });
    await setRewatchListItem('u1', 'm_7', false);
    expect(fb.calls.remove).toEqual(['users/u1/ratingFolders/rewatch/items/m_7']);
    expect(fb.calls.update).toHaveLength(1);
  });

  it('creates the rewatch list with all picked titles in one write', async () => {
    await createRewatchFolder('u1', ['m_7', 's_1']);
    expect(fb.calls.update[0]?.path).toBe('users/u1/ratingFolders/rewatch');
    expect(fb.calls.update[0]?.val).toMatchObject({
      name: 'Nochmal schauen',
      'items/m_7': true,
      'items/s_1': true,
    });
  });

  it('creates a folder under users/$uid/ratingFolders', async () => {
    const id = await createRatingFolder('u1', 'Marvel', ['m_1']);
    expect(id).toBe('k1');
    expect(fb.calls.set[0].path).toBe('users/u1/ratingFolders/k1');
    expect(fb.calls.set[0].val).toMatchObject({ name: 'Marvel', items: { m_1: true } });
  });

  it('saves, deletes and restores a folder, keeping createdAt', async () => {
    const folder = { id: 'f1', name: 'Alt', createdAt: 7, items: new Set(['s_2']) };
    await saveRatingFolder('u1', folder, 'Neu', ['s_2', 'm_3']);
    expect(fb.calls.set[0]).toEqual({
      path: 'users/u1/ratingFolders/f1',
      val: { name: 'Neu', createdAt: 7, items: { s_2: true, m_3: true } },
    });
    await deleteRatingFolder('u1', 'f1');
    expect(fb.calls.remove).toEqual(['users/u1/ratingFolders/f1', 'sharedLists/f1']);
    await restoreRatingFolder('u1', folder);
    expect(fb.calls.set[1].val).toEqual({ name: 'Alt', createdAt: 7, items: { s_2: true } });
  });

  it('expands snapshots for subscribers', () => {
    const onChange = vi.fn();
    subscribeRatingFolders('u1', onChange);
    sub.cb?.({ val: () => ({ f1: { name: 'Marvel', createdAt: 1, items: { m_1: true } } }) });
    expect(onChange.mock.calls[0][0][0]).toMatchObject({ id: 'f1', name: 'Marvel' });
  });

  it('adds and removes a single title', async () => {
    await setRatingFolderItem('u1', 'f1', 'm_3', true);
    expect(fb.calls.set[fb.calls.set.length - 1]).toEqual({
      path: 'users/u1/ratingFolders/f1/items/m_3',
      val: true,
    });
    await setRatingFolderItem('u1', 'f1', 'm_3', false);
    expect(fb.calls.remove).toContain('users/u1/ratingFolders/f1/items/m_3');
  });
});
