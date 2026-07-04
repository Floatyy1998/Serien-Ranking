// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FillerChip } from './FillerChip';

vi.mock('../../contexts/ThemeContextDef', () => ({
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

  it('shows the F letter for a filler episode (compact)', () => {
    render(<FillerChip filler />);
    expect(screen.getByText('F')).toBeInTheDocument();
    expect(screen.getByLabelText('Filler-Episode')).toBeInTheDocument();
  });

  it('shows the R letter for a recap episode (compact)', () => {
    render(<FillerChip recap />);
    expect(screen.getByText('R')).toBeInTheDocument();
    expect(screen.getByLabelText('Recap-Episode')).toBeInTheDocument();
  });

  it('shows the full word in the label variant', () => {
    render(<FillerChip filler variant="label" size="md" />);
    expect(screen.getByText('Filler')).toBeInTheDocument();
  });
});
