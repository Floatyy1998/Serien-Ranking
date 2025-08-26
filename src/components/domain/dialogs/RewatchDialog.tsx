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
import { colors } from '../../../theme';

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
            background: colors.background.gradient.dark,
            borderRadius: '20px',
            border: `1px solid ${colors.border.subtle}`,
            overflow: 'hidden',
            boxShadow: colors.shadow.dialog,
            color: colors.text.secondary,
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          textAlign: 'center',
          position: 'relative',
          background: colors.overlay.dark,
          backdropFilter: 'blur(15px)',
          borderBottom: `1px solid ${colors.border.lighter}`,
          color: colors.text.secondary,
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
            sx={{ fontWeight: 'bold', color: colors.primary }}
          >
            {itemLabel} bearbeiten
          </Typography>
        </Box>

        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            color: colors.text.muted,
            background: colors.overlay.medium,
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            '&:hover': {
              background: colors.overlay.white,
              color: colors.text.secondary,
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
          background: colors.background.gradient.dark,
          backdropFilter: 'blur(10px)',
          color: colors.text.secondary,
        }}
      >
        <Box sx={{ p: 3 }}>
          <DialogContentText>
            "{itemName}" wurde {currentWatchCount}x gesehen.
            <br />
            <br />
            Was möchtest du tun?
          </DialogContentText>
        </Box>
      </DialogContent>
      <DialogActions
        sx={{
          justifyContent: 'space-between',
          px: 3,
          pb: 2,
          background: colors.background.gradient.light,
          borderTop: `1px solid ${colors.border.lighter}`,
        }}
      >
        <Button
          onClick={handleUnwatch}
          color='error'
          variant='outlined'
          disabled={loading}
        >
          {currentWatchCount > 2
            ? `Auf ${currentWatchCount - 1}x reduzieren`
            : currentWatchCount === 2
            ? 'Auf 1x reduzieren'
            : 'Als nicht gesehen markieren'}
        </Button>
        <Button
          onClick={handleRewatch}
          variant='contained'
          disabled={loading}
          autoFocus
          sx={{
            background: colors.primary,
            '&:hover': {
              background: colors.text.accent,
            },
          }}
        >
          Nochmal gesehen ({currentWatchCount + 1}x)
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RewatchDialog;
