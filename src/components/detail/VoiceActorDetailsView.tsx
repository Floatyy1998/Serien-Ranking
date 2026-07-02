import { Movie, Person, Star, Tv } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContextDef';
import { HorizontalScrollContainer } from '../ui';
import type { CharacterMediaEdge, VoiceActorDetailsData } from './CastCrew.types';
import { tapScale } from '../../lib/motion';

interface VoiceActorDetailsViewProps {
  voiceActorDetails: VoiceActorDetailsData;
  voiceActorLoading: boolean;
  onBack: () => void;
}

export const VoiceActorDetailsView: React.FC<VoiceActorDetailsViewProps> = ({
  voiceActorDetails,
  voiceActorLoading,
  onBack,
}) => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();

  // AniList-IDs mappen nicht auf TMDB. Wir suchen beim Klick per TMDB-Search
  // nach dem Titel und navigieren intern, wenn ein Treffer existiert; sonst
  // öffnen wir den AniList-Eintrag in einem neuen Tab als Fallback.
  const handleMediaClick = async (edge: CharacterMediaEdge) => {
    const isMovie = edge.node.type === 'MOVIE';
    const query = edge.node.title.english || edge.node.title.romaji;
    const anilistFallback = () => {
      const path = isMovie ? 'manga' : 'anime';
      window.open(`https://anilist.co/${path}/${edge.node.id}`, '_blank', 'noopener,noreferrer');
    };
    if (!query) {
      anilistFallback();
      return;
    }
    try {
      const apiKey = import.meta.env.VITE_API_TMDB;
      if (!apiKey) {
        anilistFallback();
        return;
      }
      const searchType = isMovie ? 'movie' : 'tv';
      const res = await fetch(
        `https://api.themoviedb.org/3/search/${searchType}?api_key=${apiKey}&language=de-DE&query=${encodeURIComponent(query)}`
      );
      if (!res.ok) {
        anilistFallback();
        return;
      }
      const data = await res.json();
      const hit = data.results?.[0];
      if (hit?.id) {
        navigate(`/${isMovie ? 'movie' : 'series'}/${hit.id}`);
      } else {
        anilistFallback();
      }
    } catch {
      anilistFallback();
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <button
        onClick={onBack}
        style={{
          background: `${currentTheme.text.muted}18`,
          border: 'none',
          borderRadius: '20px',
          padding: '8px 16px',
          color: currentTheme.text.primary,
          fontSize: '14px',
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
                loading="lazy"
                decoding="async"
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
                  background: `${currentTheme.text.muted}18`,
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
                    fontSize: '14px',
                    color: currentTheme.text.muted,
                    margin: '0 0 4px 0',
                  }}
                >
                  {voiceActorDetails.name.native}
                </p>
              )}
              <p
                style={{
                  fontSize: '14px',
                  color: currentTheme.text.muted,
                  margin: '0 0 4px 0',
                }}
              >
                Voice Acting
              </p>
              {voiceActorDetails.dateOfBirth && (
                <p
                  style={{
                    fontSize: '13px',
                    color: currentTheme.text.muted,
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
              {voiceActorDetails.characterMedia?.edges?.map((edge, index) => (
                <motion.div
                  key={`${edge.node.id}-${index}`}
                  whileTap={tapScale}
                  onClick={() => handleMediaClick(edge)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleMediaClick(edge);
                    }
                  }}
                  style={{
                    minWidth: '130px',
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
                        loading="lazy"
                        decoding="async"
                        style={{
                          width: '130px',
                          height: '195px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '130px',
                          height: '195px',
                          background: `linear-gradient(135deg, ${currentTheme.text.muted}0D, ${currentTheme.text.muted}05)`,
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: `1px solid ${currentTheme.border.default}`,
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
                          fontSize: '11px',
                          fontWeight: 600,
                        }}
                      >
                        <Star style={{ fontSize: '11px', color: currentTheme.status.warning }} />
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
                          fontSize: '11px',
                          fontWeight: 500,
                        }}
                      >
                        {edge.node.startDate.year}
                      </div>
                    )}
                  </div>

                  <p
                    style={{
                      fontSize: '12px',
                      fontWeight: 500,
                      margin: '0 0 2px 0',
                      color: currentTheme.text.primary,
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
                        fontSize: '11px',
                        margin: 0,
                        color: currentTheme.text.muted,
                      }}
                    >
                      als {edge.characters[0].name.full}
                    </p>
                  )}
                </motion.div>
              ))}
            </HorizontalScrollContainer>
          </div>
        </>
      )}
    </div>
  );
};
