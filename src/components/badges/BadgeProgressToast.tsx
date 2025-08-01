import { Alert, Snackbar } from '@mui/material';
import React, { useState } from 'react';

interface BadgeProgressToastProps {
  badgeId: string;
  progress: {
    current: number;
    total: number;
  };
  badgeName: string;
  emoji: string;
  open: boolean;
  onClose: () => void;
}

const BadgeProgressToast: React.FC<BadgeProgressToastProps> = ({
  progress,
  badgeName,
  emoji,
  open,
  onClose,
}) => {
  const progressPercentage = Math.round(
    (progress.current / progress.total) * 100
  );

  return (
    <Snackbar
      open={open}
      autoHideDuration={3000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      sx={{
        mb: 2,
        '& .MuiSnackbarContent-root': {
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
          border: '1px solid #00fed7',
          borderRadius: '8px',
          minWidth: '320px',
        },
      }}
    >
      <Alert
        onClose={onClose}
        severity='info'
        sx={{
          width: '100%',
          background: 'transparent',
          color: '#ffffff',
          fontSize: '14px',
          '& .MuiAlert-icon': {
            color: '#00fed7',
            fontSize: '20px',
          },
          '& .MuiAlert-message': {
            width: '100%',
          },
        }}
        icon={<span style={{ fontSize: '18px' }}>{emoji}</span>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ fontWeight: 'bold' }}>
            {badgeName} - {progressPercentage}%
          </div>
          <div
            style={{
              background: '#333',
              borderRadius: '4px',
              height: '6px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                background: 'linear-gradient(90deg, #00fed7, #00c4a7)',
                height: '100%',
                width: `${progressPercentage}%`,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <div style={{ fontSize: '12px', opacity: 0.8 }}>
            {progress.current} / {progress.total}
          </div>
        </div>
      </Alert>
    </Snackbar>
  );
};

// Hook für Badge-Progress-Management
export const useBadgeProgress = () => {
  const [progressToasts, setProgressToasts] = useState<{
    [badgeId: string]: {
      progress: { current: number; total: number };
      badgeName: string;
      emoji: string;
      visible: boolean;
    };
  }>({});

  const showProgress = (
    badgeId: string,
    progress: { current: number; total: number },
    badgeName: string,
    emoji: string = '🏆'
  ) => {
    setProgressToasts((prev) => ({
      ...prev,
      [badgeId]: {
        progress,
        badgeName,
        emoji,
        visible: true,
      },
    }));
  };

  const hideProgress = (badgeId: string) => {
    setProgressToasts((prev) => ({
      ...prev,
      [badgeId]: {
        ...prev[badgeId],
        visible: false,
      },
    }));
  };

  const ProgressToasts = () => (
    <>
      {Object.entries(progressToasts).map(([badgeId, data]) => (
        <BadgeProgressToast
          key={badgeId}
          badgeId={badgeId}
          progress={data.progress}
          badgeName={data.badgeName}
          emoji={data.emoji}
          open={data.visible}
          onClose={() => hideProgress(badgeId)}
        />
      ))}
    </>
  );

  return {
    showProgress,
    hideProgress,
    ProgressToasts,
  };
};

export default BadgeProgressToast;
