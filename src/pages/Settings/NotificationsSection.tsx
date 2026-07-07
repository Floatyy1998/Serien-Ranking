/**
 * NotificationsSection - Benachrichtigungs-Schwellwerte und Toggles
 *
 * Steuert:
 * - Inaktivitäts-Schwellwert für die "Lange nicht geschaut"-Erinnerung
 * - Provider-Änderungs-Notifications an/aus
 */

import { NotificationsActive, SwapHoriz } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { memo, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  DEFAULT_INACTIVE_THRESHOLD_DAYS,
  DEFAULT_PROVIDER_NOTIFICATIONS_ENABLED,
  INACTIVE_THRESHOLD_OPTIONS,
  getInactiveThresholdDays,
  getProviderNotificationsEnabled,
  setInactiveThresholdDays,
  setProviderNotificationsEnabled,
  type InactiveThresholdOption,
} from '../../lib/settings/notificationSettings';

const thresholdLabel = (days: number) => (days === 0 ? 'Aus' : `${days} T.`);

export const NotificationsSection = memo(() => {
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const [threshold, setThreshold] = useState<number>(DEFAULT_INACTIVE_THRESHOLD_DAYS);
  const [providerEnabled, setProviderEnabled] = useState<boolean>(
    DEFAULT_PROVIDER_NOTIFICATIONS_ENABLED
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    Promise.all([
      getInactiveThresholdDays(user.uid),
      getProviderNotificationsEnabled(user.uid),
    ]).then(([t, p]) => {
      if (cancelled) return;
      setThreshold(t);
      setProviderEnabled(p);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleThresholdChange = async (value: InactiveThresholdOption) => {
    if (!user || saving) return;
    setSaving(true);
    setThreshold(value);
    try {
      await setInactiveThresholdDays(user.uid, value);
    } finally {
      setSaving(false);
    }
  };

  const handleProviderToggle = async (enabled: boolean) => {
    if (!user || saving) return;
    setSaving(true);
    setProviderEnabled(enabled);
    try {
      await setProviderNotificationsEnabled(user.uid, enabled);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.22 }}
      className="settings-card"
    >
      <h2 className="settings-section-title" style={{ color: currentTheme.text.primary }}>
        Benachrichtigungen
      </h2>

      {/* Inactive Threshold */}
      <div
        className="settings-toggle-row"
        style={{
          background: currentTheme.background.default,
          borderColor: currentTheme.border.default,
          flexDirection: 'column',
          alignItems: 'stretch',
          gap: '14px',
        }}
      >
        <div className="settings-toggle-info">
          <NotificationsActive style={{ fontSize: '22px', color: currentTheme.primary }} />
          <div>
            <h3 className="settings-toggle-title" style={{ color: currentTheme.text.primary }}>
              Inaktive Serien
            </h3>
            <p className="settings-toggle-subtitle" style={{ color: currentTheme.text.muted }}>
              Erinnerung nach X Tagen ohne neue Episode
            </p>
          </div>
        </div>
        <div className="settings-segmented">
          {INACTIVE_THRESHOLD_OPTIONS.map((opt) => {
            const active = threshold === opt;
            return (
              <button
                key={opt}
                type="button"
                disabled={loading || saving}
                onClick={() => handleThresholdChange(opt)}
                className="settings-segmented-btn"
                style={{
                  background: active
                    ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`
                    : 'transparent',
                  color: active ? currentTheme.background.default : currentTheme.text.secondary,
                  borderColor: active ? 'transparent' : `${currentTheme.border.default}`,
                  opacity: loading ? 0.5 : 1,
                }}
              >
                {thresholdLabel(opt)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Provider Notifications Toggle */}
      <div
        className="settings-toggle-row"
        style={{
          background: currentTheme.background.default,
          borderColor: currentTheme.border.default,
        }}
      >
        <div className="settings-toggle-info">
          <SwapHoriz style={{ fontSize: '22px', color: currentTheme.primary }} />
          <div>
            <h3 className="settings-toggle-title" style={{ color: currentTheme.text.primary }}>
              Provider-Änderungen
            </h3>
            <p className="settings-toggle-subtitle" style={{ color: currentTheme.text.muted }}>
              Benachrichtigung wenn ein Streaming-Anbieter wechselt
            </p>
          </div>
        </div>
        <label className="settings-toggle-switch">
          <input
            type="checkbox"
            checked={providerEnabled}
            onChange={(e) => handleProviderToggle(e.target.checked)}
            disabled={loading || saving}
            aria-label="Provider-Änderungs-Benachrichtigungen"
            className="settings-toggle-input"
          />
          <span
            className="settings-toggle-track"
            style={{
              backgroundColor: providerEnabled
                ? currentTheme.primary
                : `${currentTheme.text.muted}30`,
              opacity: loading || saving ? 0.5 : 1,
            }}
          >
            <span
              className="settings-toggle-thumb"
              style={{ left: providerEnabled ? '26px' : '4px' }}
            />
          </span>
        </label>
      </div>

      <div className="settings-info-box" style={{ background: currentTheme.background.default }}>
        <NotificationsActive
          style={{ fontSize: '18px', color: currentTheme.primary, flexShrink: 0 }}
        />
        <p className="settings-info-text" style={{ color: currentTheme.text.muted }}>
          Erinnerungen kommen frühestens 30 Tage nach der letzten Anzeige wieder — selbst wenn die
          Serie weiter inaktiv ist. Schaust du eine Episode, wird die Erinnerung beim nächsten
          Inaktivwerden direkt wieder freigeschaltet.
        </p>
      </div>
    </motion.div>
  );
});

NotificationsSection.displayName = 'NotificationsSection';
