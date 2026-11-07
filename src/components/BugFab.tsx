import { BugReport } from '@mui/icons-material';
import { memo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { stashBugContext, stashPageShot } from '../services/errorReporting/bugContext';
import { canShootPage, capturePageShot } from '../services/errorReporting/pageShot';
import { t } from '../services/i18n';
import { currentScroller } from './layout/pageScroller';

export const BugFab = memo(() => {
  const navigate = useNavigate();
  const busy = useRef(false);
  return (
    <button
      onClick={async () => {
        if (busy.current) return;
        busy.current = true;
        stashBugContext(currentScroller()?.scrollTop);
        // Nur die native Aufnahme der Desktop-Hülle; sonst sofort weiter.
        if (canShootPage()) stashPageShot(await capturePageShot());
        busy.current = false;
        navigate('/bug-report?create=true');
      }}
      aria-label={t('Bug melden')}
      style={{
        // Schmale Lasche am Bildschirmrand statt runder Knopf mitten im
        // Inhalt: der runde Knopf ragte 45px weit hinein und ueberlappte die
        // Hinzufuegen-Knoepfe auf den Poster-Karten.
        position: 'fixed',
        bottom: '50%',
        right: 0,
        width: '22px',
        height: '46px',
        minWidth: '22px',
        minHeight: '46px',
        padding: 0,
        borderRadius: 'var(--radius-md) 0 0 var(--radius-md)',
        border: 'none',
        background: 'rgba(239,68,68,0.10)',
        color: 'rgba(239,68,68,0.35)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        backdropFilter: 'var(--blur-sm)',
        WebkitBackdropFilter: 'var(--blur-sm)',
        transition: 'opacity 0.2s',
        overflow: 'hidden',
      }}
    >
      <BugReport style={{ fontSize: 16 }} />
    </button>
  );
});

BugFab.displayName = 'BugFab';
