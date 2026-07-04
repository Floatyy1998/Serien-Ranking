// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SpeakButton } from './SpeakButton';

if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

afterEach(cleanup);

describe('SpeakButton', () => {
  it('renders the "Vorlesen" title in idle state (smoke)', () => {
    render(<SpeakButton state="idle" onClick={() => {}} accent="#00d123" />);
    expect(screen.getByTitle('Vorlesen')).toBeInTheDocument();
  });

  it('shows the stop title while speaking', () => {
    render(<SpeakButton state="speaking" onClick={() => {}} accent="#00d123" />);
    expect(screen.getByTitle('Vorlesen stoppen')).toBeInTheDocument();
  });

  it('renders loading bars while loading', () => {
    render(<SpeakButton state="loading" onClick={() => {}} accent="#00d123" />);
    // loading state has no VolumeUp/Stop icon title-change -> still the "Vorlesen" title.
    expect(screen.getByTitle('Vorlesen')).toBeInTheDocument();
  });

  it('invokes onClick when pressed', () => {
    const onClick = vi.fn();
    render(<SpeakButton state="idle" onClick={onClick} accent="#00d123" />);
    fireEvent.click(screen.getByTitle('Vorlesen'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
