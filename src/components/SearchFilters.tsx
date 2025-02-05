import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import { SelectChangeEvent, Tooltip } from '@mui/material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import { memo, useCallback, useState } from 'react';

interface SearchFiltersProps {
  onSearchChange: (value: string) => void;
  onGenreChange: (value: string) => void;
  onProviderChange: (value: string) => void;
}

export const SearchFilters = memo(
  ({ onSearchChange, onGenreChange, onProviderChange }: SearchFiltersProps) => {
    const [searchValue, setSearchValue] = useState('');
    const [selectedGenre, setSelectedGenre] = useState('All');
    const [selectedProvider, setSelectedProvider] = useState('All');
    const [isWatchlist, setIsWatchlist] = useState(false);

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

    const handleWatchlistToggle = useCallback(() => {
      setIsWatchlist((prev) => !prev);
      onGenreChange(isWatchlist ? 'All' : 'Watchlist');
    }, [isWatchlist, onGenreChange]);

    return (
      <Box className='flex flex-col gap-4 md:flex-row md:items-center mb-6 max max-w-[1400px] m-auto'>
        <TextField
          label='Suchen'
          variant='outlined'
          className='flex-1'
          type='search'
          value={searchValue}
          onChange={handleSearchChange}
        />
        <FormControl className='md:w-[250px]'>
          <InputLabel>Genre</InputLabel>
          <Select
            label='Genre'
            value={selectedGenre}
            onChange={handleGenreChange}
          >
            <MenuItem value='All'>All</MenuItem>
            <MenuItem value='Action & Adventure'>Action & Adventure</MenuItem>
            <MenuItem value='Animation'>Animation</MenuItem>
            <MenuItem value='Comedy'>Comedy</MenuItem>
            <MenuItem value='Crime'>Crime</MenuItem>
            <MenuItem value='Drama'>Drama</MenuItem>
            <MenuItem value='Documentary'>Documentary</MenuItem>
            <MenuItem value='Family'>Family</MenuItem>
            <MenuItem value='Kids'>Kids</MenuItem>
            <MenuItem value='Mystery'>Mystery</MenuItem>
            <MenuItem value='Reality'>Reality</MenuItem>
            <MenuItem value='Sci-Fi & Fantasy'>Sci-Fi & Fantasy</MenuItem>
            <MenuItem value='Talk'>Talk</MenuItem>
            <MenuItem value='War & Politics'>War & Politics</MenuItem>
            <MenuItem value='Western'>Western</MenuItem>
            <MenuItem value='Ohne Bewertung'>Ohne Bewertung</MenuItem>
            <MenuItem value='Neue Episoden'>Neue Episoden</MenuItem>
            <MenuItem value='Zuletzt Hinzugefügt'>Zuletzt Hinzugefügt</MenuItem>
          </Select>
        </FormControl>
        <FormControl className='md:w-[250px]'>
          <InputLabel>Provider</InputLabel>
          <Select
            label='Provider'
            value={selectedProvider}
            onChange={handleProviderChange}
          >
            <MenuItem value='All'>Alle</MenuItem>
            <MenuItem value='Amazon Prime Video'>Prime Video</MenuItem>
            <MenuItem value='Animation Digital Network'>ADN</MenuItem>
            <MenuItem value='Apple TV Plus'>AppleTV+</MenuItem>
            <MenuItem value='Crunchyroll'>Crunchyroll</MenuItem>
            <MenuItem value='Disney Plus'>Disney+</MenuItem>
            <MenuItem value='Freevee'>Freevee</MenuItem>
            <MenuItem value='Joyn Plus'>Joyn+</MenuItem>
            <MenuItem value='MagentaTV'>MagentaTV</MenuItem>
            <MenuItem value='Netflix'>Netflix</MenuItem>
            <MenuItem value='Paramount Plus'>Paramount+</MenuItem>
            <MenuItem value='RTL+'>RTL+</MenuItem>
            <MenuItem value='WOW'>WOW</MenuItem>
          </Select>
        </FormControl>
        <Tooltip
          title={isWatchlist ? 'Watchlist ausblenden' : 'Watchlist anzeigen'}
        >
          <Button
            variant={isWatchlist ? 'contained' : 'outlined'}
            onClick={handleWatchlistToggle}
            sx={{
              margin: 'auto',
              borderRadius: '0.5rem',
              width: 48,
              height: 48,
              minWidth: 48,
            }}
          >
            {isWatchlist ? <BookmarkIcon /> : <BookmarkBorderIcon />}
          </Button>
        </Tooltip>
      </Box>
    );
  }
);
export default SearchFilters;
