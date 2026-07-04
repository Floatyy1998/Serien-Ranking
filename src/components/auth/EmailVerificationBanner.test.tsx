// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

interface FakeUser {
  emailVerified: boolean;
  reload: () => Promise<void>;
  sendEmailVerification: () => Promise<void>;
}

const authState = vi.hoisted(() => ({
  user: null as FakeUser | null,
  authStateResolved: true,
}));

const navigate = vi.hoisted(() => vi.fn<(path: string) => void>());
const signOut = vi.hoisted(() => vi.fn<() => Promise<void>>(async () => {}));

vi.mock('../../AuthContext', () => ({
  useAuth: () => ({ user: authState.user, authStateResolved: authState.authStateResolved }),
}));

vi.mock('../../contexts/ThemeContextDef', () => ({
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

  it('shows the verification banner for an unverified user', () => {
    authState.user = makeUser(false);
    render(
      <EmailVerificationBanner>
        <div>protected area</div>
      </EmailVerificationBanner>
    );

    expect(screen.getByText(/Email nicht verifiziert/)).toBeInTheDocument();
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

    expect(user.sendEmailVerification).toHaveBeenCalledTimes(1);
  });
});
