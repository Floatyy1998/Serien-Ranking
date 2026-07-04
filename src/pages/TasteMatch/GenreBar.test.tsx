// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { GenreComparison } from '../../services/tasteMatchService';
import { GenreBar } from './GenreBar';

function makeGenre(overrides: Partial<GenreComparison> = {}): GenreComparison {
  return { genre: 'Action', userPercentage: 50, friendPercentage: 50, match: 100, ...overrides };
}

afterEach(() => cleanup());

describe('GenreBar', () => {
  it('rendert Genre-Name und beide Prozentwerte', () => {
    render(
      <GenreBar genre={makeGenre()} index={0} userName="Alice" friendName="Bob" bgColor="#111" />
    );
    expect(screen.getByText('Action')).toBeInTheDocument();
    expect(screen.getAllByText('50%')).toHaveLength(2);
  });

  it('zeigt das Match-Badge bei hoher Ähnlichkeit', () => {
    render(
      <GenreBar genre={makeGenre()} index={0} userName="Alice" friendName="Bob" bgColor="#111" />
    );
    expect(screen.getByText('Match!')).toBeInTheDocument();
  });

  it('blendet das Match-Badge bei niedriger Ähnlichkeit aus', () => {
    render(
      <GenreBar
        genre={makeGenre({ userPercentage: 90, friendPercentage: 10 })}
        index={1}
        userName="Alice"
        friendName="Bob"
        bgColor="#111"
      />
    );
    expect(screen.queryByText('Match!')).not.toBeInTheDocument();
    expect(screen.getByText('90%')).toBeInTheDocument();
    expect(screen.getByText('10%')).toBeInTheDocument();
  });
});
