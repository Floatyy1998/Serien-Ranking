import React from 'react';
import { DialogTitle, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { colors } from '../../theme/colors';

interface DialogHeaderProps {
  title: string;
  onClose: () => void;
  showCloseButton?: boolean;
}

export const DialogHeader: React.FC<DialogHeaderProps> = ({
  title,
  onClose,
  showCloseButton = true,
}) => {
  return (
    <DialogTitle>
      {title}
      {showCloseButton && (
        <IconButton
          className="closeButton"
          onClick={onClose}
          style={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: colors.status.error,
          }}
        >
          <CloseIcon />
        </IconButton>
      )}
    </DialogTitle>
  );
};