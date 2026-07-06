// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProviderChangeNotification } from './ProviderChangeNotification';

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

const navigate = vi.fn<(to: string) => void>();
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));
vi.mock('../../AuthContext', () => ({ useAuth: () => ({ user: { uid: 'u1' } }) }));
vi.mock('../../lib/toast', () => ({ showUndoToast: vi.fn() }));
vi.mock('../../lib/settings/notificationSettings', () => ({ snoozeNotifications: vi.fn() }));
vi.mock('../../lib/validation/providerChangeDetection', () => ({
  markProviderChangesDismissed: vi.fn(async () => {}),
}));

vi.mock('../../contexts/ThemeContext', async () => {
  const { generateDynamicTheme } = await import('../../theme/dynamicTheme');
  const currentTheme = generateDynamicTheme({
    primaryColor: '#00d123',
    backgroundColor: '#000000',
    accentColor: '#008a6e',
  });
  return { useTheme: () => ({ currentTheme }) };
});

function changes() {
  return [
    {
      series: { id: 7, title: 'Severance', poster: { poster: 'https://x/p.jpg' } },
      addedProviders: ['Apple TV+'],
      removedProviders: [],
      currentProviders: ['Apple TV+'],
    },
  ];
}

afterEach(() => {
  cleanup();
  navigate.mockReset();
});

describe('ProviderChangeNotification', () => {
  it('renders nothing when there are no changes (smoke)', () => {
    const { container } = render(<ProviderChangeNotification changes={[]} onDismiss={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the heading, series name and detail text', () => {
    render(<ProviderChangeNotification changes={changes()} onDismiss={() => {}} />);
    expect(screen.getByText('Provider-Änderung')).toBeInTheDocument();
    expect(screen.getByText('Severance')).toBeInTheDocument();
    expect(screen.getByText(/Jetzt auf Apple TV\+/)).toBeInTheDocument();
  });

  it('navigates and dismisses when "Ansehen" is pressed', async () => {
    const onDismiss = vi.fn();
    render(<ProviderChangeNotification changes={changes()} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole('button', { name: /Ansehen/ }));
    expect(navigate).toHaveBeenCalledWith('/series/7');
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('dismisses all when the close button is pressed', async () => {
    const onDismiss = vi.fn();
    render(<ProviderChangeNotification changes={changes()} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole('button', { name: 'Schließen' }));
    await waitFor(() => expect(onDismiss).toHaveBeenCalledTimes(1));
  });
});
