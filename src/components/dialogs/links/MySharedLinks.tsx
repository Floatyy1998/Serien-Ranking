import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Button,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  TextField,
} from '@mui/material';
import React from 'react';

interface SharedLink {
  key: string;
  link: string;
  expiresAt: number;
}

interface MySharedLinksProps {
  linkDuration: number;
  isEndless: boolean;
  setIsEndless: (value: boolean) => void;
  setLinkDuration: (duration: number) => void;
  handleGenerateLink: () => void;
  handleDurationChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  sharedLinks: SharedLink[];
  handleCopyToClipboard: (link: string) => void;
  handleDeleteLink: (key: string) => void;
}

const MySharedLinks = ({
  linkDuration,
  isEndless,
  setIsEndless,
  setLinkDuration,
  handleGenerateLink,
  handleDurationChange,
  sharedLinks,
  handleCopyToClipboard,
  handleDeleteLink,
}: MySharedLinksProps) => {
  return (
    <>
      <div
        style={{
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
        }}
      >
        <TextField
          label='Gültigkeitsdauer (Stunden)'
          type='number'
          value={isEndless ? '' : linkDuration || ''}
          onChange={handleDurationChange}
          sx={{
            width: { xs: '100%', md: 200 },
            '& .MuiInputLabel-root': {
              backgroundColor: 'rgba(0, 254, 215, 0.02) !important',
              color: '#D1D5DB',
            },
            '& .MuiOutlinedInput-root': {
              color: '#D1D5DB',
              '& fieldset': { borderColor: '#374151' },
              '&:hover fieldset': { borderColor: '#4B5563' },
              '&.Mui-focused fieldset': { borderColor: '#10B981' },
            },
            '& .MuiInputBase-input': { color: '#D1D5DB' },
          }}
          disabled={isEndless}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={isEndless}
              onChange={(e) => {
                setIsEndless(e.target.checked);
                setLinkDuration(e.target.checked ? 100 * 365 * 24 : 24);
              }}
              sx={{
                '& .MuiCheckbox-root': { color: '#6B7280' },
                '& .MuiCheckbox-root.Mui-checked': { color: '#10B981' },
              }}
            />
          }
          label='Endlos gültig'
          sx={{ color: '#D1D5DB' }}
        />
        <Button
          variant='contained'
          onClick={handleGenerateLink}
          sx={{
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            fontWeight: 'medium',
            color: '#000',
          }}
        >
          <AddIcon />
        </Button>
      </div>
      <div
        style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '16px' }}
      >
        <List sx={{ mt: 2 }}>
          {sharedLinks.map((link) => (
            <ListItem
              key={link.key}
              sx={{
                mb: 1,
                borderRadius: 1,
                padding: '12px 16px',
                backgroundColor: 'rgba(0,0,0,0.4)',
              }}
            >
              <ListItemText
                primary={
                  <span
                    onClick={() => handleCopyToClipboard(link.link)}
                    style={{ cursor: 'pointer', color: '#00fed7' }}
                    className='hover:underline'
                  >
                    {link.link}
                  </span>
                }
                secondary={`Gültig bis: ${new Date(
                  link.expiresAt
                ).toLocaleString()}`}
                sx={{
                  '& .MuiListItemText-primary': { color: '#D1D5DB' },
                  '& .MuiListItemText-secondary': { color: '#9CA3AF' },
                }}
              />
              <Button
                variant='outlined'
                color='error'
                size='small'
                onClick={() => handleDeleteLink(link.key)}
                sx={{ color: '#EF4444' }}
              >
                <DeleteIcon />
              </Button>
            </ListItem>
          ))}
        </List>
      </div>
    </>
  );
};

export default MySharedLinks;
