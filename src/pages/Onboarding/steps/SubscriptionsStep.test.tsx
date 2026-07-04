// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import { SubscriptionsStep } from './SubscriptionsStep';

afterEach(() => cleanup());

describe('SubscriptionsStep', () => {
  it('renders the heading, provider tiles and skip label at zero selection', () => {
    render(
      <SubscriptionsStep
        stepNumber={4}
        selectedProviders={new Set()}
        onToggle={() => {}}
        onNext={() => {}}
        onBack={() => {}}
      />
    );
    expect(screen.getByRole('heading', { name: 'Deine Abos.' })).toBeInTheDocument();
    expect(screen.getByText('Netflix')).toBeInTheDocument();
    expect(screen.getByText('überspringen')).toBeInTheDocument();
  });

  it('toggles a provider on click', () => {
    const onToggle = vi.fn<(name: string) => void>();
    render(
      <SubscriptionsStep
        stepNumber={4}
        selectedProviders={new Set()}
        onToggle={onToggle}
        onNext={() => {}}
        onBack={() => {}}
      />
    );
    fireEvent.click(screen.getByText('Netflix'));
    expect(onToggle).toHaveBeenCalledWith('Netflix');
  });

  it('fires onBack from the back button', () => {
    const onBack = vi.fn<() => void>();
    render(
      <SubscriptionsStep
        stepNumber={4}
        selectedProviders={new Set(['Netflix'])}
        onToggle={() => {}}
        onNext={() => {}}
        onBack={onBack}
      />
    );
    fireEvent.click(screen.getByText('← zurück'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
