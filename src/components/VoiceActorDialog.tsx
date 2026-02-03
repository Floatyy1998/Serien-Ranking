import { ChevronLeft, Movie, Star, Tv } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface VoiceActorDialogProps {
  open: boolean;
  onClose: () => void;
  voiceActorId: number | null;
  voiceActorName?: string;
}

interface CharacterRole {
  id: number;
  name: string;
  image: string;
  media: {
    id: number;
    title: {
      romaji: string;
      english: string | null;
    };
    type: 'ANIME' | 'MANGA';
    coverImage: {
      large: string;
    };
    startDate: {
      year: number | null;
    };
  };
  role: string;
}

interface AniListDate {
  year?: number | null;
  month?: number | null;
  day?: number | null;
}

interface AniListCharacterMediaEdge {
  node: {
    id: number;
    title: {
      romaji: string;
      english: string | null;
    };
    type: 'ANIME' | 'MANGA';
    coverImage: {
      large: string;
    };
    startDate: {
      year: number | null;
    };
  };
  characters: {
    id: number;
    name: { full: string };
    image: { large: string };
  }[];
  characterRole: string;
}

interface TransformedCharacter {
  id: number;
  name: string;
  image: string;
  media: AniListCharacterMediaEdge['node'];
  role: string;
}

interface VoiceActorDetails {
  id: number;
  name: {
    full: string;
    native: string | null;
  };
  image: {
    large: string;
  };
  description: string | null;
  age: number | null;
  gender: string | null;
  homeTown: string | null;
  bloodType: string | null;
  dateOfBirth: AniListDate | null;
  dateOfDeath: AniListDate | null;
  characters: {
    nodes: CharacterRole[];
  };
}

export const MobileVoiceActorDialog: React.FC<VoiceActorDialogProps> = ({
  open,
  onClose,
  voiceActorId,
}) => {
  const { currentTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [voiceActorData, setVoiceActorData] = useState<VoiceActorDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && voiceActorId) {
      fetchVoiceActorDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, voiceActorId]);

  const fetchVoiceActorDetails = async () => {
    if (!voiceActorId) return;

    setLoading(true);
    setError(null);

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
            description
            age
            gender
            homeTown
            bloodType
            dateOfBirth {
              year
              month
              day
            }
            dateOfDeath {
              year
              month
              day
            }
            characterMedia(perPage: 30, sort: START_DATE_DESC) {
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
                }
                characters {
                  id
                  name {
                    full
                  }
                  image {
                    large
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

      if (!response.ok) {
        throw new Error(`Failed to fetch voice actor details: ${response.status}`);
      }

      const data = await response.json();

      if (data.data?.Staff) {
        // Transform the data to match our interface
        const transformedData: VoiceActorDetails = {
          ...data.data.Staff,
          characters: {
            nodes:
              data.data.Staff.characterMedia?.edges
                ?.map((edge: AniListCharacterMediaEdge) => ({
                  id: edge.characters?.[0]?.id || Math.random(),
                  name: edge.characters?.[0]?.name?.full || 'Unknown Character',
                  image: edge.characters?.[0]?.image?.large || '',
                  media: edge.node,
                  role: edge.characterRole || 'SUPPORTING',
                }))
                .filter((char: TransformedCharacter) => char.media) || [], // Only show characters with media
          },
        };
        setVoiceActorData(transformedData);
      }
    } catch (err) {
      setError('Fehler beim Laden der Sprecher-Details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: AniListDate | null) => {
    if (!date) return null;
    const { year, month, day } = date;
    if (!year) return null;

    const dayStr = day ? day.toString().padStart(2, '0') : '01';
    const monthStr = month ? month.toString().padStart(2, '0') : '01';
    const yearStr = year.toString();

    return `${dayStr}.${monthStr}.${yearStr}`;
  };

  if (!open) return null;

  if (loading) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: '#0d0d0d',
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div style={{ color: currentTheme.text.muted }}>Lade Sprecher-Details...</div>
      </div>
    );
  }

  if (error || !voiceActorData) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: '#0d0d0d',
          zIndex: 9999,
          padding: '20px',
        }}
      >
        <button
          onClick={onClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '16px',
            cursor: 'pointer',
            marginBottom: '20px',
          }}
        >
          <ChevronLeft /> Zurück
        </button>
        <div style={{ textAlign: 'center', color: currentTheme.text.muted }}>
          {error || 'Fehler beim Laden der Sprecher-Details'}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: '#0d0d0d',
        overflowY: 'auto',
        zIndex: 9999,
      }}
    >
      <div style={{ padding: '20px' }}>
        {/* Header */}
        <button
          onClick={onClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '16px',
            cursor: 'pointer',
            marginBottom: '20px',
          }}
        >
          <ChevronLeft /> Zurück
        </button>

        {/* Voice Actor Info */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          {voiceActorData.image?.large ? (
            <img
              src={voiceActorData.image.large}
              alt={voiceActorData.name.full}
              style={{
                width: '120px',
                height: '180px',
                objectFit: 'cover',
                borderRadius: '12px',
              }}
            />
          ) : (
            <div
              style={{
                width: '120px',
                height: '180px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Star style={{ fontSize: '32px', color: currentTheme.text.muted }} />
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
              {voiceActorData.name.full}
            </h3>
            {voiceActorData.name.native && (
              <p
                style={{
                  fontSize: '14px',
                  color: 'rgba(255, 255, 255, 0.6)',
                  margin: '0 0 8px 0',
                }}
              >
                {voiceActorData.name.native}
              </p>
            )}
            {voiceActorData.age && (
              <p
                style={{
                  fontSize: '13px',
                  color: 'rgba(255, 255, 255, 0.5)',
                  margin: '0 0 4px 0',
                }}
              >
                {voiceActorData.age} Jahre
              </p>
            )}
            {voiceActorData.dateOfBirth && (
              <p
                style={{
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.5)',
                  margin: 0,
                }}
              >
                Geboren: {formatDate(voiceActorData.dateOfBirth)}
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

          <div
            style={{
              display: 'flex',
              gap: '12px',
              overflowX: 'auto',
              paddingBottom: '8px',
              scrollbarWidth: 'none',
            }}
          >
            {voiceActorData.characters.nodes.slice(0, 20).map((char) => (
              <div
                key={char.id}
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
                  {char.media?.coverImage?.large ? (
                    <img
                      src={char.media.coverImage.large}
                      alt={char.media.title.english || char.media.title.romaji}
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
                      {char.media?.type === 'ANIME' ? (
                        <Tv style={{ fontSize: '28px', color: currentTheme.text.muted }} />
                      ) : (
                        <Movie style={{ fontSize: '28px', color: currentTheme.text.muted }} />
                      )}
                    </div>
                  )}

                  {/* Character Badge */}
                  {char.image && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '-12px',
                        right: '4px',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        border: '2px solid #0d0d0d',
                        overflow: 'hidden',
                        background: '#0d0d0d',
                      }}
                    >
                      <img
                        src={char.image}
                        alt={char.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    </div>
                  )}
                </div>

                <p
                  style={{
                    fontSize: '11px',
                    color: 'rgba(255, 255, 255, 0.8)',
                    margin: '4px 0 2px 0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {char.media?.title?.english || char.media?.title?.romaji || 'Unknown'}
                </p>
                <p
                  style={{
                    fontSize: '10px',
                    color: 'rgba(255, 255, 255, 0.5)',
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {char.name}
                </p>
                {char.media?.startDate?.year && (
                  <p
                    style={{
                      fontSize: '9px',
                      color: 'rgba(255, 215, 0, 0.6)',
                      margin: '2px 0 0 0',
                    }}
                  >
                    {char.media.startDate.year}
                  </p>
                )}
              </div>
            ))}
          </div>

          {voiceActorData.characters.nodes.length > 20 && (
            <p
              style={{
                textAlign: 'center',
                color: 'rgba(255, 255, 255, 0.4)',
                fontSize: '12px',
                marginTop: '16px',
              }}
            >
              + {voiceActorData.characters.nodes.length - 20} weitere Rollen
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
