import { useDeviceType } from '../../hooks/useDeviceType';
import type { RecommendationMediaType } from '../../types/Recommendation';
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
