// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FillerChip } from './FillerChip';

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#00d123',
      status: { warning: '#f59e0b' },
    },
  }),
}));

afterEach(() => cleanup());

describe('FillerChip', () => {
  it('renders nothing when neither filler nor recap', () => {
    const { container } = render(<FillerChip />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a filler badge (compact)', () => {
    render(<FillerChip filler />);
    expect(screen.getByLabelText('Filler-Episode')).toBeInTheDocument();
  });

  it('renders a recap badge (compact)', () => {
    render(<FillerChip recap />);
    expect(screen.getByLabelText('Recap-Episode')).toBeInTheDocument();
  });

  it('shows the full word in the label variant', () => {
    render(<FillerChip filler variant="label" size="md" />);
    expect(screen.getByText('Filler')).toBeInTheDocument();
  });
});
