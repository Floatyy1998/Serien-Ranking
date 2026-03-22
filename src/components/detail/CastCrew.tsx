import { useEffect, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import {
  AnimeCharacterData,
  CastCrewProps,
  CastMember,
  CreditItem,
  PersonDetailsData,
  VoiceActorDetailsData,
  VoiceActorRef,
} from './CastCrew.types';
import { CastCrewListView } from './CastCrewListView';
import { PersonDetailsView } from './PersonDetailsView';
import { VoiceActorDetailsView } from './VoiceActorDetailsView';

export const CastCrew: React.FC<CastCrewProps> = ({
  tmdbId,
  mediaType,
  onPersonClick,
  seriesData,
}) => {
  const { currentTheme } = useTheme();
  const [cast, setCast] = useState<CastMember[]>([]);
  const [crew, setCrew] = useState<CastMember[]>([]);
  const [animeCharacters, setAnimeCharacters] = useState<AnimeCharacterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [personDetails, setPersonDetails] = useState<PersonDetailsData | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null);
  const [selectedVoiceActor, setSelectedVoiceActor] = useState<number | null>(null);
  const [voiceActorDetails, setVoiceActorDetails] = useState<VoiceActorDetailsData | null>(null);
  const [voiceActorLoading, setVoiceActorLoading] = useState(false);

  // Check if anime - multiple detection methods
  // Method 1: Check for Animation genre (id 16) and Asian origin
  const hasAnimationGenre =
    seriesData?.genres?.some((g) => g.id === 16) ||
    seriesData?.genre?.genres?.some((g) => g.toLowerCase().includes('animation'));

  const isFromAsianCountry =
    seriesData?.origin_country?.some((c: string) => ['JP', 'CN', 'KR'].includes(c)) || false;

  // Method 2: Check for anime-related keywords in title or genres
  const hasAnimeKeywords =
    seriesData?.genre?.genres?.some((g: string) => g.toLowerCase().includes('anime')) ||
    seriesData?.title?.toLowerCase().includes('anime');

  // If we have Animation genre but no origin_country data, assume it's anime
  // Most western animations don't have "Animation" as genre in TMDB
  const isAnime =
    hasAnimeKeywords || (hasAnimationGenre && (isFromAsianCountry || !seriesData?.origin_country));

  // Set initial tab based on whether it's anime
  const [activeTab, setActiveTab] = useState<'cast' | 'crew' | 'characters'>(
    isAnime ? 'characters' : 'cast'
  );

  useEffect(() => {
    if (isAnime && mediaType === 'tv') {
      fetchAnimeCharacters();
      setActiveTab('characters'); // Switch to characters tab when anime is detected
    }
    fetchCredits();
  }, [tmdbId, mediaType, isAnime]);

  // Update active tab when anime characters are loaded
  useEffect(() => {
    if (isAnime && animeCharacters.length > 0 && activeTab !== 'characters') {
      setActiveTab('characters');
    }
  }, [animeCharacters, isAnime]);

  const fetchAnimeCharacters = async () => {
    try {
      const query = `
        query ($search: String) {
          Media(search: $search, type: ANIME) {
            id
            title {
              romaji
              english
              native
            }
            characters(sort: ROLE, perPage: 30) {
              edges {
                node {
                  id
                  name {
                    first
                    last
                    native
                  }
                  image {
                    large
                  }
                }
                role
                voiceActors(language: JAPANESE, sort: LANGUAGE) {
                  id
                  name {
                    first
                    last
                    native
                  }
                  image {
                    large
                  }
                  languageV2
                }
              }
            }
          }
        }
      `;

      const response = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: {
            search: seriesData?.name || seriesData?.title,
          },
        }),
      });

      if (!response.ok) return;

      const result = await response.json();
      if (result.data?.Media?.characters?.edges) {
        interface AniListEdge {
          node: {
            name: { first?: string; last?: string; native?: string };
            image?: { large?: string };
          };
          role: string;
          voiceActors?: {
            id: number;
            name: { first?: string; last?: string; native?: string };
            image?: { large?: string };
          }[];
        }
        const transformedCharacters = (result.data.Media.characters.edges as AniListEdge[])
          .filter((edge) => edge.voiceActors && edge.voiceActors.length > 0)
          .map((edge) => ({
            character: {
              name: `${edge.node.name.first || ''} ${edge.node.name.last || ''}`.trim(),
              native: edge.node.name.native,
              image: edge.node.image?.large,
            },
            role: edge.role === 'MAIN' ? 'Hauptrolle' : 'Nebenrolle',
            voice_actors: edge.voiceActors!.map((va) => ({
              person: {
                id: va.id,
                name: `${va.name.first || ''} ${va.name.last || ''}`.trim(),
                native: va.name.native,
                image: va.image?.large,
              },
              language: 'Japanese',
            })),
          }));
        setAnimeCharacters(transformedCharacters);
      }
    } catch (error) {
      console.error('Failed to fetch anime characters from AniList:', error);
    }
  };

  const fetchCredits = async () => {
    try {
      setLoading(true);
      const TMDB_API_KEY = import.meta.env.VITE_API_TMDB;

      if (!TMDB_API_KEY) {
        return;
      }

      const response = await fetch(
        `https://api.themoviedb.org/3/${mediaType}/${tmdbId}/credits?api_key=${TMDB_API_KEY}&language=de-DE`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch credits');
      }

      const data = await response.json();

      // Sort cast by order
      const sortedCast = (data.cast || [])
        .sort((a: CastMember, b: CastMember) => (a.order || 999) - (b.order || 999))
        .slice(0, 20);

      // Group crew by department and get important roles
      const importantCrew = (data.crew || [])
        .filter((member: CastMember) =>
          ['Director', 'Producer', 'Writer', 'Screenplay', 'Creator'].includes(member.job || '')
        )
        .slice(0, 10);

      setCast(sortedCast);
      setCrew(importantCrew);
    } catch (error) {
      console.error('Failed to fetch TMDB cast/crew credits:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPersonDetails = async (personId: number) => {
    try {
      const TMDB_API_KEY = import.meta.env.VITE_API_TMDB;
      const [personResponse, creditsResponse] = await Promise.all([
        fetch(
          `https://api.themoviedb.org/3/person/${personId}?api_key=${TMDB_API_KEY}&language=de-DE`
        ),
        fetch(
          `https://api.themoviedb.org/3/person/${personId}/combined_credits?api_key=${TMDB_API_KEY}&language=de-DE`
        ),
      ]);

      if (!personResponse.ok || !creditsResponse.ok)
        throw new Error('Failed to fetch person details');

      const personData = await personResponse.json();
      const creditsData = await creditsResponse.json();

      // Sort credits by popularity
      const sortedCredits = ([...creditsData.cast, ...creditsData.crew] as CreditItem[])
        .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
        .slice(0, 20);

      setPersonDetails({
        ...personData,
        credits: sortedCredits,
      });
      setSelectedPersonId(personId);
    } catch (error) {
      console.error('Failed to fetch person details from TMDB:', error);
    }
  };

  const handlePersonClick = (personId: number) => {
    if (onPersonClick) {
      onPersonClick(personId);
    } else {
      fetchPersonDetails(personId);
    }
  };

  const fetchVoiceActorDetails = async (voiceActorId: number) => {
    setVoiceActorLoading(true);
    try {
      const query = `
        query ($id: Int) {
          Staff(id: $id) {
            id
            name {
              full
              native
            }
            image {
              large
            }
            age
            dateOfBirth {
              year
              month
              day
            }
            characterMedia(perPage: 20, sort: START_DATE_DESC) {
              edges {
                node {
                  id
                  title {
                    romaji
                    english
                  }
                  type
                  coverImage {
                    large
                  }
                  startDate {
                    year
                  }
                  meanScore
                }
                characters {
                  id
                  name {
                    full
                  }
                }
                characterRole
              }
            }
          }
        }
      `;

      const response = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: { id: voiceActorId },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data?.Staff) {
          setVoiceActorDetails(data.data.Staff);
          setSelectedVoiceActor(voiceActorId);
        }
      }
    } catch (error) {
      console.error('Failed to fetch voice actor details from AniList:', error);
    } finally {
      setVoiceActorLoading(false);
    }
  };

  const handleVoiceActorClick = (voiceActor?: VoiceActorRef) => {
    if (voiceActor?.person?.id) {
      fetchVoiceActorDetails(voiceActor.person.id);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ color: currentTheme.text.muted }}>Lade Cast & Crew...</div>
      </div>
    );
  }

  // Voice Actor Details View
  if (selectedVoiceActor && voiceActorDetails) {
    return (
      <VoiceActorDetailsView
        voiceActorDetails={voiceActorDetails}
        voiceActorLoading={voiceActorLoading}
        onBack={() => {
          setSelectedVoiceActor(null);
          setVoiceActorDetails(null);
        }}
      />
    );
  }

  // Person Details View
  if (selectedPersonId && personDetails) {
    return (
      <PersonDetailsView
        personDetails={personDetails}
        onBack={() => {
          setSelectedPersonId(null);
          setPersonDetails(null);
        }}
      />
    );
  }

  // Cast & Crew List View
  return (
    <CastCrewListView
      isAnime={!!isAnime}
      animeCharacters={animeCharacters}
      cast={cast}
      crew={crew}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onPersonClick={handlePersonClick}
      onVoiceActorClick={handleVoiceActorClick}
    />
  );
};
