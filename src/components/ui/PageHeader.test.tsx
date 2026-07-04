// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PageHeader } from './PageHeader';

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

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/', key: 'default' }),
}));

vi.mock('../../hooks/useReducedMotion', () => ({ useReducedMotion: () => true }));

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

describe('PageHeader', () => {
  it('renders the title heading (smoke)', () => {
    render(<PageHeader title="Statistiken" showBack={false} />);
    expect(screen.getByRole('heading', { name: /Statistiken/ })).toBeInTheDocument();
  });

  it('renders the subtitle when provided', () => {
    render(<PageHeader title="Titel" subtitle="Untertitel Text" showBack={false} />);
    expect(screen.getByText('Untertitel Text')).toBeInTheDocument();
  });

  it('renders the back button when showBack is true', () => {
    render(<PageHeader title="Mit Zurück" showBack />);
    expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(1);
  });

  it('renders custom action nodes', () => {
    render(
      <PageHeader
        title="Mit Aktion"
        showBack={false}
        actions={<button type="button">Aktion</button>}
      />
    );
    expect(screen.getByRole('button', { name: 'Aktion' })).toBeInTheDocument();
  });
});
