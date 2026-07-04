// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProviderLogo } from './ProviderLogo';
import type { ProviderBrand } from '../providerBrands';

vi.mock('../../../hooks/useProviderLogos', () => ({
  tmdbLogoUrl: (path?: string) => (path ? `https://image.tmdb.org/t/p/w92${path}` : undefined),
  useProviderLogos: () => ({}),
}));

const brand: ProviderBrand = { color: '#E50914', accent: '#B81D24', abbr: 'N' };

afterEach(() => {
  cleanup();
});

describe('ProviderLogo', () => {
  it('renders the TMDB image when a logo path is given', () => {
    render(<ProviderLogo brand={brand} logoPath="/abc.png" name="Netflix" />);
    const img = screen.getByAltText('Netflix') as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.src).toContain('/abc.png');
  });

  it('renders the brand abbreviation when there is no logo', () => {
    render(<ProviderLogo brand={brand} name="Netflix" />);
    expect(screen.queryByAltText('Netflix')).not.toBeInTheDocument();
    expect(screen.getByText('N')).toBeInTheDocument();
  });
});
