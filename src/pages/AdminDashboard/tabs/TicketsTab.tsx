import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { TicketDetail } from './tickets/TicketDetail';
import { TicketList } from './tickets/TicketList';
import { useTicketsData } from './tickets/useTicketsData';
import './tickets/ticketInbox.css';

const isTyping = (target: EventTarget | null): boolean => {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
};

/** Die Inbox füllt den Platz unter der klebenden Tab-Leiste; deren Höhe hängt vom Umbruch ab. */
function useStickyTop(ref: React.RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const el = ref.current;
    const bar = document.querySelector<HTMLElement>('.admin-tab-bar');
    if (!el || !bar) return;
    const apply = () => {
      const top = parseFloat(getComputedStyle(bar).top) || 0;
      el.style.setProperty('--tk-top', `${Math.round(top + bar.offsetHeight + 8)}px`);
    };
    apply();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(apply);
    observer.observe(bar);
    return () => observer.disconnect();
  }, [ref]);
}

export function TicketsTab() {
  const data = useTicketsData();
  const rootRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(() => Date.now());
  const { items, selectedId, setSelectedId } = data;

  useStickyTop(rootRef);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return;
      if (e.key === 'Escape') {
        setSelectedId(null);
        return;
      }
      if (e.key !== 'j' && e.key !== 'k') return;
      if (items.length === 0) return;
      const index = items.findIndex((item) => item.ticket.id === selectedId);
      const step = e.key === 'j' ? 1 : -1;
      const next = index < 0 ? 0 : Math.min(items.length - 1, Math.max(0, index + step));
      setSelectedId(items[next].ticket.id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [items, selectedId, setSelectedId]);

  if (data.loading) {
    return <div className="adm-empty">Laden...</div>;
  }

  return (
    <div ref={rootRef} className={`tk-inbox ${data.selected ? 'tk-inbox--detail' : ''}`}>
      <TicketList data={data} now={now} />
      <TicketDetail data={data} now={now} />
    </div>
  );
}
