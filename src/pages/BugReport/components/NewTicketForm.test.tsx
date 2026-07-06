// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ThemeContextType } from '../../../contexts/ThemeContext';

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
  return { motion };
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

import { NewTicketForm } from './NewTicketForm';

afterEach(() => cleanup());

describe('NewTicketForm', () => {
  it('renders the form fields with the bug placeholders', () => {
    render(
      <NewTicketForm
        theme={theme}
        onSubmit={vi.fn(async () => true)}
        onCancel={vi.fn()}
        onUpload={vi.fn(async () => null)}
      />
    );
    expect(screen.getByText('Neues Ticket')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Kurze Beschreibung des Problems')).toBeInTheDocument();
  });

  it('calls onCancel when the abort button is pressed', () => {
    const onCancel = vi.fn();
    render(
      <NewTicketForm
        theme={theme}
        onSubmit={vi.fn(async () => true)}
        onCancel={onCancel}
        onUpload={vi.fn(async () => null)}
      />
    );
    fireEvent.click(screen.getByText('Abbrechen'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('submits with the entered title and description', () => {
    const onSubmit = vi.fn<
      (d: { ticketType: string; title: string; description: string }) => Promise<boolean>
    >(async () => true);
    render(
      <NewTicketForm
        theme={theme}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        onUpload={vi.fn(async () => null)}
      />
    );
    fireEvent.change(screen.getByPlaceholderText('Kurze Beschreibung des Problems'), {
      target: { value: 'Crash on login' },
    });
    fireEvent.change(screen.getByPlaceholderText('Was genau ist passiert? Was hast du erwartet?'), {
      target: { value: 'It crashes' },
    });
    fireEvent.click(screen.getByText('Absenden'));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({
      title: 'Crash on login',
      description: 'It crashes',
      ticketType: 'bug',
    });
  });

  it('switches placeholders when the feature type is selected', () => {
    render(
      <NewTicketForm
        theme={theme}
        onSubmit={vi.fn(async () => true)}
        onCancel={vi.fn()}
        onUpload={vi.fn(async () => null)}
      />
    );
    fireEvent.click(screen.getByText(/Feature/));
    expect(screen.getByPlaceholderText('Kurze Beschreibung des Features')).toBeInTheDocument();
  });
});
