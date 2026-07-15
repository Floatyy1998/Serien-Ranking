// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('framer-motion', async () => {
  const React = await import('react');
  const skip = new Set(['initial', 'animate', 'exit', 'transition', 'whileTap']);
  const make = (tag: string) =>
    React.forwardRef(function Motion(props: Record<string, unknown>, ref: unknown) {
      const clean: Record<string, unknown> = { ref };
      for (const k in props) if (!skip.has(k)) clean[k] = props[k];
      return React.createElement(tag, clean);
    });
  return {
    motion: new Proxy({} as Record<string, unknown>, { get: (_t, tag) => make(String(tag)) }),
    AnimatePresence: (props: Record<string, unknown>) =>
      React.createElement(React.Fragment, null, props.children as React.ReactNode),
  };
});

vi.mock('@mui/icons-material', () => ({ NotificationsActive: () => null }));
vi.mock('../lib/haptics', () => ({ hapticTap: vi.fn() }));
vi.mock('../lib/motion', () => ({ tapScaleTight: {} }));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'u1' }, onboardingComplete: true }),
}));

vi.mock('../contexts/ThemeContext', () => {
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

const { availableMock, enabledMock, permissionMock, enablePushMock } = vi.hoisted(() => ({
  availableMock: vi.fn(() => true),
  enabledMock: vi.fn(() => false),
  permissionMock: vi.fn(async () => 'prompt' as const),
  enablePushMock: vi.fn(async () => true),
}));

vi.mock('../services/pushNotifications', () => ({
  isNativePushAvailable: availableMock,
  isNativePushEnabled: enabledMock,
  getNativePushPermission: permissionMock,
  enableNativePush: enablePushMock,
}));

import { PushOptInPrompt } from './PushOptInPrompt';

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  availableMock.mockReturnValue(true);
  enabledMock.mockReturnValue(false);
  enablePushMock.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

const flushPrompt = async () => {
  await act(async () => {
    vi.advanceTimersByTime(4100);
    await Promise.resolve();
  });
};

describe('PushOptInPrompt', () => {
  it('erscheint nach kurzer Verzögerung in der nativen App', async () => {
    render(<PushOptInPrompt />);
    expect(screen.queryByText('Keine Folge mehr verpassen')).not.toBeInTheDocument();
    await flushPrompt();
    expect(screen.getByText('Keine Folge mehr verpassen')).toBeInTheDocument();
  });

  it('aktiviert Push und merkt sich die Entscheidung', async () => {
    render(<PushOptInPrompt />);
    await flushPrompt();
    fireEvent.click(screen.getByText('Aktivieren'));
    await act(async () => {
      await Promise.resolve();
    });
    expect(enablePushMock).toHaveBeenCalledWith('u1');
    expect(localStorage.getItem('pushPromptDismissed')).toBe('1');
  });

  it('erscheint nach „Später" nie wieder', async () => {
    render(<PushOptInPrompt />);
    await flushPrompt();
    fireEvent.click(screen.getByText('Später'));
    expect(localStorage.getItem('pushPromptDismissed')).toBe('1');
    cleanup();
    render(<PushOptInPrompt />);
    await flushPrompt();
    expect(screen.queryByText('Keine Folge mehr verpassen')).not.toBeInTheDocument();
  });

  it('bleibt im Browser (kein natives Push) unsichtbar', async () => {
    availableMock.mockReturnValue(false);
    render(<PushOptInPrompt />);
    await flushPrompt();
    expect(screen.queryByText('Keine Folge mehr verpassen')).not.toBeInTheDocument();
  });
});
