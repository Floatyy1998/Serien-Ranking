// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

const { usePrivacyDataMock } = vi.hoisted(() => ({
  usePrivacyDataMock: vi.fn(),
}));

vi.mock('framer-motion', async () => {
  const React = await import('react');
  const make = (tag: string) =>
    React.forwardRef(function Motion(props: Record<string, unknown>, ref: unknown) {
      const clean: Record<string, unknown> = { ref };
      for (const k in props)
        if (!['initial', 'animate', 'exit', 'transition'].includes(k)) clean[k] = props[k];
      return React.createElement(tag, clean);
    });
  return {
    motion: new Proxy({} as Record<string, unknown>, { get: (_t, tag) => make(String(tag)) }),
  };
});

vi.mock('@mui/icons-material', () => ({ Shield: () => <span data-testid="shield" /> }));
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
vi.mock('../../components/ui', () => ({
  LoadingSpinner: () => <div data-testid="spinner" />,
  PageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
}));
vi.mock('./usePrivacyData', () => ({ usePrivacyData: usePrivacyDataMock }));
vi.mock('./PrivacyComponents', () => ({
  ResponsibleSection: () => <div data-testid="responsible" />,
  DataCollectionSection: () => <div />,
  FirebaseSection: () => <div />,
  ApiServicesSection: () => <div />,
  RightsSection: () => <div />,
  TextSection: ({ title }: { title: string }) => <div>{title}</div>,
  ContactSection: () => <div />,
}));

import { PrivacyPage } from './PrivacyPage';

const fullData = {
  title: 'Datenschutz',
  lastUpdated: 'Stand: 2026',
  sections: {
    responsible: {},
    dataCollection: {},
    firebase: {},
    apiServices: {},
    rights: {},
    deletion: { title: 'Löschung', text: 'x' },
    security: { title: 'Sicherheit', text: 'y' },
    changes: { title: 'Änderungen', text: 'z' },
    contact: {},
  },
};

beforeEach(() => usePrivacyDataMock.mockReset());

afterEach(() => cleanup());

describe('PrivacyPage', () => {
  it('shows a spinner while loading', () => {
    usePrivacyDataMock.mockReturnValue({ data: null, loading: true });
    render(<PrivacyPage />);
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('shows an error message when data failed to load', () => {
    usePrivacyDataMock.mockReturnValue({ data: null, loading: false });
    render(<PrivacyPage />);
    expect(
      screen.getByText('Datenschutzinformationen konnten nicht geladen werden.')
    ).toBeInTheDocument();
  });

  it('renders the page title and sections when data is present', () => {
    usePrivacyDataMock.mockReturnValue({ data: fullData, loading: false });
    render(<PrivacyPage />);
    expect(screen.getByText('Datenschutz')).toBeInTheDocument();
    expect(screen.getByTestId('responsible')).toBeInTheDocument();
    expect(screen.getByText('Löschung')).toBeInTheDocument();
  });
});
