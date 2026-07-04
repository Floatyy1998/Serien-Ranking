// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

const Boom = ({ message = 'kaboom' }: { message?: string }) => {
  throw new Error(message);
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('ErrorBoundary', () => {
  it('renders children when nothing throws', () => {
    render(
      <ErrorBoundary>
        <div>safe content</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('safe content')).toBeInTheDocument();
  });

  it('shows the fallback UI when a child throws', () => {
    // React logs the caught error to console.error — silence it.
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );

    expect(screen.getByText('Etwas ist schiefgelaufen')).toBeInTheDocument();
    // Recovery affordances rendered
    expect(screen.getByText('Neu laden')).toBeInTheDocument();
    expect(screen.getByText('Fehler kopieren')).toBeInTheDocument();
    // The captured error message is surfaced
    expect(screen.getByText(/kaboom/)).toBeInTheDocument();
  });

  it('copies the error details to the clipboard', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const writeText = vi.fn<(text: string) => Promise<void>>(async () => {});
    Object.assign(navigator, { clipboard: { writeText } });

    render(
      <ErrorBoundary>
        <Boom message="copy-me" />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByText('Fehler kopieren'));

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0][0]).toContain('copy-me');
  });
});
