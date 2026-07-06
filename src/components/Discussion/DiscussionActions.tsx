import { Delete, Edit, Flag } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { useTheme } from '../../contexts/ThemeContext';

interface DiscussionActionsProps {
  isOwner: boolean;
  isSpoiler: boolean;
  currentUserId?: string;
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (v: boolean) => void;
  showSpoilerConfirm: boolean;
  setShowSpoilerConfirm: (v: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
  onFlagAsSpoiler: () => void;
}

export const DiscussionActions: React.FC<DiscussionActionsProps> = ({
  isOwner,
  isSpoiler,
  currentUserId,
  showDeleteConfirm,
  setShowDeleteConfirm,
  showSpoilerConfirm,
  setShowSpoilerConfirm,
  onEdit,
  onDelete,
  onFlagAsSpoiler,
}) => {
  const { currentTheme } = useTheme();

  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
      {/* Spoiler Flag Button */}
      {!isOwner && !isSpoiler && currentUserId && !showSpoilerConfirm && (
        <Tooltip title="Als Spoiler melden" arrow>
          <button
            onClick={() => setShowSpoilerConfirm(true)}
            style={{
              background: `${currentTheme.status.warning}15`,
              border: 'none',
              padding: '6px',
              borderRadius: '8px',
              cursor: 'pointer',
              color: currentTheme.status.warning,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Flag style={{ fontSize: '18px' }} />
          </button>
        </Tooltip>
      )}

      {/* Spoiler Confirm - inline */}
      {showSpoilerConfirm && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '13px', color: currentTheme.status.warning, fontWeight: 500 }}>
            Spoiler?
          </span>
          <button
            onClick={onFlagAsSpoiler}
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              border: 'none',
              background: currentTheme.status.warning,
              color: currentTheme.text.primary,
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            Ja
          </button>
          <button
            onClick={() => setShowSpoilerConfirm(false)}
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              border: `1px solid ${currentTheme.border.default}`,
              background: 'transparent',
              color: currentTheme.text.secondary,
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Nein
          </button>
        </div>
      )}

      {/* Edit/Delete Buttons */}
      {isOwner && !showDeleteConfirm && !showSpoilerConfirm && (
        <>
          <Tooltip title="Bearbeiten" arrow>
            <button
              onClick={onEdit}
              style={{
                background: `${currentTheme.primary}15`,
                border: 'none',
                padding: '6px',
                borderRadius: '8px',
                cursor: 'pointer',
                color: currentTheme.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Edit style={{ fontSize: '18px' }} />
            </button>
          </Tooltip>
          <Tooltip title="Löschen" arrow>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                background: `${currentTheme.status.error}15`,
                border: 'none',
                padding: '6px',
                borderRadius: '8px',
                cursor: 'pointer',
                color: currentTheme.status.error,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Delete style={{ fontSize: '18px' }} />
            </button>
          </Tooltip>
        </>
      )}

      {/* Delete Confirm - inline */}
      {showDeleteConfirm && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '13px', color: currentTheme.status.error, fontWeight: 500 }}>
            Löschen?
          </span>
          <button
            onClick={onDelete}
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              border: 'none',
              background: currentTheme.status.error,
              color: currentTheme.text.primary,
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            Ja
          </button>
          <button
            onClick={() => setShowDeleteConfirm(false)}
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              border: `1px solid ${currentTheme.border.default}`,
              background: 'transparent',
              color: currentTheme.text.secondary,
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Nein
          </button>
        </div>
      )}
    </div>
  );
};
