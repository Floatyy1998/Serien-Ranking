import ReplyRounded from '@mui/icons-material/ReplyRounded';
import { useRef } from 'react';
import { hapticTap } from '../../lib/interaction/haptics';
import { t } from '../../services/i18n';

const TRIGGER_PX = 56;
const MAX_PX = 84;
/** Wer länger hält, markiert Text — dann ist es kein Wischen. */
const LONG_PRESS_MS = 350;

interface Gesture {
  id: number;
  x: number;
  y: number;
  startedAt: number;
  dragging: boolean;
  armed: boolean;
}

export const ChatSwipeRow = ({
  cont,
  onReply,
  children,
}: {
  cont: boolean;
  onReply: () => void;
  children: React.ReactNode;
}) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const swallowClick = useRef(false);

  const paint = (offset: number, armed: boolean, settle = false) => {
    const row = rowRef.current;
    const icon = iconRef.current;
    if (!row || !icon) return;
    row.style.transition = settle ? 'transform 0.22s ease' : 'none';
    row.style.transform = offset ? `translateX(${offset}px)` : '';
    icon.style.transition = settle ? 'opacity 0.2s ease' : '';
    icon.style.opacity = String(Math.min(1, offset / TRIGGER_PX));
    icon.classList.toggle('is-armed', armed);
  };

  const end = (commit: boolean) => {
    const g = gesture.current;
    gesture.current = null;
    if (!g?.dragging) return;
    // Der Klick nach dem Loslassen darf weder Bild noch Folge öffnen
    swallowClick.current = true;
    window.setTimeout(() => (swallowClick.current = false), 400);
    paint(0, false, true);
    if (commit && g.armed) onReply();
  };

  return (
    <div
      ref={rowRef}
      className={`ch-bubble-row${cont ? ' ch-bubble-row--cont' : ''}`}
      onPointerDown={(e) => {
        if (e.pointerType === 'mouse' || !e.isPrimary) return;
        if ((e.target as HTMLElement).closest('.ch-reply-btn')) return;
        swallowClick.current = false;
        gesture.current = {
          id: e.pointerId,
          x: e.clientX,
          y: e.clientY,
          startedAt: Date.now(),
          dragging: false,
          armed: false,
        };
      }}
      onPointerMove={(e) => {
        const g = gesture.current;
        if (!g || e.pointerId !== g.id) return;
        const dx = e.clientX - g.x;
        const dy = e.clientY - g.y;
        if (!g.dragging) {
          if (Math.abs(dy) > 10 && Math.abs(dy) >= Math.abs(dx)) {
            gesture.current = null;
            return;
          }
          if (dx < 12 || dx < Math.abs(dy) * 1.5) return;
          if (Date.now() - g.startedAt > LONG_PRESS_MS || window.getSelection()?.toString()) {
            gesture.current = null;
            return;
          }
          g.dragging = true;
          rowRef.current?.setPointerCapture?.(e.pointerId);
        }
        const pull = Math.max(0, dx);
        const offset =
          pull > TRIGGER_PX ? Math.min(MAX_PX, TRIGGER_PX + (pull - TRIGGER_PX) * 0.3) : pull;
        const armed = offset >= TRIGGER_PX;
        if (armed && !g.armed) hapticTap();
        g.armed = armed;
        paint(offset, armed);
      }}
      onPointerUp={() => end(true)}
      onPointerCancel={() => end(false)}
      onClickCapture={(e) => {
        if (!swallowClick.current) return;
        swallowClick.current = false;
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <span ref={iconRef} className="ch-swipe-icon" aria-hidden>
        <ReplyRounded />
      </span>
      {children}
      <button
        type="button"
        className="ch-reply-btn"
        onClick={onReply}
        aria-label={t('Antworten')}
        title={t('Antworten')}
      >
        <ReplyRounded />
      </button>
    </div>
  );
};
