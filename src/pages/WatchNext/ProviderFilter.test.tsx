// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('framer-motion', async () => {
  const React = await import('react');
  const make = (tag: string) =>
    React.forwardRef(function Motion(props: Record<string, unknown>, ref: unknown) {
      const clean: Record<string, unknown> = { ref };
      for (const k in props) if (k !== 'whileTap') clean[k] = props[k];
      return React.createElement(tag, clean);
    });
  return {
    motion: new Proxy({} as Record<string, unknown>, { get: (_t, tag) => make(String(tag)) }),
  };
});

vi.mock('../../components/ui', () => ({
  HorizontalScrollContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { ProviderFilter } from './ProviderFilter';

const theme = {
  primary: '#00d123',
  text: { primary: '#fff', secondary: '#000', muted: '#888' },
};

const providers = [
  { name: 'Netflix', logo: '/nf.png' },
  { name: 'Disney+', logo: '' },
];

afterEach(() => cleanup());

describe('ProviderFilter', () => {
  it('renders nothing when there are no providers', () => {
    const { container } = render(
      <ProviderFilter providers={[]} selected={null} onSelect={vi.fn()} theme={theme} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders the "Alle" chip and each provider name', () => {
    render(
      <ProviderFilter providers={providers} selected={null} onSelect={vi.fn()} theme={theme} />
    );
    expect(screen.getByText('Alle')).toBeInTheDocument();
    expect(screen.getByText('Netflix')).toBeInTheDocument();
    expect(screen.getByText('Disney+')).toBeInTheDocument();
  });

  it('calls onSelect(null) when the "Alle" chip is clicked', () => {
    const onSelect = vi.fn();
    render(
      <ProviderFilter providers={providers} selected="Netflix" onSelect={onSelect} theme={theme} />
    );
    fireEvent.click(screen.getByText('Alle'));
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('toggles a provider off when it is already selected', () => {
    const onSelect = vi.fn();
    render(
      <ProviderFilter providers={providers} selected="Netflix" onSelect={onSelect} theme={theme} />
    );
    fireEvent.click(screen.getByText('Netflix'));
    expect(onSelect).toHaveBeenCalledWith(null);
    fireEvent.click(screen.getByText('Disney+'));
    expect(onSelect).toHaveBeenCalledWith('Disney+');
  });
});
