// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

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
    AnimatePresence: ({ children }: { children: unknown }) => children,
  };
});

vi.mock('@mui/icons-material', () => ({ Email: () => null }));

vi.mock('../../../contexts/ThemeContext', () => {
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

const { requestMock } = vi.hoisted(() => ({
  requestMock: vi.fn<(email: string, password: string) => Promise<void>>(),
}));

vi.mock('../../../services/account/emailChange', () => ({ requestEmailChange: requestMock }));

import { ChangeEmailForm } from './ChangeEmailForm';

const fillAndSubmit = (email: string, password = 'geheim123') => {
  fireEvent.click(screen.getByText('E-Mail-Adresse ändern'));
  fireEvent.change(screen.getByPlaceholderText('Neue E-Mail-Adresse'), {
    target: { value: email },
  });
  fireEvent.change(screen.getByPlaceholderText('Passwort zur Bestätigung'), {
    target: { value: password },
  });
  fireEvent.click(screen.getByText('Bestätigungslink senden'));
};

beforeEach(() => {
  requestMock.mockReset().mockResolvedValue(undefined);
});

afterEach(() => cleanup());

describe('ChangeEmailForm', () => {
  it('zeigt die aktuelle Adresse', () => {
    render(<ChangeEmailForm currentEmail="alt@example.com" />);
    expect(screen.getByText('alt@example.com')).toBeInTheDocument();
  });

  it('schickt den Link an die neue Adresse und bestätigt das', async () => {
    render(<ChangeEmailForm currentEmail="alt@example.com" />);
    fillAndSubmit(' neu@example.com ');
    expect(requestMock).toHaveBeenCalledWith('neu@example.com', 'geheim123');
    expect(await screen.findByText(/Bestätigungslink an neu@example.com/)).toBeInTheDocument();
  });

  it('prüft das Adressformat vor dem Absenden', () => {
    render(<ChangeEmailForm currentEmail="alt@example.com" />);
    fillAndSubmit('keine-adresse');
    expect(requestMock).not.toHaveBeenCalled();
    expect(screen.getByText('Bitte gib eine gültige E-Mail-Adresse ein.')).toBeInTheDocument();
  });

  it('meldet ein falsches Passwort', async () => {
    requestMock.mockRejectedValue({ code: 'auth/invalid-credential' });
    render(<ChangeEmailForm currentEmail="alt@example.com" />);
    fillAndSubmit('neu@example.com', 'falsch');
    expect(await screen.findByText('Falsches Passwort.')).toBeInTheDocument();
  });

  it('meldet eine schon vergebene Adresse', async () => {
    requestMock.mockRejectedValue({ code: 'auth/email-already-in-use' });
    render(<ChangeEmailForm currentEmail="alt@example.com" />);
    fillAndSubmit('vergeben@example.com');
    expect(
      await screen.findByText(
        'Diese E-Mail-Adresse wird bereits von einem anderen Konto verwendet.'
      )
    ).toBeInTheDocument();
  });
});
