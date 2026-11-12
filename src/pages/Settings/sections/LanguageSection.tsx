/**
 * Sprachwahl: Auto (Browsersprache) oder eine feste Sprache. Die Liste kommt
 * aus `i18n/locales.ts` — eine neue Sprache erscheint hier von allein.
 * Ein Wechsel lädt die App neu, weil die Sprache beim Boot fixiert wird.
 */

import { Language, Public, Translate } from '@mui/icons-material';
import { useState } from 'react';
import { ThemedSelect } from '../../../components/ui/input/ThemedSelect';
import type { AppLanguage } from '../../../services/i18n';
import {
  LOCALES,
  LOCALE_LABEL,
  getAppLanguageSetting,
  setAppLanguageSetting,
  t,
} from '../../../services/i18n';
import { getWatchRegionSetting, setWatchRegionSetting } from '../../../services/settings/region';
import {
  isAutoTranslateEnabled,
  setAutoTranslateEnabled,
} from '../../../services/translation/commentTranslation';
import { SRow, SSegment, SSwitch } from '../kit/SettingsKit';

const OPTIONS: { value: AppLanguage; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  ...LOCALES.map((code) => ({ value: code as AppLanguage, label: LOCALE_LABEL[code] })),
];

/** Länder mit eigener TMDB-Provider-Abdeckung — Auswahl fürs Streaming-Land. */
const REGIONS: { code: string; label: string }[] = [
  { code: 'DE', label: 'Deutschland' },
  { code: 'AT', label: 'Österreich' },
  { code: 'CH', label: 'Schweiz' },
  { code: 'US', label: 'USA' },
  { code: 'GB', label: 'Großbritannien' },
  { code: 'IE', label: 'Irland' },
  { code: 'CA', label: 'Kanada' },
  { code: 'AU', label: 'Australien' },
  { code: 'FR', label: 'Frankreich' },
  { code: 'IT', label: 'Italien' },
  { code: 'ES', label: 'Spanien' },
  { code: 'PT', label: 'Portugal' },
  { code: 'NL', label: 'Niederlande' },
  { code: 'PL', label: 'Polen' },
  { code: 'SE', label: 'Schweden' },
  { code: 'NO', label: 'Norwegen' },
  { code: 'DK', label: 'Dänemark' },
  { code: 'FI', label: 'Finnland' },
  { code: 'BR', label: 'Brasilien' },
  { code: 'MX', label: 'Mexiko' },
  { code: 'AR', label: 'Argentinien' },
  { code: 'CO', label: 'Kolumbien' },
  { code: 'CL', label: 'Chile' },
  { code: 'PE', label: 'Peru' },
  { code: 'JP', label: 'Japan' },
  { code: 'KR', label: 'Südkorea' },
  { code: 'IN', label: 'Indien' },
  { code: 'TR', label: 'Türkei' },
];

export const LanguageSection = () => {
  const [selected, setSelected] = useState<AppLanguage>(getAppLanguageSetting());
  const [region, setRegion] = useState<string>(getWatchRegionSetting());
  const [autoTranslate, setAutoTranslate] = useState<boolean>(isAutoTranslateEnabled());

  const chooseAutoTranslate = (value: boolean) => {
    setAutoTranslate(value);
    setAutoTranslateEnabled(value);
  };

  const choose = (value: AppLanguage) => {
    if (value === selected) return;
    setSelected(value);
    setAppLanguageSetting(value);
    window.location.reload();
  };

  const chooseRegion = (value: string) => {
    if (value === region) return;
    setRegion(value);
    setWatchRegionSetting(value);
    window.location.reload();
  };

  return (
    <>
      <SRow
        icon={Language}
        title={t('Sprache')}
        subtitle={t(
          'Auto nutzt die Gerätesprache. Sprechen wir sie nicht, erscheint die App auf Englisch.'
        )}
        below={
          <SSegment
            wrap
            ariaLabel={t('Sprache')}
            value={selected}
            onChange={choose}
            options={OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />
        }
      />
      <SRow
        icon={Translate}
        title={t('Kommentare automatisch übersetzen')}
        subtitle={t(
          'Fremdsprachige Diskussionen und Antworten werden automatisch in deine Sprache übersetzt. Ausgeschaltet erscheint stattdessen ein Übersetzen-Button.'
        )}
        trailing={
          <SSwitch
            checked={autoTranslate}
            onChange={chooseAutoTranslate}
            label={t('Kommentare automatisch übersetzen')}
          />
        }
      />
      <SRow
        icon={Public}
        title={t('Streaming-Land')}
        subtitle={t('Bestimmt, für welches Land Streaming-Anbieter angezeigt werden.')}
        below={
          <ThemedSelect
            value={region}
            onChange={chooseRegion}
            ariaLabel={t('Streaming-Land')}
            options={[
              { value: 'auto', label: t('Auto (aus Gerätesprache)') },
              ...REGIONS.map((r) => ({ value: r.code, label: t(r.label) })),
            ]}
          />
        }
      />
    </>
  );
};
