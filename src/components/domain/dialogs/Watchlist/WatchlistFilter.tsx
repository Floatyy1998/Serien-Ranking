import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import { Box, Button, Divider, TextField, Tooltip } from '@mui/material';
import React from 'react';
interface FilterProps {
  filterInput: string;
  setFilterInput: (val: string) => void;
  customOrderActive: boolean;
  setCustomOrderActive: (active: boolean) => void;
  sortOption: string;
  toggleSort: (field: string) => void;
  hideRewatches: boolean;
  setHideRewatches: (hide: boolean) => void;
}
const WatchlistFilter: React.FC<FilterProps> = ({
  filterInput,
  setFilterInput,
  customOrderActive,
  setCustomOrderActive,
  sortOption,
  toggleSort,
  hideRewatches,
  setHideRewatches,
}) => {
  return (
    <Box className='flex flex-col mb-4'>
      <Divider />
      <Box className='flex flex-col sm:flex-row justify-between items-center my-2'>
        <span className='text-gray-400 mb-2 sm:mb-0'>Filter:</span>
        <Box className='flex flex-col sm:flex-row items-center gap-2'>
          <TextField
            size='small'
            placeholder='Nach Namen filtern'
            value={filterInput}
            onChange={(e) => setFilterInput(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{
              '& .MuiOutlinedInput-root': {
                background: 'rgba(45,45,48,0.8)',
                backdropFilter: 'blur(10px)',
                borderRadius: '12px',
                color: '#ffffff',
                '& fieldset': {
                  borderColor: 'rgba(255,255,255,0.2)',
                  borderWidth: '1px',
                },
                '&:hover': {
                  background: 'rgba(55,55,58,0.9)',
                  '& fieldset': {
                    borderColor: 'rgba(255,255,255,0.3)',
                  },
                },
                '&.Mui-focused': {
                  background: 'rgba(65,65,68,0.95)',
                  boxShadow: '0 0 20px var(--theme-primary, 0.3)',
                  '& fieldset': {
                    borderColor: 'var(--theme-primary)',
                  },
                },
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255,255,255,0.7)',
                '&.Mui-focused': {
                  color: 'var(--theme-primary)',
                },
              },
            }}
          />
          <Button
            variant={customOrderActive ? 'contained' : 'outlined'}
            onClick={() => setCustomOrderActive(!customOrderActive)}
            sx={{
              width: 'auto',
              fontSize: '0.75rem',
              background: customOrderActive
                ? 'linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-primary-hover) 100%)'
                : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
              borderRadius: '12px',
              padding: '8px 16px',
              color: customOrderActive ? '#000000' : '#ffffff',
              fontWeight: customOrderActive ? 600 : 500,
              textTransform: 'none',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: customOrderActive
                  ? 'linear-gradient(135deg, var(--theme-primary-hover) 0%, var(--theme-primary-hover) 100%)'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.1) 100%)',
                transform: 'translateY(-2px)',
                boxShadow: customOrderActive
                  ? '0 8px 25px var(--theme-primary)40'
                  : '0 8px 25px rgba(255,255,255,0.2)',
              },
            }}
          >
            Benutzerdefiniert
          </Button>
          <Tooltip
            title={
              hideRewatches ? 'Rewatches anzeigen' : 'Rewatches ausblenden'
            }
          >
            <Button
              variant={!hideRewatches ? 'contained' : 'outlined'}
              onClick={() => setHideRewatches(!hideRewatches)}
              sx={{
                width: 'auto',
                fontSize: '0.75rem',
                background: !hideRewatches
                  ? 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                borderRadius: '12px',
                padding: '8px 16px',
                color: !hideRewatches ? '#000000' : '#ffffff',
                fontWeight: !hideRewatches ? 600 : 500,
                textTransform: 'none',
                border: !hideRewatches
                  ? '1px solid rgba(255,152,0,0.3)'
                  : '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: !hideRewatches
                    ? 'linear-gradient(135deg, #f57c00 0%, #ef6c00 100%)'
                    : 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.1) 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: !hideRewatches
                    ? '0 8px 25px rgba(255, 152, 0, 0.4)'
                    : '0 8px 25px rgba(255,255,255,0.2)',
                },
              }}
            >
              Rewatches
            </Button>
          </Tooltip>
          <Tooltip title='Nach Name sortieren'>
            <Button
              onClick={() => toggleSort('name')}
              sx={{
                minWidth: '80px',
                fontSize: '0.75rem',
                background:
                  'linear-gradient(135deg, var(--theme-primary)19 0%, var(--theme-primary)0D 100%)',
                borderRadius: '12px',
                padding: '8px 16px',
                color: 'var(--theme-primary)',
                fontWeight: 500,
                textTransform: 'none',
                border: '1px solid var(--theme-primary)33',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background:
                    'linear-gradient(135deg, var(--theme-primary)26 0%, var(--theme-primary)19 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(0, 254, 215, 0.3)',
                },
              }}
            >
              Name
              {!customOrderActive &&
                sortOption.startsWith('name') &&
                (sortOption.endsWith('asc') ? (
                  <ArrowUpwardIcon
                    fontSize='small'
                    style={{ width: '16px', marginLeft: 4 }}
                  />
                ) : (
                  <ArrowDownwardIcon
                    fontSize='small'
                    style={{ width: '16px', marginLeft: 4 }}
                  />
                ))}
            </Button>
          </Tooltip>
          <Tooltip title='Nach Datum sortieren'>
            <Button
              onClick={() => toggleSort('date')}
              sx={{
                minWidth: '80px',
                fontSize: '0.75rem',
                background:
                  'linear-gradient(135deg, var(--theme-primary)19 0%, var(--theme-primary)0D 100%)',
                borderRadius: '12px',
                padding: '8px 16px',
                color: 'var(--theme-primary)',
                fontWeight: 500,
                textTransform: 'none',
                border: '1px solid var(--theme-primary)33',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background:
                    'linear-gradient(135deg, var(--theme-primary)26 0%, var(--theme-primary)19 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(0, 254, 215, 0.3)',
                },
              }}
            >
              Datum
              {!customOrderActive &&
                sortOption.startsWith('date') &&
                (sortOption.endsWith('asc') ? (
                  <ArrowUpwardIcon
                    fontSize='small'
                    style={{ width: '16px', marginLeft: 4 }}
                  />
                ) : (
                  <ArrowDownwardIcon
                    fontSize='small'
                    style={{ width: '16px', marginLeft: 4 }}
                  />
                ))}
            </Button>
          </Tooltip>
        </Box>
      </Box>
      <Divider />
    </Box>
  );
};
export default WatchlistFilter;
