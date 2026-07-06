// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

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

import { ProviderBadges } from './ProviderBadges';

afterEach(() => cleanup());

describe('ProviderBadges', () => {
  it('renders nothing when there are no providers', () => {
    const { container } = render(<ProviderBadges providers={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders allowed providers and filters out unknown ones', () => {
    render(
      <ProviderBadges
        providers={[
          { provider_name: 'Netflix', logo_path: '/n.png' },
          { provider_name: 'CompletelyUnknownProvider', logo_path: '/u.png' },
        ]}
        maxDisplay={3}
      />
    );
    expect(screen.getByAltText('Netflix')).toBeInTheDocument();
    expect(screen.queryByAltText('CompletelyUnknownProvider')).not.toBeInTheDocument();
  });

  it('shows a +N overflow badge when providers exceed maxDisplay', () => {
    render(
      <ProviderBadges
        providers={[
          { provider_name: 'Netflix', logo_path: '/n.png' },
          { provider_name: 'Disney Plus', logo_path: '/d.png' },
        ]}
        maxDisplay={1}
      />
    );
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('wraps a provider in a deep-link anchor when a searchTitle is given', () => {
    render(
      <ProviderBadges
        providers={[{ provider_name: 'Netflix', logo_path: '/n.png' }]}
        searchTitle="Dexter"
      />
    );
    const link = screen.getByAltText('Netflix').closest('a');
    expect(link).not.toBeNull();
    expect(link).toHaveAttribute('target', '_blank');
  });
});
