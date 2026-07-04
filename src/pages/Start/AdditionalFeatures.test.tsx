// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AdditionalFeatures } from './AdditionalFeatures';

vi.mock('@mui/icons-material', () => {
  const stub = () => null;
  return Object.fromEntries(
    ['Speed', 'CloudSync', 'Notifications', 'Analytics'].map((n) => [n, stub])
  );
});

afterEach(() => {
  cleanup();
});

describe('AdditionalFeatures', () => {
  it('renders the section heading', () => {
    render(<AdditionalFeatures />);
    expect(screen.getByText('Weitere Highlights')).toBeInTheDocument();
  });

  it('renders all highlight titles and descriptions', () => {
    render(<AdditionalFeatures />);
    expect(screen.getByText('Blitzschnell')).toBeInTheDocument();
    expect(screen.getByText('Cloud-Sync')).toBeInTheDocument();
    expect(screen.getByText('Smart Notifications')).toBeInTheDocument();
    expect(screen.getByText('Deep Analytics')).toBeInTheDocument();
    expect(
      screen.getByText('Optimierte Performance für ein flüssiges Erlebnis')
    ).toBeInTheDocument();
  });
});
