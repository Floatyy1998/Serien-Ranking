// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ShareCardFrame } from './ShareCardFrame';

vi.mock('../../contexts/ThemeContextDef', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#00d123',
      accent: '#8b5cf6',
      text: { primary: '#fff', secondary: '#eee', muted: '#999' },
      background: { default: '#000', surface: '#111' },
    },
  }),
}));

afterEach(() => cleanup());

describe('ShareCardFrame', () => {
  it('renders the title, subtitle and branding', () => {
    render(
      <ShareCardFrame title="Mein 2025" subtitle="Mein Jahr in Serien & Filmen">
        <div>Karten-Inhalt</div>
      </ShareCardFrame>
    );
    expect(screen.getByText('Mein 2025')).toBeInTheDocument();
    expect(screen.getByText('Mein Jahr in Serien & Filmen')).toBeInTheDocument();
    expect(screen.getByText('TV-Rank')).toBeInTheDocument();
    expect(screen.getByText('tv-rank.de')).toBeInTheDocument();
  });

  it('renders its children', () => {
    render(
      <ShareCardFrame title="Titel">
        <div>Karten-Inhalt</div>
      </ShareCardFrame>
    );
    expect(screen.getByText('Karten-Inhalt')).toBeInTheDocument();
  });

  it('omits the subtitle when not provided', () => {
    render(
      <ShareCardFrame title="Titel">
        <div>x</div>
      </ShareCardFrame>
    );
    expect(screen.getByText('Titel')).toBeInTheDocument();
    expect(screen.getByText('Dein Serien-Tracker')).toBeInTheDocument();
  });
});
