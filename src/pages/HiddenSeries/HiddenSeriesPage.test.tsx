// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

const { seriesValue, navigateMock } = vi.hoisted(() => ({
  seriesValue: {
    hiddenSeriesList: [] as unknown[],
    toggleHideSeries: vi.fn<() => Promise<void>>(),
  },
  navigateMock: vi.fn(),
}));

vi.mock('framer-motion', async () => {
  const React = await import('react');
  const make = (tag: string) =>
    React.forwardRef(function Motion(props: Record<string, unknown>, ref: unknown) {
      const clean: Record<string, unknown> = { ref };
      for (const k in props)
        if (!['initial', 'animate', 'exit', 'transition', 'whileTap', 'layout'].includes(k))
          clean[k] = props[k];
      return React.createElement(tag, clean);
    });
  return {
    motion: new Proxy({} as Record<string, unknown>, { get: (_t, tag) => make(String(tag)) }),
    AnimatePresence: (props: { children: React.ReactNode }) => <>{props.children}</>,
  };
});

vi.mock('@mui/icons-material', () => ({ Visibility: () => <span /> }));
vi.mock('react-router-dom', () => ({ useNavigate: () => navigateMock }));
vi.mock('../../contexts/SeriesListContext', () => ({ useSeriesList: () => seriesValue }));
vi.mock('../../contexts/ThemeContextDef', () => {
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
  PageHeader: ({ title, actions }: { title: string; actions?: React.ReactNode }) => (
    <div>
      <h1>{title}</h1>
      {actions}
    </div>
  ),
  PageLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('../../utils/imageUrl', () => ({ getImageUrl: () => 'poster.jpg' }));
vi.mock('../../lib/motion', () => ({ tapScaleTight: {} }));

import { HiddenSeriesPage } from './HiddenSeriesPage';

beforeEach(() => {
  seriesValue.hiddenSeriesList = [];
  seriesValue.toggleHideSeries.mockReset().mockResolvedValue(undefined);
  navigateMock.mockReset();
});

afterEach(() => cleanup());

describe('HiddenSeriesPage', () => {
  it('shows the empty state when nothing is hidden', () => {
    render(<HiddenSeriesPage />);
    expect(screen.getByText('Alles aktiv')).toBeInTheDocument();
  });

  it('renders hidden series and navigates when a card is clicked', () => {
    seriesValue.hiddenSeriesList = [
      {
        id: 7,
        title: 'Dark',
        poster: { poster: 'p.jpg' },
        seasons: [{ episodes: [{ watched: true }, { watched: false }] }],
      },
    ];
    render(<HiddenSeriesPage />);
    expect(screen.getByText('Dark')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Dark'));
    expect(navigateMock).toHaveBeenCalledWith('/series/7');
  });

  it('unhides a series when the "Weiter" button is clicked', () => {
    seriesValue.hiddenSeriesList = [
      { id: 7, title: 'Dark', poster: { poster: 'p.jpg' }, seasons: [] },
    ];
    render(<HiddenSeriesPage />);
    fireEvent.click(screen.getByText('Weiter'));
    expect(seriesValue.toggleHideSeries).toHaveBeenCalledWith(7, false);
  });
});
