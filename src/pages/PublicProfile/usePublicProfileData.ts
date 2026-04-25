import firebase from 'firebase/compat/app';
import { fetchStaticCatalogSeries, fetchStaticCatalogMovies } from '../../lib/staticCatalog';
import 'firebase/compat/database';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { PublicItem, PublicFilters, PublicUserData } from './publicProfileHelpers';
import { useResolvedTheme, calculatePublicRating, applyFilters } from './publicProfileHelpers';

// Re-export types for backward compatibility
export type {
  PublicProvider,
  PublicEpisode,
  PublicSeason,
  PublicItem,
  PublicFilters,
  FallbackTheme,
  PublicTheme,
} from './publicProfileHelpers';
export { calculatePublicRating, calculateProgress } from './publicProfileHelpers';

/* ================================================================== */
/*  Main hook                                                          */
/* ================================================================== */

export function usePublicProfileData() {
  const { publicId } = useParams();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const currentTheme = useResolvedTheme();

  /* state */
  const [loading, setLoading] = useState(true);
  const [profileName, setProfileName] = useState('');
  const [profileSeries, setProfileSeries] = useState<PublicItem[]>([]);
  const [profileMovies, setProfileMovies] = useState<PublicItem[]>([]);
  const [activeTab, setActiveTab] = useState<'series' | 'movies'>('series');
  const [profileExists, setProfileExists] = useState(true);
  const [filters, setFilters] = useState<PublicFilters>({});

  /* ----- data fetching ----- */
  useEffect(() => {
    const loadPublicProfileData = async () => {
      if (!publicId) return;

      try {
        // Step 1: publicId -> userId via oeffentlich lesbarer Lookup-Node.
        // (Vorher wurde der gesamte /users-Tree iteriert, was unter den
        // aktuellen Security-Rules ohne Auth nicht mehr erlaubt ist.)
        const lookupSnap = await firebase
          .database()
          .ref(`publicProfiles/${publicId}`)
          .once('value');
        const lookup = lookupSnap.val() as { userId?: string } | null;
        const foundUserId = lookup?.userId || null;

        if (!foundUserId) {
          setProfileExists(false);
          setLoading(false);
          return;
        }

        // Step 2: User-Profil-Felder laden (username, displayName, isPublicProfile).
        const [
          profileSnap,
          seriesSnapshot,
          moviesSnapshot,
          staticSeriesCatalog,
          staticMoviesCatalog,
        ] = await Promise.all([
          firebase.database().ref(`users/${foundUserId}`).once('value'),
          firebase.database().ref(`users/${foundUserId}/series`).once('value'),
          firebase.database().ref(`users/${foundUserId}/movies`).once('value'),
          fetchStaticCatalogSeries(),
          fetchStaticCatalogMovies(),
        ]);

        const profile = profileSnap.val() as PublicUserData | null;
        if (!profile || !profile.isPublicProfile) {
          setProfileExists(false);
          setLoading(false);
          return;
        }
        setProfileName(profile.username || profile.displayName || 'Unbekannt');

        const series = seriesSnapshot.val();
        const catalogSeries: Record<string, unknown> = (staticSeriesCatalog || {}) as Record<
          string,
          unknown
        >;

        if (series) {
          const seriesArray = Object.entries(series).map(([tmdbId, userRef]) => {
            const ref = userRef as Record<string, unknown>;
            const cat = catalogSeries[tmdbId] as Record<string, unknown> | undefined;
            return {
              id: parseInt(tmdbId),
              nmr: (ref.legacyNmr as number) || parseInt(tmdbId),
              title: cat?.title as string,
              poster: cat?.poster ? { poster: cat.poster as string } : { poster: '' },
              rating: (ref.rating || {}) as Record<string, number>,
              genre: cat?.genres ? { genres: cat.genres as string[] } : undefined,
              genres: (cat?.genres as string[]) || [],
              provider: cat?.providers
                ? { provider: cat.providers as { id: number; logo: string; name: string }[] }
                : undefined,
              seasons: [],
            };
          });
          setProfileSeries(seriesArray);
        }

        const movies = moviesSnapshot.val();
        const catalogMovies: Record<string, unknown> = (staticMoviesCatalog || {}) as Record<
          string,
          unknown
        >;

        if (movies) {
          const moviesArray = Object.entries(movies).map(([tmdbId, userRef]) => {
            const ref = userRef as Record<string, unknown>;
            const cat = catalogMovies[tmdbId] as Record<string, unknown> | undefined;
            return {
              id: parseInt(tmdbId),
              nmr: (ref.legacyNmr as number) || parseInt(tmdbId),
              title: cat?.title as string,
              poster: cat?.poster ? { poster: cat.poster as string } : { poster: '' },
              rating: (ref.rating || {}) as Record<string, number>,
              genre: cat?.genres ? { genres: cat.genres as string[] } : undefined,
              genres: (cat?.genres as string[]) || [],
              provider: cat?.providers
                ? { provider: cat.providers as { id: number; logo: string; name: string }[] }
                : undefined,
              release_date: cat?.releaseDate as string | undefined,
            };
          });
          setProfileMovies(moviesArray);
        }
      } catch (error) {
        console.error('Error loading public profile:', error);
        setProfileExists(false);
      } finally {
        setLoading(false);
      }
    };

    loadPublicProfileData();
  }, [publicId]);

  /* ----- filtered / sorted lists ----- */
  const ratedSeries = useMemo(
    () => applyFilters(profileSeries, filters, false),
    [profileSeries, filters]
  );

  const ratedMovies = useMemo(
    () => applyFilters(profileMovies, filters, true),
    [profileMovies, filters]
  );

  const currentItems = activeTab === 'series' ? ratedSeries : ratedMovies;

  /* ----- average rating ----- */
  const averageRating = useMemo(() => {
    const allItems = [...profileSeries, ...profileMovies];
    const withRating = allItems.filter((item) => {
      const r = parseFloat(calculatePublicRating(item));
      return !isNaN(r) && r > 0;
    });
    if (withRating.length === 0) return 0;
    const total = withRating.reduce(
      (sum, item) => sum + parseFloat(calculatePublicRating(item)),
      0
    );
    return total / withRating.length;
  }, [profileSeries, profileMovies]);

  const itemsWithRatingCount = useMemo(() => {
    const allItems = [...profileSeries, ...profileMovies];
    return allItems.filter((item) => {
      const r = parseFloat(calculatePublicRating(item));
      return !isNaN(r) && r > 0;
    }).length;
  }, [profileSeries, profileMovies]);

  /* ----- scroll position restore ----- */
  useEffect(() => {
    const shouldRestore = sessionStorage.getItem('shouldRestorePublicProfileScroll');

    if (shouldRestore === 'true' && currentItems.length > 0) {
      sessionStorage.removeItem('shouldRestorePublicProfileScroll');

      const scrollKey = `publicProfilePageScroll_${publicId}_${activeTab}`;
      const position = sessionStorage.getItem(scrollKey);
      const scrollSource = sessionStorage.getItem(
        `publicProfilePageScrollSource_${publicId}_${activeTab}`
      );

      if (position) {
        const scrollTop = parseInt(position, 10);
        if (scrollTop > 0) {
          const restoreScroll = () => {
            if (scrollSource && scrollSource.startsWith('parent-')) {
              const parentIndex = parseInt(scrollSource.split('-')[1], 10);
              let element = scrollRef.current?.parentElement;
              for (let i = 0; i < parentIndex && element; i++) {
                element = element.parentElement;
              }
              if (element) {
                if (element.scrollHeight > element.clientHeight) {
                  element.scrollTop = scrollTop;
                  setTimeout(() => {
                    if (element && element.scrollTop < scrollTop * 0.8) {
                      element.scrollTop = scrollTop;
                    }
                  }, 50);
                } else {
                  setTimeout(restoreScroll, 200);
                }
              }
            }
          };

          setTimeout(restoreScroll, 500);
        }
      }
    }
  }, [publicId, activeTab, currentItems.length]);

  /* ----- save scroll + navigate ----- */
  const handleItemClick = useCallback(
    (item: PublicItem, type: 'series' | 'movie') => {
      let position = 0;
      let scrollSource = '';

      let element = scrollRef.current?.parentElement;
      let parentIndex = 0;
      while (element && parentIndex < 5) {
        if (element.scrollTop > 0) {
          position = element.scrollTop;
          scrollSource = `parent-${parentIndex}`;
          break;
        }
        element = element.parentElement;
        parentIndex++;
      }

      if (position === 0) {
        if (scrollRef.current && scrollRef.current.scrollTop > 0) {
          position = scrollRef.current.scrollTop;
          scrollSource = 'container';
        } else if (window.scrollY > 0) {
          position = window.scrollY;
          scrollSource = 'window';
        } else if (document.documentElement.scrollTop > 0) {
          position = document.documentElement.scrollTop;
          scrollSource = 'documentElement';
        } else if (document.body.scrollTop > 0) {
          position = document.body.scrollTop;
          scrollSource = 'body';
        }
      }

      if (position > 0) {
        try {
          const scrollKey = `publicProfilePageScroll_${publicId}_${activeTab}`;
          sessionStorage.setItem(scrollKey, position.toString());
          sessionStorage.setItem(
            `publicProfilePageScrollSource_${publicId}_${activeTab}`,
            scrollSource
          );
          sessionStorage.setItem('shouldRestorePublicProfileScroll', 'true');
        } catch (error) {
          console.error('Error saving scroll position:', error);
        }
      }

      navigate(type === 'series' ? `/series/${item.id}` : `/movie/${item.id}`);
    },
    [navigate, publicId, activeTab]
  );

  return {
    /* theme */
    currentTheme,
    /* route */
    publicId,
    navigate,
    scrollRef,
    /* loading / error */
    loading,
    profileExists,
    /* profile info */
    profileName,
    averageRating,
    itemsWithRatingCount,
    /* tab */
    activeTab,
    setActiveTab: ((tab: 'series' | 'movies') => {
      setActiveTab(tab);
    }) as React.Dispatch<React.SetStateAction<'series' | 'movies'>>,
    /* filters */
    filters,
    setFilters,
    /* items */
    ratedSeries,
    ratedMovies,
    currentItems,
    /* actions */
    handleItemClick,
  };
}
