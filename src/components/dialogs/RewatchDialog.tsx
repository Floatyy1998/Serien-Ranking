import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
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
    } finally {
      setLoading(false);
      onClose();
    }
  };

  const handleUnwatch = async () => {
    setLoading(true);
    try {
      await onUnwatch();
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
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={loading}
    >
      <DialogTitle>
        {itemLabel} bereits gesehen
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          Du hast "{itemName}" bereits {currentWatchCount}x gesehen.
          <br />
          <br />
          Möchtest du diese {itemLabel.toLowerCase()} erneut ansehen oder den Zähler reduzieren?
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
        <Button
          onClick={handleUnwatch}
          color="error"
          variant="outlined"
          disabled={loading}
        >
          {currentWatchCount > 2 
            ? `Reduzieren auf ${currentWatchCount - 1}x` 
            : currentWatchCount === 2 
              ? "Reduzieren auf 1x" 
              : "Als ungesehen markieren"
          }
        </Button>
        <Button
          onClick={handleRewatch}
          color="primary"
          variant="contained"
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