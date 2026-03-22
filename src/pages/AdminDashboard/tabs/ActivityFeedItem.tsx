import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';
import type { useTheme } from '../../../contexts/ThemeContext';
import type { useAdminDashboardData } from '../useAdminDashboardData';
import {
  EVENT_CONFIG,
  formatDateLabel,
  formatDateTime,
  getSourceBadge,
  type RawEvent,
} from './ActivityEventConfig';

interface ActivityFeedProps {
  groupedEvents: Map<string, RawEvent[]>;
  filteredEvents: RawEvent[];
  userProfiles: ReturnType<typeof useAdminDashboardData>['userProfiles'];
  range: number;
  cardBg: string;
  borderColor: string;
  theme: ReturnType<typeof useTheme>['currentTheme'];
  loading: boolean;
}

export const ActivityFeed = React.memo<ActivityFeedProps>(
  ({ groupedEvents, filteredEvents, userProfiles, range, cardBg, borderColor, theme, loading }) => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: 60, color: theme.text.muted }}>
          Lade Activity-Feed...
        </div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: cardBg,
          backdropFilter: 'blur(28px)',
          border: `1px solid ${borderColor}`,
          borderRadius: 16,
          padding: '8px 0',
          maxHeight: 650,
          overflowY: 'auto',
        }}
      >
        {filteredEvents.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: 40,
              color: theme.text.muted,
              fontSize: 13,
            }}
          >
            Keine Events fuer diesen Zeitraum
          </div>
        ) : (
          <>
            {[...groupedEvents.entries()].map(([dateKey, events]) => (
              <div key={dateKey}>
                {/* Date header */}
                <div
                  style={{
                    padding: '10px 20px 6px',
                    fontSize: 11,
                    fontWeight: 700,
                    color: theme.text.muted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    borderBottom: `1px solid ${borderColor}20`,
                    position: 'sticky',
                    top: 0,
                    background: cardBg,
                    backdropFilter: 'blur(28px)',
                    zIndex: 1,
                  }}
                >
                  {formatDateLabel(dateKey)}
                  <span
                    style={{
                      marginLeft: 8,
                      fontSize: 10,
                      fontWeight: 500,
                      color: `${theme.text.muted}80`,
                    }}
                  >
                    {events.length} Events
                  </span>
                </div>

                <AnimatePresence initial={false}>
                  {events.map((ev, i) => {
                    const config = EVENT_CONFIG[ev.e];
                    if (!config) return null;
                    const detail = config.getDetail(ev.p);
                    const userName =
                      userProfiles[ev.uid]?.displayName ||
                      userProfiles[ev.uid]?.username ||
                      (ev.uid === 'undefined' ? 'Unbekannt' : ev.uid.slice(0, 8));
                    const photoURL = userProfiles[ev.uid]?.photoURL;
                    const sourceBadge = getSourceBadge(ev);
                    const dt = formatDateTime(ev.t);

                    return (
                      <motion.div
                        key={`${ev.t}-${ev.uid}-${i}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: Math.min(i * 0.015, 0.4) }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '9px 20px',
                          borderBottom: `1px solid ${borderColor}10`,
                          transition: 'background 0.15s',
                        }}
                        whileHover={{
                          backgroundColor: `${theme.background.default}40`,
                        }}
                      >
                        {/* Time */}
                        <div
                          style={{
                            flexShrink: 0,
                            width: 58,
                            textAlign: 'right',
                          }}
                        >
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: theme.text.secondary,
                              fontFamily: 'monospace',
                              letterSpacing: '-0.02em',
                            }}
                          >
                            {dt.time}
                          </div>
                          {range > 1 && (
                            <div
                              style={{
                                fontSize: 8,
                                color: `${theme.text.muted}90`,
                                fontFamily: 'monospace',
                              }}
                            >
                              {dt.date}
                            </div>
                          )}
                        </div>

                        {/* Icon */}
                        <div
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 8,
                            background: `${config.color}15`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: config.color,
                            flexShrink: 0,
                          }}
                        >
                          {config.icon}
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: theme.text.primary,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            <span
                              style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {detail || config.label}
                            </span>
                            {sourceBadge && (
                              <span
                                style={{
                                  fontSize: 9,
                                  fontWeight: 700,
                                  padding: '1px 6px',
                                  borderRadius: 6,
                                  background: `${sourceBadge.color}18`,
                                  color: sourceBadge.color,
                                  border: `1px solid ${sourceBadge.color}30`,
                                  flexShrink: 0,
                                  letterSpacing: '0.02em',
                                }}
                              >
                                {sourceBadge.label}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 10, color: theme.text.muted }}>
                            {config.label}
                          </div>
                        </div>

                        {/* User */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            flexShrink: 0,
                          }}
                        >
                          {photoURL ? (
                            <img
                              src={photoURL}
                              alt=""
                              style={{
                                width: 20,
                                height: 20,
                                borderRadius: '50%',
                                objectFit: 'cover',
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: 20,
                                height: 20,
                                borderRadius: '50%',
                                background: `${theme.primary}25`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 9,
                                fontWeight: 700,
                                color: theme.primary,
                              }}
                            >
                              {userName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span
                            style={{
                              fontSize: 11,
                              color: theme.text.secondary,
                              fontWeight: 500,
                            }}
                          >
                            {userName}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            ))}
          </>
        )}
      </motion.div>
    );
  }
);

ActivityFeed.displayName = 'ActivityFeed';
