// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { SafeResponsiveContainer } from './SafeResponsiveContainer';

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;

afterEach(cleanup);

describe('SafeResponsiveContainer', () => {
  it('renders its chart child (smoke)', () => {
    render(
      <SafeResponsiveContainer width={300} height={200}>
        <div>chart-body</div>
      </SafeResponsiveContainer>
    );
    expect(screen.getByText('chart-body')).toBeInTheDocument();
  });

  it('renders repeatedly without throwing (warn patch is idempotent)', () => {
    const { rerender } = render(
      <SafeResponsiveContainer width={120} height={120} aspect={1}>
        <div>first</div>
      </SafeResponsiveContainer>
    );
    rerender(
      <SafeResponsiveContainer width={120} height={120} aspect={1}>
        <div>second</div>
      </SafeResponsiveContainer>
    );
    expect(screen.getByText('second')).toBeInTheDocument();
  });
});
