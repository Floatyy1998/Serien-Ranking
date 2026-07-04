// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MiniProviderBadges } from './MiniProviderBadges';
import type { MediaProvider } from './mediaCarouselTypes';

const { clickMock } = vi.hoisted(() => ({ clickMock: vi.fn() }));

vi.mock('../../../lib/providerLinks', () => ({
  getProviderSearchUrl: (name: string) => `https://search/${name}`,
  handleProviderLinkClick: clickMock,
  providerNeedsClipboardCopy: () => false,
}));

afterEach(() => {
  clickMock.mockClear();
  cleanup();
});

const providers = (n: number): MediaProvider[] =>
  Array.from({ length: n }, (_, i) => ({ name: `Prov${i}`, logo: `logo${i}.png` }));

describe('MiniProviderBadges', () => {
  it('renders nothing when providers is empty', () => {
    const { container } = render(
      <MiniProviderBadges providers={[]} isMobile={false} textColor="#fff" searchTitle="Dune" />
    );
    expect(container.firstChild).toBeNull();
  });

  it('mobile shows only the first badge with a +N overflow counter', () => {
    render(
      <MiniProviderBadges
        providers={providers(3)}
        isMobile={true}
        textColor="#fff"
        searchTitle="Dune"
      />
    );
    expect(screen.getByAltText('Prov0')).toBeInTheDocument();
    expect(screen.queryByAltText('Prov1')).not.toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('desktop shows up to 3 badges plus an overflow chip', () => {
    render(
      <MiniProviderBadges
        providers={providers(5)}
        isMobile={false}
        textColor="#fff"
        searchTitle="Dune"
      />
    );
    expect(screen.getByAltText('Prov0')).toBeInTheDocument();
    expect(screen.getByAltText('Prov2')).toBeInTheDocument();
    expect(screen.queryByAltText('Prov3')).not.toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('invokes handleProviderLinkClick when a provider logo link is clicked', () => {
    render(
      <MiniProviderBadges
        providers={providers(2)}
        isMobile={false}
        textColor="#fff"
        searchTitle="Dune"
      />
    );
    fireEvent.click(screen.getByAltText('Prov0'));
    expect(clickMock).toHaveBeenCalledTimes(1);
  });
});
