import VolumeOff from '@mui/icons-material/VolumeOff';
import VolumeUp from '@mui/icons-material/VolumeUp';
import React from 'react';
import { useEffectSounds } from '../../hooks/platform/useEffectSounds';
import { t } from '../../services/i18n';
import { setEffectSounds } from '../../services/settings/effectSounds';

/** Ton an/aus oben links in Kisten- und Glücksrad-Overlays. */
export const SoundToggleButton: React.FC = () => {
  const on = useEffectSounds();
  const label = on ? t('Ton ausschalten') : t('Ton einschalten');
  return (
    <button
      type="button"
      onClick={() => setEffectSounds(!on)}
      aria-label={label}
      aria-pressed={!on}
      title={label}
      style={{
        position: 'absolute',
        top: 'calc(16px + env(safe-area-inset-top, 0px))',
        left: 16,
        background: 'none',
        border: 'none',
        color: 'white',
        opacity: on ? 1 : 0.6,
        cursor: 'pointer',
        zIndex: 10001,
        lineHeight: 1,
        padding: 0,
      }}
    >
      {on ? <VolumeUp style={{ fontSize: 26 }} /> : <VolumeOff style={{ fontSize: 26 }} />}
    </button>
  );
};
