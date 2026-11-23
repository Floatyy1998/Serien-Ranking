// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { DEFAULT_VIEW_FILTERS } from '../../../lib/taste/discoverFilters';

const sheet = vi.hoisted(() => ({ dismiss: null as null | (() => void) }));
vi.mock('../../../components/ui/overlay/BottomSheet', () => ({
  BottomSheet: ({
    isOpen,
    onClose,
    children,
  }: {
    isOpen: boolean;
    onClose: () => void;
    children?: ReactNode;
  }) => {
    sheet.dismiss = onClose;
    return isOpen ? <div>{children}</div> : null;
  },
}));
vi.mock('../../../contexts/ThemeContext', () => {
  const make = (): unknown =>
    new Proxy(() => '#3355ff', {
      get: (_t, prop) =>
        prop === Symbol.toPrimitive || prop === 'toString' || prop === 'valueOf'
          ? () => '#3355ff'
          : make(),
    });
  return { useTheme: () => ({ currentTheme: make() }) };
});
vi.mock('@mui/icons-material/Block', () => ({ default: () => null }));
vi.mock('@mui/icons-material/Check', () => ({ default: () => null }));

import { DiscoverFilterSheet } from './DiscoverFilterSheet';

const setup = (over: Partial<React.ComponentProps<typeof DiscoverFilterSheet>> = {}) => {
  const props = {
    isOpen: true,
    onClose: vi.fn(),
    filters: DEFAULT_VIEW_FILTERS,
    onChange: vi.fn(),
    media: 'series' as const,
    showMatch: true,
    ...over,
  };
  const view = render(<DiscoverFilterSheet {...props} />);
  const inSection = (id: string) =>
    within(view.container.querySelector(`[data-section="${id}"]`) as HTMLElement);
  const genre = (label: string) =>
    inSection('genres').getByText(label).closest('button') as HTMLElement;
  const apply = () => fireEvent.click(view.container.querySelector('.df-done') as HTMLElement);
  return { props, inSection, genre, apply };
};

afterEach(() => cleanup());

describe('DiscoverFilterSheet', () => {
  it('cycles a genre through shown, hidden and off', () => {
    const { genre } = setup();
    expect(genre('Comedy')).toHaveAttribute('data-state', 'off');
    fireEvent.click(genre('Comedy'));
    expect(genre('Comedy')).toHaveAttribute('data-state', 'only');
    expect(genre('Comedy')).toHaveAttribute('aria-label', 'Comedy: wird gezeigt');
    fireEvent.click(genre('Comedy'));
    expect(genre('Comedy')).toHaveAttribute('data-state', 'hide');
    expect(genre('Comedy')).toHaveAttribute('aria-label', 'Comedy: ausgeblendet');
    fireEvent.click(genre('Comedy'));
    expect(genre('Comedy')).toHaveAttribute('data-state', 'off');
  });

  it('applies the whole choice only when the sheet closes', () => {
    const { props, genre, apply } = setup();
    fireEvent.click(genre('Comedy'));
    fireEvent.click(genre('Drama'));
    fireEvent.click(genre('Anime'));
    fireEvent.click(genre('Anime'));
    expect(props.onChange).not.toHaveBeenCalled();
    apply();
    expect(props.onChange).toHaveBeenCalledTimes(1);
    expect(props.onChange).toHaveBeenCalledWith({
      ...DEFAULT_VIEW_FILTERS,
      only: ['comedy', 'drama'],
      hide: ['anime'],
    });
    expect(props.onClose).toHaveBeenCalled();
  });

  it('also applies when the sheet is dismissed and stays quiet without changes', () => {
    const changed = setup();
    fireEvent.click(changed.inSection('rating').getByText('ab 8'));
    sheet.dismiss?.();
    expect(changed.props.onChange).toHaveBeenCalledWith({ ...DEFAULT_VIEW_FILTERS, minRating: 8 });
    cleanup();

    const untouched = setup();
    untouched.apply();
    expect(untouched.props.onChange).not.toHaveBeenCalled();
    expect(untouched.props.onClose).toHaveBeenCalled();
  });

  it('combines eras, e.g. 2000 until today, and treats all three as no limit', () => {
    const first = setup();
    fireEvent.click(first.inSection('era').getByText('2000–2015'));
    fireEvent.click(first.inSection('era').getByText('Ab 2016'));
    expect(first.inSection('era').getByText('Ab 2000')).toBeInTheDocument();
    first.apply();
    expect(first.props.onChange).toHaveBeenCalledWith({
      ...DEFAULT_VIEW_FILTERS,
      eras: ['mid', 'new'],
    });
    cleanup();

    const all = setup({ filters: { ...DEFAULT_VIEW_FILTERS, eras: ['mid', 'new'] } });
    fireEvent.click(all.inSection('era').getByText('Vor 2000'));
    all.apply();
    expect(all.props.onChange).toHaveBeenCalledWith(DEFAULT_VIEW_FILTERS);
  });

  it('sets the minimum match and names the number of filters on the button', () => {
    const { props, inSection, genre, apply } = setup();
    expect(screen.getByText('Fertig')).toBeInTheDocument();
    fireEvent.click(inSection('match').getByText('ab 80 %'));
    fireEvent.click(genre('Drama'));
    expect(screen.getByText('2 Filter anwenden')).toBeInTheDocument();
    apply();
    expect(props.onChange).toHaveBeenCalledWith({
      ...DEFAULT_VIEW_FILTERS,
      only: ['drama'],
      minMatch: 80,
    });
  });

  it('shows the match group only with a taste profile and genres per media type', () => {
    const { inSection } = setup({ showMatch: false, media: 'movie' });
    expect(screen.queryByText('Übereinstimmung')).toBeNull();
    expect(inSection('genres').queryByText('Reality')).toBeNull();
    expect(inSection('genres').getByText('Horror')).toBeInTheDocument();
  });

  it('resets everything and keeps reset disabled while nothing is set', () => {
    const empty = setup();
    expect(screen.getByText('Zurücksetzen')).toBeDisabled();
    cleanup();

    const { props, apply } = setup({
      filters: { ...DEFAULT_VIEW_FILTERS, eras: ['old'], only: ['drama'] },
    });
    fireEvent.click(screen.getByText('Zurücksetzen'));
    apply();
    expect(props.onChange).toHaveBeenCalledWith(DEFAULT_VIEW_FILTERS);
    expect(empty.props.onChange).not.toHaveBeenCalled();
  });
});
