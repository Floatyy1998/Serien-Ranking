import HelpOutlined from '@mui/icons-material/HelpOutlined';
import { memo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { isNewAccount } from '../../../lib/interaction/pageTour';
import { hapticTap } from '../../../lib/interaction/haptics';
import { showToast } from '../../../lib/interaction/toast';
import { resetSeenTours } from '../../../services/settings/pageTour';
import { t } from '../../../services/i18n';
import { SRow } from '../kit/SettingsKit';

export const PageToursSection = memo(() => {
  const { user } = useAuth() || {};

  if (!isNewAccount(user?.metadata?.creationTime)) return null;

  return (
    <SRow
      icon={HelpOutlined}
      title={t('Seitenhilfen zurücksetzen')}
      subtitle={t('Die Kurzhilfe erscheint beim nächsten Besuch jeder Seite erneut')}
      onClick={() => {
        hapticTap();
        resetSeenTours(user?.uid);
        showToast(t('Seitenhilfen werden wieder angezeigt'), 2500, 'success');
      }}
    />
  );
});

PageToursSection.displayName = 'PageToursSection';
