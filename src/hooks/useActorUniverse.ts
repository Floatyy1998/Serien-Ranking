import { useEffect, useMemo, useState } from 'react';
import { useSeriesList } from '../contexts/OptimizedSeriesListProvider';

// Global cache to persist data across navigation
const globalCache = {
  actorMap: new Map<number, Actor>(),
  fetchedSeriesIds: new Set<number>(),
  lastSeriesListHash: '',
};

export interface Actor {
  id: number;
  name: string;
  profilePath: string | null;
  seriesCount: number;
  knownFor: string;
  popularity: number;
  series: {
    id: number;
    title: string;
    character: string;
    poster: string | null;
  }[];
  // Recommendations: other series this actor is in (that user doesn't have)
  recommendations: {
    id: number;
    title: string;
    poster: string | null;
    character: string;
    voteAverage: number;
  }[];
  // Position for galaxy visualization (calculated)
  x?: number;
  y?: number;
  z?: number;
  size?: number;
  color?: string;
}

export interface ActorConnection {
  actor1Id: number;
  actor2Id: number;
  sharedSeries: {
    id: number;
    title: string;
  }[];
  strength: number;
}

export interface ActorUniverseData {
  actors: Actor[];
  connections: ActorConnection[];
  topActors: Actor[];
  recommendations: {
    series: { id: number; title: string; poster: string | null; voteAverage: number };
    actors: { id: number; name: string; character: string }[];
  }[];
  stats: {
    totalActors: number;
    actorsInMultipleSeries: number;
    mostConnectedPair: { actor1: string; actor2: string; count: number } | null;
  };
  loading: boolean;
  progress: number;
  loadingRecommendations: boolean;
}

export const useActorUniverse = (hideVoiceActors: boolean = false): ActorUniverseData => {
  const { seriesList } = useSeriesList();

  // Create a hash to detect if series list changed
  const seriesListHash = useMemo(() => seriesList.map(s => s.id).sort().join(','), [seriesList]);

  // Initialize from cache if available and series list hasn't changed
  const [actorMap, setActorMap] = useState<Map<number, Actor>>(() => {
    if (globalCache.lastSeriesListHash === seriesListHash && globalCache.actorMap.size > 0) {
      return new Map(globalCache.actorMap);
    }
    return new Map();
  });

  const [loading, setLoading] = useState(() => {
    // If we have cached data for this series list, don't show loading
    return !(globalCache.lastSeriesListHash === seriesListHash && globalCache.actorMap.size > 0);
  });

  const [progress, setProgress] = useState(() => {
    return globalCache.lastSeriesListHash === seriesListHash && globalCache.actorMap.size > 0 ? 100 : 0;
  });

  const [fetchedSeriesIds, setFetchedSeriesIds] = useState<Set<number>>(() => {
    if (globalCache.lastSeriesListHash === seriesListHash) {
      return new Set(globalCache.fetchedSeriesIds);
    }
    return new Set();
  });

  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  // Set of user's series IDs for quick lookup
  const userSeriesIds = useMemo(() => new Set(seriesList.map(s => s.id)), [seriesList]);

  // Fetch cast data for all series
  useEffect(() => {
    const fetchAllCasts = async () => {
      const TMDB_API_KEY = import.meta.env.VITE_API_TMDB;
      if (!TMDB_API_KEY || seriesList.length === 0) {
        setLoading(false);
        return;
      }

      const seriesToFetch = seriesList.filter(s => !fetchedSeriesIds.has(s.id));
      if (seriesToFetch.length === 0) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const newActorMap = new Map(actorMap);
      const newFetchedIds = new Set(fetchedSeriesIds);

      const BATCH_SIZE = 5;
      const DELAY_MS = 100;

      for (let i = 0; i < seriesToFetch.length; i += BATCH_SIZE) {
        const batch = seriesToFetch.slice(i, i + BATCH_SIZE);

        await Promise.all(
          batch.map(async (series) => {
            try {
              const response = await fetch(
                `https://api.themoviedb.org/3/tv/${series.id}/credits?api_key=${TMDB_API_KEY}`
              );

              if (!response.ok) return;

              const data = await response.json();
              const cast = data.cast || [];

              // Include all actors (top 25 per series)
              const topCast = cast.slice(0, 25);

              topCast.forEach((member: any) => {
                const existing = newActorMap.get(member.id);

                if (existing) {
                  if (!existing.series.some(s => s.id === series.id)) {
                    existing.seriesCount++;
                    existing.series.push({
                      id: series.id,
                      title: series.title || series.name || 'Unknown',
                      character: member.character || 'Unknown',
                      poster: series.poster?.poster || null,
                    });
                  }
                } else {
                  newActorMap.set(member.id, {
                    id: member.id,
                    name: member.name,
                    profilePath: member.profile_path,
                    knownFor: member.known_for_department || 'Acting',
                    popularity: member.popularity || 0,
                    seriesCount: 1,
                    series: [{
                      id: series.id,
                      title: series.title || series.name || 'Unknown',
                      character: member.character || 'Unknown',
                      poster: series.poster?.poster || null,
                    }],
                    recommendations: [],
                  });
                }
              });

              newFetchedIds.add(series.id);
            } catch (error) {
              // Silently handle errors
            }
          })
        );

        setProgress(Math.min(100, ((i + BATCH_SIZE) / seriesToFetch.length) * 100));

        if (i + BATCH_SIZE < seriesToFetch.length) {
          await new Promise(resolve => setTimeout(resolve, DELAY_MS));
        }
      }

      setActorMap(newActorMap);
      setFetchedSeriesIds(newFetchedIds);
      setLoading(false);
      setProgress(100);

      // Update global cache
      globalCache.actorMap = new Map(newActorMap);
      globalCache.fetchedSeriesIds = new Set(newFetchedIds);
      globalCache.lastSeriesListHash = seriesListHash;
    };

    fetchAllCasts();
  }, [seriesList, seriesListHash]);

  // Fetch recommendations for top actors (their other works)
  useEffect(() => {
    const fetchRecommendations = async () => {
      const TMDB_API_KEY = import.meta.env.VITE_API_TMDB;
      if (!TMDB_API_KEY || loading || actorMap.size === 0) return;

      // Get top 20 actors by series count
      const topActorIds = Array.from(actorMap.values())
        .filter(a => a.seriesCount >= 2)
        .sort((a, b) => b.seriesCount - a.seriesCount)
        .slice(0, 20)
        .map(a => a.id);

      if (topActorIds.length === 0) return;

      setLoadingRecommendations(true);
      const updatedActorMap = new Map(actorMap);

      // Fetch in batches
      for (let i = 0; i < topActorIds.length; i += 3) {
        const batch = topActorIds.slice(i, i + 3);

        await Promise.all(
          batch.map(async (actorId) => {
            try {
              const response = await fetch(
                `https://api.themoviedb.org/3/person/${actorId}/tv_credits?api_key=${TMDB_API_KEY}`
              );

              if (!response.ok) return;

              const data = await response.json();
              const tvCredits = data.cast || [];

              const actor = updatedActorMap.get(actorId);
              if (!actor) return;

              // Filter: series user doesn't have, good rating, real roles
              const recommendations = tvCredits
                .filter((credit: any) => {
                  const notOwned = !userSeriesIds.has(credit.id);
                  const goodRating = credit.vote_average >= 6.5;
                  const hasVotes = credit.vote_count >= 50;
                  const notVoice = !credit.character?.toLowerCase().includes('voice') &&
                    !credit.character?.toLowerCase().includes('(voice)');
                  return notOwned && goodRating && hasVotes && notVoice;
                })
                .sort((a: any, b: any) => b.vote_average - a.vote_average)
                .slice(0, 5)
                .map((credit: any) => ({
                  id: credit.id,
                  title: credit.name || credit.original_name,
                  poster: credit.poster_path,
                  character: credit.character || 'Unknown',
                  voteAverage: credit.vote_average,
                }));

              actor.recommendations = recommendations;
            } catch (error) {
              // Silently handle errors
            }
          })
        );

        await new Promise(resolve => setTimeout(resolve, 150));
      }

      setActorMap(updatedActorMap);
      setLoadingRecommendations(false);
    };

    fetchRecommendations();
  }, [loading, actorMap.size, userSeriesIds]);

  // Helper to check if actor is primarily a voice actor
  const isVoiceActor = (actor: Actor): boolean => {
    if (actor.series.length === 0) return false;
    const voiceRoles = actor.series.filter(s =>
      s.character?.toLowerCase().includes('voice') ||
      s.character?.toLowerCase().includes('(voice)')
    ).length;
    // Consider voice actor if more than half their roles are voice roles
    return voiceRoles > actor.series.length / 2;
  };

  // Calculate actors with positions, connections, and stats
  const universeData = useMemo(() => {
    let significantActors = Array.from(actorMap.values())
      .filter(a => a.seriesCount >= 2)
      .sort((a, b) => b.seriesCount - a.seriesCount);

    // Filter out voice actors if setting is enabled
    if (hideVoiceActors) {
      significantActors = significantActors.filter(a => !isVoiceActor(a));
    }

    const topActors = significantActors.slice(0, 10);
    const displayActors = significantActors.slice(0, 300);

    // Calculate positions in a spiral galaxy pattern
    const actorsWithPositions = displayActors.map((actor, index) => {
      const total = displayActors.length;
      const normalizedIndex = index / total;

      // Spiral galaxy formula with more spread
      const angle = normalizedIndex * Math.PI * 8;
      const radius = 0.1 + normalizedIndex * 0.4;

      const jitter = 0.04;
      const randomAngle = (Math.random() - 0.5) * jitter * Math.PI;
      const randomRadius = (Math.random() - 0.5) * jitter;

      const x = 0.5 + Math.cos(angle + randomAngle) * (radius + randomRadius);
      const y = 0.5 + Math.sin(angle + randomAngle) * (radius + randomRadius);
      const z = Math.random() * 0.5 + 0.25;

      // Size based on series count
      const size = Math.log2(actor.seriesCount + 1) * 10 + 6;

      // Color: Gold for top actors, blue for others
      const isTop = index < 10;
      const hue = isTop ? 45 : 200 + (1 - normalizedIndex) * 40;
      const saturation = isTop ? 80 : 60 + actor.seriesCount * 3;
      const lightness = isTop ? 60 : 50 + actor.seriesCount * 2;
      const color = `hsl(${hue}, ${Math.min(saturation, 90)}%, ${Math.min(lightness, 75)}%)`;

      return { ...actor, x, y, z, size, color };
    });

    // Calculate connections
    const connections: ActorConnection[] = [];
    const actorSeriesMap = new Map<number, Set<number>>();

    actorsWithPositions.forEach(actor => {
      actorSeriesMap.set(actor.id, new Set(actor.series.map(s => s.id)));
    });

    let mostConnectedPair: { actor1: string; actor2: string; count: number } | null = null;

    for (let i = 0; i < actorsWithPositions.length; i++) {
      for (let j = i + 1; j < actorsWithPositions.length; j++) {
        const actor1 = actorsWithPositions[i];
        const actor2 = actorsWithPositions[j];

        const series1 = actorSeriesMap.get(actor1.id)!;
        const series2 = actorSeriesMap.get(actor2.id)!;

        const sharedSeriesIds = [...series1].filter(id => series2.has(id));

        if (sharedSeriesIds.length > 0) {
          const sharedSeries = sharedSeriesIds.map(id => {
            const s = actor1.series.find(s => s.id === id);
            return { id, title: s?.title || 'Unknown' };
          });

          connections.push({
            actor1Id: actor1.id,
            actor2Id: actor2.id,
            sharedSeries,
            strength: sharedSeriesIds.length,
          });

          if (!mostConnectedPair || sharedSeriesIds.length > mostConnectedPair.count) {
            mostConnectedPair = {
              actor1: actor1.name,
              actor2: actor2.name,
              count: sharedSeriesIds.length,
            };
          }
        }
      }
    }

    // Aggregate recommendations from ALL actors (voice actor filter only affects actor lists, not recommendations)
    const recommendationMap = new Map<number, {
      series: { id: number; title: string; poster: string | null; voteAverage: number };
      actors: { id: number; name: string; character: string }[];
    }>();

    Array.from(actorMap.values()).forEach(actor => {
      actor.recommendations?.forEach(rec => {
        const existing = recommendationMap.get(rec.id);
        if (existing) {
          existing.actors.push({ id: actor.id, name: actor.name, character: rec.character });
        } else {
          recommendationMap.set(rec.id, {
            series: { id: rec.id, title: rec.title, poster: rec.poster, voteAverage: rec.voteAverage },
            actors: [{ id: actor.id, name: actor.name, character: rec.character }],
          });
        }
      });
    });

    // Sort recommendations by number of actors and rating
    const recommendations = Array.from(recommendationMap.values())
      .sort((a, b) => {
        if (b.actors.length !== a.actors.length) {
          return b.actors.length - a.actors.length;
        }
        return b.series.voteAverage - a.series.voteAverage;
      })
      .slice(0, 15);

    return {
      actors: actorsWithPositions,
      connections: connections.filter(c => c.strength >= 1),
      topActors,
      recommendations,
      stats: {
        totalActors: actorMap.size,
        actorsInMultipleSeries: significantActors.length,
        mostConnectedPair,
      },
      loading,
      progress,
      loadingRecommendations,
    };
  }, [actorMap, loading, progress, loadingRecommendations, hideVoiceActors]);

  return universeData;
};
