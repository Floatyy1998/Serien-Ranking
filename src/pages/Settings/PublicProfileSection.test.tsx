// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('framer-motion', async () => {
  const React = await import('react');
  const skip = new Set(['initial', 'animate', 'transition', 'whileTap']);
  const make = (tag: string) =>
    React.forwardRef(function Motion(props: Record<string, unknown>, ref: unknown) {
      const clean: Record<string, unknown> = { ref };
      for (const k in props) if (!skip.has(k)) clean[k] = props[k];
      return React.createElement(tag, clean);
    });
  return {
    motion: new Proxy({} as Record<string, unknown>, { get: (_t, tag) => make(String(tag)) }),
  };
});

vi.mock('@mui/icons-material', () => ({
  ContentCopy: () => null,
  Link: () => null,
  Public: () => null,
  Refresh: () => null,
}));

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

import { PublicProfileSection } from './PublicProfileSection';

const baseProps = () => ({
  isPublicProfile: false,
  publicProfileId: '',
  isLoadingProfile: false,
  onToggle: vi.fn(),
  onCopyLink: vi.fn(),
  onRegenerateId: vi.fn(),
});

afterEach(() => cleanup());

describe('PublicProfileSection', () => {
  it('renders the section title and hides the link block when disabled', () => {
    render(<PublicProfileSection {...baseProps()} />);
    expect(screen.getByText('Öffentliches Profil')).toBeInTheDocument();
    expect(screen.queryByText('Dein öffentlicher Link')).not.toBeInTheDocument();
  });

  it('calls onToggle when the switch is changed', () => {
    const props = baseProps();
    render(<PublicProfileSection {...props} />);
    fireEvent.click(screen.getByLabelText('Profil öffentlich teilen'));
    expect(props.onToggle).toHaveBeenCalledWith(true);
  });

  it('shows the link block and wires copy/regenerate actions when public', () => {
    const props = { ...baseProps(), isPublicProfile: true, publicProfileId: 'abc123' };
    render(<PublicProfileSection {...props} />);
    expect(screen.getByText('Dein öffentlicher Link')).toBeInTheDocument();
    expect(screen.getByText(/\/public\/abc123$/)).toBeInTheDocument();
    fireEvent.click(screen.getByText('Kopieren'));
    expect(props.onCopyLink).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText('Neu'));
    expect(props.onRegenerateId).toHaveBeenCalledTimes(1);
  });
});
