import { ChevronRight, OpenInNew, Person } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContextDef';
import type { AnimeCharacterData, CastMember, VoiceActorRef } from './CastCrew.types';

interface CastCrewListViewProps {
  isAnime: boolean;
  animeCharacters: AnimeCharacterData[];
  cast: CastMember[];
  crew: CastMember[];
  activeTab: 'cast' | 'crew' | 'characters';
  setActiveTab: (tab: 'cast' | 'crew' | 'characters') => void;
  onPersonClick: (personId: number) => void;
  onVoiceActorClick: (voiceActor?: VoiceActorRef) => void;
}

export const CastCrewListView: React.FC<CastCrewListViewProps> = ({
  isAnime,
  animeCharacters,
  cast,
  crew,
  activeTab,
  setActiveTab,
  onPersonClick,
  onVoiceActorClick,
}) => {
  const { currentTheme } = useTheme();

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
                  ? `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.accent} 100%)`
                  : `rgba(255,255,255,0.05)`,
              border: 'none',
              borderRadius: '12px',
              color: currentTheme.text.primary,
              fontSize: '15px',
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
                ? `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.accent} 100%)`
                : `rgba(255,255,255,0.05)`,
            border: 'none',
            borderRadius: '12px',
            color: currentTheme.text.primary,
            fontSize: '15px',
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
                ? `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.accent} 100%)`
                : `rgba(255,255,255,0.05)`,
            border: 'none',
            borderRadius: '12px',
            color: currentTheme.text.primary,
            fontSize: '15px',
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
                  background: `${currentTheme.text.muted}05`,
                  borderRadius: '12px',
                  marginBottom: '8px',
                  cursor: char.voice_actors?.[0]?.person?.id ? 'pointer' : 'default',
                  transition: 'background 0.2s',
                }}
                onClick={() => {
                  // Klick auf Voice Actor - zeige Details
                  onVoiceActorClick(char.voice_actors?.[0]);
                }}
                onMouseEnter={(e) => {
                  if (char.voice_actors?.[0]?.person?.id) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
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
                    loading="lazy"
                    decoding="async"
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
                      background: `${currentTheme.text.muted}18`,
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
                      fontSize: '15px',
                      fontWeight: 500,
                      margin: 0,
                      color: currentTheme.text.primary,
                    }}
                  >
                    {char.character.name}
                  </p>
                  <p
                    style={{
                      fontSize: '12px',
                      margin: '2px 0 0 0',
                      color: currentTheme.primary,
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
                          fontSize: '13px',
                          margin: 0,
                          color: currentTheme.text.secondary,
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
                              fontSize: '11px',
                              opacity: 0.5,
                            }}
                          />
                        )}
                      </p>
                      <p
                        style={{
                          fontSize: '11px',
                          margin: '2px 0 0 0',
                          color: currentTheme.text.muted,
                        }}
                      >
                        Sprecher
                      </p>
                    </div>
                    {char.voice_actors[0].person.image ? (
                      <img
                        src={char.voice_actors[0].person.image}
                        alt={char.voice_actors[0].person.name}
                        loading="lazy"
                        decoding="async"
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
                          background: `${currentTheme.text.muted}18`,
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
                onClick={() => onPersonClick(member.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  background: `${currentTheme.text.muted}05`,
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
                    loading="lazy"
                    decoding="async"
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
                      background: `${currentTheme.text.muted}18`,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Person style={{ fontSize: '20px', color: currentTheme.text.muted }} />
                  </div>
                )}

                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontSize: '15px',
                      fontWeight: 500,
                      margin: 0,
                      color: currentTheme.text.primary,
                    }}
                  >
                    {member.name}
                  </p>
                  <p
                    style={{
                      fontSize: '13px',
                      margin: 0,
                      color: currentTheme.text.muted,
                    }}
                  >
                    {member.character || member.job}
                  </p>
                </div>

                <ChevronRight
                  style={{
                    fontSize: '20px',
                    color: currentTheme.text.muted,
                  }}
                />
              </motion.div>
            ))}
      </div>
    </div>
  );
};
