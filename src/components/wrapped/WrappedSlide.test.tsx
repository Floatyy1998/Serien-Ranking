// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { WrappedSlide } from './WrappedSlide';

afterEach(() => cleanup());

describe('WrappedSlide', () => {
  it('renders its children', () => {
    render(
      <WrappedSlide>
        <span>Slide-Inhalt</span>
      </WrappedSlide>
    );
    expect(screen.getByText('Slide-Inhalt')).toBeInTheDocument();
  });

  it('applies the base class plus a custom className', () => {
    const { container } = render(
      <WrappedSlide className="extra">
        <span>x</span>
      </WrappedSlide>
    );
    const slide = container.querySelector('.wrapped-slide');
    expect(slide).not.toBeNull();
    expect(slide?.className).toContain('extra');
  });

  it('uses a gradient background when provided', () => {
    const { container } = render(
      <WrappedSlide gradient="linear-gradient(#000, #fff)">
        <span>x</span>
      </WrappedSlide>
    );
    const slide = container.querySelector('.wrapped-slide') as HTMLElement;
    expect(slide.style.background).toContain('linear-gradient');
  });
});
