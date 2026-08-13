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

vi.mock('@mui/icons-material/StarRate', () => ({ default: () => null }));

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

const { canOpenMock, openStoreMock, hapticMock } = vi.hoisted(() => ({
  canOpenMock: vi.fn(() => true),
  openStoreMock: vi.fn(),
  hapticMock: vi.fn(),
}));

vi.mock('../../services/appReview', () => ({
  canOpenStoreListing: canOpenMock,
  openStoreListing: openStoreMock,
}));
vi.mock('../../lib/haptics', () => ({ hapticTap: hapticMock }));

import { RateAppSection } from './RateAppSection';

beforeEach(() => {
  canOpenMock.mockReturnValue(true);
  openStoreMock.mockClear();
  hapticMock.mockClear();
});

afterEach(() => cleanup());

describe('RateAppSection', () => {
  it('zeigt den Bewerten-Knopf, wo ein Store dahinter liegt', () => {
    render(<RateAppSection />);
    expect(screen.getByText('App bewerten')).toBeInTheDocument();
  });

  it('rendert nichts, wo es keinen Store gibt', () => {
    canOpenMock.mockReturnValue(false);
    const { container } = render(<RateAppSection />);
    expect(container).toBeEmptyDOMElement();
  });

  it('öffnet die Store-Seite beim Tippen', () => {
    render(<RateAppSection />);
    fireEvent.click(screen.getByText('App bewerten'));
    expect(openStoreMock).toHaveBeenCalledTimes(1);
    expect(hapticMock).toHaveBeenCalledTimes(1);
  });
});
