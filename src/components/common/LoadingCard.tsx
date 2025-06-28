import { Box, Card } from '@mui/material';
import { RingLoader } from 'react-spinners';
const LoadingCard = () => {
  return (
    <Card
      className='h-full transition-shadow duration-300 flex flex-col'
      sx={{
        boxShadow: `rgba(0, 0, 0, 0.2) 8px 8px 20px 0px, rgba(255, 255, 255, 0.2) -5px -5px 20px 0px;`,
        height: '445px',
      }}
    >
      <Box
        sx={{
          textAlign: 'center',
          margin: 'auto',
        }}
      >
        <RingLoader color='#00fed7' size={60}></RingLoader>
      </Box>
    </Card>
  );
};
export default LoadingCard;
