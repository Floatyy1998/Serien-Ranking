// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('../../contexts/ThemeContextDef', () => {
  const make = (): unknown =>
    new Proxy(() => '#3355ff', {
      get: (_t, prop) =>
        prop === Symbol.toPrimitive || prop === 'toString' || prop === 'valueOf'
          ? () => '#3355ff'
          : make(),
    });
  return { useTheme: () => ({ currentTheme: make() }) };
});

import { SectionToggleCard } from './SectionToggleCard';

afterEach(() => cleanup());

describe('SectionToggleCard', () => {
  it('renders a checkbox reflecting the checked state', () => {
    render(<SectionToggleCard checked onChange={vi.fn()} label="Held ausblenden" />);
    const box = screen.getByLabelText('Held ausblenden') as HTMLInputElement;
    expect(box).toBeChecked();
  });

  it('renders an unchecked checkbox when checked is false', () => {
    render(<SectionToggleCard checked={false} onChange={vi.fn()} label="Held einblenden" />);
    expect(screen.getByLabelText('Held einblenden')).not.toBeChecked();
  });

  it('calls onChange when toggled', () => {
    const onChange = vi.fn();
    render(<SectionToggleCard checked onChange={onChange} label="Held ausblenden" />);
    fireEvent.click(screen.getByLabelText('Held ausblenden'));
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
