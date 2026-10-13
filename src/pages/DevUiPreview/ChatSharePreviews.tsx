import { VisibilityOffOutlined } from '@mui/icons-material';
import { useMemo } from 'react';
import {
  OptimizedFriendsContext,
  useOptimizedFriends,
} from '../../contexts/OptimizedFriendsContext';
import { useTheme } from '../../contexts/ThemeContext';
import type { SharedEpisode } from '../../services/chat/chatService';
import { t } from '../../services/i18n';
import type { Friend } from '../../types/Friend';
import '../Chats/ChatPages.css';
import { EpisodeShareCard } from '../Chats/EpisodeShareCard';
import { ShareEpisodeSheet } from '../EpisodeDiscussion/ShareEpisodeSheet';

const EPISODE: SharedEpisode = {
  seriesId: 209867,
  season: 1,
  episode: 5,
  seriesTitle: 'Frieren – Nach dem Ende der Reise',
  episodeTitle: 'Phantome der Toten',
  poster: '/dqZENchTd7lp5zht7BdlqM7RBhD.jpg',
};

const FRIENDS: Friend[] = ['Florian', 'BeLLe', 'catcatcat', 'Jonas', 'Mira'].map((name, i) => ({
  uid: `f${i}`,
  email: `${name.toLowerCase()}@example.com`,
  username: name,
  displayName: name,
  friendsSince: 0,
}));

export const EpisodeSharePreview = () => {
  const { currentTheme } = useTheme();
  const base = useOptimizedFriends();
  const friendsCtx = useMemo(() => ({ ...base, friends: FRIENDS, loading: false }), [base]);

  return (
    <OptimizedFriendsContext.Provider value={friendsCtx}>
      <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="ch-bubble-wrap ch-bubble-wrap--own">
          <div
            className="ch-bubble ch-bubble--own"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
            }}
          >
            <EpisodeShareCard episode={EPISODE} own />
            <div className="ch-episode-note">Die Szene am Ende, boah!</div>
          </div>
        </div>
        <div className="ch-bubble-wrap">
          <div className="ch-bubble ch-bubble--other" style={{ color: currentTheme.text.primary }}>
            <EpisodeShareCard episode={EPISODE} own={false} />
            <button className="ch-spoiler-cover ch-episode-note">
              <VisibilityOffOutlined style={{ fontSize: 16 }} />
              {t('Spoiler — tippen zum Lesen')}
            </button>
          </div>
        </div>
      </div>
      <ShareEpisodeSheet
        episode={EPISODE}
        isOpen={new URLSearchParams(window.location.search).get('sheet') !== '0'}
        onClose={() => {}}
      />
    </OptimizedFriendsContext.Provider>
  );
};
