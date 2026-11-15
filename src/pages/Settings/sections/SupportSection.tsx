import FavoriteBorder from '@mui/icons-material/FavoriteBorder';
import { memo } from 'react';
import { nativePlatform } from '../../../services/app/nativeShell';
import { t } from '../../../services/i18n';
import { SGroup, SNote, SRow } from '../kit/SettingsKit';

/** Ko-fi-Seite des Projekts. */
export const SUPPORT_URL = 'https://ko-fi.com/tvrank';

/**
 * Hinweis aufs Unterstützen. Im Web und in der Desktop-App eine Zeile mit Link. In den
 * Store-Apps bewusst nur ein Satz ohne Link und ohne Knopf, der auf die Website verweist.
 */
export const SupportSection = memo(() => {
  if (nativePlatform()) {
    return (
      <SGroup>
        <SNote icon={FavoriteBorder}>
          {t(
            'TV-Rank ist ein privates Projekt ohne Werbung. Wer es unterstützen möchte, findet den Weg dazu auf tv-rank.de in den Einstellungen.'
          )}
        </SNote>
      </SGroup>
    );
  }

  if (!SUPPORT_URL) return null;

  return (
    <SGroup>
      <SRow
        icon={FavoriteBorder}
        title={t('TV-Rank unterstützen')}
        subtitle={t('Ein privates Projekt ohne Werbung — freiwillig und ohne Gegenleistung')}
        href={SUPPORT_URL}
        chevron
      />
    </SGroup>
  );
});

SupportSection.displayName = 'SupportSection';
