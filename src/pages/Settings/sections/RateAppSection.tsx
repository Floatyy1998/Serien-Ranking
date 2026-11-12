import StarRate from '@mui/icons-material/StarRate';
import { memo } from 'react';
import { canOpenStoreListing, openStoreListing } from '../../../services/app/appReview';
import { hapticTap } from '../../../lib/interaction/haptics';
import { t } from '../../../services/i18n';
import { SRow } from '../kit/SettingsKit';

export const RateAppSection = memo(() => {
  if (!canOpenStoreListing()) return null;

  return (
    <SRow
      icon={StarRate}
      title={t('App bewerten')}
      subtitle={t('Eine Bewertung im Store hilft anderen beim Finden')}
      chevron
      onClick={() => {
        hapticTap();
        openStoreListing();
      }}
    />
  );
});

RateAppSection.displayName = 'RateAppSection';
