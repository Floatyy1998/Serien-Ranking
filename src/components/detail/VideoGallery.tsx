import { Close, PlayCircle, Theaters } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useDeviceType } from '../../hooks/useDeviceType';
import { tapScale, tapScaleSmall } from '../../lib/motion';
import { tmdbFetch } from '../../services/tmdbClient';
import { t } from '../../services/i18n';

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
  buttonStyle?: 'desktop' | 'mobile' | 'compact' | 'icon';
}

export const VideoGallery: React.FC<VideoGalleryProps> = ({
  tmdbId,
  mediaType,
  buttonStyle = 'desktop',
}) => {
  const { currentTheme } = useTheme();
  const { isMobile } = useDeviceType();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [activeTab, setActiveTab] = useState<'trailers' | 'bts'>('trailers');

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      try {
        // German videos + English fallback
        const [deData, enData] = await Promise.all([
          tmdbFetch<{ results?: Video[] }>(`${mediaType}/${tmdbId}/videos`),
          tmdbFetch<{ results?: Video[] }>(`${mediaType}/${tmdbId}/videos`, { language: 'en-US' }),
        ]);

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

  // Esc schließt den Dialog (vor dem Early-Return — Hooks laufen unbedingt).
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSelectedVideo(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  const trailers = videos.filter((v) => ['Trailer', 'Teaser'].includes(v.type));
  const behindTheScenes = videos.filter((v) =>
    ['Featurette', 'Behind the Scenes', 'Clip'].includes(v.type)
  );
  const currentVideos = activeTab === 'trailers' ? trailers : behindTheScenes;
  const mainVideo = videos[0];

  const closeModal = () => {
    setIsOpen(false);
    setSelectedVideo(null);
  };

  const openModal = () => {
    // Erstes Video sofort abspielen — der Player ist der Held des Dialogs,
    // nicht ein Kachel-Grid, das erst einen weiteren Tap verlangt.
    const first = videos[0] || null;
    setActiveTab(first && ['Trailer', 'Teaser'].includes(first.type) ? 'trailers' : 'bts');
    setSelectedVideo(first);
    setIsOpen(true);
  };

  // Don't render if no videos
  if (loading || videos.length === 0) {
    return null;
  }

  const getVideoTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      Trailer: 'Trailer',
      Teaser: 'Teaser',
      Featurette: 'Featurette',
      'Behind the Scenes': t('Making-Of'),
      Clip: 'Clip',
    };
    return labels[type] || type;
  };

  const videoCount = videos.length;
  const buttonText =
    videoCount > 1
      ? `${videoCount} Videos`
      : mainVideo?.type === 'Trailer'
        ? 'Trailer'
        : mainVideo?.type;

  // Desktop mit mehreren Videos: Player links, Liste als Sidebar rechts
  // (YouTube-Muster). Mobil bleibt der vertikale Stapel mit Quer-Leiste.
  const hasSidebar = !isMobile && videos.length > 1;

  const tabsEl =
    trailers.length > 0 && behindTheScenes.length > 0 ? (
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {(
          [
            ['trailers', `Trailer (${trailers.length})`],
            ['bts', `Behind the Scenes (${behindTheScenes.length})`],
          ] as const
        ).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              const list = tab === 'trailers' ? trailers : behindTheScenes;
              if (list[0]) setSelectedVideo(list[0]);
            }}
            style={{
              padding: '6px 14px',
              borderRadius: '999px',
              border:
                activeTab === tab
                  ? `1px solid ${currentTheme.primary}55`
                  : '1px solid var(--glass-border-subtle)',
              background: activeTab === tab ? `${currentTheme.primary}1f` : 'transparent',
              color: activeTab === tab ? currentTheme.primary : currentTheme.text.muted,
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {label}
          </button>
        ))}
      </div>
    ) : null;

  const renderVideoTile = (video: Video, layout: 'rail' | 'row') => {
    const isActive = selectedVideo?.id === video.id;
    return (
      <motion.div
        key={video.id}
        whileTap={tapScaleSmall}
        onClick={() => setSelectedVideo(video)}
        role="button"
        tabIndex={0}
        aria-label={t('{name} abspielen', { name: video.name })}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setSelectedVideo(video);
          }
        }}
        style={
          layout === 'row'
            ? { cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'center' }
            : { cursor: 'pointer', flex: '0 0 168px', width: '168px' }
        }
      >
        <div
          style={{
            aspectRatio: '16/9',
            borderRadius: '10px',
            overflow: 'hidden',
            border: isActive ? `2px solid ${currentTheme.primary}` : '2px solid transparent',
            opacity: isActive ? 1 : 0.75,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            ...(layout === 'row' ? { width: '128px', flexShrink: 0 } : {}),
          }}
        >
          <img
            src={`https://img.youtube.com/vi/${video.key}/mqdefault.jpg`}
            alt={video.name}
            loading="lazy"
            decoding="async"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `https://img.youtube.com/vi/${video.key}/hqdefault.jpg`;
            }}
          />
        </div>
        <div style={layout === 'row' ? { minWidth: 0 } : undefined}>
          <p
            style={{
              margin: layout === 'row' ? 0 : '6px 0 0',
              fontSize: '12px',
              fontWeight: 500,
              color: isActive ? currentTheme.text.primary : currentTheme.text.secondary,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: layout === 'row' ? 'normal' : 'nowrap',
              ...(layout === 'row'
                ? {
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical' as const,
                  }
                : {}),
            }}
          >
            {video.name}
          </p>
          <p style={{ margin: 0, fontSize: '11px', color: currentTheme.text.muted }}>
            {getVideoTypeLabel(video.type)}
            {video.official ? ` · ${t('Offiziell')}` : ''}
          </p>
        </div>
      </motion.div>
    );
  };

  return (
    <>
      {/* Button */}
      <motion.button
        whileTap={tapScale}
        onClick={openModal}
        aria-label={t('Videos ansehen')}
        style={
          buttonStyle === 'icon'
            ? {
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${currentTheme.primary}40`,
                borderRadius: '10px',
                color: currentTheme.text.primary,
                cursor: 'pointer',
                fontSize: '13px',
              }
            : buttonStyle === 'compact'
              ? {
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  padding: '4px 10px',
                  background:
                    'linear-gradient(135deg, rgba(255, 0, 0, 0.15) 0%, rgba(200, 0, 0, 0.15) 100%)',
                  border: '1px solid rgba(255, 0, 0, 0.3)',
                  borderRadius: '16px',
                  color: currentTheme.text.primary,
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap' as const,
                }
              : buttonStyle === 'mobile'
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
                    fontSize: '14px',
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
                    fontSize: '15px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    marginTop: '12px',
                  }
        }
      >
        {buttonStyle === 'icon' ? (
          <Theaters style={{ fontSize: '20px', color: currentTheme.primary }} />
        ) : (
          <PlayCircle
            style={{
              color: '#ff0000',
              fontSize:
                buttonStyle === 'compact' ? '16px' : buttonStyle === 'mobile' ? '20px' : '24px',
            }}
          />
        )}
        {buttonStyle !== 'icon' && buttonText}
      </motion.button>

      {/* Modal per Portal an document.body: position:fixed wird sonst von
          transformierten Ancestors (Hero-Animationen) eingefangen und der
          Dialog klebt als Mini-Box im Hero statt das Viewport zu füllen. */}
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(8, 6, 10, 0.85)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding:
                  'calc(16px + env(safe-area-inset-top)) 16px calc(16px + env(safe-area-inset-bottom))',
                overflowY: 'auto',
              }}
            >
              <motion.div
                initial={{ scale: 0.96, opacity: 0, y: 12 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.96, opacity: 0, y: 12 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Videos"
                style={{
                  width: '100%',
                  maxWidth: hasSidebar ? '1160px' : '960px',
                  margin: 'auto',
                  // Deckende Basis unter dem Glas-Verlauf — Blur ist unter dem
                  // framer-Fade nicht verlässlich (Opacity-Ancestor-Gotcha).
                  background: `linear-gradient(150deg, var(--glass-light) 0%, var(--glass-subtle) 60%), ${currentTheme.background.default}`,
                  border: '1px solid var(--glass-border-subtle)',
                  borderRadius: '20px',
                  boxShadow:
                    '0 24px 80px -24px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.06)',
                  overflow: 'hidden',
                }}
              >
                {/* Kopfzeile */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 20px',
                    borderBottom: '1px solid var(--glass-border-subtle)',
                  }}
                >
                  <h2
                    style={{
                      margin: 0,
                      fontSize: '17px',
                      fontWeight: 700,
                      fontFamily: 'var(--font-display)',
                      color: currentTheme.text.primary,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <Theaters style={{ color: currentTheme.primary, fontSize: '20px' }} />
                    Videos
                    {videos.length > 1 && (
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: 500,
                          color: currentTheme.text.muted,
                          fontFamily: 'inherit',
                        }}
                      >
                        {videos.length}
                      </span>
                    )}
                  </h2>
                  <Tooltip title={t('Schließen')} arrow>
                    <button
                      aria-label={t('Schließen')}
                      onClick={closeModal}
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid var(--glass-border-subtle)',
                        borderRadius: '50%',
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: currentTheme.text.secondary,
                        flexShrink: 0,
                      }}
                    >
                      <Close style={{ fontSize: '20px' }} />
                    </button>
                  </Tooltip>
                </div>

                <div
                  style={{
                    padding: '16px 20px 20px',
                    ...(hasSidebar
                      ? { display: 'flex', gap: '20px', alignItems: 'flex-start' }
                      : {}),
                  }}
                >
                  {/* Player-Spalte */}
                  <div style={hasSidebar ? { flex: 1, minWidth: 0 } : undefined}>
                    {selectedVideo && (
                      <>
                        <div
                          style={{
                            width: '100%',
                            aspectRatio: '16/9',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            background: '#000',
                            border: '1px solid var(--glass-border-subtle)',
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
                              display: 'block',
                            }}
                          />
                        </div>
                        <div style={{ marginTop: '10px', marginBottom: '4px' }}>
                          <p
                            style={{
                              margin: 0,
                              fontSize: '14px',
                              fontWeight: 600,
                              color: currentTheme.text.primary,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {selectedVideo.name}
                          </p>
                          <p
                            style={{
                              margin: '2px 0 0',
                              fontSize: '12px',
                              color: currentTheme.text.muted,
                            }}
                          >
                            {getVideoTypeLabel(selectedVideo.type)}
                            {selectedVideo.official ? ` · ${t('Offiziell')}` : ''}
                          </p>
                        </div>
                      </>
                    )}

                    {/* Mobil/ein-spaltig: Tabs + Quer-Leiste unter dem Player */}
                    {!hasSidebar && tabsEl && <div style={{ marginTop: '12px' }}>{tabsEl}</div>}
                    {!hasSidebar && currentVideos.length > 1 && (
                      <div
                        style={{
                          display: 'flex',
                          gap: '10px',
                          marginTop: '14px',
                          overflowX: 'auto',
                          paddingBottom: '4px',
                          WebkitOverflowScrolling: 'touch',
                        }}
                      >
                        {currentVideos.map((video) => renderVideoTile(video, 'rail'))}
                      </div>
                    )}
                  </div>

                  {/* Desktop: Sidebar mit Tabs + vertikaler Videoliste */}
                  {hasSidebar && (
                    <div style={{ width: '300px', flexShrink: 0 }}>
                      {tabsEl && <div style={{ marginBottom: '12px' }}>{tabsEl}</div>}
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px',
                          maxHeight: '56vh',
                          overflowY: 'auto',
                          paddingRight: '4px',
                        }}
                      >
                        {currentVideos.map((video) => renderVideoTile(video, 'row'))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};
