import { normalizeInviteCode } from '../../lib/invite/inviteCode';

const PENDING_KEY = 'pendingInviteCode';

export const getPendingInviteCode = (): string | null => {
  try {
    return normalizeInviteCode(localStorage.getItem(PENDING_KEY));
  } catch {
    return null;
  }
};

export const clearPendingInviteCode = (): void => {
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch {
    /* ohne Speicher gibt es auch nichts zu löschen */
  }
};

/** Merkt sich den Code aus einem Einladungslink, bis das Konto fertig eingerichtet ist. */
export const captureInviteFromUrl = (search: string = window.location.search): void => {
  const code = normalizeInviteCode(new URLSearchParams(search).get('invite'));
  if (!code) return;
  try {
    localStorage.setItem(PENDING_KEY, code);
  } catch {
    /* Quota voll: der Code lässt sich später von Hand eingeben */
  }
};
