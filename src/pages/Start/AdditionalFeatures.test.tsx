// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AdditionalFeatures } from './AdditionalFeatures';

vi.mock('@mui/icons-material', () => {
  const stub = () => null;
  return Object.fromEntries(
    ['Devices', 'NotificationsActive', 'Public', 'Translate'].map((n) => [n, stub])
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
    expect(screen.getByText('Überall dabei')).toBeInTheDocument();
    expect(screen.getByText('Push zur richtigen Zeit')).toBeInTheDocument();
    expect(screen.getByText('Für dein Land')).toBeInTheDocument();
    expect(screen.getByText('In deiner Sprache')).toBeInTheDocument();
    expect(
      screen.getByText('Neue Folgen, neue Kapitel und Nachrichten von Freunden.')
    ).toBeInTheDocument();
  });
});
