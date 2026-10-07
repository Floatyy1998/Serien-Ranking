// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Section, SectionTitle } from './Section';

afterEach(() => cleanup());

describe('Section', () => {
  it('rendert seine Kinder und setzt die Mobil-Reihenfolge', () => {
    render(
      <Section delay={0.2} order={3} id="abschnitt">
        <span>Inhalt</span>
      </Section>
    );
    expect(screen.getByText('Inhalt')).toBeInTheDocument();
    expect(document.getElementById('abschnitt')).toHaveStyle({ order: '3' });
  });

  it('SectionTitle rendert Überschrift und Zusatz', () => {
    render(<SectionTitle action={<span>4/10</span>}>Bewertung</SectionTitle>);
    expect(screen.getByRole('heading', { name: 'Bewertung' })).toBeInTheDocument();
    expect(screen.getByText('4/10')).toBeInTheDocument();
  });
});
