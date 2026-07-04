// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('../components/CoverWall', () => ({ CoverWall: () => <div>cover-wall</div> }));
vi.mock('../components/Confetti', () => ({ Confetti: () => <div>confetti</div> }));

import { CompletionStep } from './CompletionStep';

afterEach(() => cleanup());

describe('CompletionStep', () => {
  it('renders the premiere summary and finish CTA', () => {
    const onFinish = vi.fn<() => void>();
    render(
      <CompletionStep
        seriesCount={3}
        movieCount={2}
        watchedSeriesCount={1}
        posters={['/a.jpg']}
        isCompleting={false}
        completionProgress={0}
        onFinish={onFinish}
        onBack={() => {}}
      />
    );
    expect(screen.getByText('Serien')).toBeInTheDocument();
    expect(screen.getByText('Filme')).toBeInTheDocument();
    expect(screen.getByText('fortgesetzt')).toBeInTheDocument();
    fireEvent.click(screen.getByText("los geht's"));
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('renders the setup progress view while completing', () => {
    render(
      <CompletionStep
        seriesCount={3}
        movieCount={2}
        watchedSeriesCount={1}
        posters={[]}
        isCompleting
        completionProgress={42}
        onFinish={() => {}}
        onBack={() => {}}
      />
    );
    expect(screen.getByText('Setup läuft …')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });
});
