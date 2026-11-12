import { EmojiEvents } from '@mui/icons-material';
import { memo, useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { hapticSelect } from '../../../lib/interaction/haptics';
import {
  isLeaderboardHidden,
  setLeaderboardHidden,
} from '../../../services/social/leaderboardService';
import { t } from '../../../services/i18n';
import { SRow, SSwitch } from '../kit/SettingsKit';

export const LeaderboardVisibilitySection = memo(() => {
  const { user } = useAuth() || {};
  const [visible, setVisible] = useState(true);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    let cancelled = false;
    void isLeaderboardHidden(user.uid).then((hidden) => {
      if (cancelled) return;
      setVisible(!hidden);
      setBusy(false);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  const toggle = async (next: boolean) => {
    if (!user?.uid || busy) return;
    setBusy(true);
    setVisible(next);
    try {
      await setLeaderboardHidden(user.uid, !next);
      hapticSelect();
    } catch {
      setVisible(!next);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SRow
      icon={EmojiEvents}
      title={t('In der globalen Rangliste erscheinen')}
      subtitle={t('Deine Freunde sehen dich in ihrer Rangliste weiterhin')}
      trailing={
        <SSwitch
          checked={visible}
          onChange={(next) => void toggle(next)}
          disabled={busy}
          label={t('In der globalen Rangliste erscheinen')}
        />
      }
    />
  );
});

LeaderboardVisibilitySection.displayName = 'LeaderboardVisibilitySection';
