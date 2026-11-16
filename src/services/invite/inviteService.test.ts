// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ backendFetch: vi.fn() }));
vi.mock('../api/backendApi', () => ({ backendFetch: mocks.backendFetch }));

import { fetchInviteStatus, inviteUrl, redeemInvite, redeemPendingInvite } from './inviteService';
import { captureInviteFromUrl, getPendingInviteCode } from './pendingInvite';

const reply = (status: number, body: unknown) =>
  ({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) }) as Response;

beforeEach(() => {
  mocks.backendFetch.mockReset();
  localStorage.clear();
});

describe('Einladungslink', () => {
  it('trägt den Code und fällt ohne Code auf die Startseite zurück', () => {
    expect(inviteUrl('K7M2XP')).toBe('https://tv-rank.de/?invite=K7M2XP');
    expect(inviteUrl(null)).toBe('https://tv-rank.de');
  });

  it('merkt sich nur gültige Codes aus der Adresse', () => {
    captureInviteFromUrl('?invite=k7m2xp');
    expect(getPendingInviteCode()).toBe('K7M2XP');
    localStorage.clear();
    captureInviteFromUrl('?invite=<script>');
    expect(getPendingInviteCode()).toBeNull();
    captureInviteFromUrl('?foo=bar');
    expect(getPendingInviteCode()).toBeNull();
  });
});

describe('fetchInviteStatus', () => {
  it('liefert den Stand des Kontos', async () => {
    mocks.backendFetch.mockResolvedValue(
      reply(200, { code: 'K7M2XP', count: 3, rewarded: true, redeemed: false, canRedeem: true })
    );
    expect(await fetchInviteStatus()).toEqual({
      code: 'K7M2XP',
      count: 3,
      rewarded: true,
      redeemed: false,
      canRedeem: true,
    });
  });

  it('gibt bei Fehler oder kaputter Antwort null zurück', async () => {
    mocks.backendFetch.mockResolvedValue(reply(500, {}));
    expect(await fetchInviteStatus()).toBeNull();
    mocks.backendFetch.mockResolvedValue(reply(200, { code: 'nope' }));
    expect(await fetchInviteStatus()).toBeNull();
    mocks.backendFetch.mockRejectedValue(new Error('offline'));
    expect(await fetchInviteStatus()).toBeNull();
  });
});

describe('redeemInvite', () => {
  it('fragt das Backend bei offensichtlich falschen Codes gar nicht erst', async () => {
    expect(await redeemInvite('abc')).toBe('invalid_code');
    expect(mocks.backendFetch).not.toHaveBeenCalled();
  });

  it('reicht bekannte Ablehnungsgründe durch und meldet Unbekanntes als failed', async () => {
    mocks.backendFetch.mockResolvedValue(reply(403, { error: 'account_too_old' }));
    expect(await redeemInvite('K7M2XP')).toBe('account_too_old');
    mocks.backendFetch.mockResolvedValue(reply(500, { error: 'kaputt' }));
    expect(await redeemInvite('K7M2XP')).toBe('failed');
  });
});

describe('redeemPendingInvite', () => {
  it('tut ohne gemerkten Code nichts', async () => {
    expect(await redeemPendingInvite()).toBeNull();
    expect(mocks.backendFetch).not.toHaveBeenCalled();
  });

  it('vergisst den Code nach Erfolg und nach endgültiger Ablehnung', async () => {
    captureInviteFromUrl('?invite=K7M2XP');
    mocks.backendFetch.mockResolvedValue(reply(200, { ok: true }));
    expect(await redeemPendingInvite()).toBe('ok');
    expect(getPendingInviteCode()).toBeNull();

    captureInviteFromUrl('?invite=K7M2XP');
    mocks.backendFetch.mockResolvedValue(reply(409, { error: 'already_redeemed' }));
    expect(await redeemPendingInvite()).toBe('already_redeemed');
    expect(getPendingInviteCode()).toBeNull();
  });

  it('behält den Code, solange ein späterer Versuch noch klappen kann', async () => {
    captureInviteFromUrl('?invite=K7M2XP');
    mocks.backendFetch.mockResolvedValue(reply(409, { error: 'onboarding_required' }));
    expect(await redeemPendingInvite()).toBe('onboarding_required');
    expect(getPendingInviteCode()).toBe('K7M2XP');

    mocks.backendFetch.mockRejectedValue(new Error('offline'));
    expect(await redeemPendingInvite()).toBe('failed');
    expect(getPendingInviteCode()).toBe('K7M2XP');
  });
});
