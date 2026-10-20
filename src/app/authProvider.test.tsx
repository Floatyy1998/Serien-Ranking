// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';

const { onAuthStateChangedMock, initFirebaseMock, captureErrorMock } = vi.hoisted(() => ({
  captureErrorMock: vi.fn(),
  onAuthStateChangedMock: vi.fn((cb: (u: unknown) => void) => {
    cb(null);
    return () => {};
  }),
  initFirebaseMock: vi.fn(),
}));

vi.mock('firebase/compat/app', () => ({
  default: { auth: () => ({ onAuthStateChanged: onAuthStateChangedMock }) },
}));
vi.mock('../services/firebase/initFirebase', () => ({ initFirebase: initFirebaseMock }));
vi.mock('../services/firebase/analytics', () => ({
  initAnalyticsIfConsented: vi.fn(),
  setAnalyticsUser: vi.fn(),
}));
vi.mock('../services/offline/offlineFirebaseService', () => ({
  offlineFirebaseService: { cacheData: vi.fn<() => Promise<void>>() },
}));
vi.mock('./themeHelpers', () => ({
  adjustBrightness: () => '#ffffff',
  updateThemeColorMeta: vi.fn(),
}));
vi.mock('../features/badges/offlineBadgeSystem', () => ({
  getOfflineBadgeSystem: () => ({
    checkForNewBadges: vi.fn<() => Promise<unknown[]>>().mockResolvedValue([]),
  }),
}));
vi.mock('../services/firebase/userSearchIndex', () => ({ syncUserSearchIndex: vi.fn() }));
vi.mock('../services/errorReporting/errorReporter', () => ({
  captureError: captureErrorMock,
  setErrorReporterUser: vi.fn(),
}));

import { AuthProvider } from './authProvider';
import { useAuth } from '../contexts/AuthContext';

const Consumer = () => {
  const auth = useAuth();
  return <div>RESOLVED:{String(auth?.authStateResolved)}</div>;
};

afterEach(() => {
  cleanup();
  localStorage.clear();
  captureErrorMock.mockClear();
  vi.useRealTimers();
});

describe('AuthProvider', () => {
  it('renders its children', () => {
    render(
      <AuthProvider>
        <div>CHILD</div>
      </AuthProvider>
    );
    expect(screen.getByText('CHILD')).toBeInTheDocument();
  });

  it('initializes firebase and resolves the auth state', async () => {
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );
    await waitFor(() => expect(initFirebaseMock).toHaveBeenCalled());
    await waitFor(() => expect(onAuthStateChangedMock).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText('RESOLVED:true')).toBeInTheDocument());
  });

  it('meldet ohne gespeicherte Sitzung nichts', async () => {
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByText('RESOLVED:true')).toBeInTheDocument());
    expect(captureErrorMock).not.toHaveBeenCalled();
  });

  it('wartet mit gespeicherter Sitzung länger als 5 s auf Firebase', () => {
    vi.useFakeTimers();
    localStorage.setItem('cachedUser', JSON.stringify({ uid: 'u1' }));
    onAuthStateChangedMock.mockImplementationOnce(() => () => {});
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );
    act(() => vi.advanceTimersByTime(6000));
    expect(screen.getByText('RESOLVED:false')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(25000));
    expect(screen.getByText('RESOLVED:true')).toBeInTheDocument();
  });
});
