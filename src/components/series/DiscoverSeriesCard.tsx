import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Tooltip,
  Typography,
} from '@mui/material';
import notFound from '../../assets/notFound.jpg';
import { Series } from '../../interfaces/Series';
import { getFormattedDate } from '../../utils/date.utils';

interface DiscoverSeriesCardProps {
  series: Series;
  onAdd: (series: Series) => void;
  providers: any[];
}

const DiscoverSeriesCard = ({
  series,
  onAdd,
  providers = [],
}: DiscoverSeriesCardProps) => {
  const handleAddClick = () => {
    onAdd(series);
  };

  const posterImage = series.poster?.poster ? series.poster.poster : notFound;

  return (
    <Card
      className='h-full flex flex-col'
      sx={{
        boxShadow:
          '0 4px 8px 0 rgba(255, 0, 0, 0.2), 0 6px 20px 0 rgba(255, 0, 0, 0.19)',
      }}
    >
      <Box className='relative aspect-2/3'>
        <CardMedia
          sx={{
            height: '100%',
            objectFit: 'cover',
          }}
          image={posterImage}
        />
        {providers.length > 0 && (
          <Box className='absolute top-2 left-2 flex gap-1'>
            {providers.map((provider) => (
              <Box
                key={provider.provider_id}
                className='bg-black/50 backdrop-blur-xs rounded-lg p-1 w-9 h-9'
              >
                <img
                  src={`https://image.tmdb.org/t/p/w500${provider.logo}`}
                  alt={provider.provider_name}
                  className='h-7 rounded-lg'
                />
              </Box>
            ))}
          </Box>
        )}
        <Box
          sx={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            color: 'white',
            padding: '5px',
            borderRadius: '5px',
          }}
        >
          <Typography variant='body2'>
            {getFormattedDate(series.release_date || '')}
          </Typography>
        </Box>
        <Tooltip title='Serie hinzufügen' arrow>
          <Button
            onClick={handleAddClick}
            sx={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              borderRadius: '50%',
              minWidth: '50px',
              minHeight: '50px',
              cursor: 'pointer',
              fontSize: '1.5rem',
            }}
          >
            +
          </Button>
        </Tooltip>
      </Box>
      <CardContent className='grow flex items-center justify-center'>
        <Tooltip title={series.title} arrow>
          <Typography
            variant='body1'
            className='text-center'
            sx={{
              maxWidth: '100%',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              height: '3em',
              lineHeight: '1.5em',
              wordBreak: 'break-word',
              textDecoration: 'underline',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
            }}
          >
            {series.title}
          </Typography>
        </Tooltip>
      </CardContent>
    </Card>
  );
};

export default DiscoverSeriesCard;
