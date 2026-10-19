import StarRounded from '@mui/icons-material/StarRounded';
import { BottomSheet } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import type { StarredMessage } from '../../services/chat/chatMessageActions';
import { t } from '../../services/i18n';
import { ReplySnippet } from './ChatReply';

export const ChatStarredSheet = ({
  isOpen,
  starred,
  myUid,
  partnerName,
  onClose,
  onJump,
}: {
  isOpen: boolean;
  starred: StarredMessage[];
  myUid: string;
  partnerName: string;
  onClose: () => void;
  onJump: (id: string) => void;
}) => {
  const { currentTheme } = useTheme();
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} ariaLabel={t('Markierte Nachrichten')}>
      <div className="ch-fw">
        <div className="ch-fw-head">
          <strong style={{ color: currentTheme.text.primary }}>{t('Markierte Nachrichten')}</strong>
        </div>
        {starred.length === 0 ? (
          <p className="ch-starred-empty" style={{ color: currentTheme.text.muted }}>
            {t(
              'Noch nichts markiert. Halte eine Nachricht gedrückt und wähle „Mit Stern markieren“.'
            )}
          </p>
        ) : (
          <div className="ch-fw-list">
            {starred.map((s) => (
              <button
                key={s.id}
                type="button"
                className="ch-starred-row"
                onClick={() => onJump(s.id)}
              >
                <StarRounded style={{ color: currentTheme.status.warning, fontSize: 18 }} />
                <span className="ch-starred-body">
                  <small style={{ color: currentTheme.text.muted }}>
                    {s.senderId === myUid ? t('Du') : partnerName} ·{' '}
                    {new Date(s.timestamp).toLocaleString('de-DE', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </small>
                  <span style={{ color: currentTheme.text.primary }}>
                    <ReplySnippet reply={s} />
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </BottomSheet>
  );
};
