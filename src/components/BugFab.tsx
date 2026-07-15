import { BugReport } from '@mui/icons-material';
import { memo } from 'react';
import { useNavigate } from 'react-router-dom';

export const BugFab = memo(() => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate('/bug-report?create=true')}
      aria-label="Bug melden"
      style={{
        position: 'fixed',
        bottom: '50%',
        right: '5px',
        width: '40px',
        height: '40px',
        minWidth: '40px',
        minHeight: '40px',
        padding: 0,
        borderRadius: '50%',
        border: 'none',
        background: 'rgba(239,68,68,0.08)',
        color: 'rgba(239,68,68,0.3)',
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
      <BugReport style={{ fontSize: 20 }} />
    </button>
  );
});

BugFab.displayName = 'BugFab';
