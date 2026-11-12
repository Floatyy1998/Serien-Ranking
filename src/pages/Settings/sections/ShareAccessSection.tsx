import GroupAddRounded from '@mui/icons-material/GroupAddRounded';
import PersonRounded from '@mui/icons-material/PersonRounded';
import VisibilityOffRounded from '@mui/icons-material/VisibilityOffRounded';
import { useState } from 'react';
import { useOptimizedFriends } from '../../../contexts/OptimizedFriendsContext';
import { t } from '../../../services/i18n';
import { SButton, SGroup, SRow } from '../kit/SettingsKit';

export const ShareAccessSection: React.FC = () => {
  const { friends, shareIds, revokeShare, shareWithAllFriends } = useOptimizedFriends();
  const [busy, setBusy] = useState(false);

  if (friends.length === 0) return null;

  const withAccess = friends.filter((friend) => shareIds.has(friend.uid));
  const alleFreigegeben = withAccess.length === friends.length;

  const run = async (action: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  };

  return (
    <SGroup
      title={t('Wer meinen Kalender sieht')}
      description={t(
        'Deinen Kalender sehen Freunde nur, wenn du es erlaubst. Serienliste, Fortschritt, Bewertungen und Verlauf sehen alle deine Freunde.'
      )}
    >
      {withAccess.length === 0 && (
        <SRow icon={VisibilityOffRounded} title={t('Aktuell sieht niemand deinen Kalender.')} />
      )}
      {withAccess.map((friend) => (
        <SRow
          key={friend.uid}
          icon={PersonRounded}
          title={friend.displayName || friend.username || t('Freund')}
          trailing={
            <SButton
              variant="danger"
              disabled={busy}
              onClick={() => void run(() => revokeShare(friend.uid))}
            >
              {t('Entziehen')}
            </SButton>
          }
        />
      ))}
      {!alleFreigegeben && (
        <SRow
          icon={GroupAddRounded}
          title={t('Allen {n} Freunden freigeben', { n: friends.length })}
          chevron
          disabled={busy}
          onClick={() => void run(shareWithAllFriends)}
        />
      )}
    </SGroup>
  );
};
