// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LinkifiedText } from './LinkifiedText';

vi.mock('../overlay/Dialog', () => ({
  Dialog: ({ open, title }: { open: boolean; title: string }) => (open ? <div>{title}</div> : null),
}));

afterEach(cleanup);

const renderText = (text: string) =>
  render(
    <MemoryRouter>
      <LinkifiedText text={text} />
    </MemoryRouter>
  );

describe('LinkifiedText', () => {
  it('rendert eine URL als Link und den Rest als Text', () => {
    renderText('Schau hier https://www.youtube.com/watch?v=abc123 an');
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe('https://www.youtube.com/watch?v=abc123');
    expect(link.getAttribute('rel')).toContain('noopener');
  });

  it('fragt vor einem externen Link nach', () => {
    renderText('https://www.youtube.com/watch?v=abc123');
    fireEvent.click(screen.getByRole('link'));
    expect(screen.getByText('Du verlässt TV-Rank')).toBeTruthy();
  });

  it('zeigt Text ohne URL unverändert', () => {
    renderText('nur Text');
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText('nur Text')).toBeTruthy();
  });
});
