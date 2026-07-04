// @vitest-environment jsdom
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BugTicket } from '../../../BugReport/types';
import type { TicketTheme } from './ticketStyles';
import { AdminTicketCard } from './AdminTicketCard';

const theme: TicketTheme = {
  primary: '#00d123',
  text: { primary: '#fff', secondary: '#ccc', muted: '#888' },
  background: { surface: '#111', default: '#000' },
  status: { success: '#0f0', error: '#f00', warning: '#fa0' },
  border: { default: '#333' },
};

const nowIso = new Date().toISOString();

function makeTicket(overrides?: Partial<BugTicket>): BugTicket {
  return {
    id: 't1',
    ticketType: 'bug',
    title: 'App stürzt ab',
    description: 'Beim Öffnen crasht die App.',
    stepsToReproduce: '',
    screenshots: [],
    status: 'open',
    priority: 'low',
    createdBy: 'user-1',
    createdByName: 'Max Mustermann',
    createdAt: nowIso,
    updatedAt: nowIso,
    comments: {},
    ...overrides,
  };
}

function baseProps() {
  return {
    theme,
    onToggle: vi.fn<() => void>(),
    onUpdateStatus: vi.fn<(s: BugTicket['status']) => void>(),
    onUpdatePriority: vi.fn<(p: BugTicket['priority']) => void>(),
    onAddAdminNote: vi.fn<() => Promise<void>>(() => Promise.resolve()),
    onAddComment: vi.fn<() => Promise<void>>(() => Promise.resolve()),
    onDelete: vi.fn<() => void>(),
  };
}

beforeEach(() => {
  vi.stubGlobal(
    'confirm',
    vi.fn<() => boolean>(() => true)
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('AdminTicketCard', () => {
  it('renders collapsed with title, author and status/priority badges (smoke)', () => {
    render(<AdminTicketCard ticket={makeTicket()} expanded={false} {...baseProps()} />);
    expect(screen.getByText('App stürzt ab')).toBeInTheDocument();
    expect(screen.getByText('Max Mustermann')).toBeInTheDocument();
    expect(screen.getByText('Offen')).toBeInTheDocument();
    expect(screen.getByText('Niedrig')).toBeInTheDocument();
    // Collapsed: description not shown
    expect(screen.queryByText('Beschreibung')).not.toBeInTheDocument();
  });

  it('calls onToggle when the header is clicked', () => {
    const props = baseProps();
    render(<AdminTicketCard ticket={makeTicket()} expanded={false} {...props} />);
    fireEvent.click(screen.getByText('App stürzt ab'));
    expect(props.onToggle).toHaveBeenCalledTimes(1);
  });

  it('shows details and controls when expanded', () => {
    render(<AdminTicketCard ticket={makeTicket()} expanded {...baseProps()} />);
    expect(screen.getByText('Beschreibung')).toBeInTheDocument();
    expect(screen.getByText('Beim Öffnen crasht die App.')).toBeInTheDocument();
    // Comment textarea available
    expect(screen.getByPlaceholderText(/Antwort schreiben/)).toBeInTheDocument();
  });

  it('calls onDelete after confirmation when Löschen is clicked', () => {
    const props = baseProps();
    render(<AdminTicketCard ticket={makeTicket()} expanded {...props} />);
    fireEvent.click(screen.getByRole('button', { name: /Löschen/ }));
    expect(props.onDelete).toHaveBeenCalledTimes(1);
  });
});
