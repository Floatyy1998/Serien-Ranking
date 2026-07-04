// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

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

import { WatchJourneyCard } from './WatchJourneyCard';

beforeEach(() => navigateMock.mockReset());
afterEach(() => cleanup());

describe('WatchJourneyCard', () => {
  it('renders the card title and subtitle (smoke)', () => {
    render(<WatchJourneyCard />);
    expect(screen.getByText('Watch Journey')).toBeInTheDocument();
    expect(screen.getByText('Trends & Entwicklung')).toBeInTheDocument();
  });

  it('navigates to /watch-journey when clicked', () => {
    render(<WatchJourneyCard />);
    fireEvent.click(screen.getByRole('button', { name: /Watch Journey/ }));
    expect(navigateMock).toHaveBeenCalledWith('/watch-journey');
  });
});
