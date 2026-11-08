import Check from '@mui/icons-material/Check';
import IosShare from '@mui/icons-material/IosShare';
import LinkRounded from '@mui/icons-material/LinkRounded';
import { useState } from 'react';
import { useDeviceType } from '../../hooks/platform/useDeviceType';
import { useTheme } from '../../contexts/ThemeContext';
import type { RecommendationMediaType } from '../../types/Recommendation';
import { canSystemShare, shareLink } from '../../services/share/shareLink';
import { copyTextToClipboard } from '../../utils/clipboard';
import { getImageUrl, readableImageUrl } from '../../utils/imageUrl';
import { BottomSheet } from '../ui';
import { FriendPicker } from './FriendPicker';
import { RecommendMessageInput } from './RecommendMessageInput';
import { RecommendSheetHero } from './RecommendSheetHero';
import { SendRecommendationBar } from './SendRecommendationBar';
import { t } from '../../services/i18n';
import { useRecommendSheet } from './useRecommendSheet';

interface RecommendSheetProps {
  isOpen: boolean;
  onClose: () => void;
  media: {
    id: number;
    type: RecommendationMediaType;
    title: string;
    posterPath?: string;
    backdropPath?: string;
  };
}

/** Bottom-Sheet zum Empfehlen einer Serie / eines Films an Freunde. */
export const RecommendSheet: React.FC<RecommendSheetProps> = ({ isOpen, onClose, media }) => {
  const { isMobile } = useDeviceType();
  const { currentTheme } = useTheme();
  const [linkCopied, setLinkCopied] = useState(false);
  const [systemShare] = useState(canSystemShare);
  const {
    selected,
    message,
    setMessage,
    sending,
    friendsWithMedia,
    checkingLibrary,
    sortedFriends,
    availableCount,
    hasFriends,
    toggleFriend,
    handleClose,
    handleSend,
  } = useRecommendSheet({ isOpen, onClose, media });

  // Sizing tokens per breakpoint
  const sectionPadding = isMobile ? '0 20px' : '0 32px';

  // Externes Teilen (System-Share-Sheet). Geteilt wird der tv-rank.de-Link —
  // Universal/App Links öffnen auf Mobilgeräten direkt die App-Detailseite.
  const shareUrl = `https://tv-rank.de/${media.type === 'movie' ? 'movie' : 'series'}/${media.id}`;

  const handleExternalShare = async () => {
    const url = shareUrl;
    const text = t('Schau dir "{title}" auf TV-RANK an', { title: media.title });

    // Wo das Share-Sheet Dateien kann (Web Share Level 2): Poster als Bild
    // anhängen — Messenger verschicken es dann als Foto mit Text+Link als
    // Bildunterschrift. Best-effort; ohne Bild geht es unten normal weiter.
    if (
      media.posterPath &&
      typeof navigator !== 'undefined' &&
      typeof navigator.canShare === 'function'
    ) {
      try {
        const posterUrl = getImageUrl(media.posterPath, 'w500', '');
        const res = posterUrl ? await fetch(readableImageUrl(posterUrl)) : null;
        if (res?.ok) {
          const blob = await res.blob();
          const file = new File([blob], 'poster.jpg', { type: blob.type || 'image/jpeg' });
          if (navigator.canShare({ files: [file] })) {
            // Link zusätzlich in den Text — einige Ziele ignorieren das
            // url-Feld, sobald Dateien dabei sind.
            await navigator.share({ files: [file], title: media.title, text: `${text}\n${url}` });
            handleClose();
            return;
          }
        }
      } catch (err) {
        if ((err as DOMException)?.name === 'AbortError') return; // User hat abgebrochen
        // Poster-Fetch/Share fehlgeschlagen → ohne Bild weiter
      }
    }

    const result = await shareLink({ url, title: media.title, text });
    if (result === 'shared') {
      handleClose();
    } else if (result === 'copied') {
      confirmCopied();
    }
  };

  const confirmCopied = () => {
    setLinkCopied(true);
    window.setTimeout(() => setLinkCopied(false), 2000);
  };

  // Das Windows-Teilen-Fenster bietet (zumal mit Poster-Datei) kein Link-Kopieren an.
  const handleCopyLink = async () => {
    if (await copyTextToClipboard(shareUrl)) confirmCopied();
  };

  const shareButtonStyle = (highlight: boolean): React.CSSProperties => ({
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '11px 16px',
    borderRadius: 12,
    border: highlight
      ? `1px solid ${currentTheme.status.success}55`
      : '1px solid var(--glass-border-subtle)',
    background: highlight ? `${currentTheme.status.success}14` : 'rgba(255,255,255,0.05)',
    color: highlight ? currentTheme.status.success : currentTheme.text.secondary,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s, border-color 0.2s, color 0.2s',
  });

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      maxHeight="78vh"
      maxWidth={isMobile ? '640px' : 'min(1180px, 94vw)'}
      ariaLabel={t('Empfehlung senden')}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          height: '100%',
          minHeight: 0,
        }}
      >
        {/* Scrollable area (Hero + Picker + Message) */}
        <div
          style={{
            overflowY: 'auto',
            flex: 1,
            minHeight: 0,
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {/* Hero — Cinematic Card */}
          <RecommendSheetHero media={media} />

          {/* Extern teilen (WhatsApp, Signal, … via System-Share) */}
          <div style={{ padding: sectionPadding, marginBottom: 16, display: 'flex', gap: 10 }}>
            <button type="button" onClick={handleCopyLink} style={shareButtonStyle(linkCopied)}>
              {linkCopied ? (
                <Check style={{ fontSize: 18 }} />
              ) : (
                <LinkRounded style={{ fontSize: 18 }} />
              )}
              {linkCopied ? t('Link kopiert!') : t('Link kopieren')}
            </button>
            {systemShare && (
              <button type="button" onClick={handleExternalShare} style={shareButtonStyle(false)}>
                <IosShare style={{ fontSize: 18 }} />
                {t('Extern teilen')}
              </button>
            )}
          </div>

          {/* Friend Picker */}
          <div style={{ padding: sectionPadding }}>
            <FriendPicker
              sortedFriends={sortedFriends}
              selected={selected}
              friendsWithMedia={friendsWithMedia}
              checkingLibrary={checkingLibrary}
              availableCount={availableCount}
              mediaType={media.type}
              onToggleFriend={toggleFriend}
            />

            {/* Message */}
            {hasFriends && <RecommendMessageInput message={message} onMessageChange={setMessage} />}
          </div>
        </div>
        {/* end scrollable area */}

        {/* Send Button (sticky bottom) */}
        {hasFriends && (
          <SendRecommendationBar
            selectedCount={selected.size}
            sending={sending}
            onSend={handleSend}
          />
        )}
      </div>
    </BottomSheet>
  );
};
