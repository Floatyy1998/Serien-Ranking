// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SendRecommendationBar } from './SendRecommendationBar';

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#00d123',
      text: { muted: '#999' },
      background: { default: '#000', surface: '#111' },
      border: { default: '#333' },
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

describe('SendRecommendationBar', () => {
  it('ist ohne Auswahl deaktiviert', () => {
    render(<SendRecommendationBar selectedCount={0} sending={false} onSend={vi.fn()} />);
    const btn = screen.getByRole('button');
    expect(screen.getByText('Freunde auswählen')).toBeInTheDocument();
    expect(btn).toBeDisabled();
  });

  it('zeigt Singular bei einem Freund', () => {
    render(<SendRecommendationBar selectedCount={1} sending={false} onSend={vi.fn()} />);
    expect(screen.getByText('Empfehlung senden')).toBeInTheDocument();
  });

  it('zeigt Plural bei mehreren Freunden', () => {
    render(<SendRecommendationBar selectedCount={3} sending={false} onSend={vi.fn()} />);
    expect(screen.getByText('An 3 Freunde senden')).toBeInTheDocument();
  });

  it('zeigt den Sende-Status', () => {
    render(<SendRecommendationBar selectedCount={2} sending onSend={vi.fn()} />);
    expect(screen.getByText('Wird gesendet…')).toBeInTheDocument();
  });

  it('ruft onSend beim Klick wenn aktiv', () => {
    const onSend = vi.fn();
    render(<SendRecommendationBar selectedCount={2} sending={false} onSend={onSend} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onSend).toHaveBeenCalledTimes(1);
  });
});
