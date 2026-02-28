import React, { createContext, useContext, useRef, ReactNode } from 'react';

interface RatingsState {
  activeTab: 'series' | 'movies';
  sortOption: string;
  selectedGenre: string;
  selectedProvider: string | null;
  showUnrated: boolean;
}

interface RatingsStateContextType {
  getRatingsState: () => RatingsState;
  updateRatingsState: (updates: Partial<RatingsState>) => void;
  saveScrollPosition: () => void;
  restoreScrollPosition: () => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}

const RatingsStateContext = createContext<RatingsStateContextType | null>(null);

const STORAGE_KEY = 'ratingsPageState';
const SCROLL_STORAGE_KEY = 'ratingsPageScroll';

const DEFAULT_STATE: RatingsState = {
  activeTab: 'series',
  sortOption: 'rating-desc',
  selectedGenre: 'Alle',
  selectedProvider: null,
  showUnrated: false,
};

// Pure functions that work with sessionStorage only
const getStoredState = (): RatingsState => {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const { scrollPosition, ...state } = parsed;
      return { ...DEFAULT_STATE, ...state };
    }
  } catch (error) {
    console.error('Error loading ratings state:', error);
  }
  return DEFAULT_STATE;
};

const setStoredState = (updates: Partial<RatingsState>) => {
  try {
    const current = getStoredState();
    const newState = { ...current, ...updates };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  } catch (error) {
    console.error('Error saving ratings state:', error);
  }
};

export const RatingsStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const getRatingsState = () => getStoredState();

  const updateRatingsState = (updates: Partial<RatingsState>) => {
    setStoredState(updates);
    // Force a re-render by triggering a custom event
    window.dispatchEvent(new CustomEvent('ratingsStateChange'));
  };

  const saveScrollPosition = () => {
    if (scrollRef.current) {
      const position = scrollRef.current.scrollTop;
      try {
        sessionStorage.setItem(SCROLL_STORAGE_KEY, position.toString());
      } catch (error) {
        console.error('Error saving scroll position:', error);
      }
    }
  };

  const restoreScrollPosition = () => {
    try {
      const position = sessionStorage.getItem(SCROLL_STORAGE_KEY);
      if (position && scrollRef.current) {
        const scrollTop = parseInt(position, 10);
        if (scrollTop > 0) {
          setTimeout(() => {
            if (scrollRef.current) {
              scrollRef.current.scrollTop = scrollTop;
            }
          }, 100);
        }
      }
    } catch (error) {
      console.error('Error restoring scroll position:', error);
    }
  };

  const contextValue = {
    getRatingsState,
    updateRatingsState,
    saveScrollPosition,
    restoreScrollPosition,
    scrollRef,
  };

  return (
    <RatingsStateContext.Provider value={contextValue}>{children}</RatingsStateContext.Provider>
  );
};

export const useRatingsState = () => {
  const context = useContext(RatingsStateContext);
  if (!context) {
    throw new Error('useRatingsState must be used within RatingsStateProvider');
  }
  return context;
};
