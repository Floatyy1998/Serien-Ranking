import { describe, expect, it } from 'vitest';
import type { UnifiedNotification } from '../hooks/useUnifiedNotifications';
import { collapseThreads, groupByTime } from './notificationGroups';

const NOW = new Date(2026, 9, 15, 15, 0).getTime();
const HOUR = 3_600_000;

const notif = (id: string, hoursAgo: number, over: Partial<UnifiedNotification> = {}) =>
  ({
    id,
    kind: 'bug_ticket',
    title: 'Neuer Kommentar',
    message: id,
    timestamp: NOW - hoursAgo * HOUR,
    read: true,
    icon: 'feature',
    ...over,
  }) as UnifiedNotification;

describe('collapseThreads', () => {
  it('fasst Meldungen zum selben Ticket unter der neuesten zusammen', () => {
    const entries = collapseThreads([
      notif('a', 3, { groupKey: 'ticket:1' }),
      notif('b', 1, { groupKey: 'ticket:1', read: false }),
      notif('c', 2),
    ]);
    expect(entries.map((e) => e.item.id)).toEqual(['b', 'c']);
    expect(entries[0].items).toHaveLength(2);
    expect(entries[0].unread).toBe(true);
  });

  it('gilt als ungelesen, sobald eine ältere Meldung im Thread offen ist', () => {
    const [entry] = collapseThreads([
      notif('a', 1, { groupKey: 'ticket:1' }),
      notif('b', 5, { groupKey: 'ticket:1', read: false }),
    ]);
    expect(entry.item.id).toBe('a');
    expect(entry.unread).toBe(true);
  });
});

describe('groupByTime', () => {
  it('stellt Ungelesenes und offene Anfragen vor die Tagesabschnitte', () => {
    const groups = groupByTime(
      collapseThreads([
        notif('neu', 30, { read: false }),
        notif('anfrage', 50, { kind: 'request' }),
        notif('heute', 2),
        notif('gestern', 20),
        notif('woche', 24 * 4),
        notif('alt', 24 * 10),
      ]),
      NOW
    );
    expect(groups.map((g) => [g.bucket, g.entries.map((e) => e.item.id)])).toEqual([
      ['new', ['neu', 'anfrage']],
      ['today', ['heute']],
      ['yesterday', ['gestern']],
      ['week', ['woche']],
      ['older', ['alt']],
    ]);
  });

  it('kappt nur Gelesenes', () => {
    const groups = groupByTime(
      collapseThreads([notif('a', 1, { read: false }), notif('b', 2), notif('c', 3)]),
      NOW,
      1
    );
    expect(groups.flatMap((g) => g.entries.map((e) => e.item.id))).toEqual(['a', 'b']);
  });
});
