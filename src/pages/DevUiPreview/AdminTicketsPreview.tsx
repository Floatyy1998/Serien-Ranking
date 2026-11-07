import type { CSSProperties } from 'react';
import { useMemo, useState } from 'react';
import type { BugTicket } from '../BugReport/types';
import { TicketDetail } from '../AdminDashboard/tabs/tickets/TicketDetail';
import { TicketList } from '../AdminDashboard/tabs/tickets/TicketList';
import { countQueues, matchesQueue } from '../AdminDashboard/tabs/tickets/ticketQueue';
import type { TicketsData } from '../AdminDashboard/tabs/tickets/useTicketsData';
import '../AdminDashboard/adminKit.css';
import '../AdminDashboard/AdminDashboardPage.css';
import '../AdminDashboard/tabs/tickets/ticketInbox.css';

const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

const msg = (id: string, isAdmin: boolean, text: string, minutes: number) => ({
  id,
  authorUid: isAdmin ? 'admin' : 'u1',
  authorName: isAdmin ? 'Konrad' : 'Lena',
  isAdmin,
  text,
  createdAt: ago(minutes),
});

const TICKETS: BugTicket[] = [
  {
    id: '-OaX1kd9fA2',
    ticketType: 'bug',
    title: 'Folge wird nach dem Abhaken wieder als ungesehen angezeigt',
    description:
      'Ich hake bei Severance S2E4 ab, nach ein paar Sekunden ist der Haken wieder weg. Passiert nur am Handy, am Laptop klappt es.',
    stepsToReproduce: '1. Serie öffnen\n2. Folge abhaken\n3. kurz warten',
    screenshots: [],
    status: 'in-progress',
    priority: 'high',
    createdBy: 'u1',
    createdByName: 'Lena',
    createdAt: ago(60 * 26),
    updatedAt: ago(12),
    comments: {
      a: msg('a', false, 'Passiert seit dem letzten Update.', 60 * 25),
      b: msg('b', true, 'Danke! Welches Handy nutzt du?', 60 * 20),
      c: msg('c', false, 'Pixel 8, App aus dem Play Store.', 60 * 19),
      d: msg('d', true, 'Kannst du einmal die App komplett schließen und neu öffnen?', 60 * 5),
      e: msg('e', false, 'Gemacht, ist leider immer noch so.', 30),
      f: msg('f', false, 'Jetzt auch bei einer zweiten Serie.', 12),
    },
    adminNotes: {
      n: msg('n', true, 'Vermutlich Delta-Sync: serienVersion wird nicht gebumpt.', 60 * 4),
    },
    device: 'Mozilla/5.0 (Linux; Android 15; Pixel 8)',
    context: {
      page: '/series/95396',
      pageTitle: 'Severance – TV-Rank',
      scrollY: 1240,
      capturedAt: ago(60 * 26),
      env: {
        route: '/series/95396',
        build: 'a1b2c3d',
        platform: 'android',
        language: 'de',
        userAgent: 'Mozilla/5.0 (Linux; Android 15; Pixel 8)',
        viewport: '412x915@2.6',
        online: true,
        connection: '4g down=9.4',
        sessionAgeMs: 184000,
        visibility: 'visible',
        sessionErrorCount: 1,
      },
      breadcrumbs: [
        { t: 170000, type: 'route', label: '/series/95396' },
        { t: 178000, type: 'click', label: 'button.ep-check' },
      ],
      network: [
        {
          t: 171000,
          method: 'GET',
          url: 'https://serienapi.konrad-dinges.de/catalog/seasons/95396.json',
          status: 200,
          ms: 84,
          via: 'fetch',
        },
        {
          t: 178500,
          method: 'POST',
          url: 'https://serienapi.konrad-dinges.de/add',
          status: 500,
          ms: 312,
          via: 'fetch',
        },
      ],
      console: [{ t: 178600, level: 'error', text: 'markWatched failed: 500' }],
    },
  },
  {
    id: '-OaWz82kQp1',
    ticketType: 'feature',
    title: 'Filter nach Streamingdienst in der Watchlist',
    description: 'Wäre cool, wenn man die Watchlist nach Netflix, Prime usw. filtern könnte.',
    stepsToReproduce: '',
    screenshots: [],
    status: 'open',
    priority: 'medium',
    createdBy: 'u2',
    createdByName: 'Mehmet',
    createdAt: ago(60 * 3),
    updatedAt: ago(60 * 3),
    comments: {},
  },
  {
    id: '-OaWa11xYt7',
    ticketType: 'bug',
    title: 'Kalender zeigt Folgen einen Tag zu früh',
    description: 'Bei Anime aus Japan steht im Kalender immer der Vortag.',
    stepsToReproduce: '',
    screenshots: [],
    status: 'open',
    priority: 'low',
    createdBy: 'u3',
    createdByName: 'Sophie',
    createdAt: ago(60 * 30),
    updatedAt: ago(60 * 2),
    comments: {
      a: msg('a', true, 'Schaue ich mir an!', 60 * 2),
    },
  },
  {
    id: '-OaV9e2pLm4',
    ticketType: 'bug',
    title: 'Profilbild lädt nicht',
    description: 'Seit gestern ist mein Avatar grau.',
    stepsToReproduce: '',
    screenshots: [],
    status: 'done',
    priority: 'low',
    createdBy: 'u4',
    createdByName: 'Jonas',
    createdAt: ago(60 * 50),
    updatedAt: ago(60 * 40),
    comments: {},
  },
];

export function AdminTicketsPreview() {
  const [selectedId, setSelectedId] = useState<string | null>(TICKETS[0].id);
  const [queue, setQueue] = useState<TicketsData['queue']>('inbox');
  const data = useMemo<TicketsData>(() => {
    const noop = async () => {};
    return {
      tickets: TICKETS,
      loading: false,
      items: TICKETS.filter((t) => matchesQueue(t, queue) || t.status === 'done').map((t) => ({
        ticket: t,
        stale: !matchesQueue(t, queue),
      })),
      counts: countQueues(TICKETS),
      pending: 1,
      refresh: () => {},
      selected: TICKETS.find((t) => t.id === selectedId) || null,
      selectedId,
      setSelectedId,
      queue,
      setQueue,
      typeFilter: 'all',
      setTypeFilter: () => {},
      searchQuery: '',
      setSearchQuery: () => {},
      sort: 'newest',
      setSort: () => {},
      updateTicket: noop,
      addAdminComment: noop,
      addAdminNote: noop,
      deleteTicket: noop,
    };
  }, [selectedId, queue]);
  const [now] = useState(() => Date.now());

  return (
    <div className="admin-content" style={{ paddingTop: 16 }}>
      <div
        className={`tk-inbox ${data.selected ? 'tk-inbox--detail' : ''}`}
        style={{ '--tk-top': '8px' } as CSSProperties}
      >
        <TicketList data={data} now={now} />
        <TicketDetail data={data} now={now} />
      </div>
    </div>
  );
}
