// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const { authApi, navigateMock, trackLoginMock } = vi.hoisted(() => ({
  authApi: {
    signInWithEmailAndPassword: vi.fn<() => Promise<void>>(),
    sendPasswordResetEmail: vi.fn<() => Promise<void>>(),
  },
  navigateMock: vi.fn(),
  trackLoginMock: vi.fn(),
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

vi.mock('firebase/compat/app', () => ({
  default: { auth: () => authApi },
}));
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
vi.mock('../../services/firebase/analytics', () => ({ trackLogin: trackLoginMock }));
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

import { LoginPage } from './LoginPage';

beforeEach(() => {
  authApi.signInWithEmailAndPassword.mockReset().mockResolvedValue(undefined);
  authApi.sendPasswordResetEmail.mockReset().mockResolvedValue(undefined);
  navigateMock.mockReset();
  trackLoginMock.mockReset();
});

afterEach(() => cleanup());

describe('LoginPage', () => {
  it('renders the welcome heading and submit button', () => {
    render(<LoginPage />);
    expect(screen.getByText('Willkommen zurück')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Anmelden' })).toBeInTheDocument();
  });

  it('toggles password visibility', () => {
    const { container } = render(<LoginPage />);
    const input = container.querySelector('input[type="password"]') as HTMLInputElement;
    expect(input).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Passwort anzeigen' }));
    expect(container.querySelector('input[type="password"]')).toBeNull();
  });

  it('shows an error when resetting the password without an email', () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Passwort vergessen?' }));
    expect(screen.getByText('Bitte gib zuerst deine E-Mail-Adresse ein.')).toBeInTheDocument();
  });

  it('signs in and navigates on successful submit', async () => {
    const { container } = render(<LoginPage />);
    fireEvent.change(container.querySelector('input[type="email"]') as HTMLInputElement, {
      target: { value: 'a@b.de' },
    });
    fireEvent.change(container.querySelector('input[type="password"]') as HTMLInputElement, {
      target: { value: 'secret1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Anmelden' }));
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/'));
    expect(authApi.signInWithEmailAndPassword).toHaveBeenCalledWith('a@b.de', 'secret1');
  });
});
