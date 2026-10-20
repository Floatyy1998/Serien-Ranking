import { useEffect, useState } from 'react';
import { EFFECT_SOUNDS_EVENT, readEffectSounds } from '../../services/settings/effectSounds';

/** Ob Effekt-Töne (Kisten, Glücksrad) an sind — reagiert auf Umschalten überall. */
export function useEffectSounds(): boolean {
  const [on, setOn] = useState(readEffectSounds);
  useEffect(() => {
    const sync = () => setOn(readEffectSounds());
    window.addEventListener(EFFECT_SOUNDS_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EFFECT_SOUNDS_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  return on;
}
