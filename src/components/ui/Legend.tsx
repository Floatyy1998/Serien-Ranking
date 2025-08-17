import { Info } from 'lucide-react';
import { lazy, Suspense } from 'react';
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
            <Box sx={{ 
              p: 2,
              maxWidth: 400,
              background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d30 100%)',
              borderRadius: 2,
              border: `1px solid ${colors.border.primary}30`,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
            }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: 'var(--theme-primary)', 
                  fontWeight: 'bold', 
                  mb: 2,
                  textAlign: 'center',
                  fontSize: '1.1rem'
                }}
              >
                📺 Serien & Filme Guide
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography sx={{ color: '#b103fc', fontWeight: 'bold', mb: 0.5 }}>
                  🟣 Beendet:
                </Typography>
                <Typography sx={{ color: '#e0e0e0', fontSize: '0.9rem', mb: 1 }}>
                  Serie ist abgeschlossen - keine neuen Folgen
                </Typography>
                
                <Typography sx={{ color: '#42d10f', fontWeight: 'bold', mb: 0.5 }}>
                  🟢 Laufend:
                </Typography>
                <Typography sx={{ color: '#e0e0e0', fontSize: '0.9rem', mb: 2 }}>
                  Serie läuft noch - neue Folgen kommen
                </Typography>
              </Box>

              <Box sx={{ 
                borderTop: '1px solid rgba(255,255,255,0.1)', 
                pt: 2,
                '& > div': { mb: 1.5 }
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ color: 'var(--theme-primary)', fontSize: '1rem' }}>🖼️</Typography>
                  <Typography sx={{ color: colors.text.muted, fontSize: '0.9rem' }}>
                    <strong>Poster:</strong> Details anzeigen
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ color: '#ffd700', fontSize: '1rem' }}>🔖</Typography>
                  <Typography sx={{ color: colors.text.muted, fontSize: '0.9rem' }}>
                    <strong>Watchlist-Icon:</strong> Toggle Watchlist
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ color: '#ff6b6b', fontSize: '1rem' }}>⋮</Typography>
                  <Typography sx={{ color: colors.text.muted, fontSize: '0.9rem' }}>
                    <strong>3-Punkte-Menü:</strong> Rating ändern, gesehene Episoden, kommende Episoden, löschen
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
                  opacity: 0.8
                }}
              >
                💡 Nutze Filter & Suche für bessere Übersicht
              </Typography>
              
              <Typography 
                sx={{ 
                  color: '#9e9e9e', 
                  fontSize: '0.75rem', 
                  textAlign: 'center', 
                  mt: 1,
                  borderTop: '1px solid rgba(255,255,255,0.05)',
                  pt: 1
                }}
              >
                Powered by TMDB & JustWatch
              </Typography>
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
