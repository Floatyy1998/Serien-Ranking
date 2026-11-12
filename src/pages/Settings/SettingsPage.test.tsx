// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

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
    avatar: {
      fileInputRef: { current: null },
      pickFile: vi.fn(),
      handleFileSelected: vi.fn(),
      pendingFile: null,
      cancelCrop: vi.fn(),
      confirmCrop: vi.fn(),
      uploading: false,
    },
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
  Android: () => null,
  Check: () => null,
  DesktopWindows: () => null,
  ExpandMore: () => null,
  Language: () => null,
  Logout: () => null,
  PowerSettingsNew: () => null,
  Public: () => null,
  Translate: () => null,
  ImportExport: () => null,
  FileDownload: () => null,
  FileUpload: () => null,
}));

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

vi.mock('../../components/ui', () => ({
  PageHeader: (props: { title: string }) => <h1>{props.title}</h1>,
  Dialog: () => null,
}));

vi.mock('./useSettingsData', () => ({ useSettingsData: () => settingsData }));
vi.mock('../../components/ui/overlay/ImageCropSheet', () => ({ ImageCropSheet: () => null }));
vi.mock('./sections/ProfileSection', () => ({ ProfileSection: () => <div>PROFILE_SECTION</div> }));
vi.mock('./sections/PublicProfileSection', () => ({
  PublicProfileSection: () => <div>PUBLIC_SECTION</div>,
}));
vi.mock('./sections/InterestsSection', () => ({ InterestsSection: () => <div>INTERESTS</div> }));
vi.mock('./sections/AppearanceSection', () => ({
  AppearanceSection: () => <div>APPEARANCE_SECTION</div>,
}));
vi.mock('./sections/LegalSection', () => ({ LegalSection: () => <div>LEGAL_SECTION</div> }));
vi.mock('./sections/NotificationsSection', () => ({
  NotificationsSection: () => <div>NOTIF_SECTION</div>,
}));
vi.mock('./sections/PetSection', () => ({ PetSection: () => <div>PET_SECTION</div> }));
vi.mock('./sections/LeaderboardVisibilitySection', () => ({
  LeaderboardVisibilitySection: () => <div>LEADERBOARD_SECTION</div>,
}));
vi.mock('./sections/ShareAccessSection', () => ({ ShareAccessSection: () => null }));
vi.mock('./sections/SecuritySection', () => ({ SecuritySection: () => <div>SECURITY</div> }));
vi.mock('./sections/DeleteAccountSection', () => ({ DeleteAccountSection: () => null }));
vi.mock('./sections/ImportExportSection', () => ({ ImportExportSection: () => <div>IMPORT</div> }));
vi.mock('./sections/LanguageSection', () => ({ LanguageSection: () => <div>LANGUAGE</div> }));
vi.mock('./sections/RateAppSection', () => ({ RateAppSection: () => null }));
vi.mock('./sections/PageToursSection', () => ({ PageToursSection: () => null }));

import { SettingsPage } from './SettingsPage';

afterEach(() => cleanup());

const renderAt = (url = '/settings') =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <SettingsPage />
    </MemoryRouter>
  );

describe('SettingsPage', () => {
  it('zeigt Kopf, Profil, Kategorien und die erste Kategorie', () => {
    renderAt();
    expect(screen.getByRole('heading', { name: 'Einstellungen' })).toBeInTheDocument();
    expect(screen.getByText('PROFILE_SECTION')).toBeInTheDocument();
    expect(screen.getAllByText('APPEARANCE_SECTION')).toHaveLength(2);
    expect(screen.queryByText('NOTIF_SECTION')).not.toBeInTheDocument();
  });

  it('wechselt per Kategorie-Liste den Inhalt', () => {
    renderAt();
    fireEvent.click(screen.getByRole('button', { name: /Benachrichtigungen/ }));
    expect(screen.getByText('NOTIF_SECTION')).toBeInTheDocument();
    expect(screen.getByText('PET_SECTION')).toBeInTheDocument();
    expect(screen.queryByText('APPEARANCE_SECTION')).not.toBeInTheDocument();
  });

  it('öffnet die Kategorie aus der Adresse', () => {
    renderAt('/settings?cat=profil');
    expect(screen.getByText('INTERESTS')).toBeInTheDocument();
    expect(screen.getByText('PUBLIC_SECTION')).toBeInTheDocument();
  });

  it('zeigt den Desktop-Download unter Allgemein', () => {
    renderAt('/settings?cat=allgemein');
    expect(screen.getByText('Desktop App')).toBeInTheDocument();
    expect(screen.getByText('LEGAL_SECTION')).toBeInTheDocument();
  });

  it('filtert die Kategorien über die Suche', () => {
    renderAt();
    fireEvent.change(screen.getByLabelText('Einstellung suchen'), {
      target: { value: 'passwort' },
    });
    expect(screen.getByRole('button', { name: /Konto & Daten/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Darstellung/ })).not.toBeInTheDocument();
  });

  it('logs out when the logout button is clicked', () => {
    renderAt();
    fireEvent.click(screen.getByText('Abmelden'));
    expect(settingsData.handleLogout).toHaveBeenCalledTimes(1);
  });
});
