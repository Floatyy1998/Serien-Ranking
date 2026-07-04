// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock(
  '@mui/icons-material',
  () =>
    new Proxy(
      { __esModule: true },
      {
        get: (_t, p) =>
          p === '__esModule'
            ? true
            : typeof p === 'symbol' || p === 'then'
              ? undefined
              : () => null,
        has: () => true,
      }
    )
);

vi.mock('framer-motion', async () => {
  const React = await import('react');
  const skip = new Set([
    'initial',
    'animate',
    'exit',
    'transition',
    'variants',
    'layout',
    'whileTap',
    'whileHover',
    'mode',
  ]);
  const make = (tag: string) =>
    React.forwardRef(function M(props: Record<string, unknown>, ref: unknown) {
      const clean: Record<string, unknown> = { ref };
      for (const k in props) if (!skip.has(k)) clean[k] = props[k];
      return React.createElement(tag, clean);
    });
  const motion = new Proxy({} as Record<string, unknown>, { get: (_t, tag) => make(String(tag)) });
  return {
    motion,
    AnimatePresence: (p: { children?: unknown }) =>
      React.createElement(React.Fragment, null, p.children as never),
  };
});

vi.mock('../../contexts/ThemeContextDef', () => {
  const make = (): unknown =>
    new Proxy(() => '#3355ff', {
      get: (_t, prop) =>
        prop === Symbol.toPrimitive || prop === 'toString' || prop === 'valueOf'
          ? () => '#3355ff'
          : make(),
    });
  return { useTheme: () => ({ currentTheme: make() }) };
});

const search = vi.hoisted(() => ({ create: false }));
vi.mock('react-router-dom', () => ({
  useSearchParams: () => [new URLSearchParams(search.create ? 'create=true' : ''), vi.fn()],
}));

const data = vi.hoisted(() => ({
  tickets: [] as Array<{ id: string; title: string }>,
  loading: false,
  uploadScreenshot: vi.fn(),
  createTicket: vi.fn(),
  addComment: vi.fn(),
  updateTicket: vi.fn(),
}));
vi.mock('./useBugReportData', () => ({ useBugReportData: () => data }));

vi.mock('../../components/ui', () => ({
  PageLayout: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  PageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

vi.mock('./components/NewTicketForm', () => ({
  NewTicketForm: ({ onCancel }: { onCancel: () => void }) => (
    <div data-testid="new-ticket-form">
      <button onClick={onCancel}>close-form</button>
    </div>
  ),
}));
vi.mock('./components/TicketCard', () => ({
  TicketCard: ({ ticket }: { ticket: { title: string } }) => (
    <div data-testid="ticket-card">{ticket.title}</div>
  ),
}));

import { BugReportPage } from './BugReportPage';

afterEach(() => {
  cleanup();
  data.tickets = [];
  data.loading = false;
  search.create = false;
});

describe('BugReportPage', () => {
  it('renders the header and the create button', () => {
    render(<BugReportPage />);
    expect(screen.getByText('Feedback & Bugs')).toBeInTheDocument();
    expect(screen.getByText('Neues Ticket erstellen')).toBeInTheDocument();
    expect(screen.getByText('Meine Tickets (0)')).toBeInTheDocument();
  });

  it('opens the ticket form when the create button is clicked', () => {
    render(<BugReportPage />);
    fireEvent.click(screen.getByText('Neues Ticket erstellen'));
    expect(screen.getByTestId('new-ticket-form')).toBeInTheDocument();
  });

  it('renders one card per ticket and updates the count', () => {
    data.tickets = [
      { id: 't1', title: 'Bug A' },
      { id: 't2', title: 'Bug B' },
    ];
    render(<BugReportPage />);
    expect(screen.getByText('Bug A')).toBeInTheDocument();
    expect(screen.getByText('Bug B')).toBeInTheDocument();
    expect(screen.getByText('Meine Tickets (2)')).toBeInTheDocument();
  });

  it('shows the loading state', () => {
    data.loading = true;
    render(<BugReportPage />);
    expect(screen.getByText('Laden...')).toBeInTheDocument();
  });
});
