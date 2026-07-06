// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

const { useTasteProfileDataMock, navigateMock } = vi.hoisted(() => ({
  useTasteProfileDataMock: vi.fn(),
  navigateMock: vi.fn(),
}));

vi.mock('framer-motion', async () => {
  const React = await import('react');
  const make = (tag: string) =>
    React.forwardRef(function Motion(props: Record<string, unknown>, ref: unknown) {
      const clean: Record<string, unknown> = { ref };
      for (const k in props)
        if (!['initial', 'animate', 'exit', 'transition', 'whileTap'].includes(k))
          clean[k] = props[k];
      return React.createElement(tag, clean);
    });
  return {
    motion: new Proxy({} as Record<string, unknown>, { get: (_t, tag) => make(String(tag)) }),
    AnimatePresence: (props: { children: React.ReactNode }) => <>{props.children}</>,
  };
});

vi.mock('@mui/icons-material', () => {
  const Stub = () => <span />;
  return { AutoAwesome: Stub, Movie: Stub, Refresh: Stub, Star: Stub, Tv: Stub };
});
vi.mock('react-router-dom', () => ({ useNavigate: () => navigateMock }));
vi.mock('../../contexts/ThemeContext', () => {
  const make = (): unknown =>
    new Proxy(() => '#333', {
      get: (_t, prop) => {
        if (prop === Symbol.toPrimitive || prop === 'toString' || prop === 'valueOf')
          return () => '#333';
        return make();
      },
    });
  return { useTheme: () => ({ currentTheme: make() }) };
});
vi.mock('../../components/ui', () => ({
  PageLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PageHeader: ({ title, actions }: { title: string; actions?: React.ReactNode }) => (
    <div>
      <h1>{title}</h1>
      {actions}
    </div>
  ),
}));
vi.mock('./useTasteProfileData', () => ({ useTasteProfileData: useTasteProfileDataMock }));

import { TasteProfilePage } from './TasteProfilePage';

const baseReturn = () => ({
  result: null as unknown,
  generating: false,
  error: '',
  hasEnoughData: true,
  generateProfile: vi.fn(),
  clearCache: vi.fn(),
});

beforeEach(() => {
  useTasteProfileDataMock.mockReset();
  navigateMock.mockReset();
});

afterEach(() => cleanup());

describe('TasteProfilePage', () => {
  it('shows the not-enough-data hint', () => {
    useTasteProfileDataMock.mockReturnValue({ ...baseReturn(), hasEnoughData: false });
    render(<TasteProfilePage />);
    expect(screen.getByText('Noch nicht genug Daten')).toBeInTheDocument();
  });

  it('shows the generate CTA and calls generateProfile on click', () => {
    const ret = baseReturn();
    useTasteProfileDataMock.mockReturnValue(ret);
    render(<TasteProfilePage />);
    fireEvent.click(screen.getByText('Empfehlungen generieren'));
    expect(ret.generateProfile).toHaveBeenCalled();
  });

  it('shows the loading list while generating', () => {
    useTasteProfileDataMock.mockReturnValue({ ...baseReturn(), generating: true });
    render(<TasteProfilePage />);
    expect(screen.getByText('Suche passende Empfehlungen...')).toBeInTheDocument();
  });

  it('renders recommendation cards from the result', () => {
    useTasteProfileDataMock.mockReturnValue({
      ...baseReturn(),
      result: {
        recommendations: [
          {
            title: 'Better Call Saul',
            mediaType: 'series',
            tmdbId: 5,
            confidence: 'high',
            reason: 'weil du Breaking Bad magst',
            matchGenres: ['Drama'],
            rating: 8.9,
            providers: [],
            posterUrl: null,
          },
        ],
      },
    });
    render(<TasteProfilePage />);
    expect(screen.getByText('Better Call Saul')).toBeInTheDocument();
    expect(screen.getByText('weil du Breaking Bad magst')).toBeInTheDocument();
  });
});
