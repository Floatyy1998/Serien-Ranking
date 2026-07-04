// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { navigateMock, hidden } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  hidden: { current: [] as unknown[] },
}));

vi.mock('react-router-dom', () => ({ useNavigate: () => navigateMock }));
vi.mock('../../contexts/ThemeContextDef', async () => {
  const { generateDynamicTheme } = await import('../../theme/dynamicTheme');
  const currentTheme = generateDynamicTheme({
    primaryColor: '#00d123',
    backgroundColor: '#000000',
    accentColor: '#008a6e',
  });
  return { useTheme: () => ({ currentTheme }) };
});
vi.mock('../../contexts/SeriesListContext', () => ({
  useSeriesList: () => ({ hiddenSeriesList: hidden.current }),
}));

import { HiddenSeriesCard } from './HiddenSeriesCard';

beforeEach(() => {
  navigateMock.mockReset();
  hidden.current = [];
});
afterEach(() => cleanup());

describe('HiddenSeriesCard', () => {
  it('renders nothing when there are no hidden series', () => {
    const { container } = render(<HiddenSeriesCard />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a labelled button with the count when series are hidden', () => {
    hidden.current = [{ id: 1 }, { id: 2 }];
    render(<HiddenSeriesCard />);
    expect(screen.getByText('Nicht weitergeschaut')).toBeInTheDocument();
    expect(screen.getByText(/2 Serien ausgeblendet/)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Nicht weitergeschaut: 2 Serien ausgeblendet/ })
    ).toBeInTheDocument();
  });

  it('navigates to /hidden-series on click', () => {
    hidden.current = [{ id: 1 }];
    render(<HiddenSeriesCard />);
    fireEvent.click(screen.getByRole('button'));
    expect(navigateMock).toHaveBeenCalledWith('/hidden-series');
  });
});
