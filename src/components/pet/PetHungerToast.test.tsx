// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PetHungerToast } from './PetHungerToast';

vi.mock('../../contexts/ThemeContextDef', () => ({
  useTheme: () => ({
    currentTheme: {
      text: { primary: '#fff', secondary: '#eee', muted: '#999' },
    },
  }),
}));

beforeEach(() => {
  // MUI useMediaQuery benötigt matchMedia — in jsdom nicht vorhanden.
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('PetHungerToast', () => {
  it('zeigt die Warnung wenn geöffnet', () => {
    render(
      <PetHungerToast open onClose={vi.fn()} petName="Rex" level="warning" onFeed={vi.fn()} />
    );
    expect(screen.getByText('Rex hat Hunger!')).toBeInTheDocument();
    expect(screen.getByText('Jetzt füttern')).toBeInTheDocument();
  });

  it('zeigt die kritische Meldung bei level=critical', () => {
    render(
      <PetHungerToast open onClose={vi.fn()} petName="Rex" level="critical" onFeed={vi.fn()} />
    );
    expect(screen.getByText('Rex verhungert bald!')).toBeInTheDocument();
  });

  it('ruft onFeed beim Klick auf "Jetzt füttern"', () => {
    const onFeed = vi.fn();
    render(<PetHungerToast open onClose={vi.fn()} petName="Rex" level="warning" onFeed={onFeed} />);
    fireEvent.click(screen.getByText('Jetzt füttern'));
    expect(onFeed).toHaveBeenCalledTimes(1);
  });

  it('rendert keinen Inhalt wenn geschlossen', () => {
    render(
      <PetHungerToast
        open={false}
        onClose={vi.fn()}
        petName="Rex"
        level="warning"
        onFeed={vi.fn()}
      />
    );
    expect(screen.queryByText('Rex hat Hunger!')).not.toBeInTheDocument();
  });
});
