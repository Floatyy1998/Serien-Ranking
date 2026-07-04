// @vitest-environment jsdom
import type { ComponentProps } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

vi.mock('../../contexts/ThemeContextDef', () => {
  const make = (): unknown =>
    new Proxy(() => '#333', {
      get: (_t, prop) => {
        if (prop === Symbol.toPrimitive || prop === 'toString' || prop === 'valueOf')
          return () => '#333';
        return make();
      },
    });
  return { useTheme: () => ({ currentTheme: make() }) };
});

import {
  PrivacySection,
  TextSection,
  ResponsibleSection,
  ContactSection,
} from './PrivacyComponents';

afterEach(() => cleanup());

describe('PrivacyComponents', () => {
  it('PrivacySection renders its title and children', () => {
    render(
      <PrivacySection title="Abschnitt">
        <p>Inhalt hier</p>
      </PrivacySection>
    );
    expect(screen.getByText('Abschnitt')).toBeInTheDocument();
    expect(screen.getByText('Inhalt hier')).toBeInTheDocument();
  });

  it('TextSection renders title and text', () => {
    render(<TextSection title="Löschung" text="Wir löschen Daten." />);
    expect(screen.getByText('Löschung')).toBeInTheDocument();
    expect(screen.getByText('Wir löschen Daten.')).toBeInTheDocument();
  });

  it('ResponsibleSection renders contact details', () => {
    const data = {
      title: 'Verantwortlich',
      text: 'Verantwortliche Stelle',
      name: 'Max Mustermann',
      address: 'Straße 1',
      city: '12345 Stadt',
      email: 'max@example.com',
    } as unknown as ComponentProps<typeof ResponsibleSection>['data'];
    render(<ResponsibleSection data={data} />);
    expect(screen.getByText('Verantwortlich')).toBeInTheDocument();
    expect(screen.getByText('Verantwortliche Stelle')).toBeInTheDocument();
  });

  it('ContactSection renders the email', () => {
    const data = {
      title: 'Kontakt',
      text: 'Schreib uns',
      email: 'hi@example.com',
    } as unknown as ComponentProps<typeof ContactSection>['data'];
    render(<ContactSection data={data} />);
    expect(screen.getByText('Kontakt')).toBeInTheDocument();
    expect(screen.getByText(/hi@example.com/)).toBeInTheDocument();
  });
});
