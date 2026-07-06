// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TabSwitcher } from './TabSwitcher';

if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

vi.mock('../../contexts/ThemeContext', async () => {
  const { generateDynamicTheme } = await import('../../theme/dynamicTheme');
  const currentTheme = generateDynamicTheme({
    primaryColor: '#00d123',
    backgroundColor: '#000000',
    accentColor: '#008a6e',
  });
  return { useTheme: () => ({ currentTheme }) };
});

const tabs = [
  { id: 'all', label: 'Alle' },
  { id: 'open', label: 'Offen', count: 3 },
];

afterEach(cleanup);

describe('TabSwitcher', () => {
  it('renders a tablist with all tabs (smoke)', () => {
    render(<TabSwitcher tabs={tabs} activeTab="all" onTabChange={() => {}} />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(2);
  });

  it('marks the active tab as selected', () => {
    render(<TabSwitcher tabs={tabs} activeTab="open" onTabChange={() => {}} />);
    const openTab = screen.getByRole('tab', { name: /Offen/ });
    expect(openTab).toHaveAttribute('aria-selected', 'true');
  });

  it('renders a count suffix', () => {
    render(<TabSwitcher tabs={tabs} activeTab="all" onTabChange={() => {}} />);
    expect(screen.getByRole('tab', { name: /Offen \(3\)/ })).toBeInTheDocument();
  });

  it('calls onTabChange on click', () => {
    const onTabChange = vi.fn<(id: string) => void>();
    render(<TabSwitcher tabs={tabs} activeTab="all" onTabChange={onTabChange} />);
    fireEvent.click(screen.getByRole('tab', { name: /Offen/ }));
    expect(onTabChange).toHaveBeenCalledWith('open');
  });
});
