// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

const { settingsData } = vi.hoisted(() => ({
  settingsData: {
    username: 'floaty',
    setUsername: vi.fn(),
    displayName: 'Konrad',
    setDisplayName: vi.fn(),
    photoURL: '',
    uploading: false,
    saving: false,
    usernameEditable: false,
    setUsernameEditable: vi.fn(),
    displayNameEditable: false,
    setDisplayNameEditable: vi.fn(),
    fileInputRef: { current: null },
    isPublicProfile: false,
    publicProfileId: '',
    isLoadingProfile: false,
    dialog: { open: false, message: '', type: 'info' as const },
    setDialog: vi.fn(),
    snackbar: { open: false, message: '' },
    handleLogout: vi.fn(),
    handleImageUpload: vi.fn(),
    saveUsername: vi.fn(),
    saveDisplayName: vi.fn(),
    handlePublicProfileToggle: vi.fn(),
    copyPublicLink: vi.fn(),
    regeneratePublicId: vi.fn(),
    navigate: vi.fn(),
  },
}));

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

vi.mock('@mui/icons-material', () => ({
  Check: () => null,
  DesktopWindows: () => null,
  Logout: () => null,
  PowerSettingsNew: () => null,
}));

vi.mock('../../contexts/ThemeContextDef', () => {
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

vi.mock('../../components/ui', () => ({
  PageHeader: (props: { title: string }) => <h1>{props.title}</h1>,
  Dialog: () => null,
}));

vi.mock('./useSettingsData', () => ({ useSettingsData: () => settingsData }));
vi.mock('./ProfileSection', () => ({ ProfileSection: () => <div>PROFILE_SECTION</div> }));
vi.mock('./PublicProfileSection', () => ({
  PublicProfileSection: () => <div>PUBLIC_SECTION</div>,
}));
vi.mock('./AppearanceSection', () => ({ AppearanceSection: () => <div>APPEARANCE_SECTION</div> }));
vi.mock('./LegalSection', () => ({ LegalSection: () => <div>LEGAL_SECTION</div> }));
vi.mock('./NotificationsSection', () => ({ NotificationsSection: () => <div>NOTIF_SECTION</div> }));

import { SettingsPage } from './SettingsPage';

afterEach(() => cleanup());

describe('SettingsPage', () => {
  it('renders the header and all composed sections', () => {
    render(<SettingsPage />);
    expect(screen.getByRole('heading', { name: 'Einstellungen' })).toBeInTheDocument();
    expect(screen.getByText('PROFILE_SECTION')).toBeInTheDocument();
    expect(screen.getByText('APPEARANCE_SECTION')).toBeInTheDocument();
    expect(screen.getByText('PUBLIC_SECTION')).toBeInTheDocument();
    expect(screen.getByText('NOTIF_SECTION')).toBeInTheDocument();
    expect(screen.getByText('LEGAL_SECTION')).toBeInTheDocument();
  });

  it('shows the desktop download link in a web (non-electron) context', () => {
    render(<SettingsPage />);
    expect(screen.getByText('Desktop App')).toBeInTheDocument();
  });

  it('logs out when the logout button is clicked', () => {
    render(<SettingsPage />);
    fireEvent.click(screen.getByText('Abmelden'));
    expect(settingsData.handleLogout).toHaveBeenCalledTimes(1);
  });
});
