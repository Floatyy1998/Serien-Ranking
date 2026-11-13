import {
  Check,
  IosShare,
  LinkRounded,
  SendRounded,
  VisibilityOffOutlined,
} from '@mui/icons-material';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomSheet, SearchInput } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useOptimizedFriends } from '../../contexts/OptimizedFriendsContext';
import { useTheme } from '../../contexts/ThemeContext';
import { showToast } from '../../lib/interaction/toast';
import {
  otherUidFromPairId,
  sendMessage,
  subscribeChatIndex,
  type SharedEpisode,
} from '../../services/chat/chatService';
import { t } from '../../services/i18n';
import { canSystemShare, shareLink } from '../../services/share/shareLink';
import { copyTextToClipboard } from '../../utils/clipboard';
import type { Friend } from '../../types/Friend';
import { ChatAvatar } from '../Chats/ChatAvatar';
import './ShareEpisodeSheet.css';

const SEARCH_FROM = 7;

const nameOf = (f: Friend) => f.displayName || f.username || f.email;

/** Folge an Freunde schicken — landet als Karte im Chat, optional mit (Spoiler-)Kommentar. */
export const ShareEpisodeSheet = ({
  episode,
  isOpen,
  onClose,
}: {
  episode: SharedEpisode;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const { friends } = useOptimizedFriends();
  const navigate = useNavigate();
  const [recent, setRecent] = useState<Map<string, number>>(new Map());
  const [query, setQuery] = useState('');
  const [note, setNote] = useState('');
  const [spoiler, setSpoiler] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [linkCopied, setLinkCopied] = useState(false);
  const [systemShare] = useState(canSystemShare);
  const myUid = user?.uid;
  const shareUrl = `https://tv-rank.de/episode/${episode.seriesId}/s/${episode.season}/e/${episode.episode}`;
  const shareTitle = `${episode.seriesTitle} · S${episode.season} E${episode.episode}`;

  const confirmCopied = () => {
    setLinkCopied(true);
    window.setTimeout(() => setLinkCopied(false), 2000);
  };

  const copyLink = async () => {
    if (await copyTextToClipboard(shareUrl)) confirmCopied();
    else showToast(t('Teilen hat nicht geklappt'), 2000, 'error');
  };

  const shareExternally = async () => {
    const result = await shareLink({
      url: shareUrl,
      title: shareTitle,
      text: t('Schau dir {title} auf TV-RANK an', { title: shareTitle }),
    });
    if (result === 'shared') onClose();
    else if (result === 'copied') confirmCopied();
    else if (result === 'failed') showToast(t('Teilen hat nicht geklappt'), 2000, 'error');
  };

  useEffect(() => {
    if (!isOpen || !myUid) return;
    return subscribeChatIndex(myUid, (entries) => {
      const map = new Map<string, number>();
      for (const entry of entries) {
        const other = otherUidFromPairId(entry.pairId, myUid);
        if (other) map.set(other, entry.lastMessageAt);
      }
      setRecent(map);
    });
  }, [isOpen, myUid]);

  useEffect(() => {
    if (isOpen) return;
    setQuery('');
    setNote('');
    setSpoiler(false);
    setSent(new Set());
  }, [isOpen]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return friends
      .filter((f) => !q || nameOf(f).toLowerCase().includes(q))
      .sort(
        (a, b) =>
          (recent.get(b.uid) ?? 0) - (recent.get(a.uid) ?? 0) || nameOf(a).localeCompare(nameOf(b))
      );
  }, [friends, query, recent]);

  const send = async (friend: Friend) => {
    if (!myUid || sending) return;
    setSending(friend.uid);
    try {
      await sendMessage(
        myUid,
        friend.uid,
        { kind: 'episode', episode, text: note, spoiler },
        user?.displayName || t('Ich')
      );
      setSent((prev) => new Set(prev).add(friend.uid));
    } catch (error) {
      console.warn('[shareEpisode] Senden fehlgeschlagen', error);
      showToast(t('Senden fehlgeschlagen'), 2200, 'error');
    } finally {
      setSending(null);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} maxWidth="560px" ariaLabel={t('Folge teilen')}>
      <div className="se-sheet">
        <div className="se-head">
          <div className="se-title" style={{ color: currentTheme.text.primary }}>
            {t('Folge teilen')}
          </div>
          <div className="se-sub" style={{ color: currentTheme.text.muted }}>
            {episode.seriesTitle} ·{' '}
            {t('Staffel {s} · Folge {e}', { s: episode.season, e: episode.episode })}
          </div>
        </div>

        <div className="se-links">
          <button
            type="button"
            className={`se-link${linkCopied ? ' se-link--done' : ''}`}
            onClick={() => void copyLink()}
          >
            {linkCopied ? (
              <Check style={{ fontSize: 18 }} />
            ) : (
              <LinkRounded style={{ fontSize: 18 }} />
            )}
            {linkCopied ? t('Link kopiert!') : t('Link kopieren')}
          </button>
          {systemShare && (
            <button type="button" className="se-link" onClick={() => void shareExternally()}>
              <IosShare style={{ fontSize: 18 }} />
              {t('Extern teilen')}
            </button>
          )}
        </div>

        <div className="se-label" style={{ color: currentTheme.text.muted }}>
          {t('An Freunde schicken')}
        </div>

        <div className="se-note" style={friends.length === 0 ? { display: 'none' } : undefined}>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            rows={2}
            placeholder={t('Was willst du dazu sagen? (optional)')}
            style={{ color: currentTheme.text.primary, borderColor: `${currentTheme.primary}40` }}
          />
          <button
            type="button"
            className={`se-spoiler${spoiler ? ' se-spoiler--on' : ''}`}
            aria-pressed={spoiler}
            onClick={() => setSpoiler((v) => !v)}
            disabled={!note.trim()}
            style={{
              color: spoiler ? currentTheme.status.warning : currentTheme.text.muted,
              borderColor: spoiler ? `${currentTheme.status.warning}80` : 'rgba(255,255,255,0.12)',
            }}
          >
            <VisibilityOffOutlined style={{ fontSize: 16 }} />
            {t('Spoiler')}
          </button>
        </div>

        {friends.length >= SEARCH_FROM && (
          <SearchInput value={query} onChange={setQuery} placeholder={t('Freund suchen...')} />
        )}

        <div className="se-list">
          {friends.length === 0 && (
            <div className="se-empty" style={{ color: currentTheme.text.muted }}>
              {t('Füge Freunde hinzu, um Folgen zu teilen.')}
            </div>
          )}
          {list.map((friend) => {
            const done = sent.has(friend.uid);
            return (
              <div key={friend.uid} className="se-row">
                <ChatAvatar name={nameOf(friend)} photoURL={friend.photoURL} small />
                <span className="se-name" style={{ color: currentTheme.text.secondary }}>
                  {nameOf(friend)}
                </span>
                {done ? (
                  <button
                    type="button"
                    className="se-send se-send--done"
                    onClick={() => navigate(`/chat/${friend.uid}`)}
                    style={{ color: currentTheme.status.success }}
                  >
                    <Check style={{ fontSize: 17 }} />
                    {t('Chat öffnen')}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="se-send"
                    disabled={!!sending}
                    onClick={() => void send(friend)}
                    style={{
                      background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
                      opacity: sending && sending !== friend.uid ? 0.5 : 1,
                    }}
                  >
                    <SendRounded style={{ fontSize: 16 }} />
                    {sending === friend.uid ? t('Sendet…') : t('Senden')}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </BottomSheet>
  );
};
