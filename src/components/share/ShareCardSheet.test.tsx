// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ShareCardSheet } from './ShareCardSheet';
import { exportNodeAsImage } from '../../lib/share/shareCard';

// jsdom lacks matchMedia; BottomSheet -> useReducedMotion needs it.
beforeAll(() => {
  if (!window.matchMedia) {
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
});

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#00d123',
      accent: '#8b5cf6',
      text: { primary: '#fff', secondary: '#eee', muted: '#999' },
      background: { default: '#000', surface: '#111' },
    },
  }),
}));

vi.mock('../../lib/share/shareCard', () => ({
  exportNodeAsImage: vi.fn<() => Promise<Blob>>(() => Promise.resolve(new Blob(['x']))),
  shareOrDownload: vi.fn<() => Promise<void>>(() => Promise.resolve()),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const renderCard = (showImages: boolean) => <div>Karte {showImages ? 'mit' : 'ohne'} Bild</div>;

describe('ShareCardSheet', () => {
  it('renders nothing visible when closed', () => {
    render(
      <ShareCardSheet
        isOpen={false}
        onClose={vi.fn()}
        sheetTitle="Stats teilen"
        filename="stats.png"
        shareText="text"
        renderCard={renderCard}
      />
    );
    expect(screen.queryByText('Stats teilen')).not.toBeInTheDocument();
  });

  it('renders the sheet title, card and share button when open', () => {
    render(
      <ShareCardSheet
        isOpen
        onClose={vi.fn()}
        sheetTitle="Stats teilen"
        filename="stats.png"
        shareText="text"
        renderCard={renderCard}
      />
    );
    expect(screen.getByText('Stats teilen')).toBeInTheDocument();
    expect(screen.getByText('Karte mit Bild')).toBeInTheDocument();
    expect(screen.getByText('Teilen')).toBeInTheDocument();
  });

  it('exports the card image when the share button is clicked', async () => {
    render(
      <ShareCardSheet
        isOpen
        onClose={vi.fn()}
        sheetTitle="Stats teilen"
        filename="stats.png"
        shareText="text"
        renderCard={renderCard}
      />
    );
    fireEvent.click(screen.getByLabelText('Karte als Bild teilen'));
    await waitFor(() => expect(vi.mocked(exportNodeAsImage)).toHaveBeenCalled());
  });
});
