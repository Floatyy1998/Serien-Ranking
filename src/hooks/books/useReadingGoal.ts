import { useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { paths } from '../../services/db/ref';
import { setReadingGoal } from '../../services/books/bookService';
import { useEnhancedFirebaseCache } from '../data/useEnhancedFirebaseCache';

export function useReadingGoal(year: number) {
  const { user } = useAuth() || {};
  const { data, loading } = useEnhancedFirebaseCache<number>(
    user ? paths.bookGoal(user.uid, year) : '',
    { ttl: 24 * 60 * 60 * 1000, useRealtimeListener: true, enableOfflineSupport: true }
  );
  const save = useCallback(
    (goal: number) => (user ? setReadingGoal(user.uid, year, goal) : Promise.resolve()),
    [user, year]
  );
  return { goal: typeof data === 'number' && data > 0 ? data : 0, loading, save };
}
