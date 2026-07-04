// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';

import { LetterReveal } from './LetterReveal';

afterEach(() => cleanup());

describe('LetterReveal', () => {
  it('renders every character of the text', () => {
    const { container } = render(<LetterReveal text="Hallo Welt" />);
    // Letters are split into individual spans; the combined text is preserved.
    expect(container.textContent?.replace(/s/g, '')).toContain('Hallo');
    expect(container.querySelectorAll('.ob-letter').length).toBe('HalloWelt'.length);
  });

  it('applies the provided className', () => {
    const { container } = render(<LetterReveal text="Hi" className="custom" />);
    expect(container.querySelector('.custom')).not.toBeNull();
  });
});
