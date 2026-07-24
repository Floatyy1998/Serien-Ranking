import { useParams } from 'react-router-dom';
import { ChatShell } from './ChatShell';

export const ChatThreadPage = () => {
  const { friendId } = useParams<{ friendId: string }>();
  return <ChatShell activeFriendId={friendId} />;
};
