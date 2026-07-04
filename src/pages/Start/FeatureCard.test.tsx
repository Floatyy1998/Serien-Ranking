// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { FeatureCard } from './FeatureCard';

afterEach(() => {
  cleanup();
});

describe('FeatureCard', () => {
  it('renders the title and description', () => {
    render(
      <FeatureCard
        icon={<span data-testid="icon">*</span>}
        title="Serien-Tracking"
        description="Verfolge jede Episode"
        delay={0}
      />
    );
    expect(screen.getByText('Serien-Tracking')).toBeInTheDocument();
    expect(screen.getByText('Verfolge jede Episode')).toBeInTheDocument();
  });

  it('renders the provided icon node', () => {
    render(
      <FeatureCard icon={<span data-testid="icon">*</span>} title="T" description="D" delay={0} />
    );
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('applies a custom color to the icon box', () => {
    const { container } = render(
      <FeatureCard icon={<span>*</span>} title="T" description="D" delay={0} color="#ff0000" />
    );
    const iconBox = container.querySelector('.start-feature-icon-box') as HTMLElement | null;
    expect(iconBox).not.toBeNull();
    expect(iconBox?.style.color).toBeTruthy();
  });
});
