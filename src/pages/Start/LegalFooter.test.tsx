// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LegalFooter } from './LegalFooter';

vi.mock('react-router-dom', () => ({
  Link: ({ to, children }: { to: string; children?: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

afterEach(() => {
  cleanup();
});

describe('LegalFooter', () => {
  it('renders the Datenschutz link', () => {
    render(<LegalFooter />);
    expect(screen.getByRole('link', { name: 'Datenschutz' })).toHaveAttribute('href', '/privacy');
  });

  it('renders the Impressum link', () => {
    render(<LegalFooter />);
    expect(screen.getByRole('link', { name: 'Impressum' })).toHaveAttribute('href', '/impressum');
  });
});
