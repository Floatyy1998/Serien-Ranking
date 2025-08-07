import { Box, Typography } from '@mui/material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMovieList } from '../../contexts/MovieListProvider';
import { useDebounce } from '../../hooks/useDebounce';
import { calculateOverallRating } from '../../utils/rating';
import { MovieCard } from './MovieCard';

interface MovieGridProps {
  searchValue: string;
  selectedGenre: string;
  selectedProvider: string;
  viewOnlyMode?: boolean;
  targetUserId?: string;
}

// React 19: Automatische Memoization - kein memo nötig
export const MovieGrid = ({
  searchValue,
  selectedGenre,
  selectedProvider,
  viewOnlyMode = false,
  targetUserId,
}: MovieGridProps) => {
  const { movieList: contextMovieList } = useMovieList();
  const [friendMovieList, setFriendMovieList] = useState<any[]>([]);
  const [friendMoviesLoading, setFriendMoviesLoading] = useState(false);

  // Verwende Freund-Filme oder eigene Filme (memoisiert, um Endlosschleifen zu verhindern)
  const movieList = useMemo(() => {
    if (targetUserId) {
      if (friendMoviesLoading) return [];
      return friendMovieList;
    }
    return contextMovieList;
  }, [targetUserId, friendMoviesLoading, friendMovieList, contextMovieList]);

  const debouncedSearchValue = useDebounce(searchValue, 300);
  const [visibleCount, setVisibleCount] = useState(20);
  const [startIndex, setStartIndex] = useState(0);
  const [filteredMovies, setFilteredMovies] = useState<any[]>([]);

  // Lade Freund-Filme wenn targetUserId gesetzt ist
  useEffect(() => {
    if (!targetUserId) {
      setFriendMovieList([]);
      setFriendMoviesLoading(false);
      return;
    }

    setFriendMoviesLoading(true);
    const friendMoviesRef = firebase.database().ref(`${targetUserId}/filme`);

    // Real-time listener für automatische Updates
    const listener = friendMoviesRef.on(
      'value',
      (snapshot) => {
        const data = snapshot.val() || {};

        if (data === null && !snapshot.exists()) {
          setFriendMovieList([]);
        } else if (data && typeof data === 'object') {
          const movies = Object.values(data) as any[];
          setFriendMovieList(movies);
        } else {
          setFriendMovieList([]);
        }
        setFriendMoviesLoading(false);
      },
      () => {
        setFriendMovieList([]);
        setFriendMoviesLoading(false);
      }
    );

    // Cleanup function
    return () => {
      friendMoviesRef.off('value', listener);
    };
  }, [targetUserId]);

  // Filtere und sortiere die Filme basierend auf den Suchkriterien
  useEffect(() => {
    const filtered = (movieList || [])
      .filter((movie: any) => {
        const matchesSearch = movie.title
          .toLowerCase()
          .includes(debouncedSearchValue.toLowerCase());
        const matchesGenre =
          selectedGenre === 'All' ||
          (selectedGenre === 'Ohne Bewertung' &&
            calculateOverallRating(movie) === '0.00') ||
          selectedGenre === 'Zuletzt Hinzugefügt' ||
          (selectedGenre === 'Watchlist' && movie.watchlist) ||
          (selectedGenre === 'Noch nicht Veröffentlicht' &&
            movie.status !== 'Released') ||
          movie.genre.genres.includes(selectedGenre);
        const matchesProvider =
          selectedProvider === 'All' ||
          (movie.provider?.provider &&
            movie.provider.provider.some(
              (p: any) => p.name === selectedProvider
            ));
        return matchesSearch && matchesGenre && matchesProvider;
      })
      .sort((a: any, b: any) => {
        if (selectedGenre === 'Zuletzt Hinzugefügt') {
          return b.nmr - a.nmr;
        }
        if (selectedGenre === 'Noch nicht Veröffentlicht') {
          const dateA = a.release_date ? new Date(a.release_date).getTime() : 0;
          const dateB = b.release_date ? new Date(b.release_date).getTime() : 0;
          return dateA - dateB;
        }
        const ratingA = parseFloat(calculateOverallRating(a));
        const ratingB = parseFloat(calculateOverallRating(b));
        return ratingB - ratingA;
      });

    setFilteredMovies(filtered);
  }, [movieList, debouncedSearchValue, selectedGenre, selectedProvider]);

  // React 19: Automatische Memoization - kein useCallback nötig
  const handleWindowScroll = useCallback(() => {
    const scrollTop = window.scrollY;
    const windowHeight = window.innerHeight;
    const fullHeight = document.body.offsetHeight;

    const currentMovies =
      filteredMovies?.length > 0 ? filteredMovies : movieList || [];
      
    // Berechne Grid-Parameter
    const cardWidth = 230;
    const cardHeight = 444;
    const gap = 75;
    let columns = Math.floor(window.innerWidth / (cardWidth + gap));
    if (columns < 1) columns = 1;
    
    const rowHeight = cardHeight + gap;
    const viewportStart = Math.max(0, scrollTop - windowHeight);
    const viewportEnd = scrollTop + windowHeight * 2; // Buffer für smooth scrolling
    
    // Berechne sichtbare Reihen
    const startRow = Math.floor(viewportStart / rowHeight);
    const endRow = Math.ceil(viewportEnd / rowHeight);
    
    const newStartIndex = Math.max(0, startRow * columns);
    const newEndIndex = Math.min(currentMovies?.length || 0, (endRow + 1) * columns);
    const newVisibleCount = newEndIndex - newStartIndex;
    
    // Virtualization: Aktiviere bei mehr als 40 Filmen für bessere Performance
    if (currentMovies?.length > 40) {
      setStartIndex(newStartIndex);
      setVisibleCount(Math.min(newVisibleCount, 60)); // Max 60 Cards gleichzeitig (reduziert von 80)
    } else {
      // Bei wenigen Filmen: normales infinite scroll, aber limitiert auf 40 max
      if (scrollTop + windowHeight >= fullHeight - 1000 && visibleCount < Math.min(40, currentMovies?.length || 0)) {
        const itemsToAdd = Math.min(columns, 8); // Reduziert von 12 auf 8
        setVisibleCount((prev) => Math.min(prev + itemsToAdd, 40, currentMovies?.length || 0));
      }
    }
  }, [visibleCount, startIndex, filteredMovies, movieList]);

  useEffect(() => {
    // Debounced scroll handler für bessere Performance
    let ticking = false;
    const debouncedHandleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleWindowScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', debouncedHandleScroll, { passive: true });
    return () => window.removeEventListener('scroll', debouncedHandleScroll);
  }, [handleWindowScroll]);

  useEffect(() => {
    const cardWidth = 230;
    const gap = 75;
    let columns = Math.floor(window.innerWidth / (cardWidth + gap));
    if (columns < 1) columns = 1;
    const base = 20;
    let initialVisible = Math.ceil(base / columns) * columns;

    const currentMovies =
      filteredMovies?.length > 0 ? filteredMovies : movieList || [];
    if (initialVisible > currentMovies?.length) {
      initialVisible = currentMovies?.length;
    }
    setVisibleCount(initialVisible);
  }, [
    debouncedSearchValue,
    selectedGenre,
    selectedProvider,
    filteredMovies,
    movieList,
  ]);

  // Loading state für Freund-Filme
  if (targetUserId && friendMoviesLoading) {
    return (
      <Box className='flex justify-center items-center w-full h-full'>
        <Typography variant='h2' className='text-center'>
          Lade Filme...
        </Typography>
      </Box>
    );
  }

  // Überprüfe sowohl die gefilterte Liste als auch die ursprüngliche movieList
  if (
    (filteredMovies?.length === 0 || (movieList && movieList.length === 0)) &&
    selectedGenre === 'All'
  ) {
    return (
      <Box className='flex justify-center items-center w-full h-full'>
        <Typography variant='h2' className='text-center'>
          {targetUserId
            ? 'Dieser Benutzer hat noch keine Filme hinzugefügt.'
            : 'Noch keine Filme vorhanden. Füge einen Film über das Menü hinzu.'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', m: 0, p: 0 }}>
      {/* Top Spacer für Virtualization */}
      {(() => {
        const currentMovies = filteredMovies?.length > 0 ? filteredMovies : movieList || [];
        const cardHeight = 444;
        const gap = 75;
        const cardWidth = 230;
        const columns = Math.max(1, Math.floor(window.innerWidth / (cardWidth + gap)));
        const rowHeight = cardHeight + gap;
        
        const shouldVirtualize = currentMovies?.length > 40;
        const topSpacerHeight = shouldVirtualize
          ? Math.floor(startIndex / columns) * rowHeight 
          : 0;
          
        return topSpacerHeight > 0 && (
          <Box sx={{ height: `${topSpacerHeight}px`, width: '100%' }} />
        );
      })()}
      
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '75px',
          justifyContent: 'center',
          p: 2,
          boxSizing: 'border-box',
        }}
      >
        {(() => {
          // Berechne welche Filme gerendert werden sollen
          const currentMovies = filteredMovies?.length > 0 ? filteredMovies : movieList || [];
          const shouldVirtualize = currentMovies?.length > 40;
          const visibleMovies = shouldVirtualize
            ? currentMovies.slice(startIndex, startIndex + visibleCount)
            : currentMovies?.slice(0, Math.min(visibleCount, 40)); // Max 40 Movies ohne Virtualizierung

          return visibleMovies?.map((movie: any, index: number) => (
            <Box key={movie.id || movie.nmr || (startIndex + index)} sx={{ width: '230px', height: '444px' }}>
              <MovieCard
                movie={movie}
                genre={selectedGenre}
                index={startIndex + index + 1}
                disableRatingDialog={viewOnlyMode}
                forceReadOnlyDialogs={viewOnlyMode}
                disableDeleteDialog={viewOnlyMode}
              />
            </Box>
          ));
        })()}
      </Box>
      
      {/* Bottom Spacer für Virtualization */}
      {(() => {
        const currentMovies = filteredMovies?.length > 0 ? filteredMovies : movieList || [];
        const cardHeight = 444;
        const gap = 75;
        const cardWidth = 230;
        const columns = Math.max(1, Math.floor(window.innerWidth / (cardWidth + gap)));
        const rowHeight = cardHeight + gap;
        
        const shouldVirtualize = currentMovies?.length > 40;
        const remainingItems = currentMovies?.length - startIndex - visibleCount;
        const bottomSpacerHeight = shouldVirtualize && remainingItems > 0
          ? Math.ceil(remainingItems / columns) * rowHeight
          : 0;
          
        return bottomSpacerHeight > 0 && (
          <Box sx={{ height: `${bottomSpacerHeight}px`, width: '100%' }} />
        );
      })()}
    </Box>
  );
};

export default MovieGrid;
