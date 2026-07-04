// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PosterImage } from './PosterImage';

vi.mock('../../contexts/ThemeContextDef', async () => {
  const { generateDynamicTheme } = await import('../../theme/dynamicTheme');
  const currentTheme = generateDynamicTheme({
    primaryColor: '#00d123',
    backgroundColor: '#000000',
    accentColor: '#008a6e',
  });
  return { useTheme: () => ({ currentTheme }) };
});

afterEach(cleanup);

describe('PosterImage', () => {
  it('renders the image with src and alt (smoke)', () => {
    render(<PosterImage src="https://image.tmdb.org/p/abc.jpg" alt="Dexter Poster" />);
    const img = screen.getByAltText('Dexter Poster') as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src')).toBe('https://image.tmdb.org/p/abc.jpg');
  });

  it('marks itself so the global retry handler skips it', () => {
    render(<PosterImage src="https://x/y.jpg" alt="poster" />);
    expect(screen.getByAltText('poster')).toHaveAttribute('data-poster-image', 'true');
  });

  it('falls back to a placeholder when src is empty', () => {
    render(<PosterImage src="" alt="no src" />);
    const img = screen.getByAltText('no src') as HTMLImageElement;
    expect(img.getAttribute('src')).toContain('data:image/svg');
  });

  it('does not crash when the image errors', () => {
    render(<PosterImage src="https://x/broken.jpg" alt="broken" />);
    const img = screen.getByAltText('broken');
    // first error schedules a retry; should not throw synchronously
    expect(() => fireEvent.error(img)).not.toThrow();
  });
});
