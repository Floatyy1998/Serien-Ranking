import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import ReplyRounded from '@mui/icons-material/ReplyRounded';
import { useRef } from 'react';
import { hapticTap } from '../../lib/interaction/haptics';
import { t } from '../../services/i18n';

const TRIGGER_PX = 56;
const MAX_PX = 84;
/** Wer länger hält, markiert Text — dann ist es kein Wischen. */
const LONG_PRESS_MS = 350;
const MENU_PRESS_MS = 450;
const MENU_SLOP_PX = 10;

interface Gesture {
  id: number;
  x: number;
  y: number;
  lastX: number;
  lastY: number;
  startedAt: number;
  dragging: boolean;
  armed: boolean;
}

export const ChatSwipeRow = ({
  cont,
  canReply,
  onReply,
  onMenu,
  children,
}: {
  cont: boolean;
  canReply: boolean;
  onReply: () => void;
  onMenu: () => void;
  children: React.ReactNode;
}) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const swallowClick = useRef(false);
  const pressTimer = useRef(0);
  const pressFired = useRef(false);

  const cancelPress = () => window.clearTimeout(pressTimer.current);

  const swallowNextClick = () => {
    swallowClick.current = true;
    window.setTimeout(() => (swallowClick.current = false), 600);
  };

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
    swallowNextClick();
    paint(0, false, true);
    if (commit && g.armed) onReply();
  };

  return (
    <div
      ref={rowRef}
      className={`ch-bubble-row${cont ? ' ch-bubble-row--cont' : ''}`}
      onPointerDown={(e) => {
        if (e.pointerType === 'mouse' || !e.isPrimary) return;
        if ((e.target as HTMLElement).closest('.ch-hover-actions')) return;
        swallowClick.current = false;
        pressFired.current = false;
        cancelPress();
        const startX = e.clientX;
        const startY = e.clientY;
        pressTimer.current = window.setTimeout(() => {
          const g = gesture.current;
          if (g?.dragging) return;
          if (g && Math.hypot(g.lastX - startX, g.lastY - startY) > MENU_SLOP_PX) return;
          gesture.current = null;
          pressFired.current = true;
          swallowNextClick();
          hapticTap();
          onMenu();
        }, MENU_PRESS_MS);
        gesture.current = {
          id: e.pointerId,
          x: e.clientX,
          y: e.clientY,
          lastX: e.clientX,
          lastY: e.clientY,
          startedAt: Date.now(),
          dragging: false,
          armed: false,
        };
      }}
      onPointerMove={(e) => {
        const g = gesture.current;
        if (!g || e.pointerId !== g.id) return;
        g.lastX = e.clientX;
        g.lastY = e.clientY;
        const dx = e.clientX - g.x;
        const dy = e.clientY - g.y;
        if (Math.hypot(dx, dy) > MENU_SLOP_PX) cancelPress();
        if (!canReply) return;
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
      onPointerUp={() => {
        cancelPress();
        end(true);
      }}
      onPointerCancel={() => {
        cancelPress();
        end(false);
      }}
      onContextMenu={(e) => {
        // Markierter Text behält das native Menü (Kopieren am Desktop)
        if (window.getSelection()?.toString()) return;
        e.preventDefault();
        if (pressFired.current) return;
        onMenu();
      }}
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
      <span className="ch-hover-actions">
        {canReply && (
          <button
            type="button"
            className="ch-reply-btn"
            onClick={onReply}
            aria-label={t('Antworten')}
            title={t('Antworten')}
          >
            <ReplyRounded />
          </button>
        )}
        <button
          type="button"
          className="ch-reply-btn"
          onClick={onMenu}
          aria-label={t('Weitere Optionen')}
          title={t('Weitere Optionen')}
        >
          <ExpandMoreRounded />
        </button>
      </span>
    </div>
  );
};
