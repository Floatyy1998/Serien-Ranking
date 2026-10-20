// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ScrollEscapeHost } from './ScrollEscapeHost';
import { scrollPageToTop } from './pageScroller';

const navigate = vi.hoisted(() => vi.fn());
const location = vi.hoisted(() => ({ pathname: '/series/42' }));
const navRoot = vi.hoisted(() => ({ value: false }));

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
  useLocation: () => location,
}));
vi.mock('@mui/icons-material', () => ({ ArrowBack: () => null, ArrowUpward: () => null }));
vi.mock('framer-motion', () => {
  const strip = ({
    initial: _i,
    animate: _a,
    exit: _e,
    whileTap: _w,
    layout: _l,
    ...rest
  }: Record<string, unknown>) => rest;
  return {
    AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
    motion: {
      div: (p: Record<string, unknown>) => <div {...strip(p)} />,
      button: (p: Record<string, unknown>) => <button {...strip(p)} />,
    },
  };
});
vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: { primary: '#ef6f8a', accent: '#f2a648', background: { default: '#2b1a2e' } },
  }),
}));
vi.mock('../../hooks/ui/useIsNavRoot', () => ({ useIsNavRoot: () => navRoot.value }));
vi.mock('../../hooks/ui/useReducedMotion', () => ({ useReducedMotion: () => true }));
vi.mock('../../hooks/ui/useAppFocus', () => ({ useAppFocus: () => ({ focus: 'watch' }) }));

const rendered = () => [{}] as unknown as DOMRectList;

const makeScroller = (opts: { height?: number } = {}) => {
  const layout = document.createElement('div');
  layout.className = 'mobile-layout';
  const content = document.createElement('div');
  content.className = 'mobile-content';
  layout.appendChild(content);
  document.body.appendChild(layout);
  Object.defineProperty(content, 'clientHeight', { value: opts.height ?? 800 });
  Object.defineProperty(content, 'scrollTop', { value: 0, writable: true });
  content.getClientRects = rendered;
  content.scrollTo = vi.fn();
  return content;
};

const scrollTo = (el: HTMLElement, top: number) => {
  el.scrollTop = top;
  fireEvent.scroll(el);
  act(() => {
    vi.runAllTimers();
  });
};

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  document.body.innerHTML = '';
  navigate.mockReset();
  navRoot.value = false;
  location.pathname = '/series/42';
});

describe('ScrollEscapeHost', () => {
  it('stays hidden at the top of the page', () => {
    makeScroller();
    render(<ScrollEscapeHost />);
    act(() => {
      vi.runAllTimers();
    });
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows only the up button on dock pages and scrolls the active container up', () => {
    navRoot.value = true;
    const el = makeScroller();
    render(<ScrollEscapeHost />);
    scrollTo(el, 1200);
    expect(screen.queryByRole('button', { name: 'Zurück' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Zum Seitenanfang' }));
    expect(el.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('brings back and home along once the page back button has scrolled away', () => {
    const el = makeScroller();
    render(<ScrollEscapeHost />);
    scrollTo(el, 200);
    expect(screen.queryByRole('button', { name: 'Zum Seitenanfang' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Zur Startseite' }));
    expect(navigate).toHaveBeenCalledWith('/');
    fireEvent.click(screen.getByRole('button', { name: 'Zurück' }));
    expect(navigate).toHaveBeenLastCalledWith('/');
  });

  it('does not duplicate a back button that is still on screen', () => {
    const el = makeScroller();
    const back = document.createElement('div');
    back.setAttribute('data-back-button', '');
    back.getBoundingClientRect = () => ({ width: 90, top: 10, bottom: 50 }) as DOMRect;
    el.appendChild(back);
    render(<ScrollEscapeHost />);
    scrollTo(el, 1200);
    expect(screen.queryByRole('button', { name: 'Zurück' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zum Seitenanfang' })).toBeInTheDocument();
  });

  it('ignores sideways scrolling and small inner scrollers', () => {
    const el = makeScroller();
    const carousel = makeScroller({ height: 200 });
    render(<ScrollEscapeHost />);
    fireEvent.scroll(el);
    scrollTo(carousel, 1500);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('sits above a floating filter button', () => {
    navRoot.value = true;
    const el = makeScroller();
    const fab = document.createElement('button');
    fab.setAttribute('data-fab', '');
    fab.style.bottom = '30px';
    fab.getClientRects = rendered;
    Object.defineProperty(fab, 'offsetHeight', { value: 56 });
    document.body.appendChild(fab);
    const { container } = render(<ScrollEscapeHost />);
    scrollTo(el, 1200);
    expect((container.firstChild as HTMLElement).style.bottom).toBe('calc(98px)');
  });

  it('scrollPageToTop falls back to the visible page container', () => {
    const el = makeScroller();
    scrollPageToTop();
    expect(el.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });
});
