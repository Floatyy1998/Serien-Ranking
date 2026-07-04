// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock('react-router-dom', () => ({ useNavigate: () => navigateMock }));
vi.mock('../../contexts/ThemeContextDef', async () => {
  const { generateDynamicTheme } = await import('../../theme/dynamicTheme');
  const currentTheme = generateDynamicTheme({
    primaryColor: '#00d123',
    backgroundColor: '#000000',
    accentColor: '#008a6e',
  });
  return { useTheme: () => ({ currentTheme }) };
});

import { TasteProfileCard } from './TasteProfileCard';

beforeEach(() => navigateMock.mockReset());
afterEach(() => cleanup());

describe('TasteProfileCard', () => {
  it('renders the card title and subtitle (smoke)', () => {
    render(<TasteProfileCard />);
    expect(screen.getByText('KI-Empfehlungen')).toBeInTheDocument();
    expect(screen.getByText('Personalisierte Vorschläge')).toBeInTheDocument();
  });

  it('navigates to /taste-profile when clicked', () => {
    render(<TasteProfileCard />);
    fireEvent.click(screen.getByRole('button', { name: /KI Geschmacksprofil/ }));
    expect(navigateMock).toHaveBeenCalledWith('/taste-profile');
  });
});
