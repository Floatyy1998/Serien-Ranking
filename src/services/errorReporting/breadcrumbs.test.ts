// @vitest-environment jsdom
import { beforeAll, describe, expect, it, vi } from 'vitest';

const respond = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

import { getAuthTokenRejection, getBreadcrumbs, installBreadcrumbs } from './breadcrumbs';

describe('breadcrumbs fetch hook', () => {
  beforeAll(() => installBreadcrumbs());

  it('merkt sich den Ablehnungsgrund der Token-Erneuerung und lässt Firebase den Body', async () => {
    fetchMock.mockResolvedValueOnce(
      respond(400, { error: { code: 400, message: 'TOKEN_EXPIRED', status: 'INVALID_ARGUMENT' } })
    );
    const response = await window.fetch('https://securetoken.googleapis.com/v1/token?key=abc');
    await expect(response.json()).resolves.toMatchObject({ error: { message: 'TOKEN_EXPIRED' } });
    expect(getAuthTokenRejection()).toBe('TOKEN_EXPIRED');
    expect(getBreadcrumbs().slice(-1)[0]?.detail).toBe('400 TOKEN_EXPIRED');
  });

  it('wertet andere Fehlantworten nicht als Token-Ablehnung', async () => {
    fetchMock.mockResolvedValueOnce(respond(500, { error: { message: 'BOOM' } }));
    await window.fetch('https://serienapi.konrad-dinges.de/add');
    expect(getAuthTokenRejection()).toBe('TOKEN_EXPIRED');
    expect(getBreadcrumbs().slice(-1)[0]?.detail).toBe('500');
  });
});
