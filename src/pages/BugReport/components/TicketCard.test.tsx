// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ThemeContextType } from '../../../contexts/ThemeContext';
import type { BugTicket } from '../types';

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
  const skip = new Set(['initial', 'animate', 'exit', 'transition', 'whileTap', 'whileHover']);
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

const makeTheme = (): ThemeContextType['currentTheme'] => {
  const make = (): unknown =>
    new Proxy(() => '#3355ff', {
      get: (_t, prop) =>
        prop === Symbol.toPrimitive || prop === 'toString' || prop === 'valueOf'
          ? () => '#3355ff'
          : make(),
    });
  return make() as ThemeContextType['currentTheme'];
};
const theme = makeTheme();

const baseTicket: BugTicket = {
  id: 't1',
  ticketType: 'bug',
  title: 'Login broken',
  description: 'Cannot log in',
  stepsToReproduce: '',
  screenshots: [],
  status: 'open',
  priority: 'low',
  createdBy: 'u1',
  createdByName: 'Me',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  comments: {},
};

import { TicketCard } from './TicketCard';

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));

afterEach(() => cleanup());

describe('TicketCard', () => {
  it('renders the ticket title and status label collapsed', () => {
    render(
      <TicketCard
        ticket={baseTicket}
        theme={theme}
        expanded={false}
        onToggle={vi.fn()}
        onAddComment={vi.fn(async () => true)}
        onUpdate={vi.fn(async () => true)}
      />
    );
    expect(screen.getByText('Login broken')).toBeInTheDocument();
    expect(screen.getByText('Offen')).toBeInTheDocument();
    expect(screen.queryByText('Cannot log in')).not.toBeInTheDocument();
  });

  it('calls onToggle when the header is clicked', () => {
    const onToggle = vi.fn();
    render(
      <TicketCard
        ticket={baseTicket}
        theme={theme}
        expanded={false}
        onToggle={onToggle}
        onAddComment={vi.fn(async () => true)}
        onUpdate={vi.fn(async () => true)}
      />
    );
    fireEvent.click(screen.getByText('Login broken'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('shows the description and comment box when expanded', () => {
    render(
      <TicketCard
        ticket={baseTicket}
        theme={theme}
        expanded
        onToggle={vi.fn()}
        onAddComment={vi.fn(async () => true)}
        onUpdate={vi.fn(async () => true)}
      />
    );
    expect(screen.getByText('Cannot log in')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Kommentar schreiben...')).toBeInTheDocument();
  });

  it('adds a comment when Enter is pressed in the comment box', () => {
    const onAddComment = vi.fn(async () => true);
    render(
      <TicketCard
        ticket={baseTicket}
        theme={theme}
        expanded
        onToggle={vi.fn()}
        onAddComment={onAddComment}
        onUpdate={vi.fn(async () => true)}
      />
    );
    const box = screen.getByPlaceholderText('Kommentar schreiben...');
    fireEvent.change(box, { target: { value: 'Any update?' } });
    const sendBtn = screen.getAllByRole('button').find((b) => b.textContent === '');
    fireEvent.click(sendBtn as HTMLElement);
    expect(onAddComment).toHaveBeenCalledWith('Any update?');
  });
});

describe('TicketCard – Screenshots nachträglich anhängen', () => {
  const STORAGE = 'https://firebasestorage.googleapis.com/v0/b/serien-ranking/o';
  const uploadProps = {
    onUpload: vi.fn(async (f: File) => `${STORAGE}/${f.name}`),
    onAddScreenshots: vi.fn(async () => true),
    onRemoveScreenshot: vi.fn(async () => true),
  };
  const renderCard = (ticket: BugTicket, props = uploadProps) =>
    render(
      <TicketCard
        ticket={ticket}
        theme={theme}
        expanded
        onToggle={vi.fn()}
        onAddComment={vi.fn(async () => true)}
        onUpdate={vi.fn(async () => true)}
        {...props}
      />
    );

  it('zeigt die Bild-Kachel bei offenen Tickets, nicht bei erledigten', () => {
    const { unmount } = renderCard(baseTicket);
    expect(screen.getByLabelText('Bild hinzufügen')).toBeInTheDocument();
    unmount();
    renderCard({ ...baseTicket, status: 'done' });
    expect(screen.queryByLabelText('Bild hinzufügen')).not.toBeInTheDocument();
  });

  it('zeigt keine Kachel ohne Upload-Handler', () => {
    render(
      <TicketCard
        ticket={baseTicket}
        theme={theme}
        expanded
        onToggle={vi.fn()}
        onAddComment={vi.fn(async () => true)}
        onUpdate={vi.fn(async () => true)}
      />
    );
    expect(screen.queryByLabelText('Bild hinzufügen')).not.toBeInTheDocument();
  });

  it('lädt nur Bilder hoch und hängt deren URLs ans Ticket', async () => {
    const onUpload = vi.fn(async (f: File) => `${STORAGE}/${f.name}`);
    const onAddScreenshots = vi.fn(async () => true);
    renderCard(baseTicket, { ...uploadProps, onUpload, onAddScreenshots });
    const input = screen.getByTestId('ticket-screenshot-input');
    const image = new File(['x'], 'shot.png', { type: 'image/png' });
    const text = new File(['x'], 'notiz.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [image, text] } });
    await waitFor(() => expect(onAddScreenshots).toHaveBeenCalledWith([`${STORAGE}/shot.png`]));
    expect(onUpload).toHaveBeenCalledTimes(1);
  });

  it('entfernt ein Bild über den Entfernen-Knopf', async () => {
    const url = `${STORAGE}/alt.png`;
    const onRemoveScreenshot = vi.fn(async () => true);
    renderCard({ ...baseTicket, screenshots: [url] }, { ...uploadProps, onRemoveScreenshot });
    fireEvent.click(screen.getByLabelText('Bild entfernen'));
    await waitFor(() => expect(onRemoveScreenshot).toHaveBeenCalledWith(url));
  });
});
