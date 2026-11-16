import { backendFetch } from '../api/backendApi';
import { INVITE_BASE_URL, normalizeInviteCode } from '../../lib/invite/inviteCode';
import { clearPendingInviteCode, getPendingInviteCode } from './pendingInvite';

export interface InviteStatus {
  code: string;
  count: number;
  rewarded: boolean;
  redeemed: boolean;
  canRedeem: boolean;
}

export type RedeemResult =
  | 'ok'
  | 'invalid_code'
  | 'own_code'
  | 'account_too_old'
  | 'already_redeemed'
  | 'onboarding_required'
  | 'failed';

const REDEEM_ERRORS: readonly RedeemResult[] = [
  'invalid_code',
  'own_code',
  'account_too_old',
  'already_redeemed',
  'onboarding_required',
];

/** Fehler, nach denen ein erneuter Versuch mit demselben Code sinnlos ist. */
const FINAL_RESULTS: readonly RedeemResult[] = [
  'ok',
  'invalid_code',
  'own_code',
  'account_too_old',
  'already_redeemed',
];

const QUIET = [400, 403, 404, 409] as const;

const post = (path: string, body: Record<string, unknown> = {}) =>
  backendFetch(
    path,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    { quietStatuses: QUIET, quietConnectionErrors: true }
  );

export const inviteUrl = (code: string | null | undefined): string =>
  code ? `${INVITE_BASE_URL}/?invite=${code}` : INVITE_BASE_URL;

export async function fetchInviteStatus(): Promise<InviteStatus | null> {
  try {
    const response = await post('/invite/code');
    if (!response.ok) return null;
    const data = (await response.json()) as Partial<InviteStatus>;
    const code = normalizeInviteCode(data.code);
    if (!code) return null;
    return {
      code,
      count: Number(data.count) || 0,
      rewarded: data.rewarded === true,
      redeemed: data.redeemed === true,
      canRedeem: data.canRedeem === true,
    };
  } catch {
    return null;
  }
}

export async function redeemInvite(rawCode: string): Promise<RedeemResult> {
  const code = normalizeInviteCode(rawCode);
  if (!code) return 'invalid_code';
  try {
    const response = await post('/invite/redeem', { code });
    if (response.ok) return 'ok';
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    const known = REDEEM_ERRORS.find((e) => e === data.error);
    return known ?? 'failed';
  } catch {
    return 'failed';
  }
}

let autoRedeemRunning = false;

/** Löst den gemerkten Code ein. Bleibt gemerkt, solange ein späterer Versuch noch gelingen kann. */
export async function redeemPendingInvite(): Promise<RedeemResult | null> {
  const code = getPendingInviteCode();
  if (!code || autoRedeemRunning) return null;
  autoRedeemRunning = true;
  try {
    const result = await redeemInvite(code);
    if (FINAL_RESULTS.includes(result)) clearPendingInviteCode();
    return result;
  } finally {
    autoRedeemRunning = false;
  }
}
