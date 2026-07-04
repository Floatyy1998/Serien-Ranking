// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useActorPanZoom } from './useActorPanZoom';

afterEach(() => cleanup());

function mouse(clientX: number, clientY: number, button = 0): React.MouseEvent {
  return { clientX, clientY, button } as unknown as React.MouseEvent;
}
function wheel(deltaY: number): React.WheelEvent {
  return { deltaY, preventDefault: () => {} } as unknown as React.WheelEvent;
}
function touch(clientX: number, clientY: number): React.TouchEvent {
  return { touches: [{ clientX, clientY }] } as unknown as React.TouchEvent;
}

describe('useActorPanZoom – pan', () => {
  it('startet mit neutralem Transform', () => {
    const { result } = renderHook(() => useActorPanZoom());
    expect(result.current.transform).toEqual({ x: 0, y: 0, scale: 1 });
    expect(result.current.isDragging).toBe(false);
  });

  it('verschiebt beim Ziehen der Maus und stoppt beim Loslassen', () => {
    const { result } = renderHook(() => useActorPanZoom());
    act(() => result.current.handleMouseDown(mouse(100, 50)));
    expect(result.current.isDragging).toBe(true);
    act(() => result.current.handleMouseMove(mouse(150, 80)));
    expect(result.current.transform.x).toBe(50);
    expect(result.current.transform.y).toBe(30);
    act(() => result.current.handleMouseUp());
    expect(result.current.isDragging).toBe(false);
  });

  it('ignoriert Nicht-Linksklick und Move ohne aktives Dragging', () => {
    const { result } = renderHook(() => useActorPanZoom());
    act(() => result.current.handleMouseDown(mouse(10, 10, 2)));
    expect(result.current.isDragging).toBe(false);
    act(() => result.current.handleMouseMove(mouse(200, 200)));
    expect(result.current.transform).toEqual({ x: 0, y: 0, scale: 1 });
  });

  it('unterstützt Touch-Pan mit einem Finger', () => {
    const { result } = renderHook(() => useActorPanZoom());
    act(() => result.current.handleTouchStart(touch(20, 20)));
    act(() => result.current.handleTouchMove(touch(60, 55)));
    expect(result.current.transform.x).toBe(40);
    expect(result.current.transform.y).toBe(35);
    act(() => result.current.handleTouchEnd());
    expect(result.current.isDragging).toBe(false);
  });
});

describe('useActorPanZoom – zoom', () => {
  it('zoomt per Wheel nach Richtung', () => {
    const { result } = renderHook(() => useActorPanZoom());
    act(() => result.current.handleWheel(wheel(-1)));
    expect(result.current.transform.scale).toBeCloseTo(1.1, 5);
    act(() => result.current.handleWheel(wheel(1)));
    expect(result.current.transform.scale).toBeCloseTo(0.99, 5);
  });

  it('klemmt zoomIn bei 4 und zoomOut bei 0.3', () => {
    const { result } = renderHook(() => useActorPanZoom());
    act(() => {
      for (let i = 0; i < 20; i++) result.current.zoomIn();
    });
    expect(result.current.transform.scale).toBe(4);
    act(() => {
      for (let i = 0; i < 40; i++) result.current.zoomOut();
    });
    expect(result.current.transform.scale).toBe(0.3);
  });

  it('setzt die Ansicht zurück', () => {
    const { result } = renderHook(() => useActorPanZoom());
    act(() => result.current.zoomIn());
    act(() => result.current.handleMouseDown(mouse(5, 5)));
    act(() => result.current.handleMouseMove(mouse(30, 30)));
    act(() => result.current.resetView());
    expect(result.current.transform).toEqual({ x: 0, y: 0, scale: 1 });
  });
});
