// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ChatMessageText } from './ChatMessageText';

afterEach(cleanup);

describe('ChatMessageText', () => {
  it('macht Links klickbar und überlässt das Öffnen dem Aufrufer', () => {
    const onLink = vi.fn();
    render(<ChatMessageText text="Schau mal www.example.com/folge, krass" onLink={onLink} />);
    const link = screen.getByRole('link', { name: 'www.example.com/folge' });
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toContain('noopener');

    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    fireEvent(link, click);
    expect(click.defaultPrevented).toBe(true);
    expect(onLink).toHaveBeenCalledWith('https://www.example.com/folge');
  });

  it('rendert Text ohne Links unverändert', () => {
    const { container } = render(<ChatMessageText text="Kein Link hier." onLink={() => {}} />);
    expect(container.textContent).toBe('Kein Link hier.');
    expect(screen.queryByRole('link')).toBeNull();
  });
});
