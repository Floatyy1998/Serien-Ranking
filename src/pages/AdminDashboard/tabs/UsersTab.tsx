import { Circle } from '@mui/icons-material';
import { motion } from 'framer-motion';
import React, { useCallback, useMemo, useState } from 'react';
import type { useTheme } from '../../../contexts/ThemeContextDef';
import { DataTable } from '../components/DataTable';
import type { useAdminDashboardData } from '../useAdminDashboardData';
import { UserDeepDive } from './UserDeepDive';

interface UsersTabProps {
  data: ReturnType<typeof useAdminDashboardData>;
  theme: ReturnType<typeof useTheme>['currentTheme'];
}

interface RawEvent {
  e: string;
  p?: Record<string, unknown>;
  t: number;
}

function timeAgo(ts: number): string {
  if (!ts) return 'Nie';
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Gerade eben';
  if (mins < 60) return `Vor ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Vor ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Vor ${days}d`;
}

type UserItem = ReturnType<typeof useAdminDashboardData>['usersList'][number];

export const UsersTab = React.memo<UsersTabProps>(({ data, theme }) => {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userEvents, setUserEvents] = useState<RawEvent[]>([]);
  const [loadingUser, setLoadingUser] = useState(false);

  const handleRowClick = useCallback(
    async (user: UserItem) => {
      setSelectedUser(user.uid);
      setLoadingUser(true);
      const today = new Date().toISOString().slice(0, 10);
      const events = await data.loadUserEvents(user.uid, today);
      setUserEvents(events);
      setLoadingUser(false);
    },
    [data]
  );

  const columns = useMemo(
    () => [
      {
        key: 'user',
        label: 'User',
        render: (item: UserItem) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {item.photoURL ? (
              <img
                src={item.photoURL}
                alt=""
                style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' as const }}
              />
            ) : (
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: `${theme.primary}30`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  color: theme.primary,
                }}
              >
                {item.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{item.displayName}</div>
              {item.username && (
                <div style={{ fontSize: 11, color: theme.text.muted }}>@{item.username}</div>
              )}
            </div>
          </div>
        ),
        width: '200px',
      },
      {
        key: 'status',
        label: 'Status',
        render: (item: UserItem) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Circle
              style={{
                fontSize: 8,
                color: item.isOnline ? theme.status.success : theme.text.muted,
              }}
            />
            <span style={{ fontSize: 12 }}>
              {item.isOnline ? 'Online' : timeAgo(item.lastSeen)}
            </span>
          </div>
        ),
        sortValue: (item: UserItem) => item.lastSeen || 0,
      },
      {
        key: 'platform',
        label: 'Plattform',
        render: (item: UserItem) => (
          <span
            style={{
              fontSize: 11,
              padding: '2px 8px',
              borderRadius: 6,
              background:
                item.platform === 'both' ? `${theme.status.success}20` : `${theme.text.muted}15`,
              color: item.platform === 'both' ? theme.status.success : theme.text.secondary,
              fontWeight: 600,
            }}
          >
            {item.platform === 'both' ? 'Web + Ext' : item.platform || 'Web'}
          </span>
        ),
      },
      {
        key: 'joined',
        label: 'Dabei seit',
        render: (item: UserItem) =>
          item.firstSeen
            ? new Date(item.firstSeen).toLocaleDateString('de-DE', {
                day: '2-digit',
                month: 'short',
                year: '2-digit',
              })
            : '-',
        sortValue: (item: UserItem) => item.firstSeen || 0,
      },
    ],
    [theme]
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Stats bar */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <Stat label="Gesamt" value={data.usersList.length} theme={theme} />
        <Stat
          label="Online"
          value={data.usersList.filter((u) => u.isOnline).length}
          theme={theme}
          color={theme.status.success}
        />
        <Stat
          label="Extension"
          value={
            data.usersList.filter((u) => u.platform === 'both' || u.platform === 'extension').length
          }
          theme={theme}
          color="#f093fb"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: `${theme.background.surface}cc`,
          backdropFilter: 'blur(28px)',
          border: `1px solid ${theme.border.default}`,
          borderRadius: 16,
          padding: 16,
        }}
      >
        <DataTable
          data={data.usersList}
          columns={columns}
          searchKeys={(u) => `${u.displayName} ${u.username} ${u.uid}`}
          onRowClick={handleRowClick}
          theme={theme}
        />
      </motion.div>

      {/* User Deep-Dive */}
      {selectedUser && (
        <UserDeepDive
          selectedUser={selectedUser}
          userEvents={userEvents}
          loadingUser={loadingUser}
          userProfiles={data.userProfiles}
          theme={theme}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
});

UsersTab.displayName = 'UsersTab';

function Stat({
  label,
  value,
  theme,
  color,
}: {
  label: string;
  value: number;
  theme: ReturnType<typeof useTheme>['currentTheme'];
  color?: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 14px',
        borderRadius: 10,
        background: `${theme.background.surface}80`,
        border: `1px solid ${theme.border.default}`,
      }}
    >
      <span style={{ fontSize: 20, fontWeight: 800, color: color || theme.text.primary }}>
        {value}
      </span>
      <span style={{ fontSize: 12, color: theme.text.muted }}>{label}</span>
    </div>
  );
}
