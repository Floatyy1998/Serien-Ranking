import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
  Button,
  Divider,
  SelectChangeEvent,
  TextField,
  Tooltip,
} from '@mui/material';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import 'firebase/compat/database';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../App';
import { genreMenuItems, providerMenuItems } from '../../constants/menuItems';
import { useDebounce } from '../../hooks/useDebounce';
import AddSeriesDialog from '../dialogs/AddSeriesDialog';
import DiscoverSeriesDialog from '../dialogs/DiscoverSeriesDialog';

interface SearchFiltersProps {
  onSearchChange: (value: string) => void;
  onGenreChange: (value: string) => void;
  onProviderChange: (value: string) => void;
}
export const SeriesSearchFilters = memo(
  ({ onSearchChange, onGenreChange, onProviderChange }: SearchFiltersProps) => {
    const [searchValue, setSearchValue] = useState('');
    const [selectedGenre, setSelectedGenre] = useState('All');
    const [selectedProvider, setSelectedProvider] = useState('All');
    const debouncedSearchValue = useDebounce(searchValue, 300);
    const isSharedListPage = location.pathname.startsWith('/shared-list');
    const authContext = useAuth();
    const user = authContext?.user;
    const [dialogAddOpen, setDialogAddOpen] = useState(false);
    const [dialogDiscoverOpen, setDialogDiscoverOpen] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const addSeriesInputRef = useRef<HTMLInputElement>(null);

    // Reset lokale Filterstates, wenn sich der Benutzer ändert
    useEffect(() => {
      setSearchValue('');
      setSelectedGenre('All');
      setSelectedProvider('All');
      onSearchChange('');
      onGenreChange('All');
      onProviderChange('All');
    }, [user]);

    useEffect(() => {
      onSearchChange(debouncedSearchValue);
    }, [debouncedSearchValue, onSearchChange]);
    const handleSearchChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setSearchValue(value);
        onSearchChange(value);
      },
      [onSearchChange]
    );
    const handleGenreChange = useCallback(
      (event: SelectChangeEvent<unknown>) => {
        const value = event.target.value as string;
        setSelectedGenre(value);
        onGenreChange(value);
      },
      [onGenreChange]
    );
    const handleProviderChange = useCallback(
      (event: SelectChangeEvent<unknown>) => {
        const value = event.target.value as string;
        setSelectedProvider(value);
        onProviderChange(value);
      },
      [onProviderChange]
    );

    const handleDialogAddOpen = () => {
      setDialogAddOpen(true);
      setTimeout(() => {
        if (addSeriesInputRef.current) {
          addSeriesInputRef.current.focus();
        }
      }, 100);
    };

    const handleDialogDiscoverOpen = () => {
      setDialogDiscoverOpen(true);
    };

    return (
      <Box className='flex flex-col gap-4 md:flex-row md:items-center justify-center mb-6 max-w-[1400px] m-auto'>
        {}
        <Box className='flex items-center gap-2'>
          <Box sx={{ width: { lg: '300px' }, flexShrink: 0 }}>
            <TextField
              label='Suchen'
              variant='outlined'
              type='search'
              value={searchValue}
              onChange={handleSearchChange}
              fullWidth
              inputRef={searchInputRef}
            />
          </Box>
          {!isSharedListPage && (
            <Box sx={{ flexShrink: 0 }}>
              <Tooltip title='Serie hinzufügen'>
                <Button
                  variant='outlined'
                  onClick={handleDialogAddOpen}
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '0.5rem',
                    overflow: 'hidden',
                    transition: 'width 0.3s ease',
                    justifyContent: 'flex-start',
                    pl: '19px',
                    '@media (min-width:900px)': {
                      '&:hover': { width: 150 },
                      '&:hover .text-wrapper': {
                        opacity: 1,
                        transition: 'opacity 0.5s ease',
                      },
                    },
                  }}
                  aria-label='Serie hinzufügen'
                  role='button'
                >
                  {}
                  <AddIcon />
                  <Box
                    component='span'
                    sx={{
                      whiteSpace: 'nowrap',
                      opacity: 0,
                      transition: 'opacity 0.3s ease',
                      '@media (min-width:900px)': {
                        '&:hover, button:hover &': { opacity: 1 },
                      },
                    }}
                    className='text-wrapper'
                  >
                    Hinzufügen
                  </Box>
                </Button>
              </Tooltip>
              <Divider
                orientation='vertical'
                flexItem
                sx={{ ml: 1, display: { xs: 'none', md: 'block' } }}
              />
            </Box>
          )}
          <Tooltip title='Serien entdecken'>
            <Button
              variant='outlined'
              onClick={handleDialogDiscoverOpen}
              sx={{
                width: 56,
                height: 56,
                borderRadius: '0.5rem',
                overflow: 'hidden',
                transition: 'width 0.3s ease',
                justifyContent: 'flex-start',
                pl: '19px',
                '@media (min-width:900px)': {
                  '&:hover': { width: 150 },
                  '&:hover .text-wrapper': {
                    opacity: 1,
                    transition: 'opacity 0.5s ease',
                  },
                },
              }}
              aria-label='Serien entdecken'
              role='button'
            >
              <SearchIcon />
              <Box
                component='span'
                sx={{
                  whiteSpace: 'nowrap',
                  opacity: 0,
                  transition: 'opacity 0.3s ease',
                  '@media (min-width:900px)': {
                    '&:hover, button:hover &': { opacity: 1 },
                  },
                }}
                className='text-wrapper'
              >
                Entdecken
              </Box>
            </Button>
          </Tooltip>
        </Box>
        <FormControl className='md:w-[250px]'>
          <InputLabel id='genre-label'>Genre</InputLabel>
          <Select
            labelId='genre-label'
            label='Genre'
            value={selectedGenre}
            onChange={handleGenreChange}
          >
            {genreMenuItems.map((item) => (
              <MenuItem key={item.value} value={item.value}>
                {item.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl className='md:w-[250px]'>
          <InputLabel id='provider-label'>Provider</InputLabel>
          <Select
            labelId='provider-label'
            label='Provider'
            value={selectedProvider}
            onChange={handleProviderChange}
          >
            {providerMenuItems.map((item) => (
              <MenuItem key={item.value} value={item.value}>
                {item.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <AddSeriesDialog
          open={dialogAddOpen}
          onClose={() => setDialogAddOpen(false)}
          inputRef={addSeriesInputRef}
        />
        <DiscoverSeriesDialog
          open={dialogDiscoverOpen}
          onClose={() => setDialogDiscoverOpen(false)}
        />
      </Box>
    );
  }
);
export default SeriesSearchFilters;
