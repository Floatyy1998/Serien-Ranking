import { useState, type CSSProperties } from 'react';
import { useIsbnScanAvailable } from '../../hooks/books/useIsbnScanAvailable';
import { t } from '../../services/i18n';
import { IsbnScanner } from './IsbnScanner';

export const BarcodeScanIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M3 8V6a3 3 0 0 1 3-3h2M16 3h2a3 3 0 0 1 3 3v2M21 16v2a3 3 0 0 1-3 3h-2M8 21H6a3 3 0 0 1-3-3v-2"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
    />
    <g fill="currentColor">
      <rect x="6.6" y="7.5" width="1.5" height="9" rx="0.4" />
      <rect x="9.1" y="7.5" width="0.9" height="9" rx="0.4" />
      <rect x="11" y="7.5" width="2" height="9" rx="0.4" />
      <rect x="14" y="7.5" width="0.9" height="9" rx="0.4" />
      <rect x="15.9" y="7.5" width="1.5" height="9" rx="0.4" />
    </g>
  </svg>
);

interface IsbnScanButtonProps {
  onIsbn: (isbn: string) => void;
  onManual?: () => void;
  /** Blendet nur den Knopf aus — ein offener Scanner bleibt bis zum Schließen stehen. */
  hidden?: boolean;
  className?: string;
  style?: CSSProperties;
  iconSize?: number;
}

export const IsbnScanButton = ({
  onIsbn,
  onManual,
  hidden = false,
  className,
  style,
  iconSize = 22,
}: IsbnScanButtonProps) => {
  const available = useIsbnScanAvailable();
  const [open, setOpen] = useState(false);
  if (!available) return null;
  return (
    <>
      {!hidden && (
        <button
          type="button"
          className={className}
          style={style}
          onClick={() => setOpen(true)}
          aria-label={t('ISBN scannen')}
          title={t('ISBN scannen')}
        >
          <BarcodeScanIcon size={iconSize} />
        </button>
      )}
      <IsbnScanner
        open={open}
        onClose={() => setOpen(false)}
        onDetected={(isbn) => {
          setOpen(false);
          onIsbn(isbn);
        }}
        onManual={
          onManual
            ? () => {
                setOpen(false);
                onManual();
              }
            : undefined
        }
      />
    </>
  );
};
