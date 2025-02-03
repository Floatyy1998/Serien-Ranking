import { SelectChangeEvent } from '@mui/material';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import { useState } from 'react';

interface SearchFiltersProps {
  onSearchChange: (value: string) => void;
  onGenreChange: (value: string) => void;
  onProviderChange: (value: string) => void;
}

export const SearchFilters = ({
  onSearchChange,
  onGenreChange,
  onProviderChange,
}: SearchFiltersProps) => {
  const [searchValue, setSearchValue] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedProvider, setSelectedProvider] = useState('All');

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchValue(value);
    onSearchChange(value);
  };

  const handleGenreChange = (event: SelectChangeEvent<unknown>) => {
    const value = event.target.value as string;
    setSelectedGenre(value);
    onGenreChange(value);
  };

  const handleProviderChange = (event: SelectChangeEvent<unknown>) => {
    const value = event.target.value as string;
    setSelectedProvider(value);
    onProviderChange(value);
  };

  return (
    <Box className='flex flex-col gap-4 md:flex-row md:items-center mb-6 max'>
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
          <MenuItem value='Watchlist'>Watchlist</MenuItem>
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
    </Box>
  );
};
export default SearchFilters;
