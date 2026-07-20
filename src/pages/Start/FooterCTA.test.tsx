// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FooterCTA } from './FooterCTA';

vi.mock('react-router-dom', () => ({
  Link: ({ to, children }: { to: string; children?: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

afterEach(() => {
  cleanup();
});

describe('FooterCTA', () => {
  it('renders the heading and description', () => {
    render(<FooterCTA />);
    expect(screen.getByText('Bereit loszulegen?')).toBeInTheDocument();
    expect(
      screen.getByText('Starte noch heute und entdecke deine neue Lieblingsserie')
    ).toBeInTheDocument();
  });

  it('links the register CTA to /register', () => {
    render(<FooterCTA />);
    const cta = screen.getByRole('link', { name: /Jetzt kostenlos registrieren/ });
    expect(cta).toHaveAttribute('href', '/join');
  });
});
