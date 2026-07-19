import {
  CheckCircleRounded,
  Close,
  ErrorOutlineRounded,
  InfoRounded,
  WarningAmberRounded,
} from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { scaleIn, tapScale } from '../../lib/motion';
import { getOptimalTextColor } from '../../theme/colorUtils';
import { t } from '../../services/i18n';
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
    /** `danger` = destruktiv (roter Button), z. B. „Löschen". */
    variant?: 'primary' | 'secondary' | 'danger';
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
          return currentTheme.status.warning || currentTheme.status.error;
        default:
          return currentTheme.primary;
      }
    };
    const typeColor = getTypeColor() || currentTheme.primary;

    const TypeIcon =
      type === 'success'
        ? CheckCircleRounded
        : type === 'error'
          ? ErrorOutlineRounded
          : type === 'warning'
            ? WarningAmberRounded
            : InfoRounded;

    // Portal an document.body: sonst macht ein transformierter Vorfahre (framer-
    // Page-Wrapper) aus position:fixed einen Bezug auf den Container statt aufs
    // Viewport → der Dialog wäre nicht zentriert / halb abgeschnitten.
    return createPortal(
      <AnimatePresence>
        {open && (
          // Backdrop = fixed Flex-Container, der den Dialog zentriert (Flexbox
          // statt translate(-50%,-50%), weil framer/scaleIn das transform des
          // Dialogs steuert und ein inline-translate überschreiben würde →
          // Dialog landete sonst unten-rechts).
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              background: 'var(--overlay-backdrop)',
              backdropFilter: 'var(--blur-sm)',
              WebkitBackdropFilter: 'var(--blur-sm)',
              zIndex: 'var(--z-modal)' as string,
            }}
          >
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
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '400px',
                maxHeight: '85vh',
                overflowY: 'auto',
                background: currentTheme.background.paper,
                border: '1px solid var(--glass-border-light)',
                borderRadius: 'var(--radius-xl)',
                padding: '24px',
                boxShadow: 'var(--shadow-cinematic)',
              }}
            >
              {/* Close */}
              <IconButton
                icon={<Close style={{ fontSize: '20px' }} />}
                onClick={onClose}
                variant="transparent"
                size={32}
                tooltip={t('Schließen')}
                style={{ position: 'absolute', top: '14px', right: '14px' }}
              />

              {/* Header: Typ-Icon + Titel + Nachricht */}
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div
                  aria-hidden="true"
                  style={{
                    width: '46px',
                    height: '46px',
                    flexShrink: 0,
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `${typeColor}22`,
                    color: typeColor,
                    boxShadow: `inset 0 0 0 1px ${typeColor}33`,
                  }}
                >
                  <TypeIcon style={{ fontSize: '26px' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0, paddingRight: '24px' }}>
                  {title && (
                    <h3
                      id="dialog-title"
                      style={{
                        margin: '3px 0 0',
                        fontSize: '18px',
                        fontWeight: 700,
                        lineHeight: 1.25,
                        color: currentTheme.text.primary,
                      }}
                    >
                      {title}
                    </h3>
                  )}
                  <p
                    id="dialog-message"
                    style={{
                      margin: title ? '8px 0 0' : '3px 0 0',
                      fontSize: '15px',
                      lineHeight: 1.55,
                      color: currentTheme.text.secondary,
                    }}
                  >
                    {message}
                  </p>
                </div>
              </div>

              {/* Actions */}
              {actions && actions.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    gap: '10px',
                    justifyContent: 'flex-end',
                    marginTop: '24px',
                  }}
                >
                  {actions.map((action, index) => {
                    const isSecondary = action.variant === 'secondary';
                    const useDanger = action.variant === 'danger' || type === 'error';
                    const solidBg = useDanger ? currentTheme.status.error : currentTheme.primary;
                    return (
                      <motion.button
                        key={index}
                        whileTap={tapScale}
                        onClick={() => {
                          action.onClick();
                          onClose();
                        }}
                        style={{
                          minHeight: '44px',
                          padding: '0 22px',
                          borderRadius: 'var(--radius-md)',
                          border: isSecondary ? `1px solid ${currentTheme.border.default}` : 'none',
                          background: isSecondary ? 'transparent' : solidBg,
                          color: isSecondary
                            ? currentTheme.text.primary
                            : useDanger
                              ? '#fff'
                              : getOptimalTextColor(currentTheme.primary),
                          fontSize: '15px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'transform 0.12s ease, opacity 0.2s ease',
                        }}
                      >
                        {action.label}
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    );
  }
);

Dialog.displayName = 'Dialog';
