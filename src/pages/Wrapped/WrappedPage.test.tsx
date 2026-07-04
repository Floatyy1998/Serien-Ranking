// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

const { useWrappedDataMock } = vi.hoisted(() => ({ useWrappedDataMock: vi.fn() }));

vi.mock('../../components/wrapped', () => ({
  WrappedNotAvailablePage: () => <div>NOT_AVAILABLE</div>,
}));
vi.mock('./useWrappedData', () => ({ useWrappedData: useWrappedDataMock }));
vi.mock('./WrappedComponents', () => ({
  WrappedLoadingState: () => <div>LOADING_STATE</div>,
  WrappedErrorState: ({ error }: { error: string }) => <div>ERROR:{error}</div>,
  WrappedProgressBar: () => <div data-testid="progress-bar" />,
  WrappedCloseButton: () => <div data-testid="close-btn" />,
  WrappedNavigationHint: () => <div data-testid="nav-hint" />,
  WrappedSlideRenderer: () => <div data-testid="slide-renderer" />,
}));

import { WrappedPage } from './WrappedPage';

const baseReturn = () => ({
  year: 2026,
  wrappedConfig: { loading: false, enabled: true, year: 2026 },
  user: { displayName: 'Alice' },
  navigate: vi.fn(),
  stats: { some: 'stats' },
  loading: false,
  error: '',
  currentSlide: 0,
  enabledSlides: [{ type: 'intro' }],
  containerRef: { current: null },
  handleTouchStart: vi.fn(),
  handleTouchEnd: vi.fn(),
  handleShare: vi.fn<() => Promise<void>>(),
});

beforeEach(() => useWrappedDataMock.mockReset());

afterEach(() => cleanup());

describe('WrappedPage', () => {
  it('renders the not-available page when Wrapped is disabled', () => {
    useWrappedDataMock.mockReturnValue({
      ...baseReturn(),
      wrappedConfig: { loading: false, enabled: false, year: 2026 },
    });
    render(<WrappedPage />);
    expect(screen.getByText('NOT_AVAILABLE')).toBeInTheDocument();
  });

  it('renders the loading state', () => {
    useWrappedDataMock.mockReturnValue({ ...baseReturn(), loading: true });
    render(<WrappedPage />);
    expect(screen.getByText('LOADING_STATE')).toBeInTheDocument();
  });

  it('renders the error state', () => {
    useWrappedDataMock.mockReturnValue({ ...baseReturn(), error: 'Boom' });
    render(<WrappedPage />);
    expect(screen.getByText('ERROR:Boom')).toBeInTheDocument();
  });

  it('renders slides and progress bar in the happy path', () => {
    useWrappedDataMock.mockReturnValue(baseReturn());
    render(<WrappedPage />);
    expect(screen.getByTestId('slide-renderer')).toBeInTheDocument();
    expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
    expect(screen.getByTestId('nav-hint')).toBeInTheDocument();
  });
});
