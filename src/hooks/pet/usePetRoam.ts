import { useEffect, useState } from 'react';

const KEY = 'petRoam';
const EVENT = 'pet-roam-changed';

export function readPetRoam(): boolean {
  try {
    return localStorage.getItem(KEY) !== '0';
  } catch {
    return true;
  }
}

export function setPetRoam(on: boolean): void {
  try {
    localStorage.setItem(KEY, on ? '1' : '0');
  } catch {
    // ohne Storage gilt der Standard
  }
  window.dispatchEvent(new Event(EVENT));
}

/** Ob das Pet frei über das Dock läuft (Gerät-lokal, Standard: an). */
export function usePetRoam(): boolean {
  const [roam, setRoam] = useState(readPetRoam);
  useEffect(() => {
    const sync = () => setRoam(readPetRoam());
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  return roam;
}
