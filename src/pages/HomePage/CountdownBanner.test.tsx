// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CountdownBanner } from './CountdownBanner';

vi.mock('../../contexts/ThemeContext', async () => {
  const { defaultDynamicTheme } = await import('../../theme/dynamicTheme');
  return { useTheme: () => ({ currentTheme: defaultDynamicTheme }) };
});

vi.mock('../../hooks/useDeviceType', () => ({
  useDeviceType: () => ({ isMobile: true, isDesktop: false }),
}));

const baseCountdown = { title: 'Test Show', daysUntil: 3, seasonNumber: 2 };

afterEach(cleanup);

describe('CountdownBanner', () => {
  it('renders the countdown title, label and days remaining', () => {
    render(<CountdownBanner countdown={baseCountdown} totalCount={1} navigate={vi.fn()} />);
    expect(screen.getByText('Test Show')).toBeInTheDocument();
    expect(screen.getByText('Countdown')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText(/Staffel 2/)).toBeInTheDocument();
  });

  it('shows the "Heute" state when daysUntil is 0', () => {
    render(
      <CountdownBanner
        countdown={{ ...baseCountdown, daysUntil: 0 }}
        totalCount={1}
        navigate={vi.fn()}
      />
    );
    expect(screen.getByText('Heute')).toBeInTheDocument();
  });

  it('shows a +N badge when totalCount is greater than 1', () => {
    render(<CountdownBanner countdown={baseCountdown} totalCount={3} navigate={vi.fn()} />);
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('calls navigate with /countdowns when clicked', () => {
    const navigate = vi.fn();
    render(<CountdownBanner countdown={baseCountdown} totalCount={1} navigate={navigate} />);
    fireEvent.click(screen.getByText('Countdown'));
    expect(navigate).toHaveBeenCalledWith('/countdowns');
  });
});
