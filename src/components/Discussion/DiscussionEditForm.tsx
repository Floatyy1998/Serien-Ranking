import { Warning } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';

interface DiscussionEditFormProps {
  editTitle: string;
  setEditTitle: (v: string) => void;
  editContent: string;
  setEditContent: (v: string) => void;
  editIsSpoiler: boolean;
  setEditIsSpoiler: (v: boolean) => void;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
}

export const DiscussionEditForm: React.FC<DiscussionEditFormProps> = ({
  editTitle,
  setEditTitle,
  editContent,
  setEditContent,
  editIsSpoiler,
  setEditIsSpoiler,
  saving,
  onSave,
  onCancel,
}) => {
  const { currentTheme } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      style={{
        marginBottom: '16px',
        padding: '16px',
        background: currentTheme.background.surface,
        borderRadius: '12px',
        border: `2px solid ${currentTheme.primary}40`,
      }}
    >
      <input
        type="text"
        value={editTitle}
        onChange={(e) => setEditTitle(e.target.value)}
        placeholder="Titel"
        style={{
          width: '100%',
          padding: '12px',
          marginBottom: '10px',
          borderRadius: '8px',
          border: `1px solid ${currentTheme.border.default}`,
          background: currentTheme.background.card,
          color: currentTheme.text.primary,
          fontSize: '15px',
          fontWeight: 600,
          boxSizing: 'border-box',
        }}
      />
      <textarea
        value={editContent}
        onChange={(e) => setEditContent(e.target.value)}
        placeholder="Inhalt"
        rows={4}
        style={{
          width: '100%',
          padding: '12px',
          marginBottom: '10px',
          borderRadius: '8px',
          border: `1px solid ${currentTheme.border.default}`,
          background: currentTheme.background.card,
          color: currentTheme.text.primary,
          fontSize: '15px',
          resize: 'vertical',
          fontFamily: 'inherit',
          boxSizing: 'border-box',
        }}
      />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            padding: '8px 12px',
            borderRadius: '8px',
            border: `1px solid ${editIsSpoiler ? currentTheme.status.warning + '60' : currentTheme.border.default}`,
            background: editIsSpoiler ? `${currentTheme.status.warning}15` : 'transparent',
            color: editIsSpoiler ? currentTheme.status.warning : currentTheme.text.secondary,
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          <input
            type="checkbox"
            checked={editIsSpoiler}
            onChange={(e) => setEditIsSpoiler(e.target.checked)}
            style={{ display: 'none' }}
          />
          <Warning style={{ fontSize: '18px' }} />
          Spoiler
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: `1px solid ${currentTheme.border.default}`,
              background: 'transparent',
              color: currentTheme.text.secondary,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            Abbrechen
          </button>
          <button
            onClick={onSave}
            disabled={!editTitle.trim() || saving}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              background: editTitle.trim() ? currentTheme.primary : currentTheme.background.surface,
              color: editTitle.trim() ? currentTheme.text.primary : currentTheme.text.muted,
              cursor: editTitle.trim() ? 'pointer' : 'default',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            {saving ? 'Speichern...' : 'Speichern'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
