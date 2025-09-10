import { ChevronRight, Movie, OpenInNew, Person, Star, Tv } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { getFormattedDate } from '../../lib/date/date.utils';
import { HorizontalScrollContainer } from './HorizontalScrollContainer';

interface CastMember {
  id: number;
  name: string;
  character?: string;
  job?: string;
  profile_path?: string;
  order?: number;
  known_for_department?: string;
}

interface MobileCastCrewProps {
  tmdbId: number;
  mediaType: 'tv' | 'movie';
  onPersonClick?: (personId: number) => void;
  seriesData?: any; // For checking if it's anime
}

export const MobileCastCrew: React.FC<MobileCastCrewProps> = ({
  tmdbId,
  mediaType,
  onPersonClick,
  seriesData,
}) => {
  const { currentTheme } = useTheme();
  const [cast, setCast] = useState<CastMember[]>([]);
  const [crew, setCrew] = useState<CastMember[]>([]);
  const [animeCharacters, setAnimeCharacters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [personDetails, setPersonDetails] = useState<any>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null);
  const [selectedVoiceActor, setSelectedVoiceActor] = useState<any>(null);
  const [voiceActorDetails, setVoiceActorDetails] = useState<any>(null);
  const [voiceActorLoading, setVoiceActorLoading] = useState(false);

  // Check if anime - multiple detection methods
  // Method 1: Check for Animation genre and Asian origin
  
  // Helper function to check if a genre string contains animation/anime keywords
  const checkGenreString = (str: string) => {
    const normalized = str.toLowerCase();
    return normalized.includes('animation') || 
           normalized.includes('anime') || 
           normalized.includes('animiert');
  };
  
  // Check all possible genre field formats
  const hasAnimationGenre =
    // TMDB genre objects array (e.g., [{id: 16, name: "Animation"}])
    seriesData?.genres?.some?.((g: any) => {
      if (typeof g === 'object' && g !== null) {
        return g.id === 16 || (g.name && checkGenreString(g.name));
      }
      if (typeof g === 'string') {
        return checkGenreString(g);
      }
      return false;
    }) ||
    // Firebase nested genre.genres (can be object with genre keys)
    (seriesData?.genre?.genres && typeof seriesData.genre.genres === 'object' && 
      !Array.isArray(seriesData.genre.genres) &&
      Object.values(seriesData.genre.genres).some((g: any) => 
        typeof g === 'string' && checkGenreString(g)
      )) ||
    // Firebase genre.genres as array
    (Array.isArray(seriesData?.genre?.genres) && 
      seriesData.genre.genres.some((g: any) => 
        typeof g === 'string' && checkGenreString(g)
      )) ||
    // Firebase genre.genres as string
    (typeof seriesData?.genre?.genres === 'string' && 
      checkGenreString(seriesData.genre.genres)) ||
    // Direct genre field as string (Firebase legacy)
    (typeof seriesData?.genre === 'string' && checkGenreString(seriesData.genre));

  // Check origin country - anime typically from Japan, Korea, or China
  const isFromAsianCountry =
    seriesData?.origin_country?.some?.((c: string) => 
      ['JP', 'CN', 'KR', 'TW'].includes(c)
    ) || 
    seriesData?.originalCountry?.some?.((c: string) => 
      ['JP', 'CN', 'KR', 'TW'].includes(c)
    ) || false;

  // Method 2: Check for anime-related keywords in title or other fields
  const hasAnimeKeywords =
    seriesData?.title?.toLowerCase().includes('anime') ||
    seriesData?.name?.toLowerCase().includes('anime') ||
    // Check if it's explicitly marked as anime in any field
    seriesData?.type?.toLowerCase() === 'anime' ||
    seriesData?.mediaType?.toLowerCase() === 'anime';

  // Determine if it's anime based on multiple factors
  const isAnime =
    hasAnimeKeywords || 
    (hasAnimationGenre && isFromAsianCountry) || 
    (hasAnimationGenre && !seriesData?.origin_country && !seriesData?.originalCountry); // Animation without origin = likely anime

  // Debug logging for development
  if (process.env.NODE_ENV === 'development') {
    console.log('Anime detection:', {
      title: seriesData?.title,
      hasAnimationGenre,
      isFromAsianCountry,
      hasAnimeKeywords,
      isAnime,
      genres: seriesData?.genre?.genres
    });
  }

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
        const transformedCharacters = result.data.Media.characters.edges
          .filter((edge: any) => edge.voiceActors && edge.voiceActors.length > 0)
          .map((edge: any) => ({
            character: {
              name: `${edge.node.name.first || ''} ${edge.node.name.last || ''}`.trim(),
              native: edge.node.name.native,
              image: edge.node.image?.large,
            },
            role: edge.role === 'MAIN' ? 'Hauptrolle' : 'Nebenrolle',
            voice_actors: edge.voiceActors.map((va: any) => ({
              person: {
                id: va.id, // AniList ID des Voice Actors
                name: `${va.name.first || ''} ${va.name.last || ''}`.trim(),
                native: va.name.native,
                image: va.image?.large,
              },
              language: 'Japanese',
            })),
          }));
        setAnimeCharacters(transformedCharacters);
      }
    } catch (error) {}
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
      const sortedCredits = [...creditsData.cast, ...creditsData.crew]
        .sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0))
        .slice(0, 20);

      setPersonDetails({
        ...personData,
        credits: sortedCredits,
      });
      setSelectedPersonId(personId);
    } catch (error) {}
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
    } finally {
      setVoiceActorLoading(false);
    }
  };

  const handleVoiceActorClick = (voiceActor: any) => {
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
      <div style={{ padding: '20px' }}>
        <button
          onClick={() => {
            setSelectedVoiceActor(null);
            setVoiceActorDetails(null);
          }}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '20px',
            padding: '8px 16px',
            color: 'white',
            fontSize: '13px',
            marginBottom: '20px',
            cursor: 'pointer',
          }}
        >
          ← Zurück
        </button>

        {voiceActorLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ color: currentTheme.text.muted }}>Lade Sprecher-Details...</div>
          </div>
        ) : (
          <>
            {/* Voice Actor Info */}
            <div
              style={{
                display: 'flex',
                gap: '16px',
                marginBottom: '24px',
              }}
            >
              {voiceActorDetails.image?.large ? (
                <img
                  src={voiceActorDetails.image.large}
                  alt={voiceActorDetails.name.full}
                  style={{
                    width: '80px',
                    height: '120px',
                    objectFit: 'cover',
                    borderRadius: '12px',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '80px',
                    height: '120px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Person style={{ fontSize: '32px', color: currentTheme.text.muted }} />
                </div>
              )}

              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    margin: '0 0 8px 0',
                  }}
                >
                  {voiceActorDetails.name.full}
                </h3>
                {voiceActorDetails.name.native && (
                  <p
                    style={{
                      fontSize: '13px',
                      color: 'rgba(255, 255, 255, 0.6)',
                      margin: '0 0 4px 0',
                    }}
                  >
                    {voiceActorDetails.name.native}
                  </p>
                )}
                <p
                  style={{
                    fontSize: '13px',
                    color: 'rgba(255, 255, 255, 0.6)',
                    margin: '0 0 4px 0',
                  }}
                >
                  Voice Acting
                </p>
                {voiceActorDetails.dateOfBirth && (
                  <p
                    style={{
                      fontSize: '12px',
                      color: 'rgba(255, 255, 255, 0.5)',
                      margin: 0,
                    }}
                  >
                    Geboren: {voiceActorDetails.dateOfBirth.day || '??'}.
                    {voiceActorDetails.dateOfBirth.month || '??'}.
                    {voiceActorDetails.dateOfBirth.year || '????'}
                  </p>
                )}
              </div>
            </div>

            {/* Known For */}
            <div>
              <h4
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  marginBottom: '12px',
                }}
              >
                Bekannt aus
              </h4>

              <HorizontalScrollContainer gap={12} style={{ paddingBottom: '8px' }}>
                {voiceActorDetails.characterMedia?.edges?.map((edge: any, index: number) => (
                  <div
                    key={`${edge.node.id}-${index}`}
                    style={{
                      minWidth: '100px',
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      style={{
                        position: 'relative',
                        marginBottom: '6px',
                      }}
                    >
                      {edge.node.coverImage?.large ? (
                        <img
                          src={edge.node.coverImage.large}
                          alt={edge.node.title.english || edge.node.title.romaji}
                          style={{
                            width: '100px',
                            height: '150px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '100px',
                            height: '150px',
                            background:
                              'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                          }}
                        >
                          {edge.node.type === 'ANIME' ? (
                            <Tv style={{ fontSize: '28px', color: currentTheme.text.muted }} />
                          ) : (
                            <Movie style={{ fontSize: '28px', color: currentTheme.text.muted }} />
                          )}
                        </div>
                      )}

                      {/* Rating Badge */}
                      {edge.node.meanScore && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '6px',
                            right: '6px',
                            background: 'rgba(0, 0, 0, 0.8)',
                            borderRadius: '12px',
                            padding: '2px 6px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px',
                            fontSize: '10px',
                            fontWeight: 600,
                          }}
                        >
                          <Star style={{ fontSize: '10px', color: currentTheme.status.warning }} />
                          {(edge.node.meanScore / 10).toFixed(1)}
                        </div>
                      )}

                      {/* Year Badge */}
                      {edge.node.startDate?.year && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '6px',
                            left: '6px',
                            background: 'rgba(0, 0, 0, 0.8)',
                            borderRadius: '8px',
                            padding: '2px 6px',
                            fontSize: '10px',
                            fontWeight: 500,
                          }}
                        >
                          {edge.node.startDate.year}
                        </div>
                      )}
                    </div>

                    <p
                      style={{
                        fontSize: '11px',
                        fontWeight: 500,
                        margin: '0 0 2px 0',
                        color: 'rgba(255, 255, 255, 0.9)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        lineHeight: 1.3,
                      }}
                    >
                      {edge.node.title.english || edge.node.title.romaji}
                    </p>
                    {edge.characters?.[0] && (
                      <p
                        style={{
                          fontSize: '10px',
                          margin: 0,
                          color: 'rgba(255, 255, 255, 0.5)',
                        }}
                      >
                        als {edge.characters[0].name.full}
                      </p>
                    )}
                  </div>
                ))}
              </HorizontalScrollContainer>
            </div>
          </>
        )}
      </div>
    );
  }

  // Person Details View
  if (selectedPersonId && personDetails) {
    return (
      <div style={{ padding: '20px' }}>
        <button
          onClick={() => {
            setSelectedPersonId(null);
            setPersonDetails(null);
          }}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '20px',
            padding: '8px 16px',
            color: 'white',
            fontSize: '13px',
            marginBottom: '20px',
            cursor: 'pointer',
          }}
        >
          ← Zurück
        </button>

        {/* Person Info */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          {personDetails.profile_path ? (
            <img
              src={`https://image.tmdb.org/t/p/w185${personDetails.profile_path}`}
              alt={personDetails.name}
              style={{
                width: '80px',
                height: '120px',
                objectFit: 'cover',
                borderRadius: '12px',
              }}
            />
          ) : (
            <div
              style={{
                width: '80px',
                height: '120px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Person style={{ fontSize: '32px', color: 'rgba(255, 255, 255, 0.3)' }} />
            </div>
          )}

          <div style={{ flex: 1 }}>
            <h3
              style={{
                fontSize: '18px',
                fontWeight: 700,
                margin: '0 0 8px 0',
              }}
            >
              {personDetails.name}
            </h3>
            {personDetails.known_for_department && (
              <p
                style={{
                  fontSize: '13px',
                  color: 'rgba(255, 255, 255, 0.6)',
                  margin: '0 0 4px 0',
                }}
              >
                {personDetails.known_for_department}
              </p>
            )}
            {personDetails.birthday && (
              <p
                style={{
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.5)',
                  margin: 0,
                }}
              >
                Geboren: {getFormattedDate(personDetails.birthday)}
              </p>
            )}
          </div>
        </div>

        {/* Known For */}
        <div>
          <h4
            style={{
              fontSize: '16px',
              fontWeight: 600,
              marginBottom: '12px',
            }}
          >
            Bekannt aus
          </h4>

          <HorizontalScrollContainer gap={12} style={{ paddingBottom: '8px' }}>
            {personDetails.credits.map((credit: any, index: number) => (
              <div
                key={`${credit.id}-${index}`}
                style={{
                  minWidth: '100px',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    marginBottom: '6px',
                  }}
                >
                  {credit.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w185${credit.poster_path}`}
                      alt={credit.title || credit.name}
                      style={{
                        width: '100px',
                        height: '150px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100px',
                        height: '150px',
                        background:
                          'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      {credit.media_type === 'movie' ? (
                        <Movie style={{ fontSize: '28px', color: currentTheme.text.muted }} />
                      ) : (
                        <Tv style={{ fontSize: '28px', color: currentTheme.text.muted }} />
                      )}
                    </div>
                  )}

                  {/* Rating Badge */}
                  {credit.vote_average > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '6px',
                        right: '6px',
                        background: 'rgba(0, 0, 0, 0.8)',
                        borderRadius: '12px',
                        padding: '2px 6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                        fontSize: '10px',
                        fontWeight: 600,
                      }}
                    >
                      <Star style={{ fontSize: '10px', color: currentTheme.status.warning }} />
                      {credit.vote_average.toFixed(1)}
                    </div>
                  )}

                  {/* Year Badge */}
                  {(credit.release_date || credit.first_air_date) && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '6px',
                        left: '6px',
                        background: 'rgba(0, 0, 0, 0.8)',
                        borderRadius: '8px',
                        padding: '2px 6px',
                        fontSize: '10px',
                        fontWeight: 500,
                      }}
                    >
                      {new Date(credit.release_date || credit.first_air_date).getFullYear()}
                    </div>
                  )}
                </div>

                <p
                  style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    margin: '0 0 2px 0',
                    color: 'rgba(255, 255, 255, 0.9)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    lineHeight: '1.3',
                  }}
                >
                  {credit.title || credit.name}
                </p>

                {credit.character && (
                  <p
                    style={{
                      fontSize: '10px',
                      margin: 0,
                      color: 'rgba(255, 255, 255, 0.5)',
                    }}
                  >
                    als {credit.character}
                  </p>
                )}
              </div>
            ))}
          </HorizontalScrollContainer>
        </div>
      </div>
    );
  }

  // Cast & Crew List View
  return (
    <div>
      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          padding: '0 20px',
          marginBottom: '16px',
        }}
      >
        {isAnime && animeCharacters.length > 0 && (
          <button
            onClick={() => setActiveTab('characters')}
            style={{
              flex: 1,
              padding: '10px',
              background:
                activeTab === 'characters'
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : 'rgba(255, 255, 255, 0.05)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontSize: '14px',
              fontWeight: activeTab === 'characters' ? 600 : 500,
              cursor: 'pointer',
            }}
          >
            Charaktere ({animeCharacters.length})
          </button>
        )}

        <button
          onClick={() => setActiveTab('cast')}
          style={{
            flex: 1,
            padding: '10px',
            background:
              activeTab === 'cast'
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : 'rgba(255, 255, 255, 0.05)',
            border: 'none',
            borderRadius: '12px',
            color: 'white',
            fontSize: '14px',
            fontWeight: activeTab === 'cast' ? 600 : 500,
            cursor: 'pointer',
          }}
        >
          Besetzung ({cast.length})
        </button>

        <button
          onClick={() => setActiveTab('crew')}
          style={{
            flex: 1,
            padding: '10px',
            background:
              activeTab === 'crew'
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : 'rgba(255, 255, 255, 0.05)',
            border: 'none',
            borderRadius: '12px',
            color: 'white',
            fontSize: '14px',
            fontWeight: activeTab === 'crew' ? 600 : 500,
            cursor: 'pointer',
          }}
        >
          Crew ({crew.length})
        </button>
      </div>

      {/* List */}
      <div style={{ padding: '0 20px' }}>
        {activeTab === 'characters'
          ? // Anime Characters Display
            animeCharacters.map((char, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '12px',
                  marginBottom: '8px',
                  cursor: char.voice_actors?.[0]?.person?.id ? 'pointer' : 'default',
                  transition: 'background 0.2s',
                }}
                onClick={() => {
                  // Klick auf Voice Actor - zeige Details
                  handleVoiceActorClick(char.voice_actors?.[0]);
                }}
                onMouseEnter={(e) => {
                  if (char.voice_actors?.[0]?.person?.id) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                }}
              >
                {/* Character Image */}
                {char.character.image ? (
                  <img
                    src={char.character.image}
                    alt={char.character.name}
                    style={{
                      width: '48px',
                      height: '48px',
                      objectFit: 'cover',
                      borderRadius: '50%',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Person style={{ fontSize: '20px', color: currentTheme.text.muted }} />
                  </div>
                )}

                {/* Character Info */}
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      margin: 0,
                      color: 'white',
                    }}
                  >
                    {char.character.name}
                  </p>
                  <p
                    style={{
                      fontSize: '11px',
                      margin: '2px 0 0 0',
                      color: '#00d4aa',
                    }}
                  >
                    {char.role}
                  </p>
                </div>

                {/* Voice Actor */}
                {char.voice_actors?.[0] && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <div style={{ textAlign: 'right' }}>
                      <p
                        style={{
                          fontSize: '12px',
                          margin: 0,
                          color: 'rgba(255, 255, 255, 0.7)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          justifyContent: 'flex-end',
                        }}
                      >
                        {char.voice_actors[0].person.name}
                        {char.voice_actors[0].person.id && (
                          <OpenInNew
                            style={{
                              fontSize: '10px',
                              opacity: 0.5,
                            }}
                          />
                        )}
                      </p>
                      <p
                        style={{
                          fontSize: '10px',
                          margin: '2px 0 0 0',
                          color: 'rgba(255, 255, 255, 0.4)',
                        }}
                      >
                        Sprecher
                      </p>
                    </div>
                    {char.voice_actors[0].person.image ? (
                      <img
                        src={char.voice_actors[0].person.image}
                        alt={char.voice_actors[0].person.name}
                        style={{
                          width: '40px',
                          height: '40px',
                          objectFit: 'cover',
                          borderRadius: '50%',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          background: 'rgba(255, 255, 255, 0.1)',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Person style={{ fontSize: '16px', color: currentTheme.text.muted }} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          : // Regular Cast/Crew Display
            (activeTab === 'cast' ? cast : crew).map((member, index) => (
              <motion.div
                key={`${member.id}-${member.character || member.job}-${index}`}
                whileTap={{ scale: 0.98 }}
                onClick={() => handlePersonClick(member.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '12px',
                  marginBottom: '8px',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease',
                }}
              >
                {member.profile_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w92${member.profile_path}`}
                    alt={member.name}
                    style={{
                      width: '48px',
                      height: '48px',
                      objectFit: 'cover',
                      borderRadius: '50%',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Person style={{ fontSize: '20px', color: 'rgba(255, 255, 255, 0.3)' }} />
                  </div>
                )}

                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      margin: 0,
                      color: 'white',
                    }}
                  >
                    {member.name}
                  </p>
                  <p
                    style={{
                      fontSize: '12px',
                      margin: 0,
                      color: 'rgba(255, 255, 255, 0.5)',
                    }}
                  >
                    {member.character || member.job}
                  </p>
                </div>

                <ChevronRight
                  style={{
                    fontSize: '20px',
                    color: 'rgba(255, 255, 255, 0.3)',
                  }}
                />
              </motion.div>
            ))}
      </div>
    </div>
  );
};
