// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const navigateMock = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', () => ({ useNavigate: () => navigateMock }));

import { BugFab } from './BugFab';

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

  it('navigates in-app to the bug-report page on click', () => {
    render(<BugFab />);

    fireEvent.click(screen.getByRole('button', { name: 'Bug melden' }));

    expect(navigateMock).toHaveBeenCalledWith('/bug-report?create=true');
  });
});
