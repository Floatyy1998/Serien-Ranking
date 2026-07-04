// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('../../contexts/ThemeContextDef', () => {
  const make = (): unknown =>
    new Proxy(() => '#3355ff', {
      get: (_t, prop) => {
        if (prop === Symbol.toPrimitive || prop === 'toString' || prop === 'valueOf')
          return () => '#3355ff';
        return make();
      },
    });
  return { useTheme: () => ({ currentTheme: make() }) };
});

import { DiscussionActions } from './DiscussionActions';

afterEach(() => cleanup());

const baseProps = {
  isOwner: false,
  isSpoiler: false,
  currentUserId: 'user-1',
  showDeleteConfirm: false,
  setShowDeleteConfirm: vi.fn(),
  showSpoilerConfirm: false,
  setShowSpoilerConfirm: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onFlagAsSpoiler: vi.fn(),
};

describe('DiscussionActions', () => {
  it('shows the spoiler-flag button for a non-owner and triggers the confirm toggle', () => {
    const setShowSpoilerConfirm = vi.fn();
    render(<DiscussionActions {...baseProps} setShowSpoilerConfirm={setShowSpoilerConfirm} />);
    const btn = screen.getByRole('button', { name: 'Als Spoiler melden' });
    fireEvent.click(btn);
    expect(setShowSpoilerConfirm).toHaveBeenCalledWith(true);
  });

  it('renders edit + delete buttons for the owner', () => {
    render(<DiscussionActions {...baseProps} isOwner />);
    expect(screen.getByRole('button', { name: 'Bearbeiten' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Löschen' })).toBeInTheDocument();
  });

  it('confirming deletion invokes onDelete', () => {
    const onDelete = vi.fn();
    render(<DiscussionActions {...baseProps} isOwner showDeleteConfirm onDelete={onDelete} />);
    fireEvent.click(screen.getByText('Ja'));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('confirming spoiler flag invokes onFlagAsSpoiler', () => {
    const onFlagAsSpoiler = vi.fn();
    render(
      <DiscussionActions {...baseProps} showSpoilerConfirm onFlagAsSpoiler={onFlagAsSpoiler} />
    );
    expect(screen.getByText('Spoiler?')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Ja'));
    expect(onFlagAsSpoiler).toHaveBeenCalledTimes(1);
  });
});
