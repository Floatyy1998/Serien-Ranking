import { beforeEach, describe, expect, it, vi } from 'vitest';

const fb = vi.hoisted(() => ({
  updates: [] as Record<string, unknown>[],
  pushes: [] as unknown[],
}));

vi.mock('../db/ref', () => ({
  dbGet: vi.fn(async () => ({ u1: true, u2: true })),
  dbRef: vi.fn(() => ({
    push: () => ({ key: 'msg1' }),
    set: async () => {},
  })),
  dbUpdate: vi.fn(async (u: Record<string, unknown>) => {
    fb.updates.push(u);
  }),
  userPath: (uid: string, ...segments: string[]) => ['users', uid, ...segments].join('/'),
}));
vi.mock('../pushQueue', () => ({
  queuePush: vi.fn((_uid: string, payload: unknown) => {
    fb.pushes.push(payload);
  }),
}));

import { sendMessage } from './chatService';

beforeEach(() => {
  fb.updates = [];
  fb.pushes = [];
});

describe('sendMessage mit Spoiler-Flag', () => {
  it('schreibt sp:true und leakt den Text weder in Summary noch Push', async () => {
    await sendMessage(
      'u1',
      'u2',
      { kind: 'text', text: 'Er stirbt in Folge 8', spoiler: true },
      'Ich'
    );
    const update = fb.updates[0];
    const msgPath = Object.keys(update).find((k) => k.includes('/messages/'));
    expect(update[msgPath as string]).toMatchObject({ t: 'Er stirbt in Folge 8', sp: true });
    const summaryPath = Object.keys(update).find((k) => k.endsWith('lastMessage'));
    expect(update[summaryPath as string]).toBe('Spoiler');
    expect(fb.pushes[0]).toMatchObject({ body: 'Spoiler' });
  });

  it('normale Nachrichten bleiben unverändert', async () => {
    await sendMessage('u1', 'u2', { kind: 'text', text: 'Hallo' }, 'Ich');
    const update = fb.updates[0];
    const msgPath = Object.keys(update).find((k) => k.includes('/messages/'));
    expect(update[msgPath as string]).not.toHaveProperty('sp');
    const summaryPath = Object.keys(update).find((k) => k.endsWith('lastMessage'));
    expect(update[summaryPath as string]).toBe('Hallo');
  });
});
