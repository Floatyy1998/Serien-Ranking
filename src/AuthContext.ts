import type firebase from 'firebase/compat/app';
import { createContext, useContext } from 'react';

export const AuthContext = createContext<{
  user: firebase.User | null;
  setUser: React.Dispatch<React.SetStateAction<firebase.User | null>>;
  authStateResolved: boolean;
  onboardingComplete: boolean;
  setOnboardingComplete: React.Dispatch<React.SetStateAction<boolean>>;
} | null>(null);

export const useAuth = () => useContext(AuthContext);
