import { Close } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContextDef';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { scaleIn, tapScale } from '../../lib/motion';
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
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              aria-hidden="true"
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'var(--blur-sm)',
                WebkitBackdropFilter: 'var(--blur-sm)',
                zIndex: 'var(--z-modal-backdrop)' as string,
              }}
            />

            {/* Dialog */}
            <motion.div
              ref={dialogRef}
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              exit="exit"
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
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 'var(--radius-xl)',
                padding: '24px',
                minWidth: '280px',
                maxWidth: '90%',
                maxHeight: '80vh',
                overflow: 'auto',
                boxShadow: 'var(--shadow-cinematic)',
                zIndex: 'var(--z-modal)' as string,
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
                  fontSize: '15px',
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
                    <motion.button
                      key={index}
                      whileTap={tapScale}
                      onClick={() => {
                        action.onClick();
                        onClose();
                      }}
                      style={{
                        padding: '10px 20px',
                        borderRadius: 'var(--radius-sm)',
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
                        fontSize: '15px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'background 0.2s ease',
                      }}
                    >
                      {action.label}
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }
);

Dialog.displayName = 'Dialog';
