import ForumOutlined from '@mui/icons-material/ForumOutlined';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { t } from '../../services/i18n';
import { ChatListPane } from './ChatListPane';
import { ChatThreadPane } from './ChatThreadPane';
import './ChatPages.css';

// Muss zum CSS-Breakpoint der Listen-Spalte passen (min-width: 900px).
const SPLIT_QUERY = '(min-width: 900px)';

function useSplitView(): boolean {
  const [split, setSplit] = useState(() => window.matchMedia(SPLIT_QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia(SPLIT_QUERY);
    const onChange = () => setSplit(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return split;
}

/**
 * Instagram-artiger Aufbau: Desktop zeigt Liste und Unterhaltung nebeneinander
 * in voller Breite, Mobile je Route eine Spalte.
 */
export const ChatShell = ({ activeFriendId }: { activeFriendId?: string }) => {
  const navigate = useNavigate();
  const { user } = useAuth() || {};
  const { currentTheme } = useTheme();
  const isMobile = !useSplitView();

  if (!user?.uid) return null;
  const myUid = user.uid;

  const showList = !isMobile || !activeFriendId;
  const showThread = !!activeFriendId;

  return (
    <div className="ch-shell" style={{ background: currentTheme.background.default }}>
      {showList && (
        <ChatListPane
          myUid={myUid}
          activeFriendId={activeFriendId}
          // Chat-zu-Chat-Wechsel ersetzen den History-Eintrag, sonst müllt der
          // Verlauf zu und der Zurück-Pfeil hangelt sich durch alle alten Chats.
          onOpen={(friendUid) => navigate(`/chat/${friendUid}`, { replace: !!activeFriendId })}
        />
      )}
      {showThread ? (
        <ChatThreadPane key={activeFriendId} friendId={activeFriendId} showBack={isMobile} />
      ) : (
        !isMobile && (
          <div className="ch-pane-thread" style={{ background: currentTheme.background.default }}>
            <div className="ch-thread-bg" aria-hidden />
            <div className="ch-placeholder" style={{ color: currentTheme.text.muted }}>
              <div className="ch-placeholder-icon">
                <ForumOutlined style={{ fontSize: 40, color: currentTheme.primary }} />
              </div>
              <h2 style={{ color: currentTheme.text.primary }}>{t('Deine Nachrichten')}</h2>
              <p>{t('Wähle links einen Chat oder starte eine neue Unterhaltung.')}</p>
            </div>
          </div>
        )
      )}
    </div>
  );
};
