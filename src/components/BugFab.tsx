import { BugReport } from '@mui/icons-material';
import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { stashBugContext, stashPageShot } from '../services/errorReporting/bugContext';
import { capturePageShot } from '../services/errorReporting/pageShot';
import { t } from '../services/i18n';
import { currentScroller } from './layout/pageScroller';

export const BugFab = memo(() => {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  return (
    <button
      data-no-shot=""
      onClick={async () => {
        if (busy) return;
        setBusy(true);
        const scroller = currentScroller();
        stashBugContext(scroller?.scrollTop);
        stashPageShot(await capturePageShot(scroller));
        setBusy(false);
        navigate('/bug-report?create=true');
      }}
      aria-label={t('Bug melden')}
      aria-busy={busy}
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
        background: busy ? 'rgba(239,68,68,0.28)' : 'rgba(239,68,68,0.10)',
        color: busy ? 'rgba(239,68,68,0.9)' : 'rgba(239,68,68,0.35)',
        cursor: busy ? 'progress' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        backdropFilter: 'var(--blur-sm)',
        WebkitBackdropFilter: 'var(--blur-sm)',
        transition: 'background 0.2s, color 0.2s',
        overflow: 'hidden',
      }}
    >
      <BugReport style={{ fontSize: 16 }} />
    </button>
  );
});

BugFab.displayName = 'BugFab';
