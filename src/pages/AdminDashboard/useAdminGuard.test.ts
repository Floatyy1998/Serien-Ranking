// @vitest-environment jsdom
import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ADMIN_UID } from '../../config/admin';

const navSpy = vi.hoisted(() => vi.fn());
const authState = vi.hoisted(() => ({ user: null as { uid: string } | null }));

vi.mock('react-router-dom', () => ({ useNavigate: () => navSpy }));
vi.mock('../../AuthContext', () => ({ useAuth: () => ({ user: authState.user }) }));

import { useAdminGuard } from './useAdminGuard';

beforeEach(() => {
  navSpy.mockReset();
  authState.user = null;
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('useAdminGuard', () => {
  it('erlaubt den Admin und navigiert nicht weg', () => {
    authState.user = { uid: ADMIN_UID };
    const { result } = renderHook(() => useAdminGuard());
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.checking).toBe(false);
    expect(navSpy).not.toHaveBeenCalled();
  });

  it('weist einen Nicht-Admin ab und navigiert zur Startseite', () => {
    authState.user = { uid: 'not-admin' };
    const { result } = renderHook(() => useAdminGuard());
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.checking).toBe(false);
    expect(navSpy).toHaveBeenCalledWith('/', { replace: true });
  });

  it('behandelt fehlenden User als checking und navigiert weg', () => {
    authState.user = null;
    const { result } = renderHook(() => useAdminGuard());
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.checking).toBe(true);
    expect(navSpy).toHaveBeenCalledWith('/', { replace: true });
  });
});
