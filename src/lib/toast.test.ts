import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Minimal fake DOM (node env has no document). Records elements, class lists,
// children, attributes and event listeners so we can drive/inspect toasts.
// ---------------------------------------------------------------------------
interface FakeEl {
  tagName: string;
  id: string;
  className: string;
  type: string;
  textContent: string;
  style: { cssText: string; width: string };
  classList: {
    add: (c: string) => void;
    remove: (c: string) => void;
    contains: (c: string) => boolean;
  };
  _classes: Set<string>;
  _attrs: Record<string, string>;
  _children: FakeEl[];
  _listeners: Record<string, Array<() => void>>;
  _removed: boolean;
  _parent: FakeEl | null;
  setAttribute: (k: string, v: string) => void;
  getAttribute: (k: string) => string | undefined;
  appendChild: (c: FakeEl) => FakeEl;
  remove: () => void;
  addEventListener: (t: string, cb: () => void) => void;
  fire: (t: string) => void;
}

let allEls: FakeEl[] = [];
let bodyEl: FakeEl;
let headEl: FakeEl;
let rafCbs: Array<{ id: number; cb: () => void }> = [];
let rafSeq = 0;
let nowVal = 0;

function makeEl(tag: string): FakeEl {
  const el = {
    tagName: tag,
    id: '',
    className: '',
    type: '',
    textContent: '',
    style: { cssText: '', width: '' },
    _classes: new Set<string>(),
    _attrs: {} as Record<string, string>,
    _children: [] as FakeEl[],
    _listeners: {} as Record<string, Array<() => void>>,
    _removed: false,
    _parent: null as FakeEl | null,
  } as FakeEl;
  el.classList = {
    add: (c: string) => {
      el._classes.add(c);
    },
    remove: (c: string) => {
      el._classes.delete(c);
    },
    contains: (c: string) => el._classes.has(c),
  };
  el.setAttribute = (k: string, v: string) => {
    el._attrs[k] = v;
  };
  el.getAttribute = (k: string) => el._attrs[k];
  el.appendChild = (c: FakeEl) => {
    el._children.push(c);
    c._parent = el;
    return c;
  };
  el.remove = () => {
    el._removed = true;
    if (el._parent) el._parent._children = el._parent._children.filter((x) => x !== el);
  };
  el.addEventListener = (t: string, cb: () => void) => {
    (el._listeners[t] ||= []).push(cb);
  };
  el.fire = (t: string) => {
    for (const cb of el._listeners[t] || []) cb();
  };
  return el;
}

function makeDocument() {
  bodyEl = makeEl('body');
  headEl = makeEl('head');
  return {
    body: bodyEl,
    head: headEl,
    createElement: (tag: string) => {
      const el = makeEl(tag);
      allEls.push(el);
      return el;
    },
    getElementById: (id: string) => allEls.find((e) => e.id === id) || null,
  };
}

function findByClass(root: FakeEl, cls: string): FakeEl | null {
  if (root.className && root.className.split(' ').includes(cls)) return root;
  for (const c of root._children) {
    const f = findByClass(c, cls);
    if (f) return f;
  }
  return null;
}

const getContainer = () => allEls.find((e) => e.id === 'app-toast-container') || null;

async function loadToast() {
  return import('./toast');
}

beforeEach(() => {
  vi.resetModules();
  allEls = [];
  rafCbs = [];
  rafSeq = 0;
  nowVal = 1000;
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  vi.stubGlobal('document', makeDocument());
  vi.stubGlobal('performance', { now: () => nowVal });
  vi.stubGlobal('requestAnimationFrame', (cb: () => void) => {
    const id = ++rafSeq;
    rafCbs.push({ id, cb });
    return id;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    rafCbs = rafCbs.filter((r) => r.id !== id);
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

// ===========================================================================
describe('showToast', () => {
  it('mounts a toast in a lazily-created container + injects the style once', async () => {
    const { showToast } = await loadToast();
    showToast('Gespeichert');

    const container = getContainer();
    expect(container).not.toBeNull();
    expect(container?._parent).toBe(bodyEl); // container appended to <body>
    expect(container?._children).toHaveLength(1);

    const style = allEls.find((e) => e.id === 'app-toast-style');
    expect(style?._parent).toBe(headEl); // style appended to <head>

    const toast = container!._children[0];
    expect(toast.className).toBe('app-toast');
    expect(findByClass(toast, 'toast-text')?.textContent).toBe('Gespeichert');
  });

  it('success variant → role status / aria-live polite / ✓ icon', async () => {
    const { showToast } = await loadToast();
    showToast('ok', 1500, 'success');
    const toast = getContainer()!._children[0];
    expect(toast.getAttribute('role')).toBe('status');
    expect(toast.getAttribute('aria-live')).toBe('polite');
    expect(findByClass(toast, 'toast-icon--success')?.textContent).toBe('✓');
  });

  it('error variant → role alert / aria-live assertive / ! icon', async () => {
    const { showToast } = await loadToast();
    showToast('fehler', 1500, 'error');
    const toast = getContainer()!._children[0];
    expect(toast.getAttribute('role')).toBe('alert');
    expect(toast.getAttribute('aria-live')).toBe('assertive');
    expect(findByClass(toast, 'toast-icon--error')?.textContent).toBe('!');
  });

  it('info variant → ℹ icon', async () => {
    const { showToast } = await loadToast();
    showToast('info', 1500, 'info');
    const toast = getContainer()!._children[0];
    expect(findByClass(toast, 'toast-icon--info')?.textContent).toBe('ℹ');
  });

  it('auto-dismisses after `duration` then removes the node', async () => {
    const { showToast } = await loadToast();
    showToast('bye', 1000);
    const toast = getContainer()!._children[0];

    vi.advanceTimersByTime(1000); // dismiss animation starts
    expect(toast.classList.contains('toast-out')).toBe(true);
    expect(toast._removed).toBe(false);

    vi.advanceTimersByTime(300); // exit animation done → node removed
    expect(toast._removed).toBe(true);
  });

  it('reuses the same container + style element across calls', async () => {
    const { showToast } = await loadToast();
    showToast('a');
    showToast('b');
    expect(allEls.filter((e) => e.id === 'app-toast-container')).toHaveLength(1);
    expect(allEls.filter((e) => e.id === 'app-toast-style')).toHaveLength(1);
    expect(getContainer()!._children).toHaveLength(2);
  });
});

// ===========================================================================
describe('showUndoToast', () => {
  it('renders an interactive toast with an Undo button (function form)', async () => {
    const { showUndoToast } = await loadToast();
    const onUndo = vi.fn();
    showUndoToast('Episode markiert', onUndo);

    const toast = getContainer()!._children[0];
    expect(toast.className).toContain('toast-interactive');
    expect(findByClass(toast, 'toast-undo-btn')?.textContent).toBe('Rückgängig');
    expect(onUndo).not.toHaveBeenCalled();
  });

  it('Undo click fires onUndo, dismisses, and prevents the later commit', async () => {
    const { showUndoToast } = await loadToast();
    const onUndo = vi.fn();
    const onCommit = vi.fn();
    showUndoToast('markiert', { onUndo, onCommit, duration: 4000 });

    const toast = getContainer()!._children[0];
    findByClass(toast, 'toast-undo-btn')!.fire('click');

    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(onCommit).not.toHaveBeenCalled();

    vi.advanceTimersByTime(5000); // dismiss timer was cleared → no commit
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('auto-commits via the dismiss timer when left untouched', async () => {
    const { showUndoToast } = await loadToast();
    const onUndo = vi.fn();
    const onCommit = vi.fn();
    showUndoToast('markiert', { onUndo, onCommit, duration: 4000 });

    vi.advanceTimersByTime(4000);
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onUndo).not.toHaveBeenCalled();
  });

  it('a second Undo click after settling is a no-op', async () => {
    const { showUndoToast } = await loadToast();
    const onUndo = vi.fn();
    showUndoToast('markiert', onUndo);
    const btn = findByClass(getContainer()!._children[0], 'toast-undo-btn')!;
    btn.fire('click');
    btn.fire('click');
    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it('honors the function-form duration arg (third param)', async () => {
    const { showUndoToast } = await loadToast();
    const onUndo = vi.fn();
    showUndoToast('markiert', onUndo, 2000);
    vi.advanceTimersByTime(1999);
    expect(getContainer()!._children[0]._removed).toBe(false);
    vi.advanceTimersByTime(1); // hits 2000ms dismiss timer
    // commitNow → dismissToast schedules the 300ms removal
    vi.advanceTimersByTime(300);
    expect(getContainer()!._children[0]?._removed ?? true).toBe(true);
  });

  it('commits the oldest toast once the stack limit (3) is exceeded', async () => {
    const { showUndoToast } = await loadToast();
    const commits = [vi.fn(), vi.fn(), vi.fn(), vi.fn()];
    showUndoToast('1', { onUndo: vi.fn(), onCommit: commits[0] });
    showUndoToast('2', { onUndo: vi.fn(), onCommit: commits[1] });
    showUndoToast('3', { onUndo: vi.fn(), onCommit: commits[2] });
    expect(commits[0]).not.toHaveBeenCalled();

    showUndoToast('4', { onUndo: vi.fn(), onCommit: commits[3] }); // 4th → evicts #1
    expect(commits[0]).toHaveBeenCalledTimes(1);
    expect(commits[1]).not.toHaveBeenCalled();
  });

  it('drives the progress bar via requestAnimationFrame and stops at expiry', async () => {
    const { showUndoToast } = await loadToast();
    showUndoToast('markiert', vi.fn() as () => void, 4000);
    const undoChildren = getContainer()!._children[0]._children;
    const bar = undoChildren[undoChildren.length - 1]; // bar appended last

    expect(rafCbs).toHaveLength(1);
    nowVal = 3000; // 2000ms elapsed of 4000 → 50% remaining
    rafCbs[rafCbs.length - 1].cb();
    expect(bar.style.width).toBe('50%');

    nowVal = 6000; // elapsed 5000 > duration → clamp to 0, no further rAF scheduled
    const before = rafCbs.length;
    rafCbs[rafCbs.length - 1].cb();
    expect(bar.style.width).toBe('0%');
    expect(rafCbs.length).toBe(before); // did not re-schedule
  });
});
