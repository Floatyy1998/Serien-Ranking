/**
 * RequestsTab - Incoming and sent friend requests
 */

import Cancel from '@mui/icons-material/Cancel';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Person from '@mui/icons-material/Person';
import PersonAdd from '@mui/icons-material/PersonAdd';
import { motion } from 'framer-motion';
import { useTheme } from '../../../contexts/ThemeContext';
import { useActivityGrouping } from '../useActivityGrouping';
import type { FirebaseUserProfile } from '../types';
import type { FriendRequest } from '../../../types/Friend';

interface RequestsTabProps {
  friendRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  requestProfiles: Record<string, FirebaseUserProfile>;
  acceptFriendRequest: (id: string) => void;
  declineFriendRequest: (id: string) => void;
  cancelFriendRequest: (id: string) => void;
}

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

  return (
    <motion.div
      key="requests"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      {friendRequests.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h2
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color: currentTheme.text.muted,
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Eingehende Anfragen
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {friendRequests.map((request, index) => {
              const requestProfile = requestProfiles[request.fromUserId] || {};
              return (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px',
                    background: `linear-gradient(135deg, ${currentTheme.primary}10, ${currentTheme.primary}05)`,
                    border: `1px solid ${currentTheme.primary}30`,
                    borderRadius: '14px',
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      ...(requestProfile.photoURL
                        ? {
                            backgroundImage: `url("${requestProfile.photoURL}")`,
                            backgroundPosition: 'center',
                            backgroundSize: 'cover',
                          }
                        : {
                            background: `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`,
                          }),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {!requestProfile.photoURL && (
                      <Person style={{ fontSize: '22px', color: 'white' }} />
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <h3
                      style={{
                        fontSize: '15px',
                        fontWeight: 600,
                        margin: 0,
                        color: currentTheme.text.primary,
                      }}
                    >
                      {requestProfile.displayName || request.fromUsername}
                    </h3>
                    <p
                      style={{
                        fontSize: '13px',
                        color: currentTheme.text.muted,
                        margin: 0,
                      }}
                    >
                      {formatTimeAgo(request.timestamp || request.sentAt || Date.now())}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => acceptFriendRequest(request.id)}
                      style={{
                        padding: '10px',
                        background: `linear-gradient(135deg, ${currentTheme.status.success}, #22c55e)`,
                        border: 'none',
                        borderRadius: '10px',
                        color: 'white',
                        cursor: 'pointer',
                      }}
                    >
                      <CheckCircle style={{ fontSize: '20px' }} />
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => declineFriendRequest(request.id)}
                      style={{
                        padding: '10px',
                        background: `linear-gradient(135deg, ${currentTheme.status.error}, #ef4444)`,
                        border: 'none',
                        borderRadius: '10px',
                        color: 'white',
                        cursor: 'pointer',
                      }}
                    >
                      <Cancel style={{ fontSize: '20px' }} />
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {sentRequests.length > 0 && (
        <div>
          <h2
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color: currentTheme.text.muted,
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Gesendete Anfragen
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sentRequests.map((request) => (
              <div
                key={request.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px',
                  background: currentTheme.background.surface,
                  border: `1px solid ${currentTheme.border.default}`,
                  borderRadius: '14px',
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: `${currentTheme.text.muted}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Person style={{ fontSize: '22px', color: currentTheme.text.muted }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3
                    style={{
                      fontSize: '15px',
                      fontWeight: 600,
                      margin: 0,
                      color: currentTheme.text.primary,
                    }}
                  >
                    {request.toUsername}
                  </h3>
                  <p
                    style={{
                      fontSize: '13px',
                      color: currentTheme.text.muted,
                      margin: 0,
                    }}
                  >
                    Ausstehend
                  </p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => cancelFriendRequest(request.id)}
                  style={{
                    padding: '10px',
                    background: currentTheme.background.default,
                    border: `1px solid ${currentTheme.border.default}`,
                    borderRadius: '10px',
                    color: currentTheme.text.secondary,
                    cursor: 'pointer',
                  }}
                >
                  <Cancel style={{ fontSize: '20px' }} />
                </motion.button>
              </div>
            ))}
          </div>
        </div>
      )}

      {friendRequests.length === 0 && sentRequests.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ textAlign: 'center', padding: '60px 20px' }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 20px',
              borderRadius: '50%',
              background: `${currentTheme.text.muted}10`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PersonAdd style={{ fontSize: '40px', color: currentTheme.text.muted }} />
          </div>
          <h2
            style={{
              margin: '0 0 8px',
              fontSize: '18px',
              fontWeight: 700,
              color: currentTheme.text.primary,
            }}
          >
            Keine offenen Anfragen
          </h2>
        </motion.div>
      )}
    </motion.div>
  );
};
