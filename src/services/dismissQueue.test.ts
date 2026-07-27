import { beforeEach, describe, expect, it, vi } from 'vitest';

const fb = vi.hoisted(() => ({
  pushes: [] as { path: string; value: unknown }[],
}));

vi.mock('./db/ref', () => ({
  serverTimestamp: () => 1234,
  dbRef: vi.fn((path: string) => ({
    push: async (value: unknown) => {
      fb.pushes.push({ path, value });
    },
  })),
}));

import { queueDismiss } from './dismissQueue';

beforeEach(() => {
  fb.pushes = [];
});

describe('queueDismiss', () => {
  it('legt einen Eintrag mit uid und Deep-Link ab', async () => {
    await queueDismiss('u1', '/chat/friend1');
    expect(fb.pushes).toHaveLength(1);
    expect(fb.pushes[0].path).toBe('dismissQueue');
    expect(fb.pushes[0].value).toMatchObject({ uid: 'u1', url: '/chat/friend1' });
  });

  it('ignoriert Links ohne führenden Slash (Rules würden sie ablehnen)', async () => {
    await queueDismiss('u1', 'https://example.com/chat/friend1');
    expect(fb.pushes).toEqual([]);
  });

  it('ohne uid passiert nichts', async () => {
    await queueDismiss('', '/chat/friend1');
    expect(fb.pushes).toEqual([]);
  });

  it('kürzt überlange Links auf das Rules-Limit', async () => {
    await queueDismiss('u1', '/chat/' + 'x'.repeat(400));
    expect((fb.pushes[0].value as { url: string }).url).toHaveLength(200);
  });
});
