// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('framer-motion', async () => {
  const React = await import('react');
  const skip = new Set(['initial', 'animate', 'transition', 'whileTap']);
  const make = (tag: string) =>
    React.forwardRef(function Motion(props: Record<string, unknown>, ref: unknown) {
      const clean: Record<string, unknown> = { ref };
      for (const k in props) if (!skip.has(k)) clean[k] = props[k];
      return React.createElement(tag, clean);
    });
  return {
    motion: new Proxy({} as Record<string, unknown>, { get: (_t, tag) => make(String(tag)) }),
  };
});

vi.mock('@mui/icons-material/HelpOutline', () => ({ default: () => null }));

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

const { resetMock, toastMock } = vi.hoisted(() => ({ resetMock: vi.fn(), toastMock: vi.fn() }));

vi.mock('../../services/pageTour', () => ({ resetSeenTours: resetMock }));
vi.mock('../../lib/toast', () => ({ showToast: toastMock }));
vi.mock('../../lib/haptics', () => ({ hapticTap: vi.fn() }));

import { PageToursSection } from './PageToursSection';

beforeEach(() => {
  resetMock.mockClear();
  toastMock.mockClear();
});

afterEach(() => cleanup());

describe('PageToursSection', () => {
  it('zeigt den Knopf zum Zurücksetzen', () => {
    render(<PageToursSection />);
    expect(screen.getByText('Seitenhilfen zurücksetzen')).toBeInTheDocument();
  });

  it('setzt die gesehenen Hilfen zurück und meldet es', () => {
    render(<PageToursSection />);

    fireEvent.click(screen.getByText('Seitenhilfen zurücksetzen'));

    expect(resetMock).toHaveBeenCalledTimes(1);
    expect(toastMock).toHaveBeenCalledWith('Seitenhilfen werden wieder angezeigt', 2500, 'success');
  });
});
