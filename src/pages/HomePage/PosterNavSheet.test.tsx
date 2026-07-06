// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock('../../hooks/useTransitionNavigate', () => ({
  useTransitionNavigate: () => navigateMock,
}));
vi.mock('../../contexts/ThemeContext', async () => {
  const { generateDynamicTheme } = await import('../../theme/dynamicTheme');
  const currentTheme = generateDynamicTheme({
    primaryColor: '#00d123',
    backgroundColor: '#000000',
    accentColor: '#008a6e',
  });
  return { useTheme: () => ({ currentTheme }) };
});

import { PosterNavSheet } from './PosterNavSheet';

const nav = {
  open: true,
  seriesId: 123,
  title: 'Breaking Bad',
  episodePath: '/series/123/season/1/episode/2',
};

beforeEach(() => navigateMock.mockReset());
afterEach(() => cleanup());

describe('PosterNavSheet', () => {
  it('does not render sheet content when closed', () => {
    render(<PosterNavSheet posterNav={{ ...nav, open: false }} onClose={vi.fn()} />);
    expect(screen.queryByText('Zur Episode')).not.toBeInTheDocument();
  });

  it('renders the title and navigation options when open', () => {
    render(<PosterNavSheet posterNav={nav} onClose={vi.fn()} />);
    expect(screen.getByText('Breaking Bad')).toBeInTheDocument();
    expect(screen.getByText('Zur Episode')).toBeInTheDocument();
    expect(screen.getByText('Zur Serie')).toBeInTheDocument();
  });

  it('closes and navigates to the episode path when "Zur Episode" is clicked', () => {
    const onClose = vi.fn();
    render(<PosterNavSheet posterNav={nav} onClose={onClose} />);
    fireEvent.click(screen.getByText('Zur Episode'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith(nav.episodePath);
  });

  it('closes and navigates to the series page when "Zur Serie" is clicked', () => {
    const onClose = vi.fn();
    render(<PosterNavSheet posterNav={nav} onClose={onClose} />);
    fireEvent.click(screen.getByText('Zur Serie'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith('/series/123');
  });
});
