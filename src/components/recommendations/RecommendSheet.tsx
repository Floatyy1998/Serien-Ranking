import Check from '@mui/icons-material/Check';
import IosShare from '@mui/icons-material/IosShare';
import { useState } from 'react';
import { useDeviceType } from '../../hooks/useDeviceType';
import { useTheme } from '../../contexts/ThemeContext';
import type { RecommendationMediaType } from '../../types/Recommendation';
import { shareLink } from '../../services/share/shareLink';
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
  const handleExternalShare = async () => {
    const result = await shareLink({
      url: `https://tv-rank.de/${media.type === 'movie' ? 'movie' : 'series'}/${media.id}`,
      title: media.title,
      text: t('Schau dir "{title}" auf TV-RANK an', { title: media.title }),
    });
    if (result === 'shared') {
      handleClose();
    } else if (result === 'copied') {
      // Desktop-Fallback: Link liegt in der Zwischenablage — kurz bestätigen.
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 2000);
    }
  };

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
          <div style={{ padding: sectionPadding, marginBottom: 16 }}>
            <button
              type="button"
              onClick={handleExternalShare}
              aria-label={t('Extern teilen')}
              style={{
                width: '100%',
                minHeight: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '11px 16px',
                borderRadius: 12,
                border: linkCopied
                  ? `1px solid ${currentTheme.status.success}55`
                  : '1px solid var(--glass-border-subtle)',
                background: linkCopied
                  ? `${currentTheme.status.success}14`
                  : 'rgba(255,255,255,0.05)',
                color: linkCopied ? currentTheme.status.success : currentTheme.text.secondary,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {linkCopied ? (
                <Check style={{ fontSize: 18 }} />
              ) : (
                <IosShare style={{ fontSize: 18 }} />
              )}
              {linkCopied ? t('Link kopiert!') : t('Extern teilen')}
            </button>
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
