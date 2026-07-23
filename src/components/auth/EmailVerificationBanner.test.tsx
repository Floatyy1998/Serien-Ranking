// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

interface FakeUser {
  emailVerified: boolean;
  metadata?: { creationTime?: string };
  reload: () => Promise<void>;
  sendEmailVerification: () => Promise<void>;
}

const authState = vi.hoisted(() => ({
  user: null as FakeUser | null,
  authStateResolved: true,
}));

const navigate = vi.hoisted(() => vi.fn<(path: string) => void>());
const signOut = vi.hoisted(() => vi.fn<() => Promise<void>>(async () => {}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: authState.user, authStateResolved: authState.authStateResolved }),
}));

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#00d123',
      accent: '#00ff88',
      status: { error: '#ef4444' },
      background: { surface: '#111111', default: '#000000' },
      text: { primary: '#ffffff', secondary: '#cccccc', muted: '#999999' },
    },
  }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
}));

vi.mock('firebase/compat/app', () => ({
  default: { auth: () => ({ signOut }) },
}));
vi.mock('firebase/compat/auth', () => ({}));

// Verifizierungs-Mail läuft über den Backend-Weg (mit Firebase-Fallback).
const requestVerificationMail = vi.hoisted(() =>
  vi.fn<(user: unknown) => Promise<void>>(async () => {})
);
vi.mock('../../services/authMails', () => ({ requestVerificationMail }));

import { EmailVerificationBanner } from './EmailVerificationBanner';

function makeUser(emailVerified: boolean): FakeUser {
  return {
    emailVerified,
    reload: vi.fn<() => Promise<void>>(async () => {}),
    sendEmailVerification: vi.fn<() => Promise<void>>(async () => {}),
  };
}

beforeEach(() => {
  authState.user = null;
  authState.authStateResolved = true;
  navigate.mockReset();
  signOut.mockClear();
});

afterEach(() => {
  cleanup();
});

describe('EmailVerificationBanner', () => {
  it('renders children when the user is verified', async () => {
    authState.user = makeUser(true);
    render(
      <EmailVerificationBanner>
        <div>protected area</div>
      </EmailVerificationBanner>
    );

    expect(await screen.findByText('protected area')).toBeInTheDocument();
    expect(screen.queryByText(/Email nicht verifiziert/)).toBeNull();
  });

  it('shows the banner for an unverified user but keeps the app usable', () => {
    authState.user = makeUser(false);
    render(
      <EmailVerificationBanner>
        <div>protected area</div>
      </EmailVerificationBanner>
    );

    expect(screen.getByText(/Email nicht verifiziert/)).toBeInTheDocument();
    // Kein blockierendes Overlay mehr — die App (inkl. Onboarding) bleibt sichtbar.
    expect(screen.queryByText('Email-Verifizierung erforderlich')).toBeNull();
    expect(screen.getByText('protected area')).toBeInTheDocument();
  });

  it('blocks with the hard gate once the 3-day grace period expired', () => {
    const user = makeUser(false);
    user.metadata = { creationTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() };
    authState.user = user;
    render(
      <EmailVerificationBanner>
        <div>protected area</div>
      </EmailVerificationBanner>
    );

    expect(screen.getByText('Email-Verifizierung erforderlich')).toBeInTheDocument();
  });

  it('resends the verification link on click', () => {
    const user = makeUser(false);
    authState.user = user;
    render(
      <EmailVerificationBanner>
        <div>protected area</div>
      </EmailVerificationBanner>
    );

    fireEvent.click(screen.getByText('Erneut senden'));

    expect(requestVerificationMail).toHaveBeenCalledTimes(1);
    expect(requestVerificationMail).toHaveBeenCalledWith(user);
  });
});
