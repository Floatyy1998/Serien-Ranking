// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { onValue, subscribeValue } from './subscribeValue';

type Fehler = (e: Error) => void;

function fakeRef() {
  const state: { handler?: unknown; onError?: Fehler; onCalls: number; offCalls: number } = {
    onCalls: 0,
    offCalls: 0,
  };
  const ref = {
    on: (_ev: string, handler: unknown, onError: Fehler) => {
      state.handler = handler;
      state.onError = onError;
      state.onCalls += 1;
    },
    off: () => {
      state.offCalls += 1;
    },
  };
  return { ref: ref as never, state };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('subscribeValue', () => {
  it('haengt den Listener an und meldet ihn beim Aufraeumen ab', () => {
    const { ref, state } = fakeRef();
    const ab = subscribeValue(ref, vi.fn());
    expect(state.onCalls).toBe(1);
    ab();
    expect(state.offCalls).toBe(1);
  });

  it('haengt sich nach permission_denied genau einmal neu an', () => {
    const { ref, state } = fakeRef();
    subscribeValue(ref, vi.fn(), { retryMs: 100 });

    state.onError?.(new Error('permission_denied at /users/u1/pets'));
    expect(state.onCalls).toBe(1);
    vi.advanceTimersByTime(100);
    expect(state.onCalls).toBe(2);

    // Zweiter Fehler ist keine Token-Luecke mehr — kein weiterer Versuch.
    state.onError?.(new Error('permission_denied at /users/u1/pets'));
    vi.advanceTimersByTime(1000);
    expect(state.onCalls).toBe(2);
  });

  it('versucht es nach dem Aufraeumen nicht mehr', () => {
    const { ref, state } = fakeRef();
    const ab = subscribeValue(ref, vi.fn(), { retryMs: 100 });
    state.onError?.(new Error('permission_denied'));
    ab();
    vi.advanceTimersByTime(500);
    expect(state.onCalls).toBe(1);
  });

  it('warnt bei anderen Fehlern, ohne neu anzuhaengen', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { ref, state } = fakeRef();
    subscribeValue(ref, vi.fn(), { label: 'pets', retryMs: 100 });
    state.onError?.(new Error('network unreachable'));
    vi.advanceTimersByTime(500);
    expect(state.onCalls).toBe(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('pets'));
    warn.mockRestore();
  });
});

describe('onValue', () => {
  it('gibt den Handler zurueck, damit bestehende off-Pfade weiter funktionieren', () => {
    const { ref, state } = fakeRef();
    const handler = vi.fn();
    expect(onValue(ref, handler)).toBe(handler);
    expect(state.onCalls).toBe(1);
  });

  it('haengt sich nach permission_denied einmal neu an', () => {
    const { ref, state } = fakeRef();
    onValue(ref, vi.fn());
    state.onError?.(new Error('permission_denied at /users/u1/pets'));
    vi.advanceTimersByTime(2500);
    expect(state.onCalls).toBe(2);

    state.onError?.(new Error('permission_denied at /users/u1/pets'));
    vi.advanceTimersByTime(5000);
    expect(state.onCalls).toBe(2);
  });

  it('warnt bei anderen Fehlern mit dem uebergebenen Label', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { ref, state } = fakeRef();
    onValue(ref, vi.fn(), 'chatIndex');
    state.onError?.(new Error('disconnected'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('chatIndex'));
    warn.mockRestore();
  });
});
