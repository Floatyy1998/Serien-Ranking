import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { currentScroller } from '../../../components/layout/pageScroller';
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

const NARROW = '(max-width: 899px)';

/**
 * Schmal sind Liste und Ticket zwei Ansichten auf derselben Seite: Ticket
 * öffnen springt an den Anfang, Zurück landet wieder an der alten Listenstelle.
 */
function useNarrowScroll(ref: React.RefObject<HTMLElement | null>, open: boolean) {
  const listScroll = useRef(0);
  const wasOpen = useRef(open);
  useLayoutEffect(() => {
    if (wasOpen.current === open) return;
    wasOpen.current = open;
    if (typeof window.matchMedia !== 'function' || !window.matchMedia(NARROW).matches) return;
    const el = ref.current;
    const scroller = currentScroller();
    if (!scroller) return;
    if (open) {
      listScroll.current = scroller.scrollTop;
      if (!el) return;
      const sticky = parseFloat(getComputedStyle(el).getPropertyValue('--tk-top')) || 0;
      const offset = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
      const target = Math.max(0, scroller.scrollTop + offset - sticky);
      if (scroller.scrollTop > target) scroller.scrollTo({ top: target, behavior: 'instant' });
    } else {
      scroller.scrollTo({ top: listScroll.current, behavior: 'instant' });
    }
  }, [ref, open]);
}

export function TicketsTab() {
  const data = useTicketsData();
  const rootRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(() => Date.now());
  const { items, selectedId, setSelectedId } = data;

  useStickyTop(rootRef);
  useNarrowScroll(rootRef, !!data.selected);

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
