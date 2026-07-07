// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const { authApi, dbRefSet, navigateMock, trackRegisterMock, syncIndexMock } = vi.hoisted(() => ({
  authApi: {
    createUserWithEmailAndPassword: vi.fn(),
  },
  dbRefSet: vi.fn<() => Promise<void>>(),
  navigateMock: vi.fn(),
  trackRegisterMock: vi.fn(),
  syncIndexMock: vi.fn<() => Promise<void>>(),
}));

vi.mock('framer-motion', async () => {
  const React = await import('react');
  const make = (tag: string) =>
    React.forwardRef(function Motion(props: Record<string, unknown>, ref: unknown) {
      const clean: Record<string, unknown> = { ref };
      for (const k in props)
        if (!['initial', 'animate', 'exit', 'transition', 'whileTap', 'whileHover'].includes(k))
          clean[k] = props[k];
      return React.createElement(tag, clean);
    });
  return {
    motion: new Proxy({} as Record<string, unknown>, { get: (_t, tag) => make(String(tag)) }),
  };
});

vi.mock('firebase/compat/app', () => {
  const database = Object.assign(() => ({ ref: () => ({ set: dbRefSet }) }), {
    ServerValue: { TIMESTAMP: 0 },
  });
  return { default: { auth: () => authApi, database } };
});
vi.mock('firebase/compat/auth', () => ({}));
vi.mock('firebase/compat/database', () => ({}));

vi.mock('../../components/ui', () => ({
  GradientText: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
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
vi.mock('../../services/firebase/analytics', () => ({ trackRegister: trackRegisterMock }));
vi.mock('../../services/firebase/userSearchIndex', () => ({ syncUserSearchIndex: syncIndexMock }));
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

import { RegisterPage } from './RegisterPage';

const fillForm = (
  container: HTMLElement,
  { username = 'Alice', email = 'a@b.de', pw = 'secret1', confirm = 'secret1' } = {}
) => {
  // Re-query fresh before each change: capturing all nodes up front yields stale
  // references after the intervening controlled-input re-renders.
  const all = () => Array.from(container.querySelectorAll('input')) as HTMLInputElement[];
  fireEvent.change(
    all().find((i) => i.type !== 'email' && i.type !== 'password') as HTMLInputElement,
    {
      target: { value: username },
    }
  );
  fireEvent.change(all().find((i) => i.type === 'email') as HTMLInputElement, {
    target: { value: email },
  });
  fireEvent.change(all().filter((i) => i.type === 'password')[0], { target: { value: pw } });
  fireEvent.change(all().filter((i) => i.type === 'password')[1], { target: { value: confirm } });
};

const submit = (container: HTMLElement) =>
  fireEvent.submit(container.querySelector('form') as HTMLFormElement);

beforeEach(() => {
  authApi.createUserWithEmailAndPassword.mockReset().mockResolvedValue({
    user: {
      uid: 'u1',
      email: 'a@b.de',
      updateProfile: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
      sendEmailVerification: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
    },
  });
  dbRefSet.mockReset().mockResolvedValue(undefined);
  syncIndexMock.mockReset().mockResolvedValue(undefined);
  navigateMock.mockReset();
  trackRegisterMock.mockReset();
});

afterEach(() => cleanup());

describe('RegisterPage', () => {
  it('renders the registration heading and submit button', () => {
    render(<RegisterPage />);
    expect(screen.getByText('Erstelle dein Konto')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Registrieren' })).toBeInTheDocument();
  });

  it('shows an error when passwords do not match', () => {
    const { container } = render(<RegisterPage />);
    fillForm(container, { confirm: 'different' });
    submit(container);
    expect(screen.getByText('Passwörter stimmen nicht überein.')).toBeInTheDocument();
    expect(authApi.createUserWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it('shows an error when the username is too short', () => {
    const { container } = render(<RegisterPage />);
    fillForm(container, { username: 'ab' });
    submit(container);
    expect(
      screen.getByText('Benutzername muss mindestens 3 Zeichen lang sein.')
    ).toBeInTheDocument();
  });

  it('creates the account and navigates on valid submit', async () => {
    const { container } = render(<RegisterPage />);
    fillForm(container);
    submit(container);
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/'));
    expect(authApi.createUserWithEmailAndPassword).toHaveBeenCalledWith('a@b.de', 'secret1');
    expect(dbRefSet).toHaveBeenCalled();
  });
});
