/**
 * RequestsTab - Incoming and sent friend requests.
 */

import CheckRounded from '@mui/icons-material/CheckRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import MarkEmailReadRounded from '@mui/icons-material/MarkEmailReadRounded';
import PersonRounded from '@mui/icons-material/PersonRounded';
import ScheduleRounded from '@mui/icons-material/ScheduleRounded';
import { motion } from 'framer-motion';
import { useState, type ReactNode } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { EmptyState } from '../../../components/ui';
import { showUndoToast } from '../../../lib/toast';
import { useActivityGrouping } from '../useActivityGrouping';
import type { FirebaseUserProfile } from '../types';
import type { FriendRequest } from '../../../types/Friend';
import { tapScaleTight } from '../../../lib/motion';

interface RequestsTabProps {
  friendRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  requestProfiles: Record<string, FirebaseUserProfile>;
  acceptFriendRequest: (id: string) => void;
  declineFriendRequest: (id: string) => void;
  cancelFriendRequest: (id: string) => void;
}

const SectionLabel = ({ children, color }: { children: ReactNode; color: string }) => (
  <h2
    style={{
      fontSize: '12px',
      fontWeight: 800,
      color,
      margin: '0 0 12px',
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
    }}
  >
    {children}
  </h2>
);

export const RequestsTab = ({
  friendRequests,
  sentRequests,
  requestProfiles,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
}: RequestsTabProps) => {
  const { currentTheme } = useTheme();
  const { formatTimeAgo } = useActivityGrouping([]);

  // Anfragen, die gerade in einem Undo-Fenster stecken: sofort ausblenden, die
  // eigentliche (nicht umkehrbare) Löschung erfolgt erst beim Commit.
  const [pendingRemoval, setPendingRemoval] = useState<Set<string>>(new Set());

  const removeWithUndo = (id: string, label: string, commit: (id: string) => void) => {
    setPendingRemoval((prev) => new Set(prev).add(id));
    showUndoToast(label, {
      onUndo: () =>
        setPendingRemoval((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        }),
      onCommit: () => commit(id),
    });
  };

  const visibleIncoming = friendRequests.filter((r) => !pendingRemoval.has(r.id));
  const visibleSent = sentRequests.filter((r) => !pendingRemoval.has(r.id));

  const isEmpty = visibleIncoming.length === 0 && visibleSent.length === 0;

  if (isEmpty) {
    return (
      <motion.div
        key="requests"
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -16 }}
      >
        <EmptyState
          icon={<MarkEmailReadRounded style={{ fontSize: 'inherit' }} />}
          title="Keine offenen Anfragen"
          description="Hier siehst du eingehende und gesendete Freundschaftsanfragen."
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      key="requests"
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
    >
      {visibleIncoming.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <SectionLabel color={currentTheme.text.secondary}>
            Eingehend · {visibleIncoming.length}
          </SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {visibleIncoming.map((request, index) => {
              const profile = requestProfiles[request.fromUserId] || {};
              const name = profile.displayName || request.fromUsername || 'Unbekannt';
              return (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.05, 0.3) }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '13px 14px',
                    background: `linear-gradient(135deg, ${currentTheme.primary}12, ${currentTheme.background.surface})`,
                    border: `1px solid ${currentTheme.primary}33`,
                    borderRadius: '16px',
                  }}
                >
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      flexShrink: 0,
                      ...(profile.photoURL
                        ? {
                            backgroundImage: `url("${profile.photoURL}")`,
                            backgroundPosition: 'center',
                            backgroundSize: 'cover',
                          }
                        : {
                            background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                          }),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {!profile.photoURL && (
                      <PersonRounded
                        style={{ fontSize: '24px', color: currentTheme.text.secondary }}
                      />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3
                      style={{
                        fontSize: '15px',
                        fontWeight: 700,
                        margin: '0 0 2px',
                        color: currentTheme.text.secondary,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {name}
                    </h3>
                    <p style={{ fontSize: '13px', color: currentTheme.text.muted, margin: 0 }}>
                      möchte dein Freund sein ·{' '}
                      {formatTimeAgo(request.timestamp || request.sentAt || 0)}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <motion.button
                      whileTap={tapScaleTight}
                      onClick={() => acceptFriendRequest(request.id)}
                      aria-label="Annehmen"
                      style={{
                        width: '40px',
                        height: '40px',
                        background: `linear-gradient(135deg, ${currentTheme.status.success}, #22c55e)`,
                        border: 'none',
                        borderRadius: '12px',
                        color: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: `0 4px 12px ${currentTheme.status.success}44`,
                      }}
                    >
                      <CheckRounded style={{ fontSize: '22px' }} />
                    </motion.button>
                    <motion.button
                      whileTap={tapScaleTight}
                      onClick={() =>
                        removeWithUndo(request.id, 'Anfrage abgelehnt', declineFriendRequest)
                      }
                      aria-label="Ablehnen"
                      style={{
                        width: '40px',
                        height: '40px',
                        background: `${currentTheme.status.error}14`,
                        border: 'none',
                        borderRadius: '12px',
                        color: currentTheme.status.error,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CloseRounded style={{ fontSize: '22px' }} />
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {visibleSent.length > 0 && (
        <div>
          <SectionLabel color={currentTheme.text.muted}>
            Gesendet · {visibleSent.length}
          </SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {visibleSent.map((request) => (
              <div
                key={request.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '13px 14px',
                  background: currentTheme.background.surface,
                  border: `1px solid ${currentTheme.border.default}`,
                  borderRadius: '16px',
                }}
              >
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    background: `${currentTheme.text.muted}1a`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <PersonRounded style={{ fontSize: '24px', color: currentTheme.text.muted }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3
                    style={{
                      fontSize: '15px',
                      fontWeight: 700,
                      margin: '0 0 2px',
                      color: currentTheme.text.secondary,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {request.toUsername}
                  </h3>
                  <p
                    style={{
                      fontSize: '13px',
                      color: currentTheme.text.muted,
                      margin: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <ScheduleRounded style={{ fontSize: '14px' }} />
                    Ausstehend
                  </p>
                </div>
                <motion.button
                  whileTap={tapScaleTight}
                  onClick={() =>
                    removeWithUndo(request.id, 'Anfrage zurückgezogen', cancelFriendRequest)
                  }
                  aria-label="Anfrage zurückziehen"
                  style={{
                    width: '40px',
                    height: '40px',
                    background: currentTheme.background.default,
                    border: `1px solid ${currentTheme.border.default}`,
                    borderRadius: '12px',
                    color: currentTheme.text.muted,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <CloseRounded style={{ fontSize: '20px' }} />
                </motion.button>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};
