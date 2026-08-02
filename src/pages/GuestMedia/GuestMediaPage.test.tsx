// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#ef6f8a',
      accent: '#f2a648',
      text: { primary: '#fff', secondary: '#eee', muted: '#999' },
      background: { default: '#2b1a2e' },
      status: { success: '#22c55e' },
    },
  }),
}));

vi.mock('../../hooks/useDeviceType', () => ({
  useDeviceType: () => ({ isMobile: false, isDesktop: true }),
}));

const navigateMock = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}));

const addGuestPickMock = vi.hoisted(() => vi.fn());
vi.mock('../../services/guestOnboarding', () => ({
  addGuestPick: addGuestPickMock,
}));

// framer-motion-Lifecycle wirft in jsdom — Prop-strippender Passthrough reicht.
vi.mock('framer-motion', async () => {
  const { createElement, forwardRef } = await import('react');
  const SKIP = new Set(['initial', 'animate', 'exit', 'whileTap', 'transition', 'variants']);
  const make = (tag: string) =>
    forwardRef((props: Record<string, unknown>, ref: React.Ref<unknown>) => {
      const clean: Record<string, unknown> = {};
      for (const k in props) if (!SKIP.has(k)) clean[k] = props[k];
      return createElement(tag, { ...clean, ref });
    });
  const cache: Record<string, unknown> = {};
  return {
    motion: new Proxy(
      {},
      { get: (_t: object, tag: string | symbol) => (cache[String(tag)] ??= make(String(tag))) }
    ),
  };
});

import { GuestMediaPage } from './GuestMediaPage';

const seriesDetail = {
  name: 'Furious',
  first_air_date: '2026-07-27',
  overview: 'Eine Serie.',
  poster_path: '/p.jpg',
  backdrop_path: '/b.jpg',
  vote_average: 7.5,
  number_of_seasons: 1,
  genres: [{ name: 'Drama' }],
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  navigateMock.mockReset();
  addGuestPickMock.mockReset();
});

beforeEach(() => {
  vi.stubEnv('VITE_API_TMDB', 'testkey');
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, json: async () => seriesDetail }) as unknown as Response)
  );
});

describe('GuestMediaPage', () => {
  it('zeigt Titel, Meta und CTA nach dem TMDB-Load', async () => {
    render(<GuestMediaPage mediaType="tv" tmdbId={287238} />);
    expect(await screen.findByText('Furious')).toBeInTheDocument();
    expect(screen.getByText(/2026/)).toBeInTheDocument();
    expect(screen.getByText('Jetzt tracken — kostenlos')).toBeInTheDocument();
  });

  it('legt den Titel als Gast-Pick ab und geht ins /join-Onboarding', async () => {
    render(<GuestMediaPage mediaType="tv" tmdbId={287238} />);
    fireEvent.click(await screen.findByText('Jetzt tracken — kostenlos'));
    expect(addGuestPickMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: 287238, type: 'series', title: 'Furious' })
    );
    expect(navigateMock).toHaveBeenCalledWith('/join');
  });

  it('zeigt den Fehlerzustand, wenn TMDB nichts liefert', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 404 }) as unknown as Response)
    );
    render(<GuestMediaPage mediaType="movie" tmdbId={1} />);
    await waitFor(() => expect(screen.getByText('Titel nicht gefunden.')).toBeInTheDocument());
  });
});
