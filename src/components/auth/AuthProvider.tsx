import { createContext, useContext, useEffect, useState } from 'react';
import apiService from '../../services/api.service';

interface User {
  uid: string;
  email: string;
  username: string;
  displayName: string;
  profileImage?: string;
  photoURL?: string; // Firebase/imported field name
  theme?: {
    primaryColor: string;
    mode: 'light' | 'dark' | 'auto';
  };
  stats?: {
    totalSeries: number;
    totalMovies: number;
    totalWatchTime: number;
    episodesWatched: number;
  };
}

interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  authStateResolved: boolean;
  isOffline: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authStateResolved, setAuthStateResolved] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check auth state on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        
        if (token) {
          const userData = await apiService.getCurrentUser();
          setUser(userData);
          apiService.connectSocket();
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('auth_token');
      } finally {
        setAuthStateResolved(true);
        window.setAppReady?.('auth', true);
        window.setAppReady?.('firebase', true); // For compatibility
        window.setAppReady?.('emailVerification', true);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiService.login(email, password);
      setUser(response.user);
      
      // Update last login in backend is handled by the API
      window.location.href = '/';
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  };

  const register = async (email: string, password: string, username: string, displayName?: string) => {
    try {
      const response = await apiService.register(email, password, username, displayName);
      setUser(response.user);
      
      window.location.href = '/';
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.response?.data?.error || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
      setUser(null);
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails on backend, clear local state
      localStorage.removeItem('auth_token');
      setUser(null);
      window.location.href = '/login';
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    try {
      const updatedUser = await apiService.updateProfile(updates);
      setUser(updatedUser);
    } catch (error: any) {
      console.error('Profile update error:', error);
      throw new Error(error.response?.data?.error || 'Profile update failed');
    }
  };

  // Handle offline mode with cached data
  useEffect(() => {
    if (isOffline && user) {
      // Store user data in localStorage for offline access
      localStorage.setItem('cached_user', JSON.stringify(user));
    }
  }, [isOffline, user]);

  // Load cached user data when offline
  useEffect(() => {
    if (isOffline && !user) {
      const cachedUser = localStorage.getItem('cached_user');
      if (cachedUser) {
        try {
          const userData = JSON.parse(cachedUser);
          setUser(userData);
        } catch (error) {
          console.error('Failed to parse cached user:', error);
        }
      }
    }
  }, [isOffline]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      setUser, 
      authStateResolved, 
      isOffline,
      login,
      register,
      logout,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};