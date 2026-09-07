// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { VisuallyHidden } from './VisuallyHidden';

afterEach(cleanup);

describe('VisuallyHidden', () => {
  it('renders its children (smoke)', () => {
    render(<VisuallyHidden>Hidden label</VisuallyHidden>);
    expect(screen.getByText('Hidden label')).toBeInTheDocument();
  });

  it('renders a <span> by default', () => {
    render(<VisuallyHidden>span content</VisuallyHidden>);
    expect(screen.getByText('span content').tagName).toBe('SPAN');
  });

  it('honours the `as` prop for the element type', () => {
    render(<VisuallyHidden as="h2">heading content</VisuallyHidden>);
    expect(screen.getByText('heading content').tagName).toBe('H2');
  });

  it('applies visually-hidden styles', () => {
    render(<VisuallyHidden>styled</VisuallyHidden>);
    const el = screen.getByText('styled');
    expect(el).toHaveStyle({ position: 'absolute', width: '1px', height: '1px' });
  });
});
