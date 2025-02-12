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
}
const WatchlistFilter: React.FC<FilterProps> = ({
  filterInput,
  setFilterInput,
  customOrderActive,
  setCustomOrderActive,
  sortOption,
  toggleSort,
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
          />
          <Button
            variant={customOrderActive ? 'contained' : 'outlined'}
            onClick={() => setCustomOrderActive(!customOrderActive)}
            sx={{
              width: 'auto',
              fontSize: '0.75rem',
              backgroundColor: customOrderActive ? '#00fed7' : 'transparent',
              color: customOrderActive ? '#000' : '#00fed7',
            }}
          >
            Benutzerdefiniert
          </Button>
          <Tooltip title='Nach Name sortieren'>
            <Button
              onClick={() => toggleSort('name')}
              sx={{
                color: '#00fed7',
                minWidth: '80px',
                fontSize: '0.75rem',
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
                color: '#00fed7',
                minWidth: '80px',
                fontSize: '0.75rem',
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
