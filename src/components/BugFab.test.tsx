// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BugFab } from './BugFab';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('BugFab', () => {
  it('renders the bug-report button', () => {
    render(<BugFab />);
    expect(screen.getByRole('button', { name: 'Bug melden' })).toBeInTheDocument();
  });

  it('opens the bug-report page in a new tab on click', () => {
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
    render(<BugFab />);

    fireEvent.click(screen.getByRole('button', { name: 'Bug melden' }));

    expect(openSpy).toHaveBeenCalledWith('/bug-report?create=true', '_blank');
  });
});
