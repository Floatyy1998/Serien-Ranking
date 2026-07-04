// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { LivePulse } from './LivePulse';

afterEach(cleanup);

describe('LivePulse', () => {
  it('renders the active user count (plural)', () => {
    render(<LivePulse count={5} color="#00d123" textColor="#ffffff" />);
    expect(screen.getByText(/5 Users aktiv/)).toBeInTheDocument();
  });

  it('uses the singular "User" for a count of one', () => {
    render(<LivePulse count={1} color="#00d123" textColor="#fff" />);
    expect(screen.getByText(/1 User aktiv/)).toBeInTheDocument();
    expect(screen.queryByText(/Users aktiv/)).not.toBeInTheDocument();
  });
});
