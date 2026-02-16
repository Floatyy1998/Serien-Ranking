import { Close, PlayArrow, PlayCircle, Theaters } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
  published_at?: string;
}

interface VideoGalleryProps {
  tmdbId: number;
  mediaType: 'tv' | 'movie';
  buttonStyle?: 'desktop' | 'mobile';
}

export const VideoGallery: React.FC<VideoGalleryProps> = ({
  tmdbId,
  mediaType,
  buttonStyle = 'desktop',
}) => {
  const { currentTheme } = useTheme();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [activeTab, setActiveTab] = useState<'trailers' | 'bts'>('trailers');

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      try {
        const apiKey = import.meta.env.VITE_API_TMDB;

        // Fetch German videos
        const deResponse = await fetch(
          `https://api.themoviedb.org/3/${mediaType}/${tmdbId}/videos?api_key=${apiKey}&language=de-DE`
        );
        const deData = await deResponse.json();

        // Fetch English videos as fallback
        const enResponse = await fetch(
          `https://api.themoviedb.org/3/${mediaType}/${tmdbId}/videos?api_key=${apiKey}&language=en-US`
        );
        const enData = await enResponse.json();

        // Combine and deduplicate
        const allVideos = [...(deData.results || []), ...(enData.results || [])];
        const uniqueVideos = allVideos.filter(
          (video, index, self) =>
            index === self.findIndex((v) => v.key === video.key) && video.site === 'YouTube'
        );

        // Sort: official first, then by type
        const sortedVideos = uniqueVideos.sort((a, b) => {
          if (a.official && !b.official) return -1;
          if (!a.official && b.official) return 1;
          const typePriority: Record<string, number> = {
            Trailer: 0,
            Teaser: 1,
            Clip: 2,
            Featurette: 3,
            'Behind the Scenes': 4,
          };
          return (typePriority[a.type] || 99) - (typePriority[b.type] || 99);
        });

        setVideos(sortedVideos);
      } catch (error) {
        console.error('Failed to fetch videos:', error);
      } finally {
        setLoading(false);
      }
    };

    if (tmdbId) {
      fetchVideos();
    }
  }, [tmdbId, mediaType]);

  const trailers = videos.filter((v) => ['Trailer', 'Teaser'].includes(v.type));
  const behindTheScenes = videos.filter((v) =>
    ['Featurette', 'Behind the Scenes', 'Clip'].includes(v.type)
  );
  const currentVideos = activeTab === 'trailers' ? trailers : behindTheScenes;
  const mainVideo = videos[0];

  // Don't render if no videos
  if (loading || videos.length === 0) {
    return null;
  }

  const getVideoTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      Trailer: 'Trailer',
      Teaser: 'Teaser',
      Featurette: 'Featurette',
      'Behind the Scenes': 'Making-Of',
      Clip: 'Clip',
    };
    return labels[type] || type;
  };

  const videoCount = videos.length;
  const buttonText = videoCount > 1 ? `${videoCount} Videos` : (mainVideo?.type === 'Trailer' ? 'Trailer' : mainVideo?.type);

  return (
    <>
      {/* Button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        style={
          buttonStyle === 'mobile'
            ? {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 16px',
                background: `linear-gradient(135deg, rgba(255, 0, 0, 0.15) 0%, rgba(200, 0, 0, 0.15) 100%)`,
                border: `1px solid rgba(255, 0, 0, 0.3)`,
                borderRadius: '12px',
                color: currentTheme.text.primary,
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                width: '100%',
              }
            : {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 20px',
                background: `linear-gradient(135deg, rgba(255, 0, 0, 0.15) 0%, rgba(200, 0, 0, 0.15) 100%)`,
                border: `1px solid rgba(255, 0, 0, 0.3)`,
                borderRadius: '12px',
                color: currentTheme.text.primary,
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                marginTop: '12px',
              }
        }
      >
        <PlayCircle style={{ color: '#ff0000', fontSize: buttonStyle === 'mobile' ? '20px' : '24px' }} />
        {buttonText}
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setIsOpen(false);
              setSelectedVideo(null);
            }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.95)',
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              padding: '20px',
              paddingTop: '60px',
              overflowY: 'auto',
            }}
          >
            {/* Close Button */}
            <Tooltip title="Schließen" arrow>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setSelectedVideo(null);
                }}
                style={{
                  position: 'fixed',
                  top: '16px',
                  right: '16px',
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '44px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#fff',
                  zIndex: 10001,
                }}
              >
                <Close />
              </button>
            </Tooltip>

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '1000px',
                margin: '0 auto',
              }}
            >
              {/* Header */}
              <div style={{ marginBottom: '20px' }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: '24px',
                    fontWeight: 600,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <Theaters style={{ color: currentTheme.primary }} />
                  Videos
                </h2>
              </div>

              {/* Video Player Area */}
              {selectedVideo && (
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '16/9',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    marginBottom: '24px',
                    background: '#000',
                  }}
                >
                  <iframe
                    src={`https://www.youtube.com/embed/${selectedVideo.key}?autoplay=1`}
                    title={selectedVideo.name}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                    }}
                  />
                </div>
              )}

              {/* Tabs */}
              {(trailers.length > 0 || behindTheScenes.length > 0) && (
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '16px',
                  }}
                >
                  {trailers.length > 0 && (
                    <button
                      onClick={() => setActiveTab('trailers')}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '20px',
                        border: 'none',
                        background:
                          activeTab === 'trailers'
                            ? currentTheme.primary
                            : 'rgba(255,255,255,0.1)',
                        color: '#fff',
                        fontSize: '14px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      Trailer ({trailers.length})
                    </button>
                  )}
                  {behindTheScenes.length > 0 && (
                    <button
                      onClick={() => setActiveTab('bts')}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '20px',
                        border: 'none',
                        background:
                          activeTab === 'bts'
                            ? currentTheme.primary
                            : 'rgba(255,255,255,0.1)',
                        color: '#fff',
                        fontSize: '14px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      Behind the Scenes ({behindTheScenes.length})
                    </button>
                  )}
                </div>
              )}

              {/* Video Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '16px',
                }}
              >
                {currentVideos.map((video) => (
                  <motion.div
                    key={video.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedVideo(video)}
                    style={{
                      cursor: 'pointer',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      background: 'rgba(255,255,255,0.05)',
                      border: selectedVideo?.id === video.id
                        ? `2px solid ${currentTheme.primary}`
                        : '2px solid transparent',
                    }}
                  >
                    {/* Thumbnail */}
                    <div style={{ position: 'relative', aspectRatio: '16/9' }}>
                      <img
                        src={`https://img.youtube.com/vi/${video.key}/mqdefault.jpg`}
                        alt={video.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://img.youtube.com/vi/${video.key}/hqdefault.jpg`;
                        }}
                      />
                      {/* Play Button Overlay */}
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'rgba(0,0,0,0.4)',
                        }}
                      >
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: currentTheme.primary,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <PlayArrow style={{ fontSize: '28px', color: '#fff' }} />
                        </div>
                      </div>
                      {/* Category Badge */}
                      <div
                        style={{
                          position: 'absolute',
                          top: '8px',
                          left: '8px',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          background: 'rgba(0,0,0,0.7)',
                          fontSize: '11px',
                          fontWeight: 500,
                          color: '#fff',
                        }}
                      >
                        {getVideoTypeLabel(video.type)}
                      </div>
                      {/* Official Badge */}
                      {video.official && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            background: currentTheme.primary,
                            fontSize: '11px',
                            fontWeight: 500,
                            color: '#fff',
                          }}
                        >
                          Offiziell
                        </div>
                      )}
                    </div>
                    {/* Title */}
                    <div style={{ padding: '12px' }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: '13px',
                          fontWeight: 500,
                          color: '#fff',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {video.name}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
