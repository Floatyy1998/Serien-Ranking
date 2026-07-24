import { describe, expect, it, vi } from 'vitest';

vi.mock('../db/ref', () => ({
  dbGet: vi.fn(),
  dbRef: vi.fn(),
  dbUpdate: vi.fn(),
  userPath: (uid: string, ...segments: string[]) => ['users', uid, ...segments].join('/'),
}));
vi.mock('../pushQueue', () => ({ queuePush: vi.fn() }));

import { chatPairId, otherUidFromPairId } from './chatService';

describe('chatPairId', () => {
  it('ist unabhängig von der Reihenfolge der Teilnehmer', () => {
    expect(chatPairId('bob', 'alice')).toBe('alice_bob');
    expect(chatPairId('alice', 'bob')).toBe('alice_bob');
  });

  it('nutzt echte Firebase-UIDs stabil', () => {
    const a = 'iYSCWycjVES8DEhOWi7uMf9sYE12';
    const b = '83fRTz3YqgMkjz646AJ1GO6I8Kg1';
    expect(chatPairId(a, b)).toBe(chatPairId(b, a));
    expect(chatPairId(a, b)).toContain('_');
  });
});

describe('otherUidFromPairId', () => {
  it('liefert das Gegenüber für beide Positionen', () => {
    expect(otherUidFromPairId('alice_bob', 'alice')).toBe('bob');
    expect(otherUidFromPairId('alice_bob', 'bob')).toBe('alice');
  });

  it('liefert null, wenn der Nutzer nicht Teil des Chats ist', () => {
    expect(otherUidFromPairId('alice_bob', 'carol')).toBeNull();
  });

  it('verwechselt Präfix-UIDs nicht', () => {
    expect(otherUidFromPairId('ali_bob', 'alice')).toBeNull();
  });
});
