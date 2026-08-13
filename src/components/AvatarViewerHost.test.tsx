// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';

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
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    motion: new Proxy({} as Record<string, unknown>, { get: (_t, tag) => make(String(tag)) }),
  };
});

vi.mock('@mui/icons-material/Close', () => ({ default: () => null }));
vi.mock('../hooks/useAndroidBack', () => ({ useAndroidBack: vi.fn() }));
vi.mock('../hooks/useReducedMotion', () => ({ useReducedMotion: () => true }));

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

import { showAvatar } from '../lib/avatarViewer';
import { AvatarViewerHost } from './AvatarViewerHost';

const open = (url: string | null, name = 'Alice') =>
  act(() => {
    showAvatar(url, name);
  });

afterEach(() => cleanup());

describe('AvatarViewerHost', () => {
  it('zeigt zunächst nichts', () => {
    render(<AvatarViewerHost />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('öffnet das Bild auf Anforderung', () => {
    render(<AvatarViewerHost />);

    open('https://cdn/a.jpg');

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByAltText('Profilbild von Alice')).toHaveAttribute('src', 'https://cdn/a.jpg');
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('öffnet nichts, wenn es gar kein Bild gibt', () => {
    render(<AvatarViewerHost />);

    open(null);

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('schließt beim Tippen auf den Hintergrund', () => {
    render(<AvatarViewerHost />);
    open('https://cdn/a.jpg');

    fireEvent.click(screen.getByRole('dialog'));

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('schließt nicht, wenn man das Bild selbst antippt', () => {
    render(<AvatarViewerHost />);
    open('https://cdn/a.jpg');

    fireEvent.click(screen.getByAltText('Profilbild von Alice'));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('schließt über Escape', () => {
    render(<AvatarViewerHost />);
    open('https://cdn/a.jpg');

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });

    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('showAvatar', () => {
  it('meldet false ohne Bild, damit Aufrufer nicht klickbar werden', () => {
    expect(showAvatar(null, 'Alice')).toBe(false);
    expect(showAvatar(undefined, 'Alice')).toBe(false);
    expect(showAvatar('', 'Alice')).toBe(false);
  });

  it('meldet true mit Bild', () => {
    expect(showAvatar('https://cdn/a.jpg', 'Alice')).toBe(true);
  });
});
