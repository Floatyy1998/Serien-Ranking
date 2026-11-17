// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { VolumeHint } from './VolumeHint';

vi.mock('../../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#00d123',
      accent: '#00b0ff',
      text: { secondary: '#aaa', muted: '#777' },
    },
  }),
}));

afterEach(() => cleanup());

describe('VolumeHint', () => {
  it('bietet Kapitel-Lesern zuerst den Besitz des einen Bands an', () => {
    const onOwn = vi.fn();
    const onMark = vi.fn();
    render(
      <VolumeHint
        volume={113}
        tracksChapters
        hasProgress
        onOwn={onOwn}
        onMark={onMark}
        onDismiss={vi.fn()}
      />
    );
    const buttons = screen.getAllByRole('button').map((b) => b.textContent);
    expect(buttons.slice(0, 2)).toEqual(['Band 113 im Besitz', 'Bis Band 113 gelesen']);
    fireEvent.click(screen.getByText('Band 113 im Besitz'));
    expect(onOwn).toHaveBeenCalledTimes(1);
    expect(onMark).not.toHaveBeenCalled();
  });

  it('fragt bei einem schon gelesenen Band nur noch nach dem Besitz', () => {
    render(<VolumeHint volume={3} tracksChapters={false} onOwn={vi.fn()} onDismiss={vi.fn()} />);
    expect(screen.getByText('Steht der Band bei dir im Regal?')).toBeInTheDocument();
    expect(screen.queryByText('Bis Band 3 gelesen')).not.toBeInTheDocument();
  });

  it('bleibt beim Abhaken, wenn der Band schon im Regal steht', () => {
    const onMark = vi.fn();
    render(<VolumeHint volume={3} tracksChapters={false} onMark={onMark} onDismiss={vi.fn()} />);
    expect(screen.queryByText('Band 3 im Besitz')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Bis Band 3 gelesen'));
    expect(onMark).toHaveBeenCalledTimes(1);
  });
});
