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
import { Movie } from '../../interfaces/Movie';
import { getFormattedDate } from '../../utils/date.utils';

interface DiscoverMovieCardProps {
  movie: Movie;
  onAdd: (movie: Movie) => void;
}

const DiscoverMovieCard = ({ movie, onAdd }: DiscoverMovieCardProps) => {
  const handleAddClick = () => {
    onAdd(movie);
  };

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
          image={
            movie.poster.poster.substring(movie.poster.poster.length - 4) !==
            'null'
              ? movie.poster.poster
              : notFound
          }
        />
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
            {getFormattedDate(movie.release_date || '')}
          </Typography>
        </Box>
        <Tooltip title='Film hinzufügen' arrow>
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
        <Tooltip title={movie.title} arrow>
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
            {movie.title}
          </Typography>
        </Tooltip>
      </CardContent>
    </Card>
  );
};

export default DiscoverMovieCard;
