// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';

import { Confetti } from './Confetti';

afterEach(() => cleanup());

describe('Confetti', () => {
  it('renders the requested number of particles', () => {
    const { container } = render(<Confetti count={12} />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).not.toBeNull();
    expect(wrapper.children.length).toBe(12);
  });

  it('defaults to a decorative, aria-hidden container', () => {
    const { container } = render(<Confetti count={3} />);
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });
});
