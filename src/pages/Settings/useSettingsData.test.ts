// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fb = vi.hoisted(() => {
  const state = {
    dataByPath: {} as Record<string, unknown>,
    setCalls: [] as Array<{ path: string; value: unknown }>,
    updateCalls: [] as Array<{ path: string; value: unknown }>,
    signOutCalls: 0,
    putFiles: [] as string[],
  };
  const makeRef = (path: string) => ({
    path,
    once: async () => ({ val: () => state.dataByPath[path] ?? null }),
    set: async (value: unknown) => {
      state.setCalls.push({ path, value });
    },
    update: async (value: unknown) => {
      state.updateCalls.push({ path, value });
    },
    child: (sub: string) => makeRef(`${path}/${sub}`),
    put: async (f: File) => {
      state.putFiles.push(f.name);
    },
    getDownloadURL: async () => 'https://cdn/profile.png',
  });
  const ref = (path?: string) => makeRef(path ?? '');
  const database = Object.assign(() => ({ ref }), {});
  const storage = () => ({ ref: () => makeRef('storage-root') });
  const auth = () => ({
    signOut: async () => {
      state.signOutCalls++;
    },
  });
  return { state, ref, database, storage, auth };
});

vi.mock('firebase/compat/app', () => ({
  default: { database: fb.database, storage: fb.storage, auth: fb.auth },
}));
vi.mock('firebase/compat/database', () => ({}));
vi.mock('firebase/compat/storage', () => ({}));

interface MockUser {
  uid: string;
  displayName?: string;
  photoURL?: string;
  updateProfile: (p: Record<string, unknown>) => Promise<void>;
  reload: () => Promise<void>;
}
const authState = vi.hoisted(() => ({ user: null as MockUser | null }));
vi.mock('../../AuthContext', () => ({ useAuth: () => ({ user: authState.user }) }));

const navSpy = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', () => ({ useNavigate: () => navSpy }));

const analytics = vi.hoisted(() => ({ trackLogout: vi.fn() }));
vi.mock('../../firebase/analytics', () => ({ trackLogout: analytics.trackLogout }));

const searchIndex = vi.hoisted(() => ({ syncUserSearchIndex: vi.fn(async () => {}) }));
vi.mock('../../lib/firebase/userSearchIndex', () => ({
  syncUserSearchIndex: searchIndex.syncUserSearchIndex,
}));

const haptics = vi.hoisted(() => ({
  hapticSelect: vi.fn(),
  hapticSuccess: vi.fn(),
  hapticWarning: vi.fn(),
}));
vi.mock('../../lib/haptics', () => haptics);

import { useSettingsData } from './useSettingsData';

function makeUser(): MockUser {
  return {
    uid: 'u1',
    displayName: 'Old Name',
    photoURL: '',
    updateProfile: vi.fn(async () => {}),
    reload: vi.fn(async () => {}),
  };
}

beforeEach(() => {
  fb.state.dataByPath = {};
  fb.state.setCalls = [];
  fb.state.updateCalls = [];
  fb.state.signOutCalls = 0;
  fb.state.putFiles = [];
  authState.user = makeUser();
  navSpy.mockReset();
  analytics.trackLogout.mockClear();
  searchIndex.syncUserSearchIndex.mockClear();
  haptics.hapticSelect.mockClear();
  haptics.hapticSuccess.mockClear();
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn(async () => {}) },
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('useSettingsData – load', () => {
  it('lädt Profildaten aus Firebase', async () => {
    fb.state.dataByPath['users/u1'] = {
      username: 'coolname',
      displayName: 'Cool Name',
      isPublicProfile: true,
      publicProfileId: 'pub123',
    };
    const { result } = renderHook(() => useSettingsData());
    await waitFor(() => expect(result.current.username).toBe('coolname'));
    expect(result.current.displayName).toBe('Cool Name');
    expect(result.current.isPublicProfile).toBe(true);
    expect(result.current.publicProfileId).toBe('pub123');
  });
});

describe('useSettingsData – actions', () => {
  it('saveUsername aktualisiert Firebase und spiegelt den Suchindex', async () => {
    const { result } = renderHook(() => useSettingsData());
    act(() => result.current.setUsername('neuername'));
    await act(async () => {
      await result.current.saveUsername();
    });
    const upd = fb.state.updateCalls.find((c) => c.path === 'users/u1');
    expect((upd?.value as Record<string, unknown>)?.username).toBe('neuername');
    expect((upd?.value as Record<string, unknown>)?.usernameLower).toBe('neuername');
    expect(searchIndex.syncUserSearchIndex).toHaveBeenCalledWith('u1', { username: 'neuername' });
    expect(result.current.snackbar.open).toBe(true);
  });

  it('saveDisplayName aktualisiert Profil und Firebase', async () => {
    const { result } = renderHook(() => useSettingsData());
    act(() => result.current.setDisplayName('Neuer Name'));
    await act(async () => {
      await result.current.saveDisplayName();
    });
    expect(authState.user?.updateProfile).toHaveBeenCalledWith({ displayName: 'Neuer Name' });
    const upd = fb.state.updateCalls.find(
      (c) => c.path === 'users/u1' && (c.value as Record<string, unknown>).displayName
    );
    expect((upd?.value as Record<string, unknown>)?.displayName).toBe('Neuer Name');
  });

  it('handleLogout meldet ab und navigiert bei Bestätigung', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { result } = renderHook(() => useSettingsData());
    await act(async () => {
      await result.current.handleLogout();
    });
    expect(analytics.trackLogout).toHaveBeenCalled();
    expect(fb.state.signOutCalls).toBe(1);
    expect(navSpy).toHaveBeenCalledWith('/');
  });

  it('handleLogout bricht ohne Bestätigung ab', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const { result } = renderHook(() => useSettingsData());
    await act(async () => {
      await result.current.handleLogout();
    });
    expect(fb.state.signOutCalls).toBe(0);
    expect(navSpy).not.toHaveBeenCalled();
  });

  it('handlePublicProfileToggle aktiviert ein öffentliches Profil (Multi-Path)', async () => {
    const { result } = renderHook(() => useSettingsData());
    await act(async () => {
      await result.current.handlePublicProfileToggle(true);
    });
    const upd = fb.state.updateCalls.find(
      (c) => c.path === '/' && (c.value as Record<string, unknown>)['users/u1/isPublicProfile']
    );
    expect(upd).toBeDefined();
    expect(result.current.isPublicProfile).toBe(true);
    expect(result.current.publicProfileId).not.toBe('');
    expect(haptics.hapticSelect).toHaveBeenCalled();
  });

  it('copyPublicLink kopiert die URL in die Zwischenablage', async () => {
    fb.state.dataByPath['users/u1'] = { publicProfileId: 'abc' };
    const { result } = renderHook(() => useSettingsData());
    await waitFor(() => expect(result.current.publicProfileId).toBe('abc'));
    await act(async () => {
      result.current.copyPublicLink();
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('/public/abc')
    );
  });

  it('handleImageUpload lädt Bild hoch und speichert die URL', async () => {
    const { result } = renderHook(() => useSettingsData());
    const file = new File(['img'], 'avatar.png');
    const event = {
      target: { files: [file] },
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    await act(async () => {
      await result.current.handleImageUpload(event);
    });
    expect(fb.state.putFiles).toContain('avatar.png');
    expect(authState.user?.updateProfile).toHaveBeenCalledWith({
      photoURL: 'https://cdn/profile.png',
    });
    expect(result.current.photoURL).toBe('https://cdn/profile.png');
  });
});
