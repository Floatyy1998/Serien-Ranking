// @vitest-environment jsdom
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { TicketStatus, TicketType } from '../../../BugReport/types';
import type { TicketTheme } from './ticketStyles';
import { TicketsTabHeader } from './TicketsTabHeader';

const theme: TicketTheme = {
  primary: '#00d123',
  text: { primary: '#fff', secondary: '#ccc', muted: '#888' },
  background: { surface: '#111', default: '#000' },
  status: { success: '#0f0', error: '#f00', warning: '#fa0' },
  border: { default: '#333' },
};

const counts: Record<string, number> = { all: 7, open: 3, 'in-progress': 1, bug: 5, feature: 2 };

function setup(overrides?: Partial<Parameters<typeof TicketsTabHeader>[0]>) {
  const props = {
    theme,
    totalCount: 7,
    counts,
    statusFilter: 'all' as const,
    setStatusFilter: vi.fn<(s: TicketStatus | 'all') => void>(),
    typeFilter: 'all' as const,
    setTypeFilter: vi.fn<(t: TicketType | 'all') => void>(),
    searchQuery: '',
    setSearchQuery: vi.fn<(q: string) => void>(),
    ...overrides,
  };
  render(<TicketsTabHeader {...props} />);
  return props;
}

afterEach(cleanup);

describe('TicketsTabHeader', () => {
  it('renders the stat bar labels and totals (smoke)', () => {
    setup();
    expect(screen.getByText('Gesamt')).toBeInTheDocument();
    expect(screen.getByText('Bugs')).toBeInTheDocument();
    // totalCount stat value
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('calls setSearchQuery when typing in the search box', () => {
    const props = setup();
    fireEvent.change(screen.getByPlaceholderText(/Ticket suchen/), {
      target: { value: 'crash' },
    });
    expect(props.setSearchQuery).toHaveBeenCalledWith('crash');
  });

  it('calls setStatusFilter and setTypeFilter when filter buttons are clicked', () => {
    const props = setup();
    fireEvent.click(screen.getByRole('button', { name: /Offen/ }));
    expect(props.setStatusFilter).toHaveBeenCalledWith('open');
    fireEvent.click(screen.getByRole('button', { name: /Bug/ }));
    expect(props.setTypeFilter).toHaveBeenCalledWith('bug');
  });
});
