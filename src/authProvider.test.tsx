// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';

const { onAuthStateChangedMock, initFirebaseMock } = vi.hoisted(() => ({
  onAuthStateChangedMock: vi.fn((cb: (u: unknown) => void) => {
    cb(null);
    return () => {};
  }),
  initFirebaseMock: vi.fn(),
}));

vi.mock('firebase/compat/app', () => ({
  default: { auth: () => ({ onAuthStateChanged: onAuthStateChangedMock }) },
}));
vi.mock('./services/firebase/initFirebase', () => ({ initFirebase: initFirebaseMock }));
vi.mock('./services/firebase/analytics', () => ({
  initAnalyticsIfConsented: vi.fn(),
  setAnalyticsUser: vi.fn(),
}));
vi.mock('./services/offlineFirebaseService', () => ({
  offlineFirebaseService: { cacheData: vi.fn<() => Promise<void>>() },
}));
vi.mock('./themeHelpers', () => ({
  adjustBrightness: () => '#ffffff',
  updateThemeColorMeta: vi.fn(),
}));
vi.mock('./features/badges/offlineBadgeSystem', () => ({
  getOfflineBadgeSystem: () => ({
    checkForNewBadges: vi.fn<() => Promise<unknown[]>>().mockResolvedValue([]),
  }),
}));
vi.mock('./services/firebase/userSearchIndex', () => ({ syncUserSearchIndex: vi.fn() }));

import { AuthProvider } from './authProvider';
import { useAuth } from './contexts/AuthContext';

const Consumer = () => {
  const auth = useAuth();
  return <div>RESOLVED:{String(auth?.authStateResolved)}</div>;
};

afterEach(() => cleanup());

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
});
