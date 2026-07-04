// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SearchInput } from './SearchInput';

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

describe('SearchInput', () => {
  it('renders a search input with placeholder (smoke)', () => {
    render(<SearchInput value="" onChange={() => {}} placeholder="Serie suchen..." />);
    expect(screen.getByRole('search')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Serie suchen...')).toBeInTheDocument();
  });

  it('calls onChange as the user types', () => {
    const onChange = vi.fn<(value: string) => void>();
    render(<SearchInput value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Dexter' } });
    expect(onChange).toHaveBeenCalledWith('Dexter');
  });

  it('shows the clear button only when there is a value', () => {
    const { rerender } = render(<SearchInput value="" onChange={() => {}} />);
    expect(screen.queryByLabelText('Suchfeld leeren')).not.toBeInTheDocument();
    rerender(<SearchInput value="abc" onChange={() => {}} />);
    expect(screen.getByLabelText('Suchfeld leeren')).toBeInTheDocument();
  });

  it('clears the value when the clear button is pressed', () => {
    const onChange = vi.fn<(value: string) => void>();
    render(<SearchInput value="abc" onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Suchfeld leeren'));
    expect(onChange).toHaveBeenCalledWith('');
  });
});
