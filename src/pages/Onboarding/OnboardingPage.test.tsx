// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';

const navigate = vi.hoisted(() => vi.fn<(path: string, opts?: unknown) => void>());
const authState = vi.hoisted(() => ({
  value: {
    user: { uid: 'u1', displayName: 'Alice' },
    onboardingComplete: false as boolean,
    setOnboardingComplete: vi.fn<(v: boolean) => void>(),
  },
}));

vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));
vi.mock('../../AuthContext', () => ({ useAuth: () => authState.value }));

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
vi.mock('../../hooks/useActiveSubscriptions', () => ({
  invalidateActiveSubscriptions: vi.fn(),
}));

vi.mock('./steps/WelcomeStep', () => ({ WelcomeStep: () => <div>welcome-step</div> }));
vi.mock('./steps/DiscoveryStep', () => ({ DiscoveryStep: () => <div>discovery-step</div> }));
vi.mock('./steps/SubscriptionsStep', () => ({ SubscriptionsStep: () => <div>subs-step</div> }));
vi.mock('./steps/CompletionStep', () => ({ CompletionStep: () => <div>completion-step</div> }));

vi.mock('firebase/compat/app', () => ({
  default: { database: () => ({ ref: () => ({ set: vi.fn(async () => {}) }) }) },
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
  it('renders the welcome step and progress on the first step', () => {
    render(<OnboardingPage />);
    expect(screen.getByText('welcome-step')).toBeInTheDocument();
    expect(screen.getByText(/01 \/ 05/)).toBeInTheDocument();
    expect(screen.getByText('Kuration')).toBeInTheDocument();
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
