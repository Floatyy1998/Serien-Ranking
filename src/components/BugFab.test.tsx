// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const navigateMock = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', () => ({ useNavigate: () => navigateMock }));

const shot = vi.hoisted(() => ({
  native: false,
  blob: new Blob(['x'], { type: 'image/jpeg' }),
}));
vi.mock('../services/errorReporting/pageShot', () => ({
  canShootPage: () => shot.native,
  capturePageShot: vi.fn(async () => shot.blob),
}));

import { BugFab } from './BugFab';
import { stashedPageShot } from '../services/errorReporting/bugContext';

afterEach(() => {
  cleanup();
  navigateMock.mockClear();
  shot.native = false;
  vi.restoreAllMocks();
});

describe('BugFab', () => {
  it('renders the bug-report button', () => {
    render(<BugFab />);
    expect(screen.getByRole('button', { name: 'Bug melden' })).toBeInTheDocument();
  });

  it('navigiert ohne native Aufnahme sofort zur Ticketseite', () => {
    render(<BugFab />);
    fireEvent.click(screen.getByRole('button', { name: 'Bug melden' }));
    expect(navigateMock).toHaveBeenCalledWith('/bug-report?create=true');
    expect(stashedPageShot()).toBeNull();
  });

  it('hängt in der Desktop-App das native Foto an', async () => {
    shot.native = true;
    render(<BugFab />);
    fireEvent.click(screen.getByRole('button', { name: 'Bug melden' }));
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/bug-report?create=true'));
    expect(stashedPageShot()).toBe(shot.blob);
  });
});
