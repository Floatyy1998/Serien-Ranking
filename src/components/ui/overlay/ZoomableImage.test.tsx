// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ZoomableImage } from './ZoomableImage';

/**
 * jsdom kennt kein PointerEvent — ohne diesen Ersatz baut Testing-Library ein
 * nacktes `Event`, und clientX/pointerId kommen gar nicht erst im Handler an.
 */
class TestPointerEvent extends MouseEvent {
  pointerId: number;
  constructor(type: string, init: MouseEventInit & { pointerId?: number } = {}) {
    super(type, init);
    this.pointerId = init.pointerId ?? 1;
  }
}
(globalThis as unknown as { PointerEvent: unknown }).PointerEvent = TestPointerEvent;
(window as unknown as { PointerEvent: unknown }).PointerEvent = TestPointerEvent;

afterEach(() => cleanup());

/** jsdom kennt kein Layout — Fenstermaße untermogeln, sonst ist alles 0. */
const withViewport = (width: number, height: number) => {
  const view = screen.getByAltText('Testbild').parentElement as HTMLElement;
  Object.defineProperty(view, 'clientWidth', { value: width, configurable: true });
  Object.defineProperty(view, 'clientHeight', { value: height, configurable: true });
  view.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width, height, right: width, bottom: height }) as DOMRect;
  return view;
};

describe('ZoomableImage', () => {
  it('zeigt das Bild', () => {
    render(<ZoomableImage src="https://cdn/a.jpg" alt="Testbild" />);
    expect(screen.getByAltText('Testbild')).toHaveAttribute('src', 'https://cdn/a.jpg');
  });

  it('schließt bei einem Tipp neben dem Bild', () => {
    const onEmptyClick = vi.fn();
    render(<ZoomableImage src="https://cdn/a.jpg" alt="Testbild" onEmptyClick={onEmptyClick} />);
    const view = withViewport(400, 400);

    fireEvent.pointerDown(view, { pointerId: 1, clientX: 10, clientY: 10 });
    fireEvent.pointerUp(view, { pointerId: 1, clientX: 10, clientY: 10 });

    expect(onEmptyClick).toHaveBeenCalledTimes(1);
  });

  it('schließt nicht, wenn der Tipp auf dem Bild landet', () => {
    const onEmptyClick = vi.fn();
    render(<ZoomableImage src="https://cdn/a.jpg" alt="Testbild" onEmptyClick={onEmptyClick} />);
    const view = withViewport(400, 400);
    const image = screen.getByAltText('Testbild');

    fireEvent.pointerDown(image, { pointerId: 1, clientX: 200, clientY: 200 });
    fireEvent.pointerUp(view, { pointerId: 1, clientX: 200, clientY: 200 });

    expect(onEmptyClick).not.toHaveBeenCalled();
  });

  it('schließt nicht, wenn dabei geschoben wurde', () => {
    const onEmptyClick = vi.fn();
    render(<ZoomableImage src="https://cdn/a.jpg" alt="Testbild" onEmptyClick={onEmptyClick} />);
    const view = withViewport(400, 400);

    fireEvent.pointerDown(view, { pointerId: 1, clientX: 10, clientY: 10 });
    fireEvent.pointerMove(view, { pointerId: 1, clientX: 90, clientY: 40 });
    fireEvent.pointerUp(view, { pointerId: 1, clientX: 90, clientY: 40 });

    expect(onEmptyClick).not.toHaveBeenCalled();
  });

  it('vergrößert bei Doppeltipp auf das Bild und meldet es', () => {
    const onZoomChange = vi.fn();
    render(<ZoomableImage src="https://cdn/a.jpg" alt="Testbild" onZoomChange={onZoomChange} />);
    const view = withViewport(400, 400);
    const image = screen.getByAltText('Testbild');
    Object.defineProperty(image, 'naturalWidth', { value: 800, configurable: true });
    Object.defineProperty(image, 'naturalHeight', { value: 800, configurable: true });
    fireEvent.load(image);

    const tap = () => {
      fireEvent.pointerDown(image, { pointerId: 1, clientX: 200, clientY: 200 });
      fireEvent.pointerUp(view, { pointerId: 1, clientX: 200, clientY: 200 });
    };
    tap();
    tap();

    expect(image.style.transform).toContain('scale(2.5)');
    expect(onZoomChange).toHaveBeenLastCalledWith(true);
  });
});
