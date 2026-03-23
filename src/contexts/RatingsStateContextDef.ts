import type React from 'react';
import { createContext, useContext } from 'react';

export interface RatingsState {
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

export const RatingsStateContext = createContext<RatingsStateContextType | null>(null);

export const useRatingsState = () => {
  const context = useContext(RatingsStateContext);
  if (!context) {
    throw new Error('useRatingsState must be used within RatingsStateProvider');
  }
  return context;
};
