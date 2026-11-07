import { describe, expect, it } from 'vitest';
import type { BugTicket, TicketComment } from '../../../BugReport/types';
import { buildThread, matchesQueue, mergeOrder, needsReply, pendingChanges } from './ticketQueue';

const comment = (id: string, isAdmin: boolean, createdAt: string): TicketComment => ({
  id,
  authorUid: isAdmin ? 'admin' : 'u',
  authorName: isAdmin ? 'Admin' : 'Nutzer',
  isAdmin,
  text: id,
  createdAt,
});

const base = (extra: Partial<BugTicket> = {}): BugTicket => ({
  id: 't',
  ticketType: 'bug',
  title: 'T',
  description: '',
  stepsToReproduce: '',
  screenshots: [],
  status: 'open',
  priority: 'low',
  createdBy: 'u',
  createdByName: 'Nutzer',
  createdAt: '2026-11-01T00:00:00Z',
  updatedAt: '2026-11-01T00:00:00Z',
  comments: {},
  ...extra,
});

describe('ticketQueue', () => {
  it('needsReply: offen ohne Antwort oder Nutzer hat zuletzt geschrieben', () => {
    expect(needsReply(base())).toBe(true);
    expect(needsReply(base({ status: 'in-progress' }))).toBe(false);
    expect(
      needsReply(
        base({
          comments: {
            a: comment('a', true, '2026-11-02T00:00:00Z'),
            b: comment('b', false, '2026-11-03T00:00:00Z'),
          },
        })
      )
    ).toBe(true);
    expect(needsReply(base({ comments: { a: comment('a', true, '2026-11-02T00:00:00Z') } }))).toBe(
      false
    );
    expect(needsReply(base({ status: 'done' }))).toBe(false);
  });

  it('zählt Altbestand "closed" als erledigt', () => {
    const legacy = base({ status: 'closed' });
    expect(matchesQueue(legacy, 'done')).toBe(true);
    expect(matchesQueue(legacy, 'inbox')).toBe(false);
  });

  it('mischt Kommentare und Notizen chronologisch', () => {
    const thread = buildThread(
      base({
        comments: { a: comment('a', false, '2026-11-03T00:00:00Z') },
        adminNotes: { n: comment('n', true, '2026-11-02T00:00:00Z') },
      })
    );
    expect(thread.map((e) => `${e.kind}:${e.id}`)).toEqual(['note:n', 'comment:a']);
  });

  it('mergeOrder hält Positionen, fügt Neues oben an, wirft Gelöschtes raus', () => {
    const order = ['b', 'a', 'c'];
    const seen = new Set(['a', 'b', 'c']);
    expect(mergeOrder(order, seen, ['a', 'b'], new Set(['a', 'b', 'c']))).toBe(order);
    expect(mergeOrder(order, seen, ['d', 'a', 'b'], new Set(['a', 'b', 'd']))).toEqual([
      'd',
      'b',
      'a',
    ]);
    expect(pendingChanges(order, ['a', 'b', 'e'])).toBe(2);
  });
});
