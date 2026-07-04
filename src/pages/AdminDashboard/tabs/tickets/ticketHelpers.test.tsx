// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { TicketTheme } from './ticketStyles';
import { Badge, Section } from './ticketHelpers';

const theme: TicketTheme = {
  primary: '#00d123',
  text: { primary: '#fff', secondary: '#ccc', muted: '#888' },
  background: { surface: '#111', default: '#000' },
  status: { success: '#0f0', error: '#f00', warning: '#fa0' },
  border: { default: '#333' },
};

afterEach(cleanup);

describe('ticketHelpers', () => {
  it('Badge renders its children', () => {
    render(<Badge color="#00d123">Offen</Badge>);
    expect(screen.getByText('Offen')).toBeInTheDocument();
  });

  it('Section renders the title and its children', () => {
    render(
      <Section title="Beschreibung" theme={theme}>
        <p>ticket body</p>
      </Section>
    );
    expect(screen.getByText('Beschreibung')).toBeInTheDocument();
    expect(screen.getByText('ticket body')).toBeInTheDocument();
  });

  it('Section accepts a custom color override for the title', () => {
    render(
      <Section title="Notiz" theme={theme} color="#ff0000">
        <span>note</span>
      </Section>
    );
    expect(screen.getByText('Notiz')).toBeInTheDocument();
    expect(screen.getByText('note')).toBeInTheDocument();
  });
});
