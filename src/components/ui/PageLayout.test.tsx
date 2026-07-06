// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PageLayout } from './PageLayout';

vi.mock('../../contexts/ThemeContext', async () => {
  const { generateDynamicTheme } = await import('../../theme/dynamicTheme');
  const currentTheme = generateDynamicTheme({
    primaryColor: '#00d123',
    backgroundColor: '#000000',
    accentColor: '#008a6e',
  });
  return { useTheme: () => ({ currentTheme }) };
});

afterEach(cleanup);

describe('PageLayout', () => {
  it('renders its children (smoke)', () => {
    render(
      <PageLayout>
        <span>Page body</span>
      </PageLayout>
    );
    expect(screen.getByText('Page body')).toBeInTheDocument();
  });

  it('forwards the ref to the root element', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <PageLayout ref={ref}>
        <span>x</span>
      </PageLayout>
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('merges a custom style override', () => {
    render(
      <PageLayout style={{ padding: '5px' }}>
        <span>styled body</span>
      </PageLayout>
    );
    const root = screen.getByText('styled body').parentElement as HTMLElement;
    expect(root).toHaveStyle({ padding: '5px' });
  });
});
