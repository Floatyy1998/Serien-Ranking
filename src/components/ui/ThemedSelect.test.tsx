// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ThemedSelect } from './ThemedSelect';

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#00d123',
      accent: '#00ff88',
      border: { default: 'rgba(255,255,255,0.1)' },
      text: { primary: '#ffffff', secondary: '#cccccc', muted: '#999999' },
      background: { surface: '#111111' },
    },
  }),
}));

afterEach(cleanup);

const OPTIONS = [
  { value: 'auto', label: 'Auto (aus Gerätesprache)' },
  { value: 'DE', label: 'Deutschland' },
  { value: 'US', label: 'USA' },
];

describe('ThemedSelect', () => {
  it('shows the selected label on the trigger', () => {
    render(<ThemedSelect value="DE" options={OPTIONS} onChange={vi.fn()} />);
    expect(screen.getByRole('button', { expanded: false })).toHaveTextContent('Deutschland');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('opens the listbox and selects an option', () => {
    const onChange = vi.fn();
    render(<ThemedSelect value="auto" options={OPTIONS} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { expanded: false }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('option', { name: 'USA' }));
    expect(onChange).toHaveBeenCalledWith('US');
  });

  it('does not fire onChange when picking the already active option', () => {
    const onChange = vi.fn();
    render(<ThemedSelect value="DE" options={OPTIONS} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { expanded: false }));
    fireEvent.click(screen.getByRole('option', { name: /Deutschland/ }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
