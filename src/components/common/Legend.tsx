import { Info } from 'lucide-react';
import { lazy, Suspense } from 'react';
const Box = lazy(() => import('@mui/material/Box'));
const IconButton = lazy(() => import('@mui/material/IconButton'));
const Tooltip = lazy(() => import('@mui/material/Tooltip'));
const Typography = lazy(() => import('@mui/material/Typography'));
export const Legend = () => {
  return (
    <Suspense fallback={<div />}>
      <Box className='flex items-center gap-6 max-w-[1400px] mx-auto justify-center md:justify-start sm:justify-center'>
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
            <>
              <Typography style={{ textDecoration: 'underline' }}>
                <b>LEGENDE</b>
              </Typography>
              <br></br>
              <span style={{ color: '#b103fc' }}>
                <b>beendet:</b> Es kommen{' '}
                <strong>
                  <u style={{ textDecoration: 'underline' }}>keine</u>
                </strong>{' '}
                weiteren Episoden.
              </span>
              <br></br>
              <br></br>
              <span style={{ color: '#42d10f' }}>
                <b>laufend:</b> Es kommen weitere Folgen.
              </span>
              <br></br>
              <br></br>
              <span>
                Klicke auf ein Poster, , um zu erfahren, wo du die Serie schauen
                kannst.
              </span>
              <br></br>
              <br></br>
              <span>Klicke auf ein Rating, um das Rating anzupassen.</span>
              <br></br>
              <br></br>
              <span>
                Klicke auf den Titel, um gehsehene Episoden zu markieren.
              </span>
              <br></br>
              <br></br>
              <span>
                Klicke auf das Bookmark-Symbol, um die Serie auf deiner
                Watchlist zu speichern.
              </span>
              <br></br>
              <br></br>
              <span>
                Nutze die Suchleiste, um nach Serien zu suchen und Filter, um
                Ergebnisse einzugrenzen.
              </span>
              <br></br>
              <br></br>
              <span>
                Klicke auf das Statistik-Symbol, um detaillierte Statistiken zu
                deinen Serien zu sehen.
              </span>
              <br></br>
              <br></br>
              <span style={{ color: '#00fed7' }}>
                Daten bereitgestellt von TMDB und JustWatch
              </span>
              <br></br>
              <br></br>
            </>
          }
          arrow
          placement='bottom'
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
