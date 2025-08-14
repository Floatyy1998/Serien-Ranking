import { Card, CardContent, CardMedia, Typography } from '@mui/material';
import notFound from '../../assets/notFound.jpg';
import { Movie } from '../../types/Movie';
import { Series } from '../../types/Series';

interface SimpleCardProps {
  item: Series | Movie;
}

const SimpleCard = ({ item }: SimpleCardProps) => {
  const posterImage = item.poster?.poster ? item.poster.poster : notFound;
  const title = item.title;

  return (
    <Card
      sx={{
        width: '110px',
        height: '185px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow:
          '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)',
      }}
    >
      <CardMedia
        component='img'
        image={posterImage}
        alt={title}
        sx={{ height: '135px', objectFit: 'cover' }}
      />
      <CardContent
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '5px',
        }}
      >
        <Typography
          variant='body2'
          sx={{
            textAlign: 'center',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {title}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default SimpleCard;
