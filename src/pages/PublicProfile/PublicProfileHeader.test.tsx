// @vitest-environment jsdom
import type { ComponentProps } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

vi.mock('framer-motion', async () => {
  const React = await import('react');
  const make = (tag: string) =>
    React.forwardRef(function Motion(props: Record<string, unknown>, ref: unknown) {
      const clean: Record<string, unknown> = { ref };
      for (const k in props)
        if (!['initial', 'animate', 'exit', 'transition'].includes(k)) clean[k] = props[k];
      return React.createElement(tag, clean);
    });
  return {
    motion: new Proxy({} as Record<string, unknown>, { get: (_t, tag) => make(String(tag)) }),
  };
});

vi.mock('@mui/icons-material', () => {
  const Stub = () => <span />;
  return { Public: Stub, Star: Stub };
});
vi.mock('../../components/ui', () => ({
  BackButton: () => <button>Zurück</button>,
  GradientText: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

import { PublicProfileHeader } from './PublicProfileHeader';

const makeTheme = () =>
  new Proxy(() => '#333', {
    get: (_t, prop) => {
      if (prop === Symbol.toPrimitive || prop === 'toString' || prop === 'valueOf')
        return () => '#333';
      return makeTheme();
    },
  }) as unknown as ComponentProps<typeof PublicProfileHeader>['currentTheme'];

afterEach(() => cleanup());

describe('PublicProfileHeader', () => {
  it('renders the profile name and rated count', () => {
    render(
      <PublicProfileHeader
        profileName="Alice"
        itemsWithRatingCount={42}
        averageRating={8.5}
        currentTheme={makeTheme()}
      />
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('42 bewertet')).toBeInTheDocument();
  });

  it('renders the formatted average rating', () => {
    render(
      <PublicProfileHeader
        profileName="Bob"
        itemsWithRatingCount={1}
        averageRating={7.25}
        currentTheme={makeTheme()}
      />
    );
    expect(screen.getByText('Ø 7.3')).toBeInTheDocument();
  });
});
