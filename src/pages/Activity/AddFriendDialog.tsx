import { CheckCircle, Close, Person, PersonAdd, Star } from '@mui/icons-material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useAuth } from '../../App';
import { useOptimizedFriends } from '../../contexts/OptimizedFriendsProvider';
import { useTheme } from '../../contexts/ThemeContext';
import { IconButton, EmptyState, SearchInput, BottomSheet, GradientText, LoadingSpinner } from '../../components/ui';

interface UserSearchResult {
  uid: string;
  username: string;
  displayName: string;
  photoURL?: string;
  isAlreadyFriend: boolean;
  hasPendingRequest: boolean;
  bio?: string;
  seriesCount?: number;
  moviesCount?: number;
}

interface AddFriendDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddFriendDialog: React.FC<AddFriendDialogProps> = ({ isOpen, onClose }) => {
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const { friends, sentRequests, sendFriendRequest } = useOptimizedFriends();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [recentlyAdded, setRecentlyAdded] = useState<string[]>([]);

  // Live search with debounce
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const searchTimer = setTimeout(async () => {
      setSearching(true);
      try {
        const usersRef = firebase.database().ref('users');
        const snapshot = await usersRef.once('value');
        const users = snapshot.val();

        if (users) {
          // Process users in parallel with Promise.all for better performance
          const userPromises = Object.entries(users).map(async ([uid, userData]: [string, any]) => {
            // Skip current user
            if (uid === user?.uid) return null;

            const username = userData.username?.toLowerCase() || '';
            const displayName = userData.displayName?.toLowerCase() || '';
            const query = searchQuery.toLowerCase();

            // Search in username and display name
            if (username.includes(query) || displayName.includes(query)) {
              // Fetch series and movies counts from separate Firebase nodes
              let seriesCount = 0;
              let moviesCount = 0;

              try {
                const [seriesSnapshot, moviesSnapshot] = await Promise.all([
                  firebase.database().ref(`${uid}/serien`).once('value'),
                  firebase.database().ref(`${uid}/filme`).once('value')
                ]);

                const seriesData = seriesSnapshot.val();
                const moviesData = moviesSnapshot.val();

                seriesCount = seriesData ? Object.keys(seriesData).length : 0;
                moviesCount = moviesData ? Object.keys(moviesData).length : 0;
              } catch (error) {
                // If we can't fetch counts, continue with 0
              }

              return {
                uid,
                username: userData.username || 'Unknown',
                displayName: userData.displayName || userData.username || 'Unknown',
                photoURL: userData.photoURL,
                bio: userData.bio,
                seriesCount,
                moviesCount,
                isAlreadyFriend: friends.some(f => f.uid === uid),
                hasPendingRequest: sentRequests.some(r => r.toUserId === uid) || recentlyAdded.includes(uid),
              };
            }
            return null;
          });

          const processedResults = await Promise.all(userPromises);
          const validResults = processedResults.filter(result => result !== null) as UserSearchResult[];

          // Sort results - friends last, exact matches first
          validResults.sort((a, b) => {
            if (a.isAlreadyFriend !== b.isAlreadyFriend) {
              return a.isAlreadyFriend ? 1 : -1;
            }

            const searchLower = searchQuery.toLowerCase();
            const aExact = a.username.toLowerCase() === searchLower || a.displayName.toLowerCase() === searchLower;
            const bExact = b.username.toLowerCase() === searchLower || b.displayName.toLowerCase() === searchLower;

            if (aExact !== bExact) {
              return aExact ? -1 : 1;
            }

            return a.username.localeCompare(b.username);
          });

          setSearchResults(validResults.slice(0, 10)); // Limit to 10 results
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setSearching(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(searchTimer);
  }, [searchQuery, user, friends, sentRequests, recentlyAdded]);

  const handleSendRequest = async (targetUser: UserSearchResult) => {
    if (!targetUser || targetUser.isAlreadyFriend || targetUser.hasPendingRequest) return;

    setSendingRequest(true);
    try {
      const success = await sendFriendRequest(targetUser.username);
      if (success) {
        setRecentlyAdded([...recentlyAdded, targetUser.uid]);
        setRequestSuccess(true);

        // Reset after animation
        setTimeout(() => {
          setRequestSuccess(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to send request:', error);
    } finally {
      setSendingRequest(false);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    setRequestSuccess(false);
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} ariaLabel="Freund hinzufügen">
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px 20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${currentTheme.primary}33 0%, ${currentTheme.primary}66 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PersonAdd style={{ fontSize: '24px', color: currentTheme.primary }} />
          </div>
          <div>
            <GradientText as="h2" style={{
                fontSize: '24px',
                fontWeight: 700,
                margin: 0,
              }}>
              Neue Freunde
            </GradientText>
            <p
              style={{
                color: currentTheme.text.secondary,
                fontSize: '14px',
                margin: '2px 0 0 0',
              }}
            >
              Finde andere Serien-Fans
            </p>
          </div>
        </div>

        <IconButton icon={<Close style={{ fontSize: '20px' }} />} onClick={handleClose} size={36} variant="surface" tooltip="Schließen" />
      </div>

      {/* Search Input */}
      <div style={{ padding: '0 20px 20px' }}>
        <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Suche nach Benutzername..." autoFocus />
      </div>

      {/* Content Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 20px 20px',
          minHeight: '200px',
        }}
      >
        {/* Loading State */}
        {searching && (
          <LoadingSpinner text="Suche läuft..." />
        )}

        {/* No Query State */}
        {!searchQuery && !searching && (
          <EmptyState
            icon={<Star style={{ fontSize: '48px' }} />}
            title="Bereit für neue Freundschaften?"
            description="Gib einen Benutzernamen ein, um zu starten"
          />
        )}

        {/* No Results State */}
        {searchQuery && !searching && searchResults.length === 0 && (
          <EmptyState
            icon={<Person style={{ fontSize: '48px' }} />}
            title="Keine Ergebnisse"
            description="Versuche einen anderen Benutzernamen"
            iconColor={currentTheme.text.secondary}
          />
        )}

        {/* Search Results */}
        {searchResults.length > 0 && !searching && (
          <div>
            <h2
              aria-live="polite"
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: currentTheme.text.secondary,
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              {searchResults.length} {searchResults.length === 1 ? 'Person' : 'Personen'} gefunden
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {searchResults.map((result) => (
                <motion.button
                  key={result.uid}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSendRequest(result)}
                  disabled={result.isAlreadyFriend || result.hasPendingRequest || sendingRequest}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    background: result.isAlreadyFriend || result.hasPendingRequest
                      ? currentTheme.background.surface
                      : `linear-gradient(135deg, ${currentTheme.background.surface}AA 0%, ${currentTheme.background.default}AA 100%)`,
                    border: `1px solid ${
                      result.isAlreadyFriend || result.hasPendingRequest
                        ? currentTheme.border.default
                        : currentTheme.primary + '33'
                    }`,
                    borderRadius: '12px',
                    cursor: result.isAlreadyFriend || result.hasPendingRequest ? 'not-allowed' : 'pointer',
                    opacity: result.isAlreadyFriend || result.hasPendingRequest ? 0.6 : 1,
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      ...(result.photoURL
                        ? {
                            backgroundImage: `url("${result.photoURL}")`,
                            backgroundPosition: 'center',
                            backgroundSize: 'cover',
                          }
                        : {
                            background: `linear-gradient(135deg, ${currentTheme.primary}66 0%, ${currentTheme.primary}99 100%)`,
                          }),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {!result.photoURL && <Person style={{ fontSize: '24px', color: 'white' }} />}
                  </div>

                  {/* User Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        color: currentTheme.text.primary,
                        marginBottom: '2px',
                      }}
                    >
                      {result.displayName}
                    </div>
                    <div
                      style={{
                        fontSize: '13px',
                        color: currentTheme.text.secondary,
                        marginBottom: '4px',
                      }}
                    >
                      @{result.username}
                    </div>
                    {(result.seriesCount !== undefined || result.moviesCount !== undefined) && (
                      <div
                        style={{
                          fontSize: '12px',
                          color: currentTheme.text.secondary,
                          opacity: 0.8,
                        }}
                      >
                        {result.seriesCount || 0} Serien • {result.moviesCount || 0} Filme
                      </div>
                    )}
                  </div>

                  {/* Status Icon */}
                  <div>
                    {result.isAlreadyFriend && (
                      <CheckCircle style={{ fontSize: '24px', color: currentTheme.status.success }} />
                    )}
                    {result.hasPendingRequest && (
                      <div
                        style={{
                          padding: '6px 12px',
                          background: currentTheme.primary + '22',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: currentTheme.primary,
                        }}
                      >
                        Angefragt
                      </div>
                    )}
                    {!result.isAlreadyFriend && !result.hasPendingRequest && (
                      <PersonAdd style={{ fontSize: '20px', color: currentTheme.primary }} />
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Success Message */}
        <AnimatePresence>
          {requestSuccess && (
            <motion.div
              role="alert"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{
                position: 'fixed',
                bottom: '100px',
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '12px 24px',
                background: currentTheme.status.success,
                borderRadius: '12px',
                color: 'white',
                fontWeight: 600,
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                zIndex: 1001,
              }}
            >
              ✓ Freundschaftsanfrage gesendet!
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </BottomSheet>
  );
};
