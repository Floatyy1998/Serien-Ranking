import {
  Bookmark,
  Circle,
  Image,
  Lightbulb,
  LiveTv,
  MoreVert,
} from '@mui/icons-material';
import { Info } from 'lucide-react';
import { lazy, Suspense } from 'react';
import tvdbLogo from '../../assets/tvdb.png';
import { colors } from '../../theme';
const Box = lazy(() => import('@mui/material/Box'));
const IconButton = lazy(() => import('@mui/material/IconButton'));
const Tooltip = lazy(() => import('@mui/material/Tooltip'));
const Typography = lazy(() => import('@mui/material/Typography'));
export const Legend = () => {
  return (
    <Suspense fallback={<div />}>
      <Box className='flex items-center gap-6 max-w-[1400px] mx-auto justify-center'>
        <Typography variant='body2' className='text-gray-400'>
          Serien Status:
        </Typography>
        <div className='flex items-center gap-2'>
          <Box className='w-3 h-3 rounded-full bg-purple-500' />
          <Typography variant='body2' className='text-gray-300'>
            Beendet
          </Typography>
        </div>
        <div className='flex items-center gap-2'>
          <Box className='w-3 h-3 rounded-full bg-green-500' />
          <Typography variant='body2' className='text-gray-300'>
            Laufend
          </Typography>
        </div>
        <Tooltip
          title={
            <Box
              sx={{
                p: 2,
                maxWidth: 400,
                background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d30 100%)',
                borderRadius: 2,
                border: `1px solid ${colors.border.primary}30`,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
              }}
            >
              <Typography
                variant='h6'
                sx={{
                  color: 'var(--theme-primary)',
                  fontWeight: 'bold',
                  mb: 2,
                  textAlign: 'center',
                  fontSize: '1.1rem',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    justifyContent: 'center',
                  }}
                >
                  <LiveTv sx={{ fontSize: '1.2rem' }} />
                  <span>Serien & Filme Guide</span>
                </Box>
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    color: '#b103fc',
                    fontWeight: 'bold',
                    mb: 0.5,
                  }}
                >
                  <Circle sx={{ fontSize: '0.9rem', color: '#b103fc' }} />
                  <Typography sx={{ color: '#b103fc', fontWeight: 'bold' }}>
                    Beendet:
                  </Typography>
                </Box>
                <Typography
                  sx={{ color: '#e0e0e0', fontSize: '0.9rem', mb: 1 }}
                >
                  Serie ist abgeschlossen - keine neuen Folgen
                </Typography>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    color: '#42d10f',
                    fontWeight: 'bold',
                    mb: 0.5,
                  }}
                >
                  <Circle sx={{ fontSize: '0.9rem', color: '#42d10f' }} />
                  <Typography sx={{ color: '#42d10f', fontWeight: 'bold' }}>
                    Laufend:
                  </Typography>
                </Box>
                <Typography
                  sx={{ color: '#e0e0e0', fontSize: '0.9rem', mb: 2 }}
                >
                  Serie läuft noch - neue Folgen kommen
                </Typography>
              </Box>

              <Box
                sx={{
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                  pt: 2,
                  '& > div': { mb: 1.5 },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Image
                    sx={{ color: 'var(--theme-primary)', fontSize: '1rem' }}
                  />
                  <Typography
                    sx={{ color: colors.text.muted, fontSize: '0.9rem' }}
                  >
                    <strong>Poster:</strong> Details anzeigen
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Bookmark sx={{ color: '#ffd700', fontSize: '1rem' }} />
                  <Typography
                    sx={{ color: colors.text.muted, fontSize: '0.9rem' }}
                  >
                    <strong>Watchlist-Icon:</strong> Toggle Watchlist
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MoreVert sx={{ color: '#ff6b6b', fontSize: '1rem' }} />
                  <Typography
                    sx={{ color: colors.text.muted, fontSize: '0.9rem' }}
                  >
                    <strong>3-Punkte-Menü:</strong> Rating ändern, gesehene
                    Episoden, kommende Episoden, löschen
                  </Typography>
                </Box>
              </Box>

              <Typography
                sx={{
                  color: 'var(--theme-primary)',
                  fontSize: '0.8rem',
                  textAlign: 'center',
                  mt: 2,
                  fontStyle: 'italic',
                  opacity: 0.8,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    justifyContent: 'center',
                  }}
                >
                  <Lightbulb sx={{ fontSize: '0.9rem' }} />
                  <span>Nutze Filter & Suche für bessere Übersicht</span>
                </Box>
              </Typography>

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  mt: 1,
                  borderTop: '1px solid rgba(255,255,255,0.05)',
                  pt: 1,
                }}
              >
                <Typography
                  sx={{
                    color: '#9e9e9e',
                    fontSize: '0.75rem',
                    textAlign: 'center',
                  }}
                >
                  Powered by TMDB, JustWatch &
                </Typography>
                <a
                  href='https://thetvdb.com/subscribe'
                  target='_blank'
                  rel='noopener noreferrer'
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    textDecoration: 'none',
                  }}
                >
                  <img
                    src={tvdbLogo}
                    alt='TheTVDB'
                    style={{
                      height: '16px',
                      filter: 'brightness(0.8)',
                      transition: 'filter 0.2s ease',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.filter = 'brightness(1)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.filter = 'brightness(0.8)')
                    }
                  />
                </a>
              </Box>
            </Box>
          }
          arrow
          placement='bottom'
          componentsProps={{
            tooltip: {
              sx: {
                bgcolor: 'transparent',
                '& .MuiTooltip-arrow': {
                  color: '#1a1a1a',
                },
              },
            },
          }}
        >
          <IconButton size='small' className='text-gray-400' aria-label='info'>
            <Info size={16} />
          </IconButton>
        </Tooltip>
      </Box>
    </Suspense>
  );
};
export default Legend;
