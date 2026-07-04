// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ThresholdControl } from './ThresholdControl';

const theme = vi.hoisted(() => ({
  currentTheme: {
    primary: '#00d123',
    secondary: '#8b5cf6',
    accent: '#8b5cf6',
    background: { default: '#000', surface: '#111', surfaceHover: '#222', card: '#0a0a0a' },
    text: { primary: '#fff', secondary: '#ddd', muted: '#999' },
    border: { default: '#333' },
    status: { success: '#4caf50', warning: '#f59e0b', error: '#ef4444' },
  },
}));
vi.mock('../../../contexts/ThemeContextDef', () => ({ useTheme: () => theme }));

afterEach(() => {
  cleanup();
});

describe('ThresholdControl', () => {
  it('renders the label and current threshold value', () => {
    render(<ThresholdControl unusedThresholdDays={60} onThresholdChange={vi.fn()} />);
    expect(screen.getByText('Schwellenwert')).toBeInTheDocument();
    expect(screen.getByRole('spinbutton')).toHaveValue(60);
  });

  it('calls onThresholdChange with the parsed number', () => {
    const onChange = vi.fn();
    render(<ThresholdControl unusedThresholdDays={60} onThresholdChange={onChange} />);
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '90' } });
    expect(onChange).toHaveBeenCalledWith(90);
  });

  it('ignores non-numeric input', () => {
    const onChange = vi.fn();
    render(<ThresholdControl unusedThresholdDays={60} onThresholdChange={onChange} />);
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '' } });
    expect(onChange).not.toHaveBeenCalled();
  });
});
