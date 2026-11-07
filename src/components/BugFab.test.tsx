// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const navigateMock = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', () => ({ useNavigate: () => navigateMock }));

const shot = vi.hoisted(() => ({ blob: new Blob(['x'], { type: 'image/jpeg' }) }));
vi.mock('../services/errorReporting/pageShot', () => ({
  capturePageShot: vi.fn(async () => shot.blob),
}));

import { BugFab } from './BugFab';
import { stashedPageShot } from '../services/errorReporting/bugContext';

afterEach(() => {
  cleanup();
  navigateMock.mockClear();
  vi.restoreAllMocks();
});

describe('BugFab', () => {
  it('renders the bug-report button', () => {
    render(<BugFab />);
    expect(screen.getByRole('button', { name: 'Bug melden' })).toBeInTheDocument();
  });

  it('fotografiert die Seite und navigiert dann zur Ticketseite', async () => {
    render(<BugFab />);

    fireEvent.click(screen.getByRole('button', { name: 'Bug melden' }));

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/bug-report?create=true'));
    expect(stashedPageShot()).toBe(shot.blob);
  });
});
