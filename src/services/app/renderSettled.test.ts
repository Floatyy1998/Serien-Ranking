// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RENDER_SETTLE_MAX_MS, whenRenderSettled } from './renderSettled';

// jsdom layoutet nicht: sichtbar ist nur, was hier ein Rechteck bekommt.
function show(el: Element, top = 0): void {
  const rect = { top, bottom: top + 100, left: 0, right: 100, width: 100, height: 100 };
  el.getClientRects = () => [rect] as unknown as DOMRectList;
  el.getBoundingClientRect = () => rect as DOMRect;
}

function loader(): HTMLElement {
  const el = document.createElement('div');
  el.setAttribute('data-app-loading', '');
  return el;
}

let root: HTMLElement;

beforeEach(() => {
  vi.useFakeTimers();
  root = document.createElement('div');
  document.body.appendChild(root);
  show(root);
});

afterEach(() => {
  vi.useRealTimers();
  root.remove();
});

describe('whenRenderSettled', () => {
  it('meldet nach kurzer Ruhe, wenn nichts mehr lädt', async () => {
    const onSettled = vi.fn();
    whenRenderSettled(root, onSettled);
    await vi.advanceTimersByTimeAsync(200);
    expect(onSettled).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(300);
    expect(onSettled).toHaveBeenCalledTimes(1);
  });

  it('wartet, solange ein Lader im Bild ist', async () => {
    const spinner = loader();
    show(spinner);
    root.appendChild(spinner);
    const onSettled = vi.fn();
    whenRenderSettled(root, onSettled);
    await vi.advanceTimersByTimeAsync(3000);
    expect(onSettled).not.toHaveBeenCalled();

    spinner.remove();
    await vi.advanceTimersByTimeAsync(600);
    expect(onSettled).toHaveBeenCalledTimes(1);
  });

  it('wartet auf Platzhalter im Bild', async () => {
    const skeleton = document.createElement('div');
    skeleton.className = 'skeleton-shimmer';
    show(skeleton);
    root.appendChild(skeleton);
    const onSettled = vi.fn();
    whenRenderSettled(root, onSettled);
    await vi.advanceTimersByTimeAsync(2000);
    expect(onSettled).not.toHaveBeenCalled();
  });

  it('ignoriert Lader in versteckten Bereichen und unterhalb des Bildschirms', async () => {
    root.appendChild(loader());
    const below = loader();
    show(below, window.innerHeight + 500);
    root.appendChild(below);
    const onSettled = vi.fn();
    whenRenderSettled(root, onSettled);
    await vi.advanceTimersByTimeAsync(500);
    expect(onSettled).toHaveBeenCalledTimes(1);
  });

  it('wartet auf sichtbare Bilder, die noch laden', async () => {
    const img = document.createElement('img');
    let complete = false;
    Object.defineProperty(img, 'complete', { get: () => complete });
    show(img);
    root.appendChild(img);
    const onSettled = vi.fn();
    whenRenderSettled(root, onSettled);
    await vi.advanceTimersByTimeAsync(2000);
    expect(onSettled).not.toHaveBeenCalled();

    complete = true;
    await vi.advanceTimersByTimeAsync(200);
    expect(onSettled).toHaveBeenCalledTimes(1);
  });

  it('neu eingefügter Inhalt im Bild verlängert die Ruhezeit', async () => {
    const onSettled = vi.fn();
    whenRenderSettled(root, onSettled);
    await vi.advanceTimersByTimeAsync(250);
    root.appendChild(document.createElement('section'));
    await vi.advanceTimersByTimeAsync(250);
    expect(onSettled).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(200);
    expect(onSettled).toHaveBeenCalledTimes(1);
  });

  it('gibt bei hängenden Platzhaltern nach dem Limit auf, statt den Start ewig zu halten', async () => {
    const skeleton = document.createElement('div');
    skeleton.className = 'skeleton-shimmer';
    show(skeleton);
    root.appendChild(skeleton);
    const onSettled = vi.fn();
    whenRenderSettled(root, onSettled);
    await vi.advanceTimersByTimeAsync(RENDER_SETTLE_MAX_MS + 200);
    expect(onSettled).toHaveBeenCalledTimes(1);
  });

  it('deckt nie auf einen Seiten-Lader auf, auch nicht nach dem Limit', async () => {
    const spinner = loader();
    show(spinner);
    root.appendChild(spinner);
    const onSettled = vi.fn();
    whenRenderSettled(root, onSettled);
    await vi.advanceTimersByTimeAsync(RENDER_SETTLE_MAX_MS * 3);
    expect(onSettled).not.toHaveBeenCalled();

    spinner.remove();
    await vi.advanceTimersByTimeAsync(600);
    expect(onSettled).toHaveBeenCalledTimes(1);
  });

  it('meldet nach dem Abbrechen nichts mehr', async () => {
    const onSettled = vi.fn();
    const cancel = whenRenderSettled(root, onSettled);
    cancel();
    await vi.advanceTimersByTimeAsync(2000);
    expect(onSettled).not.toHaveBeenCalled();
  });
});
