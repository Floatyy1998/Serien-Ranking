import { useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useEnhancedFirebaseCache } from '../hooks/data/useEnhancedFirebaseCache';
import { paths } from '../services/db/ref';
import type { Book } from '../types/Book';
import { BooksListContext } from './BooksListContext';

export const BooksListProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth() || {};

  const { data, loading, refetch, isStale, isOffline } = useEnhancedFirebaseCache<
    Record<string, Book>
  >(user ? paths.books(user.uid) : '', {
    ttl: 24 * 60 * 60 * 1000,
    useRealtimeListener: true,
    enableOfflineSupport: true,
    syncOnReconnect: true,
  });

  const allBookList = useMemo(
    () =>
      data
        ? Object.entries(data)
            .filter(([, b]) => b && b.title)
            .map(([id, b]) => ({
              ...b,
              id,
              authors: b.authors ?? [],
              currentPage: b.currentPage ?? 0,
            }))
        : [],
    [data]
  );
  const bookList = useMemo(() => allBookList.filter((b) => !b.hidden), [allBookList]);
  const hiddenBookList = useMemo(() => allBookList.filter((b) => b.hidden), [allBookList]);

  const value = useMemo(
    () => ({
      bookList,
      allBookList,
      hiddenBookList,
      loading,
      refetchBooks: refetch,
      isOffline,
      isStale,
    }),
    [bookList, allBookList, hiddenBookList, loading, refetch, isOffline, isStale]
  );

  return <BooksListContext.Provider value={value}>{children}</BooksListContext.Provider>;
};
