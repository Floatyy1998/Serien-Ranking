// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

vi.mock('../../contexts/ThemeContextDef', () => {
  const make = (): unknown =>
    new Proxy(() => '#3355ff', {
      get: (_t, prop) => {
        if (prop === Symbol.toPrimitive || prop === 'toString' || prop === 'valueOf')
          return () => '#3355ff';
        return make();
      },
    });
  return { useTheme: () => ({ currentTheme: make() }) };
});

vi.mock('../../components/ui', () => ({
  GradientText: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

import { GradientRing } from './GradientRing';

afterEach(() => cleanup());

describe('GradientRing', () => {
  it('renders the rounded progress percentage', () => {
    render(<GradientRing progress={50} />);
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('caps the displayed percentage at 99%', () => {
    render(<GradientRing progress={100} />);
    expect(screen.getByText('99%')).toBeInTheDocument();
  });

  it('renders an svg sized to the given prop', () => {
    const { container } = render(<GradientRing progress={25} size={80} />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('width')).toBe('80');
  });
});
