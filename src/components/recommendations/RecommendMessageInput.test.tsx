// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RecommendMessageInput } from './RecommendMessageInput';

vi.mock('../../contexts/ThemeContextDef', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#00d123',
      accent: '#00ff99',
      text: { primary: '#fff', muted: '#999' },
      background: { surface: '#111' },
      border: { default: '#333' },
      status: { warning: '#f59e0b' },
    },
  }),
}));

vi.mock('../../hooks/useDeviceType', () => ({
  useDeviceType: () => ({ isMobile: false, isDesktop: true }),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('RecommendMessageInput', () => {
  it('zeigt den Zeichenzähler passend zur Nachrichtenlänge', () => {
    render(<RecommendMessageInput message="Hallo" onMessageChange={vi.fn()} />);
    expect(screen.getByText('5/240')).toBeInTheDocument();
  });

  it('ruft onMessageChange bei Eingabe', () => {
    const onMessageChange = vi.fn();
    render(<RecommendMessageInput message="" onMessageChange={onMessageChange} />);
    fireEvent.change(screen.getByPlaceholderText('Sag was dazu…'), {
      target: { value: 'Neu' },
    });
    expect(onMessageChange).toHaveBeenCalledWith('Neu');
  });

  it('begrenzt die Eingabe auf 240 Zeichen', () => {
    const onMessageChange = vi.fn();
    render(<RecommendMessageInput message="" onMessageChange={onMessageChange} />);
    fireEvent.change(screen.getByPlaceholderText('Sag was dazu…'), {
      target: { value: 'x'.repeat(300) },
    });
    expect(onMessageChange).toHaveBeenCalledWith('x'.repeat(240));
  });
});
