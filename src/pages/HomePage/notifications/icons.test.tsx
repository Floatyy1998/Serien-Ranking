// @vitest-environment jsdom
import { render, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { ThemeContextType } from '../../../contexts/ThemeContextDef';
import { getNotificationIcon, getNotificationIconBg } from './icons';

const theme = {
  primary: '#00d123',
  secondary: '#123456',
  accent: '#008a6e',
  status: { error: '#ef4444', warning: '#f59e0b', success: '#22c55e' },
  text: { muted: '#888888' },
} as unknown as ThemeContextType['currentTheme'];

afterEach(() => cleanup());

describe('getNotificationIcon', () => {
  it('returns a renderable icon element for a known key', () => {
    const { container } = render(<>{getNotificationIcon('tv', theme)}</>);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('falls back to a default icon for an unknown key', () => {
    const { container } = render(<>{getNotificationIcon('does-not-exist', theme)}</>);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});

describe('getNotificationIconBg', () => {
  it('builds a gradient using the mapped color for a known key', () => {
    const bg = getNotificationIconBg('person', theme);
    expect(bg).toContain('linear-gradient');
    expect(bg).toContain('#22c55e');
  });

  it('falls back to a primary-color gradient for an unknown key', () => {
    const bg = getNotificationIconBg('does-not-exist', theme);
    expect(bg).toContain('linear-gradient');
    expect(bg).toContain('#00d123');
  });
});
