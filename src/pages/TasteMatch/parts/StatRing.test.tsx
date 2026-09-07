// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { StatRing } from './StatRing';

afterEach(() => cleanup());

describe('StatRing', () => {
  it('rendert Label, Score und Icon', () => {
    render(
      <StatRing
        icon={<span data-testid="ring-icon" />}
        label="Serien"
        score={42}
        color="#667eea"
        delay={0.1}
        bgColor="#111"
      />
    );
    expect(screen.getByText('Serien')).toBeInTheDocument();
    expect(screen.getByText('42%')).toBeInTheDocument();
    expect(screen.getByTestId('ring-icon')).toBeInTheDocument();
  });

  it('rendert den Hint-Text wenn übergeben', () => {
    render(
      <StatRing
        icon={<span />}
        label="Filme"
        score={10}
        color="#f093fb"
        delay={0.2}
        bgColor="#111"
        hint="5 gemeinsame Filme"
      />
    );
    expect(screen.getByText('5 gemeinsame Filme')).toBeInTheDocument();
  });
});
