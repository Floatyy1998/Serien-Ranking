import { NotificationsActive, PhoneIphone, SwapHoriz, TimerOutlined } from '@mui/icons-material';
import { memo, useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import {
  disableNativePush,
  enableNativePush,
  isNativePushAvailable,
  isNativePushEnabled,
} from '../../../services/notifications/pushNotifications';
import {
  DEFAULT_INACTIVE_THRESHOLD_DAYS,
  DEFAULT_PROVIDER_NOTIFICATIONS_ENABLED,
  INACTIVE_THRESHOLD_OPTIONS,
  getInactiveThresholdDays,
  getProviderNotificationsEnabled,
  setInactiveThresholdDays,
  setProviderNotificationsEnabled,
  type InactiveThresholdOption,
} from '../../../lib/settings/notificationSettings';
import { t } from '../../../services/i18n';
import { SNote, SRow, SSegment, SSwitch } from '../kit/SettingsKit';

const thresholdLabel = (days: number) => (days === 0 ? t('Aus') : t('{days} T.', { days }));

export const NotificationsSection = memo(() => {
  const { user } = useAuth() || {};
  const [threshold, setThreshold] = useState<number>(DEFAULT_INACTIVE_THRESHOLD_DAYS);
  const [providerEnabled, setProviderEnabled] = useState<boolean>(
    DEFAULT_PROVIDER_NOTIFICATIONS_ENABLED
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(isNativePushEnabled);
  const [pushBusy, setPushBusy] = useState(false);
  const pushAvailable = isNativePushAvailable();

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    Promise.all([
      getInactiveThresholdDays(user.uid),
      getProviderNotificationsEnabled(user.uid),
    ]).then(([days, provider]) => {
      if (cancelled) return;
      setThreshold(days);
      setProviderEnabled(provider);
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

  const handlePushToggle = async (enabled: boolean) => {
    if (!user || pushBusy) return;
    setPushBusy(true);
    try {
      if (enabled) {
        const ok = await enableNativePush(user.uid);
        setPushEnabled(ok);
      } else {
        await disableNativePush(user.uid);
        setPushEnabled(false);
      }
    } finally {
      setPushBusy(false);
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
    <>
      {pushAvailable && (
        <SRow
          icon={PhoneIphone}
          title={t('Push-Benachrichtigungen')}
          subtitle={t('Neue Folgen deiner Serien und Freundschaftsanfragen direkt aufs Handy')}
          trailing={
            <SSwitch
              checked={pushEnabled}
              onChange={(next) => void handlePushToggle(next)}
              disabled={pushBusy}
              label={t('Push-Benachrichtigungen')}
            />
          }
        />
      )}
      <SRow
        icon={TimerOutlined}
        title={t('Inaktive Serien')}
        subtitle={t('Erinnerung nach X Tagen ohne neue Episode')}
        below={
          <SSegment
            ariaLabel={t('Inaktive Serien')}
            value={threshold}
            disabled={loading || saving}
            onChange={(v) => void handleThresholdChange(v as InactiveThresholdOption)}
            options={INACTIVE_THRESHOLD_OPTIONS.map((opt) => ({
              value: opt,
              label: thresholdLabel(opt),
            }))}
          />
        }
      />
      <SRow
        icon={SwapHoriz}
        title={t('Provider-Änderungen')}
        subtitle={t('Benachrichtigung wenn ein Streaming-Anbieter wechselt')}
        trailing={
          <SSwitch
            checked={providerEnabled}
            onChange={(next) => void handleProviderToggle(next)}
            disabled={loading || saving}
            label={t('Provider-Änderungs-Benachrichtigungen')}
          />
        }
      />
      <SNote icon={NotificationsActive}>
        {t(
          'Erinnerungen kommen frühestens 30 Tage nach der letzten Anzeige wieder — selbst wenn die Serie weiter inaktiv ist. Schaust du eine Episode, wird die Erinnerung beim nächsten Inaktivwerden direkt wieder freigeschaltet.'
        )}
      </SNote>
    </>
  );
});

NotificationsSection.displayName = 'NotificationsSection';
