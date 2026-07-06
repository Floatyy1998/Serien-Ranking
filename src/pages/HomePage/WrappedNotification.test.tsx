// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WrappedNotification } from './WrappedNotification';

const navigateMock = vi.hoisted(() => vi.fn());
const cfg = vi.hoisted(() => ({ enabled: true, year: 2025, loading: false }));

vi.mock('react-router-dom', () => ({ useNavigate: () => navigateMock }));

vi.mock('../../contexts/ThemeContext', async () => {
  const { defaultDynamicTheme } = await import('../../theme/dynamicTheme');
  return { useTheme: () => ({ currentTheme: defaultDynamicTheme }) };
});

vi.mock('../../hooks/useWrappedConfig', () => ({
  useWrappedConfig: () => ({ enabled: cfg.enabled, year: cfg.year, loading: cfg.loading }),
}));

beforeEach(() => {
  navigateMock.mockReset();
  cfg.enabled = true;
  cfg.year = 2025;
  cfg.loading = false;
});

afterEach(cleanup);

describe('WrappedNotification', () => {
  it('renders nothing while loading', () => {
    cfg.loading = true;
    render(<WrappedNotification />);
    expect(screen.queryByText('Dein Wrapped ist da')).toBeNull();
  });

  it('renders nothing when disabled', () => {
    cfg.enabled = false;
    render(<WrappedNotification />);
    expect(screen.queryByText('Dein Wrapped ist da')).toBeNull();
  });

  it('renders the banner with the configured year when enabled', () => {
    render(<WrappedNotification />);
    expect(screen.getByText('Dein Wrapped ist da')).toBeInTheDocument();
    expect(screen.getByText('2025')).toBeInTheDocument();
  });

  it('navigates to /wrapped when clicked', () => {
    render(<WrappedNotification />);
    fireEvent.click(screen.getByRole('button', { name: /Wrapped/ }));
    expect(navigateMock).toHaveBeenCalledWith('/wrapped');
  });
});
