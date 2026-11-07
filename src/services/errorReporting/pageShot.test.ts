// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

const h2i = vi.hoisted(() => ({
  seen: [] as Array<{ scrollTop: number; marginTop: string }>,
  fail: false,
  scroller: null as HTMLElement | null,
}));

vi.mock('html-to-image', () => ({
  toCanvas: vi.fn(async () => {
    const scroller = h2i.scroller as HTMLElement;
    const content = scroller.children[1] as HTMLElement;
    h2i.seen.push({ scrollTop: scroller.scrollTop, marginTop: content.style.marginTop });
    if (h2i.fail) throw new Error('kaputt');
    return {
      toBlob: (cb: (b: Blob | null) => void) => cb(new Blob(['jpeg'], { type: 'image/jpeg' })),
    };
  }),
}));

import { capturePageShot } from './pageShot';

function makeScroller(scrollTop: number): HTMLElement {
  const scroller = document.createElement('div');
  const fixed = document.createElement('div');
  fixed.style.position = 'fixed';
  const content = document.createElement('div');
  scroller.append(fixed, content);
  document.body.append(scroller);
  for (const el of [fixed, content]) {
    Object.defineProperty(el, 'offsetHeight', { configurable: true, get: () => 500 });
  }
  let top = scrollTop;
  Object.defineProperty(scroller, 'scrollTop', {
    configurable: true,
    get: () => top,
    set: (v: number) => {
      top = v;
    },
  });
  scroller.scrollTo = ((opts: ScrollToOptions) => {
    top = opts.top ?? 0;
  }) as typeof scroller.scrollTo;
  h2i.scroller = scroller;
  return scroller;
}

afterEach(() => {
  document.body.innerHTML = '';
  h2i.seen = [];
  h2i.fail = false;
});

describe('capturePageShot', () => {
  it('rechnet den Scroll in einen Rand am ersten Kind im Fluss um und stellt ihn zurück', async () => {
    const scroller = makeScroller(600);
    const blob = await capturePageShot(scroller);
    expect(blob?.type).toBe('image/jpeg');
    expect(h2i.seen[0]).toEqual({ scrollTop: 0, marginTop: '-600px' });
    expect(scroller.scrollTop).toBe(600);
    expect((scroller.children[1] as HTMLElement).style.marginTop).toBe('');
  });

  it('liefert null und stellt den Scroll zurück, wenn das Rendern scheitert', async () => {
    h2i.fail = true;
    const scroller = makeScroller(300);
    expect(await capturePageShot(scroller)).toBeNull();
    expect(scroller.scrollTop).toBe(300);
    expect((scroller.children[1] as HTMLElement).style.marginTop).toBe('');
  });
});
