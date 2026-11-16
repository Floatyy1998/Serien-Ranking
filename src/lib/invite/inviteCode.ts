export const INVITE_BASE_URL = 'https://tv-rank.de';

export const INVITE_CODE_LENGTH = 6;

const CODE_RE = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/;

/** Bringt eine Eingabe in die Form, die das Backend vergibt, oder null, wenn sie kein Code sein kann. */
export const normalizeInviteCode = (raw: unknown): string | null => {
  if (typeof raw !== 'string') return null;
  const code = raw.replace(/[\s-]/g, '').toUpperCase();
  return CODE_RE.test(code) ? code : null;
};
