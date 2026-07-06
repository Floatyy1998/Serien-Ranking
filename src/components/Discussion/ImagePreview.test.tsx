// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('../../contexts/ThemeContext', () => {
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

import { ImagePreview } from './ImagePreview';

afterEach(() => cleanup());

describe('ImagePreview', () => {
  it('renders the image thumbnail', () => {
    render(<ImagePreview src="https://img/x.jpg" />);
    const img = screen.getByAltText('Bild') as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.src).toContain('https://img/x.jpg');
  });

  it('expands to a fullscreen view when clicked', () => {
    render(<ImagePreview src="https://img/x.jpg" />);
    expect(screen.getAllByAltText('Bild')).toHaveLength(1);
    fireEvent.click(screen.getByAltText('Bild'));
    expect(screen.getAllByAltText('Bild').length).toBeGreaterThan(1);
  });

  it('invokes onRemove without expanding when the remove button is clicked', () => {
    const onRemove = vi.fn();
    render(<ImagePreview src="https://img/x.jpg" onRemove={onRemove} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(screen.getAllByAltText('Bild')).toHaveLength(1);
  });
});
