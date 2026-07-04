// @vitest-environment jsdom
import { render, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Snackbar } from './Snackbar';

const showToast = vi.hoisted(() => vi.fn());
vi.mock('../../lib/toast', () => ({ showToast }));

afterEach(() => {
  cleanup();
  showToast.mockReset();
});

describe('Snackbar', () => {
  it('renders nothing to the DOM (smoke)', () => {
    const { container } = render(<Snackbar open={false} message="hi" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('delegates to showToast on the open rising edge', () => {
    render(<Snackbar open message="Gespeichert" variant="success" />);
    expect(showToast).toHaveBeenCalledWith('Gespeichert', 2500, 'success');
  });

  it('does not call showToast while closed', () => {
    render(<Snackbar open={false} message="Nope" />);
    expect(showToast).not.toHaveBeenCalled();
  });

  it('fires again when transitioning closed -> open', () => {
    const { rerender } = render(<Snackbar open={false} message="Later" variant="error" />);
    expect(showToast).not.toHaveBeenCalled();
    rerender(<Snackbar open message="Later" variant="error" />);
    expect(showToast).toHaveBeenCalledWith('Later', 2500, 'error');
  });
});
