// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('../../lib/interaction/haptics', () => ({ hapticTap: vi.fn() }));
vi.mock('../../components/ui', () => ({
  IconContainer: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));
vi.mock('../../components/invite/InviteSheet', () => ({
  InviteSheet: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div>INVITE_SHEET</div> : null),
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

import { InviteAppBanner } from './InviteAppBanner';

afterEach(() => cleanup());

describe('InviteAppBanner', () => {
  it('nennt die Belohnung und öffnet das Einladungs-Sheet erst beim Antippen', () => {
    render(<InviteAppBanner />);
    expect(screen.getByText('Ihr bekommt beide ein exklusives Accessoire')).toBeInTheDocument();
    expect(screen.queryByText('INVITE_SHEET')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Freunde einladen/ }));
    expect(screen.getByText('INVITE_SHEET')).toBeInTheDocument();
  });
});
