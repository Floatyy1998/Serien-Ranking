import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
} from '@mui/material';
import React, { useState } from 'react';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import StarIcon from '@mui/icons-material/Star';
import InfoIcon from '@mui/icons-material/Info';
import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay';
import DeleteIcon from '@mui/icons-material/Delete';

interface MenuOption {
  label: string;
  icon: React.ReactNode;
  onClick: (event: React.MouseEvent) => void;
  disabled?: boolean;
}

interface ThreeDotMenuProps {
  options: MenuOption[];
}

const ThreeDotMenu: React.FC<ThreeDotMenuProps> = ({ options }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    setAnchorEl(null);
  };

  const handleMenuItemClick = (optionClick: (event: React.MouseEvent) => void) => (event: React.MouseEvent) => {
    event.stopPropagation();
    optionClick(event);
    handleClose();
  };

  return (
    <>
      <IconButton
        onClick={handleClick}
        sx={{
          color: 'white',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          transition: 'all 0.3s ease',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            transform: 'scale(1.05)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          },
          width: 36,
          height: 36,
        }}
        aria-label="Optionen"
      >
        <MoreVertIcon sx={{ fontSize: 22 }} />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => handleClose()}
        onClick={(e) => e.stopPropagation()}
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(15, 15, 15, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            color: 'white',
            minWidth: 200,
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
            '& .MuiMenuItem-root': {
              padding: '12px 20px',
              borderRadius: '12px',
              margin: '4px 8px',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                transform: 'translateX(4px)',
              },
              '&:first-of-type': {
                marginTop: '8px',
              },
              '&:last-of-type': {
                marginBottom: '8px',
              },
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {options.map((option, index) => (
          <MenuItem
            key={index}
            onClick={handleMenuItemClick(option.onClick)}
            disabled={option.disabled}
          >
            <ListItemIcon sx={{ 
              color: 'white', 
              minWidth: 40,
              '& .MuiSvgIcon-root': {
                fontSize: '20px',
              },
            }}>
              {option.icon}
            </ListItemIcon>
            <ListItemText 
              primary={option.label}
              sx={{
                '& .MuiTypography-root': {
                  fontSize: '14px',
                  fontWeight: 500,
                },
              }}
            />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default ThreeDotMenu;
export { StarIcon, InfoIcon, PlaylistPlayIcon, BookmarkIcon, DeleteIcon };