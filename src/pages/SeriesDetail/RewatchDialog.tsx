import { Tooltip } from '@mui/material';
import { useRef } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import type { SeriesEpisode } from './types';

interface RewatchDialogProps {
  item: SeriesEpisode;
  onRewatch: (episode: SeriesEpisode) => void;
  onUnwatch: (episode: SeriesEpisode) => void;
  onClose: () => void;
}

export const RewatchDialog: React.FC<RewatchDialogProps> = ({
  item,
  onRewatch,
  onUnwatch,
  onClose,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, true, onClose);

  return (
    <div
      onClick={onClose}
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rewatch-dialog-title"
        aria-describedby="rewatch-dialog-desc"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
          borderRadius: '16px',
          padding: '24px',
          maxWidth: '400px',
          width: '100%',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <h2
          id="rewatch-dialog-title"
          style={{
            margin: '0 0 16px 0',
            fontSize: '18px',
            fontWeight: '600',
            textAlign: 'center',
          }}
        >
          Episode bearbeiten
        </h2>

        <p
          id="rewatch-dialog-desc"
          style={{
            margin: '0 0 24px 0',
            fontSize: '14px',
            opacity: 0.8,
            textAlign: 'center',
          }}
        >
          "{item.name}" wurde {item.watchCount}x gesehen.
          <br />
          <br />
          Was möchtest du tun?
        </p>

        <div
          style={{
            display: 'flex',
            gap: '12px',
            flexDirection: 'column',
          }}
        >
          <Tooltip title="Episode als erneut gesehen markieren" arrow>
            <button
              onClick={() => onRewatch(item)}
              style={{
                padding: '12px',
                background: 'linear-gradient(135deg, #00d4aa 0%, #00b4d8 100%)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Nochmal gesehen ({(item.watchCount || 1) + 1}x)
            </button>
          </Tooltip>

          <Tooltip title="Watch-Count reduzieren" arrow>
            <button
              onClick={() => onUnwatch(item)}
              style={{
                padding: '12px',
                background: 'rgba(255, 107, 107, 0.2)',
                border: '1px solid rgba(255, 107, 107, 0.4)',
                borderRadius: '8px',
                color: '#ff6b6b',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              {(item.watchCount ?? 0) > 2
                ? `Auf ${item.watchCount! - 1}x reduzieren`
                : (item.watchCount ?? 0) === 2
                  ? 'Auf 1x reduzieren'
                  : 'Als nicht gesehen markieren'}
            </button>
          </Tooltip>

          <Tooltip title="Dialog schließen" arrow>
            <button
              onClick={onClose}
              style={{
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Abbrechen
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};
