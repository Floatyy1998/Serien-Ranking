// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { useTheme } from '../../contexts/ThemeContextDef';

vi.mock('@mui/icons-material', () => ({ Star: () => null }));

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));
vi.mock('react-router-dom', () => ({ useNavigate: () => navigateMock }));

import { RatingsEmptyState } from './RatingsEmptyState';

const theme = {
  primary: '#3355ff',
  text: { primary: '#ffffff', secondary: '#eeeeee', muted: '#888888' },
} as unknown as ReturnType<typeof useTheme>['currentTheme'];

afterEach(() => {
  cleanup();
  navigateMock.mockReset();
});

describe('RatingsEmptyState', () => {
  it('prompts to rate series when nothing is rated', () => {
    render(<RatingsEmptyState theme={theme} activeTab="series" hasQuickFilter={false} />);
    expect(screen.getByText('Noch keine Serien')).toBeInTheDocument();
    expect(screen.getByText('Serien entdecken')).toBeInTheDocument();
  });

  it('shows a filter-empty message and hides the CTA when a quick filter is active', () => {
    render(<RatingsEmptyState theme={theme} activeTab="movies" hasQuickFilter />);
    expect(screen.getByText('Keine Ergebnisse für diesen Filter')).toBeInTheDocument();
    expect(screen.queryByText('Filme entdecken')).not.toBeInTheDocument();
  });

  it('navigates to discover when the CTA is clicked', () => {
    render(<RatingsEmptyState theme={theme} activeTab="series" hasQuickFilter={false} />);
    fireEvent.click(screen.getByText('Serien entdecken'));
    expect(navigateMock).toHaveBeenCalledWith('/discover');
  });
});
