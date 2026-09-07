import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Firebase-Mock für den discussionFeed-Knoten: push + orderByChild-Query +
// update. Verhalten je Test über `state` konfigurierbar.
const fb = vi.hoisted(() => {
  const state = {
    push: vi.fn(async (_entry: unknown) => ({ key: 'generated-id' })),
    once: vi.fn(async () => makeSnapshot([])),
    update: vi.fn(async (_updates: Record<string, unknown>) => undefined),
  };
  function makeSnapshot(children: Array<{ key: string }>) {
    return {
      exists: () => children.length > 0,
      forEach: (cb: (c: { key: string }) => boolean | void) => {
        for (const c of children) cb(c);
      },
    };
  }
  const ref = () => ({
    push: state.push,
    orderByChild: () => ({ equalTo: () => ({ once: state.once }) }),
    update: state.update,
  });
  return { state, ref, makeSnapshot };
});

vi.mock('firebase/compat/app', () => ({
  default: { database: () => ({ ref: fb.ref }) },
}));
vi.mock('firebase/compat/database', () => ({}));

import { deleteDiscussionFeedEntries, writeDiscussionFeedEntry } from './discussionFeedService';

beforeEach(() => {
  fb.state.push.mockReset().mockResolvedValue({ key: 'generated-id' });
  fb.state.once.mockReset().mockResolvedValue(fb.makeSnapshot([]));
  fb.state.update.mockReset().mockResolvedValue(undefined);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('writeDiscussionFeedEntry', () => {
  it('pusht den Eintrag und gibt den neuen Key zurück', async () => {
    fb.state.push.mockResolvedValueOnce({ key: 'abc123' });
    const entry = { discussionId: 'd1', type: 'series' } as never;
    const key = await writeDiscussionFeedEntry(entry);
    expect(key).toBe('abc123');
    expect(fb.state.push).toHaveBeenCalledWith(entry);
  });

  it('push wirft → null (best-effort, geloggt)', async () => {
    fb.state.push.mockRejectedValueOnce(new Error('permission denied'));
    const key = await writeDiscussionFeedEntry({ discussionId: 'd1' } as never);
    expect(key).toBeNull();
    expect(console.error).toHaveBeenCalled();
  });
});

describe('deleteDiscussionFeedEntries', () => {
  it('löscht alle Feed-Einträge einer Diskussion via Multi-Path-update', async () => {
    fb.state.once.mockResolvedValueOnce(fb.makeSnapshot([{ key: 'e1' }, { key: 'e2' }]));
    await deleteDiscussionFeedEntries('d1');
    expect(fb.state.update).toHaveBeenCalledWith({ e1: null, e2: null });
  });

  it('keine Treffer → kein update-Aufruf', async () => {
    fb.state.once.mockResolvedValueOnce(fb.makeSnapshot([]));
    await deleteDiscussionFeedEntries('d1');
    expect(fb.state.update).not.toHaveBeenCalled();
  });

  it('Query wirft → wird gefangen (kein Throw), geloggt', async () => {
    fb.state.once.mockRejectedValueOnce(new Error('boom'));
    await expect(deleteDiscussionFeedEntries('d1')).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalled();
  });
});
