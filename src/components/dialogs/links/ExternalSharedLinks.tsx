import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material';
interface ExternalSavedLink {
  key: string;
  name: string;
  link: string;
}
interface ExternalSharedLinksProps {
  externalSharedLists: ExternalSavedLink[];
  externalName: string;
  externalLink: string;
  setExternalName: (name: string) => void;
  setExternalLink: (link: string) => void;
  handleSaveExternalLink: () => void;
  handleDeleteExternalLink: (key: string) => void;
}
const ExternalSharedLinks = ({
  externalSharedLists,
  externalName,
  externalLink,
  setExternalName,
  setExternalLink,
  handleSaveExternalLink,
  handleDeleteExternalLink,
}: ExternalSharedLinksProps) => {
  return (
    <>
      <Typography variant='h6' sx={{ mb: 2 }}>
        Gespeicherte Listen
      </Typography>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: '8px',
          mb: '16px',
        }}
      >
        <TextField
          label='Name'
          value={externalName}
          onChange={(e) => setExternalName(e.target.value)}
          size='small'
          sx={{ flex: { xs: '1 0 auto', md: '1 1 200px' } }}
        />
        <TextField
          label='Link'
          value={externalLink}
          onChange={(e) => setExternalLink(e.target.value)}
          size='small'
          sx={{ flex: { xs: '1 0 auto', md: '1 1 200px' } }}
        />
        <Button
          variant='contained'
          onClick={handleSaveExternalLink}
          sx={{ alignSelf: { xs: 'center', md: 'auto' }, width: 'auto' }}
        >
          <AddIcon />
        </Button>
      </Box>
      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        <List>
          {externalSharedLists.map((item) => (
            <ListItem
              component='a'
              href={item.link}
              target='_blank'
              key={item.key}
              sx={{
                mb: 1,
                borderRadius: 1,
                padding: '12px 16px',
                backgroundColor: 'rgba(0,0,0,0.4)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <ListItemText
                primary={item.name}
                secondary={item.link}
                sx={{
                  '& .MuiListItemText-primary': { color: '#D1D5DB' },
                  '& .MuiListItemText-secondary': {
                    color: '#00fed7',
                    textDecoration: 'underline',
                  },
                }}
              />
              <Button
                variant='outlined'
                color='error'
                size='small'
                onClick={(e) => {
                  e.preventDefault();
                  handleDeleteExternalLink(item.key);
                }}
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
export default ExternalSharedLinks;
