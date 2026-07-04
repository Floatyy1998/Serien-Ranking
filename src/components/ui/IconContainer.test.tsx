// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { IconContainer } from './IconContainer';

afterEach(() => cleanup());

describe('IconContainer', () => {
  it('renders its children', () => {
    render(
      <IconContainer color="#ff0000">
        <span data-testid="child">Hi</span>
      </IconContainer>
    );
    expect(screen.getByTestId('child')).toHaveTextContent('Hi');
  });

  it('applies size and className to the wrapper', () => {
    render(
      <IconContainer color="#00ff00" size={64} className="my-box">
        <span data-testid="child">X</span>
      </IconContainer>
    );
    const wrapper = screen.getByTestId('child').parentElement as HTMLElement;
    expect(wrapper).toHaveClass('my-box');
    expect(wrapper.style.width).toBe('64px');
    expect(wrapper.style.height).toBe('64px');
  });

  it('builds a gradient background from the color', () => {
    render(
      <IconContainer color="#123456" secondaryColor="#654321">
        <span data-testid="child">X</span>
      </IconContainer>
    );
    const wrapper = screen.getByTestId('child').parentElement as HTMLElement;
    expect(wrapper.style.background).toContain('linear-gradient');
    expect(wrapper.style.background).toContain('#123456');
  });
});
