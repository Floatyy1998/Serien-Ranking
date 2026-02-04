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
  return (
    <div
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
        style={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
          borderRadius: '16px',
          padding: '24px',
          maxWidth: '400px',
          width: '100%',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <h3
          style={{
            margin: '0 0 16px 0',
            fontSize: '18px',
            fontWeight: '600',
            textAlign: 'center',
          }}
        >
          Episode bearbeiten
        </h3>

        <p
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
        </div>
      </div>
    </div>
  );
};
