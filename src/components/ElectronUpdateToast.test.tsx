// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import type React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../contexts/ThemeContextDef', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#00d123',
      accent: '#00ff88',
      background: { surface: '#111111' },
      text: { primary: '#ffffff', secondary: '#cccccc' },
    },
  }),
}));

const MOTION_ONLY = new Set([
  'initial',
  'animate',
  'exit',
  'transition',
  'variants',
  'whileHover',
  'whileTap',
  'layout',
  'drag',
]);
const stripMotionProps = (props: Record<string, unknown>): React.HTMLAttributes<HTMLDivElement> => {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(props)) {
    if (!MOTION_ONLY.has(key)) out[key] = props[key];
  }
  return out as React.HTMLAttributes<HTMLDivElement>;
};

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  motion: {
    div: (props: Record<string, unknown>) => <div {...stripMotionProps(props)} />,
  },
}));

import { ElectronUpdateToast } from './ElectronUpdateToast';

let statusCb: ((status: ElectronUpdateStatus) => void) | null = null;
const installUpdate = vi.fn<() => Promise<void>>(async () => {});

function installElectronApi() {
  window.electronAPI = {
    isElectron: true,
    getAutoStart: async () => false,
    setAutoStart: async () => true,
    onUpdateStatus: (cb: (status: ElectronUpdateStatus) => void) => {
      statusCb = cb;
      return () => {
        statusCb = null;
      };
    },
    installUpdate,
    checkForUpdates: async () => undefined,
  };
}

beforeEach(() => {
  statusCb = null;
  installUpdate.mockClear();
});

afterEach(() => {
  cleanup();
  delete window.electronAPI;
});

describe('ElectronUpdateToast', () => {
  it('renders nothing in a browser (no electronAPI)', () => {
    render(<ElectronUpdateToast />);
    expect(screen.queryByText('Update bereit')).toBeNull();
  });

  it('shows the toast once an update is ready and installs on click', async () => {
    installElectronApi();
    render(<ElectronUpdateToast />);

    // No toast before a "ready" status arrives
    expect(screen.queryByText('Update bereit')).toBeNull();

    act(() => {
      statusCb?.({ state: 'ready', version: '1.2.3' });
    });

    expect(screen.getByText('Update bereit')).toBeInTheDocument();
    expect(screen.getByText('1.2.3')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByText('Jetzt installieren'));
    });

    expect(installUpdate).toHaveBeenCalledTimes(1);
  });

  it('hides the toast when dismissed with "Später"', () => {
    installElectronApi();
    render(<ElectronUpdateToast />);
    act(() => {
      statusCb?.({ state: 'ready', version: '2.0.0' });
    });
    expect(screen.getByText('Update bereit')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Später'));

    expect(screen.queryByText('Update bereit')).toBeNull();
  });
});
