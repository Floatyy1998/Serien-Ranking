import { Translate } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import type { CommentTranslationState } from '../../hooks/useCommentTranslation';
import { t } from '../../services/i18n';

/** Kleiner Text-Button unter Kommentaren: Übersetzen / Original anzeigen. */
export const TranslateButton: React.FC<{ translation: CommentTranslationState }> = ({
  translation,
}) => {
  const { currentTheme } = useTheme();
  const { offerTranslation, showTranslation, translating, failed, toggleTranslation } = translation;

  if (!offerTranslation) return null;

  return (
    <button
      onClick={toggleTranslation}
      disabled={translating}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        background: 'transparent',
        border: 'none',
        padding: '4px 0',
        marginTop: '6px',
        cursor: translating ? 'default' : 'pointer',
        color: failed ? currentTheme.status.error : currentTheme.text.muted,
        fontSize: '12px',
        fontWeight: 600,
      }}
    >
      <Translate style={{ fontSize: '14px' }} />
      {translating
        ? t('Übersetze…')
        : failed
          ? t('Übersetzung fehlgeschlagen – erneut versuchen')
          : showTranslation
            ? t('Original anzeigen')
            : t('Übersetzen')}
    </button>
  );
};
