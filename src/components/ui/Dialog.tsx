import { Close } from '@mui/icons-material';
import { memo, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { IconButton } from './IconButton';

interface MobileDialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  }>;
}

export const Dialog = memo(
  ({ open, onClose, title, message, type = 'info', actions }: MobileDialogProps) => {
    const { currentTheme } = useTheme();
    const dialogRef = useRef<HTMLDivElement>(null);

    useFocusTrap(dialogRef, open, onClose);

    if (!open) return null;

    const getTypeColor = () => {
      switch (type) {
        case 'success':
          return currentTheme.status.success;
        case 'error':
          return currentTheme.status.error;
        case 'warning':
          return currentTheme.primary;
        default:
          return currentTheme.primary;
      }
    };

    return (
      <>
        {/* Backdrop */}
        <div
          onClick={onClose}
          aria-hidden="true"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 9998,
            animation: 'fadeIn 0.2s ease-out',
          }}
        />

        {/* Dialog */}
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'dialog-title' : undefined}
          aria-label={!title ? message.substring(0, 80) : undefined}
          aria-describedby="dialog-message"
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: currentTheme.background.paper,
            border: `1px solid ${currentTheme.border.default}`,
            borderRadius: '16px',
            padding: '24px',
            minWidth: '280px',
            maxWidth: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
            zIndex: 9999,
            animation: 'slideUp 0.3s ease-out',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '16px',
            }}
          >
            {title && (
              <h3
                id="dialog-title"
                style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: 600,
                  color: currentTheme.text.primary,
                  flex: 1,
                }}
              >
                {title}
              </h3>
            )}
            <IconButton
              icon={<Close style={{ fontSize: '20px' }} />}
              onClick={onClose}
              variant="transparent"
              size={32}
              tooltip="Schließen"
              style={{ marginLeft: 'auto', marginTop: '-4px', marginRight: '-4px' }}
            />
          </div>

          {/* Type indicator bar - only show for errors */}
          {type === 'error' && (
            <div
              aria-hidden="true"
              style={{
                height: '3px',
                background: getTypeColor(),
                borderRadius: '2px',
                marginBottom: '16px',
                marginLeft: '-24px',
                marginRight: '-24px',
              }}
            />
          )}

          {/* Message */}
          <p
            id="dialog-message"
            style={{
              margin: '0 0 20px 0',
              fontSize: '14px',
              lineHeight: 1.5,
              color: currentTheme.text.primary,
            }}
          >
            {message}
          </p>

          {/* Actions */}
          {actions && actions.length > 0 && (
            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
              }}
            >
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => {
                    action.onClick();
                    onClose();
                  }}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border:
                      action.variant === 'secondary'
                        ? `1px solid ${currentTheme.border.default}`
                        : 'none',
                    background:
                      action.variant === 'secondary'
                        ? 'transparent'
                        : type === 'error'
                          ? currentTheme.status.error
                          : currentTheme.primary,
                    color: action.variant === 'secondary' ? currentTheme.text.primary : 'white',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            transform: translate(-50%, -40%);
            opacity: 0;
          }
          to {
            transform: translate(-50%, -50%);
            opacity: 1;
          }
        }
      `}</style>
      </>
    );
  }
);

Dialog.displayName = 'Dialog';
