// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useLongPress } from './useLongPress';

const Probe = ({ onLong, onClick }: { onLong: (v: string) => void; onClick: () => void }) => {
  const bind = useLongPress<string>(onLong);
  return (
    <button type="button" onClick={onClick} {...bind('x')}>
      probe
    </button>
  );
};

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('useLongPress', () => {
  it('fires after holding and swallows the following click', () => {
    const onLong = vi.fn();
    const onClick = vi.fn();
    render(<Probe onLong={onLong} onClick={onClick} />);
    const el = screen.getByText('probe');
    fireEvent.pointerDown(el, { button: 0, clientX: 5, clientY: 5 });
    act(() => vi.advanceTimersByTime(500));
    expect(onLong).toHaveBeenCalledWith('x');
    fireEvent.pointerUp(el);
    fireEvent.click(el);
    expect(onClick).not.toHaveBeenCalled();
    fireEvent.click(el);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('a short tap is a normal click', () => {
    const onLong = vi.fn();
    const onClick = vi.fn();
    render(<Probe onLong={onLong} onClick={onClick} />);
    const el = screen.getByText('probe');
    fireEvent.pointerDown(el, { button: 0 });
    act(() => vi.advanceTimersByTime(200));
    fireEvent.pointerUp(el);
    fireEvent.click(el);
    act(() => vi.advanceTimersByTime(500));
    expect(onLong).not.toHaveBeenCalled();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('moving the finger (scrolling) cancels the press', () => {
    const onLong = vi.fn();
    render(<Probe onLong={onLong} onClick={vi.fn()} />);
    const el = screen.getByText('probe');
    fireEvent.pointerDown(el, { button: 0, clientX: 0, clientY: 0 });
    fireEvent.pointerMove(el, { clientX: 0, clientY: 30 });
    act(() => vi.advanceTimersByTime(600));
    expect(onLong).not.toHaveBeenCalled();
  });

  it('right click triggers it right away', () => {
    const onLong = vi.fn();
    render(<Probe onLong={onLong} onClick={vi.fn()} />);
    const el = screen.getByText('probe');
    fireEvent.pointerDown(el, { button: 2 });
    fireEvent.contextMenu(el);
    fireEvent.pointerDown(el, { button: 2 });
    fireEvent.contextMenu(el);
    expect(onLong).toHaveBeenCalledTimes(2);
  });

  it('the touch contextmenu after a fired long press does not fire twice', () => {
    const onLong = vi.fn();
    render(<Probe onLong={onLong} onClick={vi.fn()} />);
    const el = screen.getByText('probe');
    fireEvent.pointerDown(el, { button: 0 });
    act(() => vi.advanceTimersByTime(500));
    fireEvent.contextMenu(el);
    expect(onLong).toHaveBeenCalledTimes(1);
  });
});
