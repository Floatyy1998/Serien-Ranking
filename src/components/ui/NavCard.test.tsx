// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NavCard } from './NavCard';

vi.mock('../../contexts/ThemeContextDef', async () => {
  const { generateDynamicTheme } = await import('../../theme/dynamicTheme');
  const currentTheme = generateDynamicTheme({
    primaryColor: '#00d123',
    backgroundColor: '#000000',
    accentColor: '#008a6e',
  });
  return { useTheme: () => ({ currentTheme }) };
});

afterEach(cleanup);

describe('NavCard', () => {
  it('renders its children (smoke)', () => {
    render(
      <NavCard onClick={() => {}} accentColor="#00d123">
        <span>Card content</span>
      </NavCard>
    );
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('exposes the aria-label on the button', () => {
    render(
      <NavCard onClick={() => {}} accentColor="#00d123" aria-label="Zu Statistiken">
        <span>x</span>
      </NavCard>
    );
    expect(screen.getByRole('button', { name: 'Zu Statistiken' })).toBeInTheDocument();
  });

  it('invokes onClick when pressed', () => {
    const onClick = vi.fn();
    render(
      <NavCard onClick={onClick} accentColor="#00d123" aria-label="press">
        <span>x</span>
      </NavCard>
    );
    fireEvent.click(screen.getByRole('button', { name: 'press' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
