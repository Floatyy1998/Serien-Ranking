// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('../components/CoverWall', () => ({ CoverWall: () => <div>cover-wall</div> }));

import { WelcomeStep } from './WelcomeStep';

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn<() => Promise<Response>>(
      async () => ({ ok: true, json: async () => ({ results: [] }) }) as Response
    )
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('WelcomeStep', () => {
  it('renders the curated genres and skip action', () => {
    const onSkip = vi.fn<() => void>();
    render(
      <WelcomeStep
        username="Alice"
        selectedSlugs={[]}
        onToggleGenre={() => {}}
        onNext={() => {}}
        onSkip={onSkip}
      />
    );
    expect(screen.getByText('Drama')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
    fireEvent.click(screen.getByText('jetzt nicht'));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it('enables the next CTA once a genre is selected', () => {
    const onNext = vi.fn<() => void>();
    render(
      <WelcomeStep
        username="Alice"
        selectedSlugs={['drama']}
        onToggleGenre={() => {}}
        onNext={onNext}
        onSkip={() => {}}
      />
    );
    const cta = screen.getByText('weiter').closest('button') as HTMLButtonElement;
    expect(cta.disabled).toBe(false);
    fireEvent.click(cta);
    expect(onNext).toHaveBeenCalledTimes(1);
  });
});
