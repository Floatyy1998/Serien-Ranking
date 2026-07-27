// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const reg = vi.hoisted(() => ({ handlers: [] as Array<() => boolean> }));

vi.mock('../services/nativeShell', () => ({
  registerBackInterceptor: (fn: () => boolean) => {
    reg.handlers.push(fn);
    return () => {
      const i = reg.handlers.indexOf(fn);
      if (i >= 0) reg.handlers.splice(i, 1);
    };
  },
}));

import { useAndroidBack } from './useAndroidBack';

/** Wie nativeShell: der zuletzt geöffnete Abfänger kommt zuerst dran. */
const pressBack = (): boolean => {
  for (let i = reg.handlers.length - 1; i >= 0; i--) {
    if (reg.handlers[i]()) return true;
  }
  return false;
};

beforeEach(() => {
  reg.handlers = [];
});

describe('useAndroidBack', () => {
  it('meldet sich nur an, solange das Overlay offen ist', () => {
    const { rerender } = renderHook(({ open }) => useAndroidBack(open, () => {}), {
      initialProps: { open: false },
    });
    expect(reg.handlers).toHaveLength(0);

    rerender({ open: true });
    expect(reg.handlers).toHaveLength(1);

    rerender({ open: false });
    expect(reg.handlers).toHaveLength(0);
  });

  it('schließt das Overlay und verhindert die Navigation', () => {
    const onBack = vi.fn();
    renderHook(() => useAndroidBack(true, onBack));

    expect(pressBack()).toBe(true);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('bei zwei Overlays schließt Zurück nur das zuletzt geöffnete', () => {
    const erstes = vi.fn();
    const zweites = vi.fn();
    renderHook(() => useAndroidBack(true, erstes));
    renderHook(() => useAndroidBack(true, zweites));

    pressBack();
    expect(zweites).toHaveBeenCalledTimes(1);
    expect(erstes).not.toHaveBeenCalled();
  });

  it('meldet sich beim Unmount wieder ab', () => {
    const { unmount } = renderHook(() => useAndroidBack(true, () => {}));
    expect(reg.handlers).toHaveLength(1);
    unmount();
    expect(reg.handlers).toHaveLength(0);
  });

  it('ohne offenes Overlay bleibt der Zurück-Knopf unangetastet', () => {
    renderHook(() => useAndroidBack(false, () => {}));
    expect(pressBack()).toBe(false);
  });
});
