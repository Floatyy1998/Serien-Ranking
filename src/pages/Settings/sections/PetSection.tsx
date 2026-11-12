import { DirectionsWalk, Pets, VolumeUp } from '@mui/icons-material';
import { memo, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { usePetEnabled } from '../../../hooks/pet/usePetEnabled';
import { useEffectSounds } from '../../../hooks/platform/useEffectSounds';
import { setPetRoam, usePetRoam } from '../../../hooks/pet/usePetRoam';
import { t } from '../../../services/i18n';
import { setPetEnabled } from '../../../services/pet/petPreferences';
import { setEffectSounds } from '../../../services/settings/effectSounds';
import { SRow, SSwitch } from '../kit/SettingsKit';

export const PetSection = memo(() => {
  const { user } = useAuth() || {};
  const enabled = usePetEnabled();
  const roam = usePetRoam();
  const sounds = useEffectSounds();
  const [busy, setBusy] = useState(false);

  const handleToggle = async (next: boolean) => {
    if (!user || busy) return;
    setBusy(true);
    try {
      await setPetEnabled(user.uid, next);
    } catch (error) {
      console.error('Pet toggle failed:', error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <SRow
        icon={Pets}
        title={t('Pet-Begleiter')}
        subtitle={
          enabled
            ? t('Widget, Reaktionen und Pet-Karten sind an.')
            : t(
                'Ausgeschaltet. Solange steht die Zeit für dein Pet still, es bekommt keinen Hunger.'
              )
        }
        trailing={
          <SSwitch
            checked={enabled}
            onChange={(next) => void handleToggle(next)}
            disabled={busy || !user}
            label={t('Pet-Begleiter')}
          />
        }
      />
      {enabled && (
        <SRow
          icon={DirectionsWalk}
          title={t('Herumlaufen')}
          subtitle={
            roam
              ? t('Dein Pet läuft frei über die Navigationsleiste.')
              : t('Dein Pet bleibt an seinem Platz sitzen.')
          }
          trailing={<SSwitch checked={roam} onChange={setPetRoam} label={t('Herumlaufen')} />}
        />
      )}
      <SRow
        icon={VolumeUp}
        title={t('Töne bei Kisten & Glücksrad')}
        subtitle={
          sounds
            ? t('Beim Öffnen und Drehen spielen Effekt-Töne.')
            : t('Kisten und Glücksrad bleiben stumm.')
        }
        trailing={
          <SSwitch
            checked={sounds}
            onChange={setEffectSounds}
            label={t('Töne bei Kisten & Glücksrad')}
          />
        }
      />
    </>
  );
});

PetSection.displayName = 'PetSection';
