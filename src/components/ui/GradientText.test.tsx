// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GradientText } from './GradientText';

vi.mock('../../contexts/ThemeContextDef', () => ({
  useTheme: () => ({
    currentTheme: { primary: '#00d123', accent: '#8b5cf6' },
  }),
}));

afterEach(() => cleanup());

describe('GradientText', () => {
  it('renders its children in a span by default', () => {
    render(<GradientText>Hallo Welt</GradientText>);
    const el = screen.getByText('Hallo Welt');
    expect(el.tagName).toBe('SPAN');
  });

  it('renders as the requested element via the "as" prop', () => {
    render(<GradientText as="h2">Titel</GradientText>);
    expect(screen.getByRole('heading', { level: 2, name: 'Titel' })).toBeInTheDocument();
  });

  it('adds the shimmer class when shimmer is enabled', () => {
    render(<GradientText shimmer>Glanz</GradientText>);
    expect(screen.getByText('Glanz')).toHaveClass('gradient-shimmer');
  });

  it('adds the animated-gradient class when animatedGradient is enabled', () => {
    render(<GradientText animatedGradient>Anim</GradientText>);
    expect(screen.getByText('Anim')).toHaveClass('gradient-text-animated');
  });
});
