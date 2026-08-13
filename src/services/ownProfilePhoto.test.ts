// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

type Handler = (snapshot: { val: () => unknown }) => void;

const { refs, dbRefMock } = vi.hoisted(() => {
  const refs = new Map<string, { on: ReturnType<typeof vi.fn>; off: ReturnType<typeof vi.fn> }>();
  return {
    refs,
    dbRefMock: vi.fn((path: string) => {
      if (!refs.has(path)) refs.set(path, { on: vi.fn(), off: vi.fn() });
      return refs.get(path);
    }),
  };
});

vi.mock('./db/ref', () => ({
  dbRef: dbRefMock,
  paths: { photoURL: (uid: string) => `users/${uid}/photoURL` },
}));

import { bindOwnPhotoURL, getOwnPhotoURL, setOwnPhotoURL, useOwnPhotoURL } from './ownProfilePhoto';

/** Den Listener auslösen, den bindOwnPhotoURL registriert hat. */
const emit = (uid: string, value: unknown) => {
  const ref = refs.get(`users/${uid}/photoURL`);
  const calls = ref?.on.mock.calls ?? [];
  const handler = calls[calls.length - 1]?.[1] as Handler | undefined;
  act(() => handler?.({ val: () => value }));
};

beforeEach(() => {
  refs.clear();
  dbRefMock.mockClear();
  bindOwnPhotoURL(null);
});

afterEach(() => bindOwnPhotoURL(null));

describe('bindOwnPhotoURL', () => {
  it('hängt genau einen Listener an den Knoten des Nutzers', () => {
    bindOwnPhotoURL('u1');
    expect(dbRefMock).toHaveBeenCalledWith('users/u1/photoURL');
    expect(refs.get('users/u1/photoURL')?.on).toHaveBeenCalledTimes(1);
  });

  it('bindet bei derselben uid nicht doppelt', () => {
    bindOwnPhotoURL('u1');
    bindOwnPhotoURL('u1');
    expect(refs.get('users/u1/photoURL')?.on).toHaveBeenCalledTimes(1);
  });

  it('löst die alte Bindung beim Kontowechsel', () => {
    bindOwnPhotoURL('u1');
    bindOwnPhotoURL('u2');
    expect(refs.get('users/u1/photoURL')?.off).toHaveBeenCalledTimes(1);
    expect(refs.get('users/u2/photoURL')?.on).toHaveBeenCalledTimes(1);
  });

  it('räumt beim Abmelden auf', () => {
    bindOwnPhotoURL('u1');
    setOwnPhotoURL('https://cdn/a.jpg');

    bindOwnPhotoURL(null);

    expect(refs.get('users/u1/photoURL')?.off).toHaveBeenCalledTimes(1);
    expect(getOwnPhotoURL()).toBeNull();
  });

  it('übernimmt, was die Datenbank meldet', () => {
    bindOwnPhotoURL('u1');
    emit('u1', 'https://cdn/db.jpg');
    expect(getOwnPhotoURL()).toBe('https://cdn/db.jpg');
  });

  it('behandelt einen leeren Knoten als kein Bild', () => {
    bindOwnPhotoURL('u1');
    emit('u1', null);
    expect(getOwnPhotoURL()).toBeNull();
  });
});

describe('useOwnPhotoURL', () => {
  it('meldet eine Änderung an alle Zuschauer', () => {
    bindOwnPhotoURL('u1');
    const a = renderHook(() => useOwnPhotoURL());
    const b = renderHook(() => useOwnPhotoURL());

    act(() => setOwnPhotoURL('https://cdn/neu.jpg'));

    expect(a.result.current).toBe('https://cdn/neu.jpg');
    expect(b.result.current).toBe('https://cdn/neu.jpg');
  });

  it('nimmt den Rückfallwert, solange nichts gesetzt ist', () => {
    const { result } = renderHook(() => useOwnPhotoURL('https://cdn/google.jpg'));
    expect(result.current).toBe('https://cdn/google.jpg');
  });

  it('lässt den gesetzten Wert den Rückfallwert schlagen', () => {
    bindOwnPhotoURL('u1');
    act(() => setOwnPhotoURL('https://cdn/eigen.jpg'));

    const { result } = renderHook(() => useOwnPhotoURL('https://cdn/google.jpg'));

    expect(result.current).toBe('https://cdn/eigen.jpg');
  });

  it('gibt ohne beides null zurück', () => {
    const { result } = renderHook(() => useOwnPhotoURL());
    expect(result.current).toBeNull();
  });
});
