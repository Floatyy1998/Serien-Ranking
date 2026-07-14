// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { ADMIN_UID } from '../config/admin';

const fb = vi.hoisted(() => {
  const state: { data: unknown } = { data: null };
  const once = vi.fn(() => Promise.resolve({ val: () => state.data }));
  const ref = vi.fn(() => ({ once }));
  const database = vi.fn(() => ({ ref }));
  return { state, once, ref, database };
});

vi.mock('firebase/compat/app', () => ({ default: { database: fb.database } }));
vi.mock('firebase/compat/database', () => ({}));

const toast = vi.hoisted(() => ({ showToast: vi.fn() }));
vi.mock('../lib/toast', () => ({ showToast: toast.showToast }));

const authState = vi.hoisted(() => ({ user: null as { uid: string } | null }));
vi.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ user: authState.user }) }));

import { useAdminHealthAlert } from './useAdminHealthAlert';

beforeEach(() => {
  fb.state.data = null;
  fb.once.mockClear();
  fb.ref.mockClear();
  fb.database.mockClear();
  toast.showToast.mockClear();
  authState.user = null;
});

describe('useAdminHealthAlert', () => {
  it('macht nichts ohne eingeloggten User', () => {
    renderHook(() => useAdminHealthAlert());
    expect(fb.database).not.toHaveBeenCalled();
    expect(toast.showToast).not.toHaveBeenCalled();
  });

  it('macht nichts für Nicht-Admin-User', () => {
    authState.user = { uid: 'not-admin' };
    renderHook(() => useAdminHealthAlert());
    expect(fb.database).not.toHaveBeenCalled();
    expect(toast.showToast).not.toHaveBeenCalled();
  });

  it('zeigt einen Toast mit der Anzahl relevanter Probleme für den Admin', async () => {
    authState.user = { uid: ADMIN_UID };
    fb.state.data = {
      userA: { issues: [{ type: 'broken-poster' }, { type: 'missing-all-genre' }] },
      userB: { issues: [{ type: 'stale-catalog' }] },
    };
    renderHook(() => useAdminHealthAlert());
    expect(fb.ref).toHaveBeenCalledWith('admin/dataIntegrityIssues');
    await waitFor(() => expect(toast.showToast).toHaveBeenCalledTimes(1));
    // broken-poster + stale-catalog = 2 (missing-all-genre wird ignoriert)
    expect(toast.showToast).toHaveBeenCalledWith('2 Data Health Probleme', 3000);
  });

  it('zeigt keinen Toast wenn nur ignorierte Typen vorliegen', async () => {
    authState.user = { uid: ADMIN_UID };
    fb.state.data = {
      userA: { issues: [{ type: 'missing-all-genre' }, { type: 'missing-all-rating' }] },
    };
    renderHook(() => useAdminHealthAlert());
    await waitFor(() => expect(fb.once).toHaveBeenCalled());
    expect(toast.showToast).not.toHaveBeenCalled();
  });

  it('zeigt keinen Toast wenn keine Daten existieren', async () => {
    authState.user = { uid: ADMIN_UID };
    fb.state.data = null;
    renderHook(() => useAdminHealthAlert());
    await waitFor(() => expect(fb.once).toHaveBeenCalled());
    expect(toast.showToast).not.toHaveBeenCalled();
  });
});
