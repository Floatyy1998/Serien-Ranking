// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

vi.mock('framer-motion', async () => {
  const React = await import('react');
  const skip = new Set(['initial', 'animate', 'transition']);
  const make = (tag: string) =>
    React.forwardRef(function Motion(props: Record<string, unknown>, ref: unknown) {
      const clean: Record<string, unknown> = { ref };
      for (const k in props) if (!skip.has(k)) clean[k] = props[k];
      return React.createElement(tag, clean);
    });
  return {
    motion: new Proxy({} as Record<string, unknown>, { get: (_t, tag) => make(String(tag)) }),
  };
});

vi.mock('@mui/icons-material', () => ({
  NotificationsActive: () => null,
  SwapHoriz: () => null,
}));

vi.mock('../../AuthContext', () => ({ useAuth: () => ({ user: authUser }) }));

vi.mock('../../contexts/ThemeContext', () => {
  const make = (): unknown =>
    new Proxy(() => '#3355ff', {
      get: (_t, prop) => {
        if (prop === Symbol.toPrimitive || prop === 'toString' || prop === 'valueOf')
          return () => '#3355ff';
        return make();
      },
    });
  return { useTheme: () => ({ currentTheme: make() }) };
});

const { setThresholdMock, setProviderMock, authUser } = vi.hoisted(() => ({
  setThresholdMock: vi.fn(async () => {}),
  setProviderMock: vi.fn(async () => {}),
  // Stable reference: the load effect keys on `user`; a fresh object per render loops.
  authUser: { uid: 'u1' },
}));

vi.mock('../../lib/settings/notificationSettings', () => ({
  DEFAULT_INACTIVE_THRESHOLD_DAYS: 30,
  DEFAULT_PROVIDER_NOTIFICATIONS_ENABLED: true,
  INACTIVE_THRESHOLD_OPTIONS: [0, 14, 30, 60, 90],
  getInactiveThresholdDays: vi.fn(async () => 30),
  getProviderNotificationsEnabled: vi.fn(async () => true),
  setInactiveThresholdDays: setThresholdMock,
  setProviderNotificationsEnabled: setProviderMock,
}));

import { NotificationsSection } from './NotificationsSection';

beforeEach(() => {
  setThresholdMock.mockClear();
  setProviderMock.mockClear();
});
afterEach(() => cleanup());

describe('NotificationsSection', () => {
  it('renders the section title and threshold options', () => {
    render(<NotificationsSection />);
    expect(screen.getByText('Benachrichtigungen')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '14 T.' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aus' })).toBeInTheDocument();
  });

  it('saves a new inactivity threshold once loaded', async () => {
    render(<NotificationsSection />);
    await waitFor(() => expect(screen.getByRole('button', { name: '14 T.' })).not.toBeDisabled());
    fireEvent.click(screen.getByRole('button', { name: '14 T.' }));
    await waitFor(() => expect(setThresholdMock).toHaveBeenCalledWith('u1', 14));
  });

  it('toggles the provider-change notifications setting', async () => {
    render(<NotificationsSection />);
    await waitFor(() =>
      expect(screen.getByLabelText('Provider-Änderungs-Benachrichtigungen')).not.toBeDisabled()
    );
    fireEvent.click(screen.getByLabelText('Provider-Änderungs-Benachrichtigungen'));
    await waitFor(() => expect(setProviderMock).toHaveBeenCalledWith('u1', false));
  });
});
