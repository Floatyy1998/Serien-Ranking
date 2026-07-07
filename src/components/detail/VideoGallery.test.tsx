// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

vi.mock('../../contexts/ThemeContext', () => {
  const make = (): unknown =>
    new Proxy(() => '#3355ff', {
      get: (_t, prop) => {
        if (prop === Symbol.toPrimitive || prop === 'toString' || prop === 'valueOf')
          return () => '#3355ff';
        return make();
      },
    });
  return { useTheme: () => ({ currentTheme: make() }) };
});

// framer-motion's motion-value lifecycle throws in the jsdom test env
// (`removeOnChange is not a function`); a prop-stripping passthrough is enough here.
vi.mock('framer-motion', async () => {
  const { createElement, forwardRef, Fragment } = await import('react');
  const SKIP = new Set([
    'initial',
    'animate',
    'exit',
    'whileTap',
    'whileHover',
    'whileInView',
    'whileFocus',
    'whileDrag',
    'viewport',
    'transition',
    'layout',
    'layoutId',
    'drag',
    'dragConstraints',
    'onViewportEnter',
    'onViewportLeave',
    'variants',
    'custom',
    'onAnimationStart',
    'onAnimationComplete',
  ]);
  const make = (tag: string) =>
    forwardRef((props: Record<string, unknown>, ref: React.Ref<unknown>) => {
      const clean: Record<string, unknown> = {};
      for (const k in props) if (!SKIP.has(k)) clean[k] = props[k];
      return createElement(tag, { ...clean, ref });
    });
  const cache: Record<string, unknown> = {};
  const motion = new Proxy(
    {},
    { get: (_t: object, tag: string | symbol) => (cache[String(tag)] ??= make(String(tag))) }
  );
  return {
    motion,
    AnimatePresence: ({ children }: { children?: React.ReactNode }) =>
      createElement(Fragment, null, children),
    useMotionValue: (v: unknown) => ({ get: () => v, set: () => {} }),
    useSpring: (v: unknown) => v,
    useTransform: () => ({ get: () => 0, set: () => {} }),
    useMotionTemplate: () => '',
  };
});

import { VideoGallery } from './VideoGallery';

const trailerResults = {
  results: [
    {
      id: 'v1',
      key: 'abc',
      name: 'Official Trailer',
      site: 'YouTube',
      type: 'Trailer',
      official: true,
    },
  ],
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('VideoGallery', () => {
  beforeEach(() => {
    // tmdbFetch wirft ohne Key — auf dem CI-Runner gibt es keine .env,
    // deshalb deterministisch stubben (lokal wuerde die echte .env greifen).
    vi.stubEnv('VITE_API_TMDB', 'testkey');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => trailerResults }) as unknown as Response)
    );
  });

  it('renders the trailer trigger button after videos load', async () => {
    render(<VideoGallery tmdbId={100} mediaType="tv" />);
    expect(await screen.findByText('Trailer')).toBeInTheDocument();
  });

  it('opens the modal and shows the video grid when clicked', async () => {
    render(<VideoGallery tmdbId={100} mediaType="tv" />);
    const btn = await screen.findByText('Trailer');
    fireEvent.click(btn);
    expect(await screen.findByText('Videos')).toBeInTheDocument();
    expect(screen.getByText('Trailer (1)')).toBeInTheDocument();
  });

  it('renders nothing when there are no videos', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => ({ results: [] }) }) as unknown as Response)
    );
    const { container } = render(<VideoGallery tmdbId={101} mediaType="tv" />);
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});
