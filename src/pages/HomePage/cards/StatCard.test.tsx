// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StatCard } from './StatCard';

const wrap = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={createTheme()}>{ui}</ThemeProvider>);

afterEach(() => cleanup());

describe('StatCard', () => {
  it('renders the value and label (smoke)', () => {
    wrap(
      <StatCard
        icon={<span data-testid="icon">i</span>}
        label="Serien"
        value={42}
        iconColor="#00d123"
      />
    );
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Serien')).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('renders the optional subValue only when provided', () => {
    const { rerender } = wrap(
      <StatCard icon={<span>i</span>} label="L" value="1" iconColor="#fff" />
    );
    expect(screen.queryByText('sub-text')).not.toBeInTheDocument();
    rerender(
      <ThemeProvider theme={createTheme()}>
        <StatCard icon={<span>i</span>} label="L" value="1" iconColor="#fff" subValue="sub-text" />
      </ThemeProvider>
    );
    expect(screen.getByText('sub-text')).toBeInTheDocument();
  });

  it('invokes onClick when clicked', () => {
    const onClick = vi.fn();
    wrap(
      <StatCard
        icon={<span>i</span>}
        label="Clickable"
        value="9"
        iconColor="#fff"
        onClick={onClick}
      />
    );
    fireEvent.click(screen.getByText('9'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
