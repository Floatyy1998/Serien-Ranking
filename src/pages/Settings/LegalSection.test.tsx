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

vi.mock('@mui/icons-material', () => ({ ChevronRight: () => null }));

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

const { setConsentMock } = vi.hoisted(() => ({ setConsentMock: vi.fn() }));

vi.mock('../../firebase/analytics', () => ({
  getAnalyticsConsent: () => false,
  setAnalyticsConsent: setConsentMock,
}));
vi.mock('../../lib/haptics', () => ({ hapticSelect: vi.fn() }));

import { LegalSection } from './LegalSection';

beforeEach(() => setConsentMock.mockClear());
afterEach(() => cleanup());

describe('LegalSection', () => {
  it('renders the legal navigation buttons and data-source links', () => {
    render(<LegalSection onNavigatePrivacy={vi.fn()} onNavigateImpressum={vi.fn()} />);
    expect(screen.getByText('Datenschutzerklärung')).toBeInTheDocument();
    expect(screen.getByText('Impressum')).toBeInTheDocument();
    expect(screen.getByText('JustWatch')).toBeInTheDocument();
    expect(screen.getByText('TMDB')).toBeInTheDocument();
  });

  it('calls the navigation handlers when the links are clicked', () => {
    const onNavigatePrivacy = vi.fn();
    const onNavigateImpressum = vi.fn();
    render(
      <LegalSection
        onNavigatePrivacy={onNavigatePrivacy}
        onNavigateImpressum={onNavigateImpressum}
      />
    );
    fireEvent.click(screen.getByText('Datenschutzerklärung'));
    expect(onNavigatePrivacy).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText('Impressum'));
    expect(onNavigateImpressum).toHaveBeenCalledTimes(1);
  });

  it('persists the analytics consent when the toggle is switched on', () => {
    render(<LegalSection onNavigatePrivacy={vi.fn()} onNavigateImpressum={vi.fn()} />);
    fireEvent.click(screen.getByLabelText('Firebase Analytics'));
    expect(setConsentMock).toHaveBeenCalledWith(true);
  });
});
