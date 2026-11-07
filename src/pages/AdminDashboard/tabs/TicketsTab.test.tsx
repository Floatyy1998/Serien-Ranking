// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BugTicket } from '../../BugReport/types';
import type { TicketsData } from './tickets/useTicketsData';
import { MemoryRouter } from 'react-router-dom';
import { TicketsTab as Tab } from './TicketsTab';

const TicketsTab = () => (
  <MemoryRouter>
    <Tab />
  </MemoryRouter>
);

const holder = vi.hoisted(() => ({ value: null as unknown }));

vi.mock('./tickets/useTicketsData', () => ({
  useTicketsData: () => holder.value,
}));

const nowIso = new Date().toISOString();

function ticket(id: string, title: string, extra: Partial<BugTicket> = {}): BugTicket {
  return {
    id,
    ticketType: 'bug',
    title,
    description: `Beschreibung von ${title}`,
    stepsToReproduce: '',
    screenshots: [],
    status: 'open',
    priority: 'low',
    createdBy: 'u',
    createdByName: 'Tester',
    createdAt: nowIso,
    updatedAt: nowIso,
    comments: {},
    ...extra,
  };
}

function makeData(overrides: Partial<TicketsData>): TicketsData {
  const tickets = overrides.tickets ?? [];
  return {
    tickets,
    loading: false,
    items: tickets.map((t) => ({ ticket: t, stale: false })),
    counts: { inbox: tickets.length, waiting: 0, done: 0, rejected: 0, obsolete: 0, all: 0 },
    pending: 0,
    refresh: vi.fn(),
    selected: null,
    selectedId: null,
    setSelectedId: vi.fn(),
    queue: 'inbox',
    setQueue: vi.fn(),
    typeFilter: 'all',
    setTypeFilter: vi.fn(),
    searchQuery: '',
    setSearchQuery: vi.fn(),
    sort: 'newest',
    setSort: vi.fn(),
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
  it('zeigt den Ladezustand', () => {
    holder.value = makeData({ loading: true });
    render(<TicketsTab />);
    expect(screen.getByText('Laden...')).toBeInTheDocument();
  });

  it('zeigt den leeren Eingang und den Auswahl-Hinweis', () => {
    render(<TicketsTab />);
    expect(screen.getByText('Keine Tickets gefunden.')).toBeInTheDocument();
    expect(screen.getByText('Ticket auswählen')).toBeInTheDocument();
  });

  it('listet Tickets und wählt per Klick und J/K aus', () => {
    const list = [ticket('a', 'Erstes Ticket'), ticket('b', 'Zweites Ticket')];
    const setSelectedId = vi.fn();
    holder.value = makeData({ tickets: list, setSelectedId });
    render(<TicketsTab />);
    fireEvent.click(screen.getByText('Zweites Ticket'));
    expect(setSelectedId).toHaveBeenCalledWith('b');
    fireEvent.keyDown(window, { key: 'j' });
    expect(setSelectedId).toHaveBeenLastCalledWith('a');
  });

  it('zeigt den Verlauf und sendet Antwort samt Erledigt', async () => {
    const t = ticket('a', 'Login kaputt', {
      comments: {
        c1: {
          id: 'c1',
          authorUid: 'u',
          authorName: 'Tester',
          isAdmin: false,
          text: 'Immer noch kaputt',
          createdAt: nowIso,
        },
      },
      adminNotes: {
        n1: {
          id: 'n1',
          authorUid: 'admin',
          authorName: 'Admin',
          isAdmin: true,
          text: 'Cache prüfen',
          createdAt: nowIso,
        },
      },
    });
    const addAdminComment = vi.fn(() => Promise.resolve());
    const updateTicket = vi.fn(() => Promise.resolve());
    holder.value = makeData({
      tickets: [t],
      selected: t,
      selectedId: 'a',
      addAdminComment,
      updateTicket,
    });
    render(<TicketsTab />);
    expect(screen.getByText('Immer noch kaputt')).toBeInTheDocument();
    expect(screen.getByText('Cache prüfen')).toBeInTheDocument();
    expect(screen.getByText('Antwort offen')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/Antwort schreiben/), {
      target: { value: 'Behoben' },
    });
    fireEvent.click(screen.getByText(/Senden & erledigt/));
    await vi.waitFor(() => expect(updateTicket).toHaveBeenCalledWith('a', { status: 'done' }));
    expect(addAdminComment).toHaveBeenCalledWith('a', 'Behoben');
  });

  it('bietet Geschlossen nicht mehr als eigenen Status an', () => {
    const t = ticket('a', 'Alt', { status: 'closed' });
    holder.value = makeData({ tickets: [t], selected: t, selectedId: 'a' });
    render(<TicketsTab />);
    const statusGroup = screen.getByRole('radiogroup', { name: 'Status' });
    expect(statusGroup.textContent).not.toContain('Geschlossen');
    expect(screen.getByRole('radio', { name: 'Erledigt' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('vom Nutzer selbst geschlossen')).toBeInTheDocument();
  });
});
