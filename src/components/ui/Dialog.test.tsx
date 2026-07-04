// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Dialog } from './Dialog';

if (!window.matchMedia) {
  window.matchMedia = ((q: string) => ({
    matches: false,
    media: q,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

vi.mock('../../contexts/ThemeContextDef', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#00d123',
      background: { paper: '#1a1a1a', surface: '#111' },
      text: { primary: '#fff', secondary: '#ddd' },
      status: { success: '#4caf50', error: '#ef4444' },
      border: { default: '#333' },
    },
  }),
}));

afterEach(() => cleanup());

describe('Dialog', () => {
  it('renders nothing when closed', () => {
    render(<Dialog open={false} onClose={vi.fn()} message="Hallo" />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders the title and message when open', () => {
    render(<Dialog open onClose={vi.fn()} title="Achtung" message="Etwas ist passiert" />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Achtung')).toBeInTheDocument();
    expect(screen.getByText('Etwas ist passiert')).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn();
    render(<Dialog open onClose={onClose} message="Msg" />);
    fireEvent.click(screen.getByRole('button', { name: 'Schließen' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('runs an action handler and then closes', () => {
    const onClose = vi.fn();
    const onAction = vi.fn();
    render(
      <Dialog
        open
        onClose={onClose}
        message="Bestätigen?"
        actions={[{ label: 'OK', onClick: onAction }]}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
