import { Close as CloseIcon } from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Typography,
} from '@mui/material';
import { useState } from 'react';

interface RewatchDialogProps {
  open: boolean;
  onClose: () => void;
  onRewatch: () => void;
  onUnwatch: () => void;
  itemType: 'episode' | 'season';
  itemName: string;
  currentWatchCount: number;
}

const RewatchDialog = ({
  open,
  onClose,
  onRewatch,
  onUnwatch,
  itemType,
  itemName,
  currentWatchCount,
}: RewatchDialogProps) => {
  const [loading, setLoading] = useState(false);

  const handleRewatch = async () => {
    setLoading(true);
    try {
      await onRewatch();
    } catch (error) {
    } finally {
      setLoading(false);
      onClose();
    }
  };

  const handleUnwatch = async () => {
    setLoading(true);
    try {
      await onUnwatch();
    } catch (error) {
    } finally {
      setLoading(false);
      onClose();
    }
  };

  const itemLabel = itemType === 'episode' ? 'Episode' : 'Staffel';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='sm'
      fullWidth
      disableEscapeKeyDown={loading}
      slotProps={{
        paper: {
          sx: {
            minHeight: 'auto',
            maxHeight: '40vh',
            background:
              'linear-gradient(145deg, #1a1a1a 0%, #2d2d30 50%, #1a1a1a 100%)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            overflow: 'hidden',
            boxShadow:
              '0 16px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(255, 215, 0, 0.3), 0 0 60px rgba(255, 215, 0, 0.1)',
            color: 'white',
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          textAlign: 'center',
          position: 'relative',
          background:
            'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 100%)',
          backdropFilter: 'blur(15px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          color: '#ffffff',
          fontWeight: 600,
          fontSize: '1.25rem',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
          }}
        >
          <Typography
            component='div'
            variant='h4'
            sx={{ fontWeight: 'bold', color: '#ffd700' }}
          >
            {itemLabel} bereits gesehen
          </Typography>
        </Box>

        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'rgba(255,255,255,0.7)',
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            '&:hover': {
              background: 'rgba(255,255,255,0.1)',
              color: '#ffffff',
              transform: 'translateY(-50%) scale(1.05)',
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent
        sx={{
          p: 0,
          background:
            'linear-gradient(180deg, rgba(26,26,26,0.95) 0%, rgba(45,45,48,0.95) 50%, rgba(26,26,26,0.95) 100%)',
          backdropFilter: 'blur(10px)',
          color: '#ffffff',
        }}
      >
        <Box sx={{ p: 3 }}>
          <DialogContentText>
            Du hast "{itemName}" bereits {currentWatchCount}x gesehen.
            <br />
            <br />
            Möchtest du diese {itemLabel.toLowerCase()} erneut ansehen oder den
            Zähler reduzieren?
          </DialogContentText>
        </Box>
      </DialogContent>
      <DialogActions
        sx={{
          justifyContent: 'space-between',
          px: 3,
          pb: 2,
          background:
            'linear-gradient(135deg, rgba(26,26,26,0.95) 0%, rgba(45,45,48,0.95) 100%)',
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <Button
          onClick={handleUnwatch}
          color='error'
          variant='outlined'
          disabled={loading}
        >
          {currentWatchCount > 2
            ? `Reduzieren auf ${currentWatchCount - 1}x`
            : currentWatchCount === 2
            ? 'Reduzieren auf 1x'
            : 'Als ungesehen markieren'}
        </Button>
        <Button
          onClick={handleRewatch}
          color='primary'
          variant='contained'
          disabled={loading}
          autoFocus
        >
          Erneut ansehen ({currentWatchCount + 1}x)
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RewatchDialog;
