import { motion } from 'framer-motion';
import React from 'react';
import type { useTheme } from '../../../contexts/ThemeContext';
import type { useAdminDashboardData } from '../useAdminDashboardData';

interface SessionItem {
  uid: string;
  platform: string;
  seriesName: string;
  season: number;
  episode: number;
  startTime: number;
  endTime: number;
  durationSec: number;
  progressPercent: number;
  abandoned: boolean;
  milestones: number[];
}

const PLATFORM_COLORS: Record<string, string> = {
  netflix: '#e50914',
  disneyplus: '#113ccf',
  disney: '#113ccf',
  prime: '#00a8e1',
  joyn: '#1eff00',
  paramount: '#0064ff',
  appletv: '#000000',
  crunchyroll: '#f47521',
  wow: '#6b2fa0',
  hbomax: '#b53dd1',
  adn: '#005599',
  unknown: '#666',
};

function platformColor(name: string): string {
  const lower = name.toLowerCase();
  return PLATFORM_COLORS[lower] || PLATFORM_COLORS.unknown;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hours}h ${remMins}m`;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface ExtensionSessionsListProps {
  sessions: SessionItem[];
  userProfiles: ReturnType<typeof useAdminDashboardData>['userProfiles'];
  cardBg: string;
  borderColor: string;
  theme: ReturnType<typeof useTheme>['currentTheme'];
}

export const ExtensionSessionsList = React.memo<ExtensionSessionsListProps>(
  ({ sessions, userProfiles, cardBg, borderColor, theme }) => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        style={{
          background: cardBg,
          backdropFilter: 'blur(28px)',
          border: `1px solid ${borderColor}`,
          borderRadius: 16,
          padding: 20,
        }}
      >
        <h3
          style={{
            margin: '0 0 16px',
            fontSize: 15,
            fontWeight: 700,
            color: theme.text.primary,
          }}
        >
          Sessions ({sessions.length})
        </h3>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            maxHeight: 400,
            overflowY: 'auto',
          }}
        >
          {sessions.map((s, i) => {
            const userName =
              userProfiles[s.uid]?.displayName ||
              userProfiles[s.uid]?.username ||
              (s.uid === 'undefined' ? 'Unbekannt' : s.uid.slice(0, 8));
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 12px',
                  borderRadius: 10,
                  background: `${theme.background.default}50`,
                  fontSize: 12,
                }}
              >
                <span
                  style={{
                    color: theme.text.muted,
                    fontSize: 10,
                    width: 40,
                    flexShrink: 0,
                  }}
                >
                  {formatTime(s.startTime)}
                </span>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: 6,
                    background: `${platformColor(s.platform)}30`,
                    color: platformColor(s.platform),
                    fontWeight: 700,
                    fontSize: 10,
                    textTransform: 'capitalize',
                    flexShrink: 0,
                  }}
                >
                  {s.platform}
                </span>
                <span
                  style={{
                    fontWeight: 600,
                    color: theme.text.primary,
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {s.seriesName}
                </span>
                <span style={{ color: theme.text.muted, flexShrink: 0 }}>
                  S{s.season}E{s.episode}
                </span>
                {s.durationSec > 0 && (
                  <span style={{ color: theme.text.muted, flexShrink: 0 }}>
                    {formatDuration(s.durationSec)}
                  </span>
                )}
                {s.progressPercent > 0 && (
                  <div
                    style={{
                      width: 50,
                      height: 6,
                      borderRadius: 3,
                      background: `${theme.text.muted}20`,
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(s.progressPercent, 100)}%`,
                        height: '100%',
                        borderRadius: 3,
                        background:
                          s.progressPercent > 80
                            ? '#00b894'
                            : s.progressPercent > 40
                              ? '#fdcb6e'
                              : '#ff6b6b',
                      }}
                    />
                  </div>
                )}
                {s.abandoned && (
                  <span
                    style={{
                      padding: '1px 5px',
                      borderRadius: 3,
                      background: `${theme.status.error}20`,
                      color: theme.status.error,
                      fontSize: 9,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    ABBRUCH
                  </span>
                )}
                <span
                  style={{
                    color: theme.text.muted,
                    fontSize: 10,
                    flexShrink: 0,
                  }}
                >
                  {userName}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  }
);

ExtensionSessionsList.displayName = 'ExtensionSessionsList';
