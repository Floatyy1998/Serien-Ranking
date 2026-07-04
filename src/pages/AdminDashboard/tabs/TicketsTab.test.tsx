// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BugTicket } from '../../BugReport/types';
import type { TicketTheme } from './tickets/ticketStyles';
import type { useTicketsData as UseTicketsDataFn } from './tickets/useTicketsData';
import { TicketsTab } from './TicketsTab';

type TicketsData = ReturnType<typeof UseTicketsDataFn>;

const holder = vi.hoisted(() => ({ value: null as unknown }));

vi.mock('./tickets/useTicketsData', () => ({
  useTicketsData: () => holder.value,
}));

const theme: TicketTheme = {
  primary: '#00d123',
  text: { primary: '#fff', secondary: '#ccc', muted: '#888' },
  background: { surface: '#111', default: '#000' },
  status: { success: '#0f0', error: '#f00', warning: '#fa0' },
  border: { default: '#333' },
};

const nowIso = new Date().toISOString();

function ticket(id: string, title: string): BugTicket {
  return {
    id,
    ticketType: 'bug',
    title,
    description: 'desc',
    stepsToReproduce: '',
    screenshots: [],
    status: 'open',
    priority: 'low',
    createdBy: 'u',
    createdByName: 'Tester',
    createdAt: nowIso,
    updatedAt: nowIso,
    comments: {},
  };
}

function makeData(overrides: Partial<TicketsData>): TicketsData {
  const tickets = overrides.tickets ?? [];
  return {
    tickets,
    loading: false,
    filtered: tickets,
    counts: { all: tickets.length },
    expandedId: null,
    setExpandedId: vi.fn(),
    expandedRef: { current: null },
    statusFilter: 'all',
    setStatusFilter: vi.fn(),
    typeFilter: 'all',
    setTypeFilter: vi.fn(),
    searchQuery: '',
    setSearchQuery: vi.fn(),
    updateTicket: vi.fn(() => Promise.resolve()),
    addAdminComment: vi.fn(() => Promise.resolve()),
    addAdminNote: vi.fn(() => Promise.resolve()),
    deleteTicket: vi.fn(() => Promise.resolve()),
    ...overrides,
  } as TicketsData;
}

beforeEach(() => {
  holder.value = makeData({});
});

afterEach(cleanup);

describe('TicketsTab', () => {
  it('shows the loading placeholder while loading', () => {
    holder.value = makeData({ loading: true });
    render(<TicketsTab theme={theme} />);
    expect(screen.getByText('Laden...')).toBeInTheDocument();
  });

  it('renders the empty state when there are no tickets', () => {
    holder.value = makeData({ tickets: [], filtered: [] });
    render(<TicketsTab theme={theme} />);
    expect(screen.getByText('Keine Tickets gefunden.')).toBeInTheDocument();
  });

  it('renders a card per filtered ticket and the count summary', () => {
    const list = [ticket('a', 'Erstes Ticket'), ticket('b', 'Zweites Ticket')];
    holder.value = makeData({ tickets: list, filtered: list });
    render(<TicketsTab theme={theme} />);
    expect(screen.getByText('Erstes Ticket')).toBeInTheDocument();
    expect(screen.getByText('Zweites Ticket')).toBeInTheDocument();
    expect(screen.getByText(/2 von 2 Tickets/)).toBeInTheDocument();
  });
});
