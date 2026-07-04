// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ProviderLogoLink } from './ProviderLogoLink';

// providerLinks / providerChangeDetection are pure and imported for real.

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('ProviderLogoLink', () => {
  it('renders a deep-link anchor for a known provider (Netflix)', () => {
    render(<ProviderLogoLink src="https://img/netflix.png" name="Netflix" searchTitle="Dexter" />);
    const img = screen.getByAltText('Netflix') as HTMLImageElement;
    expect(img).toBeInTheDocument();
    const link = img.closest('a');
    expect(link).not.toBeNull();
    expect(link).toHaveAttribute('target', '_blank');
    expect((link as HTMLAnchorElement).href).not.toBe('');
  });

  it('falls back to a plain img (no anchor) for an unknown provider', () => {
    render(
      <ProviderLogoLink src="https://img/unknown.png" name="TotallyUnknownXYZ" searchTitle="Foo" />
    );
    const img = screen.getByAltText('TotallyUnknownXYZ');
    expect(img).toBeInTheDocument();
    expect(img.closest('a')).toBeNull();
  });

  it('stops propagation on click so parent handlers do not fire', () => {
    const parentClick = vi.fn();
    render(
      <div onClick={parentClick}>
        <ProviderLogoLink src="https://img/netflix.png" name="Netflix" searchTitle="Dexter" />
      </div>
    );
    const link = screen.getByAltText('Netflix').closest('a') as HTMLAnchorElement;
    fireEvent.click(link);
    expect(parentClick).not.toHaveBeenCalled();
  });

  it('shows a clipboard-copy title hint for Disney Plus', () => {
    render(<ProviderLogoLink src="https://img/disney.png" name="Disney Plus" searchTitle="Loki" />);
    const img = screen.getByAltText('Disney Plus');
    expect(img).toHaveAttribute('title', expect.stringContaining('kopieren'));
  });
});
