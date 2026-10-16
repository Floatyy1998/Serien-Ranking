// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const navigate = vi.hoisted(() => vi.fn<(path: string, opts?: unknown) => void>());
const authState = vi.hoisted(() => ({
  value: {
    user: { uid: 'u1', displayName: 'Alice' },
    onboardingComplete: false as boolean,
    setOnboardingComplete: vi.fn<(v: boolean) => void>(),
  },
}));

vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => authState.value }));

vi.mock('./hooks/useOnboardingSearch', () => ({
  useOnboardingSearch: () => ({
    suggestions: [],
    searchResults: [],
    loading: false,
    searchLoading: false,
    fetchSuggestions: vi.fn(),
    search: vi.fn(),
    addToList: vi.fn(async () => true),
    setSearchResults: vi.fn(),
  }),
}));
vi.mock('./hooks/useWaitForBackendItem', () => ({
  useWaitForBackendItem: () => vi.fn(async () => {}),
}));
vi.mock('./hooks/useApplyWatchProgress', () => ({
  useApplyWatchProgress: () => vi.fn(async () => {}),
}));
vi.mock('../../hooks/provider/useActiveSubscriptions', () => ({
  invalidateActiveSubscriptions: vi.fn(),
}));

vi.mock('./steps/WelcomeStep', () => ({ WelcomeStep: () => <div>welcome-step</div> }));
vi.mock('./steps/FocusStep', () => ({
  FocusStep: ({ onChange, onNext }: { onChange: (f: string) => void; onNext: () => void }) => (
    <div>
      focus-step
      <button onClick={() => onChange('read')}>pick-read</button>
      <button onClick={onNext}>focus-next</button>
    </div>
  ),
}));
vi.mock('./steps/ReadingStep', () => ({ ReadingStep: () => <div>reading-step</div> }));
vi.mock('./steps/DiscoveryStep', () => ({ DiscoveryStep: () => <div>discovery-step</div> }));
vi.mock('./steps/SubscriptionsStep', () => ({ SubscriptionsStep: () => <div>subs-step</div> }));
vi.mock('./steps/CompletionStep', () => ({ CompletionStep: () => <div>completion-step</div> }));

vi.mock('firebase/compat/app', () => ({
  default: { database: () => ({ ref: () => ({ set: vi.fn(async () => {}) }) }) },
}));
// Offline-Queue haengt an einer initialisierten Firebase-App — im Test nur der Write.
vi.mock('../../services/offline/queuedUpdate', () => ({
  applyUserUpdate: vi.fn(async () => ({ queued: false })),
}));
vi.mock('../../services/account/onboardingProgress', () => ({
  markOnboardingStep: vi.fn(async () => {}),
  signupProvider: (id?: string) => id ?? 'unbekannt',
}));
vi.mock('firebase/compat/database', () => ({}));

import { OnboardingPage } from './OnboardingPage';

beforeEach(() => {
  navigate.mockReset();
  authState.value = {
    user: { uid: 'u1', displayName: 'Alice' },
    onboardingComplete: false,
    setOnboardingComplete: vi.fn<(v: boolean) => void>(),
  };
});
afterEach(() => cleanup());

describe('OnboardingPage', () => {
  it('fragt zuerst nach dem Schwerpunkt', () => {
    render(<OnboardingPage />);
    expect(screen.getByText('focus-step')).toBeInTheDocument();
    expect(screen.getByText(/01 \/ 08/)).toBeInTheDocument();
    expect(screen.getByText('Auftakt')).toBeInTheDocument();
  });

  it('kürzt das Programm für Lese-Nutzer auf Kuration, Lesen, Pet, Premiere', () => {
    render(<OnboardingPage />);
    fireEvent.click(screen.getByText('pick-read'));
    fireEvent.click(screen.getByText('focus-next'));
    expect(screen.getByText('welcome-step')).toBeInTheDocument();
    expect(screen.getByText(/02 \/ 05/)).toBeInTheDocument();
  });

  it('redirects home when onboarding is already complete', async () => {
    authState.value = {
      user: { uid: 'u1', displayName: 'Alice' },
      onboardingComplete: true,
      setOnboardingComplete: vi.fn<(v: boolean) => void>(),
    };
    render(<OnboardingPage />);
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/', { replace: true }));
  });
});
