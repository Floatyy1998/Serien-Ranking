// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SectionHeader } from './SectionHeader';

vi.mock('../../contexts/ThemeContext', async () => {
  const { generateDynamicTheme } = await import('../../theme/dynamicTheme');
  const currentTheme = generateDynamicTheme({
    primaryColor: '#00d123',
    backgroundColor: '#000000',
    accentColor: '#008a6e',
  });
  return { useTheme: () => ({ currentTheme }) };
});

afterEach(cleanup);

describe('SectionHeader', () => {
  it('renders the title and icon (smoke)', () => {
    render(<SectionHeader icon={<span data-testid="icon">i</span>} title="Weiter schauen" />);
    expect(screen.getByRole('heading', { name: /Weiter schauen/ })).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('does not render the see-all button without onSeeAll', () => {
    render(<SectionHeader icon={<span>i</span>} title="Ohne" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders a custom see-all label and fires onSeeAll', () => {
    const onSeeAll = vi.fn();
    render(
      <SectionHeader icon={<span>i</span>} title="Mit" onSeeAll={onSeeAll} seeAllLabel="Mehr" />
    );
    const btn = screen.getByRole('button');
    expect(btn).toHaveTextContent('Mehr');
    fireEvent.click(btn);
    expect(onSeeAll).toHaveBeenCalledTimes(1);
  });

  it('renders a custom action node', () => {
    render(
      <SectionHeader
        icon={<span>i</span>}
        title="Action"
        action={<button type="button">Aktion</button>}
      />
    );
    expect(screen.getByRole('button', { name: 'Aktion' })).toBeInTheDocument();
  });
});
