// @vitest-environment jsdom
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Friend, FriendRequest } from '../../types/Friend';

/* ---------------------------------------------------------------------------
 * fetchPublicUserFields wird gemockt; loadPublicProfile (echt) baut daraus
 * das Profil-Objekt.
 * ------------------------------------------------------------------------- */
const svc = vi.hoisted(() => ({
  fields: {} as Record<
    string,
    { username: string | null; displayName: string | null; photoURL: string | null }
  >,
  fn: vi.fn<
    (
      uid: string
    ) => Promise<{ username: string | null; displayName: string | null; photoURL: string | null }>
  >(),
}));

vi.mock('../../lib/firebase/userDisplayData', () => ({
  fetchPublicUserFields: (uid: string) => svc.fn(uid),
}));

import { useActivityFriendProfiles } from './useActivityFriendProfiles';

const friend = (uid: string): Friend => ({
  uid,
  email: `${uid}@x.de`,
  username: uid,
  friendsSince: 0,
});

const request = (fromUserId: string): FriendRequest => ({
  id: `r_${fromUserId}`,
  fromUserId,
  toUserId: 'me',
  fromUserEmail: '',
  toUserEmail: '',
  status: 'pending',
  sentAt: 0,
});

beforeEach(() => {
  svc.fields = {};
  svc.fn.mockReset();
  svc.fn.mockImplementation((uid: string) =>
    Promise.resolve(svc.fields[uid] ?? { username: null, displayName: null, photoURL: null })
  );
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('useActivityFriendProfiles', () => {
  it('lädt Profile für alle Freunde', async () => {
    svc.fields['a'] = { username: 'Anna', displayName: null, photoURL: 'a.jpg' };
    svc.fields['b'] = { username: null, displayName: 'Ben', photoURL: null };
    const { result } = renderHook(() => useActivityFriendProfiles([friend('a'), friend('b')], []));
    await waitFor(() => expect(Object.keys(result.current.friendProfiles)).toHaveLength(2));
    expect(result.current.friendProfiles['a'].username).toBe('Anna');
    expect(result.current.friendProfiles['a'].photoURL).toBe('a.jpg');
    expect(result.current.friendProfiles['b'].displayName).toBe('Ben');
  });

  it('liest bei leerer Freundesliste keine Profile', () => {
    renderHook(() => useActivityFriendProfiles([], []));
    expect(svc.fn).not.toHaveBeenCalled();
  });

  it('ignoriert Freunde ohne öffentliche Felder', async () => {
    svc.fields['a'] = { username: 'Anna', displayName: null, photoURL: null };
    // 'empty' liefert nur null-Felder → wird nicht aufgenommen
    const { result } = renderHook(() =>
      useActivityFriendProfiles([friend('a'), friend('empty')], [])
    );
    await waitFor(() => expect(result.current.friendProfiles['a']).toBeDefined());
    expect(result.current.friendProfiles['empty']).toBeUndefined();
  });

  it('lädt Profile für offene Freundschaftsanfragen', async () => {
    svc.fields['x'] = { username: 'Xavier', displayName: null, photoURL: null };
    const { result } = renderHook(() => useActivityFriendProfiles([], [request('x')]));
    await waitFor(() => expect(result.current.requestProfiles['x']).toBeDefined());
    expect(result.current.requestProfiles['x'].username).toBe('Xavier');
  });
});
