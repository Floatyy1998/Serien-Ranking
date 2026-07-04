// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

vi.mock('@mui/icons-material', () => ({ Check: () => null }));

const { theme } = vi.hoisted(() => ({
  theme: { status: { success: '#4cd137' } },
}));
vi.mock('../../contexts/ThemeContextDef', () => ({
  useTheme: () => ({ currentTheme: theme }),
}));

import { RatingSnackbar } from './RatingSnackbar';

afterEach(() => cleanup());

describe('RatingSnackbar', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<RatingSnackbar open={false} message="Gespeichert" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the message when open', () => {
    render(<RatingSnackbar open message="Gespeichert" />);
    expect(screen.getByText('Gespeichert')).toBeInTheDocument();
  });
});
