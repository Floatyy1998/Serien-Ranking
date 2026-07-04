// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Section, SectionTitle } from './Section';

afterEach(() => cleanup());

describe('Section', () => {
  it('rendert seine Kinder', () => {
    render(
      <Section bg="#111" delay={0.2}>
        <span>Inhalt</span>
      </Section>
    );
    expect(screen.getByText('Inhalt')).toBeInTheDocument();
  });

  it('SectionTitle rendert Titel mit Farbe', () => {
    render(<SectionTitle color="#00d123">Beschreibung</SectionTitle>);
    const title = screen.getByText('Beschreibung');
    expect(title).toBeInTheDocument();
    expect(title).toHaveStyle({ color: '#00d123' });
  });
});
