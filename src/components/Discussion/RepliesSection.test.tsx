// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const { navigateMock, createReplyMock, repliesRef } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  createReplyMock: vi.fn<() => Promise<boolean>>(),
  repliesRef: {
    current: [] as {
      id: string;
      userId: string;
      username: string;
      content: string;
      createdAt: number;
      likes: string[];
    }[],
  },
}));

vi.mock('react-router-dom', () => ({ useNavigate: () => navigateMock }));

vi.mock('../../contexts/ThemeContext', () => {
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

vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: { uid: 'viewer' } }) }));

vi.mock('firebase/compat/app', () => ({ default: { storage: () => ({}) } }));
vi.mock('firebase/compat/storage', () => ({}));

vi.mock('../../hooks/useDiscussions', () => ({
  useDiscussionReplies: () => ({
    replies: repliesRef.current,
    loading: false,
    createReply: createReplyMock,
    editReply: vi.fn().mockResolvedValue(true),
    deleteReply: vi.fn(),
    toggleReplyLike: vi.fn(),
  }),
}));

import { RepliesSection } from './RepliesSection';

beforeEach(() => {
  navigateMock.mockReset();
  createReplyMock.mockReset();
  createReplyMock.mockResolvedValue(true);
  repliesRef.current = [
    {
      id: 'r1',
      userId: 'other',
      username: 'Alice',
      content: 'A reply',
      createdAt: Date.now(),
      likes: [],
    },
  ];
});

afterEach(() => cleanup());

describe('RepliesSection', () => {
  it('renders the collapsed toggle with the reply count', () => {
    render(
      <RepliesSection discussionId="d1" discussionPath="discussions/series/1" replyCount={2} />
    );
    expect(screen.getByText('2 Antworten')).toBeInTheDocument();
    expect(screen.queryByText('A reply')).not.toBeInTheDocument();
  });

  it('expands to show replies and the new reply input', () => {
    render(
      <RepliesSection discussionId="d1" discussionPath="discussions/series/1" replyCount={2} />
    );
    fireEvent.click(screen.getByText('2 Antworten'));
    expect(screen.getByText('A reply')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Antwort schreiben...')).toBeInTheDocument();
  });

  it('submits a new reply via createReply', async () => {
    render(
      <RepliesSection discussionId="d1" discussionPath="discussions/series/1" replyCount={0} />
    );
    fireEvent.click(screen.getByText('Antworten'));
    fireEvent.change(screen.getByPlaceholderText('Antwort schreiben...'), {
      target: { value: 'My answer' },
    });
    // The Send button is the last button rendered in the reply input row.
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[buttons.length - 1]);
    await waitFor(() => expect(createReplyMock).toHaveBeenCalledWith('My answer', false));
  });

  it('disables the toggle interaction when spoiler-hidden', () => {
    render(
      <RepliesSection
        discussionId="d1"
        discussionPath="discussions/series/1"
        replyCount={2}
        isSpoilerHidden
      />
    );
    fireEvent.click(screen.getByText('2 Antworten'));
    // Still collapsed: reply content must not appear.
    expect(screen.queryByText('A reply')).not.toBeInTheDocument();
  });
});
