import Check from '@mui/icons-material/Check';
import Group from '@mui/icons-material/Group';
import LibraryAddCheck from '@mui/icons-material/LibraryAddCheck';
import Person from '@mui/icons-material/Person';
import Send from '@mui/icons-material/Send';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { BottomSheet } from '../ui';
import { useOptimizedFriends } from '../../contexts/OptimizedFriendsContext';
import { useTheme } from '../../contexts/ThemeContextDef';
import { useDeviceType } from '../../hooks/useDeviceType';
import { useRecommendations } from '../../hooks/useRecommendations';
import { showToast } from '../../lib/toast';
import type { RecommendationMediaType } from '../../types/Recommendation';
import { getImageUrl } from '../../utils/imageUrl';

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

const MAX_MESSAGE_LENGTH = 240;

export const RecommendSheet: React.FC<RecommendSheetProps> = ({ isOpen, onClose, media }) => {
  const { currentTheme } = useTheme();
  const { isMobile } = useDeviceType();
  const { friends } = useOptimizedFriends();
  const { send } = useRecommendations();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [messageFocused, setMessageFocused] = useState(false);
  const [friendsWithMedia, setFriendsWithMedia] = useState<Set<string>>(new Set());
  const [checkingLibrary, setCheckingLibrary] = useState(false);

  // Check which friends already have this series/movie in their library.
  // Punkt-Query per Friend (~500 Bytes) statt Full-Read der series/movies-Liste.
  useEffect(() => {
    if (!isOpen || friends.length === 0) {
      setFriendsWithMedia(new Set());
      return;
    }
    let cancelled = false;
    setCheckingLibrary(true);
    const subPath = media.type === 'series' ? 'series' : 'movies';
    Promise.all(
      friends.map(async (friend) => {
        try {
          const snap = await firebase
            .database()
            .ref(`users/${friend.uid}/${subPath}/${media.id}`)
            .once('value');
          return snap.exists() ? friend.uid : null;
        } catch {
          return null;
        }
      })
    ).then((results) => {
      if (cancelled) return;
      setFriendsWithMedia(new Set(results.filter((uid): uid is string => uid !== null)));
      setCheckingLibrary(false);
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen, friends, media.id, media.type]);

  // Sort: available first, then those who already have it. Alphabetical within each group.
  const sortedFriends = useMemo(() => {
    const byName = (a: { displayName?: string; username?: string }, b: typeof a) =>
      (a.displayName || a.username || '').localeCompare(b.displayName || b.username || '');
    const available = friends.filter((f) => !friendsWithMedia.has(f.uid)).sort(byName);
    const owned = friends.filter((f) => friendsWithMedia.has(f.uid)).sort(byName);
    return [...available, ...owned];
  }, [friends, friendsWithMedia]);

  const availableCount = friends.length - friendsWithMedia.size;

  const heroBackdrop = useMemo(
    () => getImageUrl(media.backdropPath || media.posterPath, 'w780', ''),
    [media.backdropPath, media.posterPath]
  );
  const posterUrl = useMemo(() => getImageUrl(media.posterPath, 'w342', ''), [media.posterPath]);

  const toggleFriend = (uid: string) => {
    if (friendsWithMedia.has(uid)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  };

  const handleClose = () => {
    if (sending) return;
    setSelected(new Set());
    setMessage('');
    onClose();
  };

  const handleSend = async () => {
    if (selected.size === 0 || sending) return;
    setSending(true);
    try {
      const count = await send({
        recipientUids: Array.from(selected),
        media,
        message: message.trim() || undefined,
      });
      showToast(count === 1 ? `Empfehlung gesendet` : `An ${count} Freunde gesendet`, 1800);
      setSelected(new Set());
      setMessage('');
      onClose();
    } catch (err) {
      console.error('Failed to send recommendation', err);
      showToast('Senden fehlgeschlagen', 2000, 'error');
    } finally {
      setSending(false);
    }
  };

  const hasFriends = sortedFriends.length > 0;

  // Sizing tokens per breakpoint
  const heroPadding = isMobile ? '18px' : '26px 30px';
  const heroPosterW = isMobile ? 82 : 108;
  const heroPosterH = isMobile ? 122 : 160;
  const heroTitleSize = isMobile ? 22 : 28;
  const avatarSize = isMobile ? 60 : 66;
  const avatarMin = isMobile ? 80 : 88;
  const gridGap = isMobile ? 14 : 16;
  const sectionPadding = isMobile ? '0 20px' : '0 32px';

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      maxHeight="78vh"
      maxWidth={isMobile ? '640px' : 'min(1180px, 94vw)'}
      ariaLabel="Empfehlung senden"
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
          <div
            style={{
              position: 'relative',
              margin: isMobile ? '0 14px 18px' : '0 24px 24px',
              borderRadius: isMobile ? 22 : 28,
              overflow: 'hidden',
              border: `1px solid ${currentTheme.primary}33`,
              boxShadow: `0 22px 50px -18px rgba(0,0,0,0.55), 0 8px 22px -8px ${currentTheme.primary}33, inset 0 1px 0 rgba(255,255,255,0.08)`,
            }}
          >
            {/* Backdrop layer */}
            {heroBackdrop && (
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: `url(${heroBackdrop})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'blur(36px) saturate(1.6) brightness(0.45)',
                  transform: 'scale(1.2)',
                }}
              />
            )}
            {/* Theme gradient */}
            <div
              aria-hidden
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(135deg, ${currentTheme.primary}66 0%, transparent 50%, ${currentTheme.accent}55 100%)`,
              }}
            />
            {/* Radial glow */}
            <div
              aria-hidden
              style={{
                position: 'absolute',
                inset: 0,
                background: `radial-gradient(ellipse 70% 100% at 20% 0%, ${currentTheme.primary}30, transparent 60%)`,
              }}
            />
            {/* Bottom darken */}
            <div
              aria-hidden
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.55) 100%)',
              }}
            />

            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? 16 : 24,
                padding: heroPadding,
              }}
            >
              {posterUrl ? (
                <motion.img
                  src={posterUrl}
                  alt=""
                  initial={{ rotate: -3, scale: 0.95 }}
                  animate={{ rotate: -2, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 240, damping: 22 }}
                  style={{
                    width: heroPosterW,
                    height: heroPosterH,
                    borderRadius: isMobile ? 12 : 14,
                    objectFit: 'cover',
                    boxShadow:
                      '0 18px 36px -12px rgba(0,0,0,0.75), 0 4px 10px -2px rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: heroPosterW,
                    height: heroPosterH,
                    borderRadius: isMobile ? 12 : 14,
                    background: `linear-gradient(135deg, ${currentTheme.primary}66, ${currentTheme.accent}55)`,
                    flexShrink: 0,
                    transform: 'rotate(-2deg)',
                  }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Eyebrow with bar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: isMobile ? 8 : 12,
                  }}
                >
                  <div
                    aria-hidden
                    style={{
                      width: 24,
                      height: 2,
                      borderRadius: 2,
                      background: `linear-gradient(90deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                    }}
                  />
                  <div
                    style={{
                      fontSize: isMobile ? 10 : 11,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.22em',
                      color: '#fff',
                      opacity: 0.85,
                    }}
                  >
                    Du empfiehlst
                  </div>
                </div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: heroTitleSize,
                    fontWeight: 900,
                    lineHeight: 1.1,
                    fontFamily: 'var(--font-display)',
                    background: `linear-gradient(135deg, #fff 0%, #fff 50%, ${currentTheme.primary}cc 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    textShadow: '0 2px 8px rgba(0,0,0,0.4)',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {media.title}
                </h2>
                <div
                  style={{
                    marginTop: isMobile ? 8 : 12,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    borderRadius: 999,
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#fff',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                  }}
                >
                  {media.type === 'movie' ? 'Film' : 'Serie'}
                </div>
              </div>
            </div>
          </div>

          {/* Friend Picker */}
          <div style={{ padding: sectionPadding }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: isMobile ? 14 : 18,
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  aria-hidden
                  style={{
                    width: 4,
                    height: 16,
                    borderRadius: 2,
                    background: `linear-gradient(180deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                  }}
                />
                <div
                  style={{
                    fontSize: isMobile ? 13 : 14,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.14em',
                    color: currentTheme.text.primary,
                  }}
                >
                  An wen?
                </div>
                {!checkingLibrary && friendsWithMedia.size > 0 && (
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: currentTheme.text.muted,
                      letterSpacing: '0.02em',
                    }}
                  >
                    · {availableCount} verfügbar
                  </div>
                )}
              </div>
              <AnimatePresence mode="popLayout">
                {selected.size > 0 && (
                  <motion.span
                    key={selected.size}
                    initial={{ scale: 0.7, opacity: 0, y: -4 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.7, opacity: 0, y: -4 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      padding: '5px 12px',
                      borderRadius: 999,
                      background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                      color: currentTheme.text.secondary,
                      boxShadow: `0 6px 16px -6px ${currentTheme.primary}99`,
                      letterSpacing: '0.02em',
                    }}
                  >
                    {selected.size} ausgewählt
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            {!hasFriends ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: isMobile ? '36px 16px' : '48px 24px',
                  background: `${currentTheme.background.surface}88`,
                  borderRadius: 20,
                  border: `1px dashed ${currentTheme.border.default}`,
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    margin: '0 auto 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `linear-gradient(135deg, ${currentTheme.primary}22, ${currentTheme.accent}11)`,
                    border: `1px solid ${currentTheme.primary}33`,
                  }}
                >
                  <Group style={{ fontSize: 28, color: currentTheme.primary }} />
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: currentTheme.text.primary,
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  Noch keine Freunde
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: currentTheme.text.muted,
                    marginTop: 6,
                    lineHeight: 1.5,
                  }}
                >
                  Füge erst Freunde hinzu, um zu empfehlen.
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(auto-fill, minmax(${avatarMin}px, 1fr))`,
                  gap: gridGap,
                }}
              >
                {sortedFriends.map((friend) => {
                  const isSelected = selected.has(friend.uid);
                  const alreadyHas = friendsWithMedia.has(friend.uid);
                  const name = friend.displayName || friend.username || 'Freund';
                  return (
                    <motion.button
                      key={friend.uid}
                      whileTap={alreadyHas ? undefined : { scale: 0.9 }}
                      whileHover={!isMobile && !alreadyHas ? { y: -2 } : undefined}
                      onClick={() => toggleFriend(friend.uid)}
                      aria-pressed={isSelected}
                      aria-disabled={alreadyHas}
                      title={
                        alreadyHas
                          ? `${name} hat ${media.type === 'movie' ? 'den Film' : 'die Serie'} schon`
                          : undefined
                      }
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 4px',
                        background: 'none',
                        border: 'none',
                        cursor: alreadyHas ? 'not-allowed' : 'pointer',
                        borderRadius: 14,
                        opacity: alreadyHas ? 0.42 : 1,
                        filter: alreadyHas ? 'grayscale(0.6)' : 'none',
                        transition: 'opacity 0.2s ease, filter 0.2s ease',
                      }}
                    >
                      <div
                        style={{
                          position: 'relative',
                          width: avatarSize,
                          height: avatarSize,
                          borderRadius: '50%',
                        }}
                      >
                        {/* Glow halo when selected */}
                        <motion.div
                          aria-hidden
                          animate={
                            isSelected
                              ? { scale: 1.15, opacity: 0.55 }
                              : { scale: 0.85, opacity: 0 }
                          }
                          transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                          style={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: '50%',
                            background: `radial-gradient(circle, ${currentTheme.primary}, transparent 70%)`,
                            filter: 'blur(12px)',
                            zIndex: 0,
                          }}
                        />
                        {/* Gradient ring */}
                        <motion.div
                          aria-hidden
                          animate={
                            isSelected ? { scale: 1, opacity: 1 } : { scale: 0.92, opacity: 0 }
                          }
                          transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                          style={{
                            position: 'absolute',
                            inset: -4,
                            borderRadius: '50%',
                            background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                            zIndex: 1,
                          }}
                        />
                        <div
                          style={{
                            position: 'relative',
                            width: avatarSize,
                            height: avatarSize,
                            borderRadius: '50%',
                            overflow: 'hidden',
                            border: isSelected
                              ? `3px solid ${currentTheme.background.default}`
                              : `2px solid ${currentTheme.border.default}`,
                            background: friend.photoURL
                              ? `url("${friend.photoURL}") center/cover`
                              : `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 2,
                            boxShadow: isSelected
                              ? `0 10px 24px -8px ${currentTheme.primary}bb`
                              : '0 3px 8px rgba(0,0,0,0.2)',
                            transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
                          }}
                        >
                          {!friend.photoURL && (
                            <Person
                              style={{
                                fontSize: Math.round(avatarSize * 0.5),
                                color: currentTheme.text.primary,
                              }}
                              aria-hidden
                            />
                          )}
                        </div>
                        <AnimatePresence>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0, rotate: -30 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0, rotate: 30 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                              style={{
                                position: 'absolute',
                                right: -2,
                                bottom: -2,
                                width: isMobile ? 24 : 28,
                                height: isMobile ? 24 : 28,
                                borderRadius: '50%',
                                background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                                border: `2.5px solid ${currentTheme.background.default}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 3,
                                boxShadow: `0 4px 10px -2px ${currentTheme.primary}99`,
                              }}
                            >
                              <Check
                                style={{ fontSize: isMobile ? 14 : 16, color: '#fff' }}
                                aria-hidden
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                        {alreadyHas && (
                          <div
                            aria-hidden
                            style={{
                              position: 'absolute',
                              right: -2,
                              bottom: -2,
                              width: isMobile ? 24 : 28,
                              height: isMobile ? 24 : 28,
                              borderRadius: '50%',
                              background: currentTheme.background.surface,
                              border: `2px solid ${currentTheme.background.default}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              zIndex: 3,
                              boxShadow: '0 3px 8px rgba(0,0,0,0.3)',
                            }}
                          >
                            <LibraryAddCheck
                              style={{
                                fontSize: isMobile ? 13 : 15,
                                color: currentTheme.status?.success || '#22c55e',
                              }}
                            />
                          </div>
                        )}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 2,
                          maxWidth: avatarMin - 8,
                        }}
                      >
                        <div
                          style={{
                            fontSize: isMobile ? 12 : 13,
                            fontWeight: isSelected ? 800 : 600,
                            color: isSelected ? currentTheme.text.primary : currentTheme.text.muted,
                            textAlign: 'center',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '100%',
                            transition: 'color 0.2s ease',
                          }}
                        >
                          {name}
                        </div>
                        {alreadyHas && (
                          <div
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              letterSpacing: '0.06em',
                              textTransform: 'uppercase',
                              color: currentTheme.status?.success || '#22c55e',
                              opacity: 0.85,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Hat das schon
                          </div>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}

            {/* Message */}
            {hasFriends && (
              <div style={{ marginTop: isMobile ? 26 : 32 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 12,
                  }}
                >
                  <div
                    aria-hidden
                    style={{
                      width: 4,
                      height: 16,
                      borderRadius: 2,
                      background: `linear-gradient(180deg, ${currentTheme.accent}, ${currentTheme.primary})`,
                    }}
                  />
                  <div
                    style={{
                      fontSize: isMobile ? 13 : 14,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.14em',
                      color: currentTheme.text.primary,
                    }}
                  >
                    Nachricht{' '}
                    <span
                      style={{
                        opacity: 0.5,
                        fontWeight: 600,
                        letterSpacing: '0.06em',
                      }}
                    >
                      · optional
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    position: 'relative',
                    borderRadius: 18,
                    background: `${currentTheme.background.surface}cc`,
                    border: messageFocused
                      ? `1px solid ${currentTheme.primary}88`
                      : `1px solid ${currentTheme.border.default}`,
                    padding: '14px 16px 10px',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    boxShadow: messageFocused
                      ? `0 0 0 4px ${currentTheme.primary}22, 0 6px 18px -8px ${currentTheme.primary}55`
                      : 'none',
                    transition:
                      'border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease',
                  }}
                >
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
                    onFocus={() => setMessageFocused(true)}
                    onBlur={() => setMessageFocused(false)}
                    placeholder="Sag was dazu…"
                    rows={isMobile ? 2 : 3}
                    style={{
                      width: '100%',
                      resize: 'none',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: currentTheme.text.primary,
                      fontSize: 14,
                      fontFamily: 'inherit',
                      lineHeight: 1.5,
                    }}
                  />
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      fontSize: 11,
                      color:
                        message.length > MAX_MESSAGE_LENGTH - 30
                          ? currentTheme.status?.warning || '#f59e0b'
                          : currentTheme.text.muted,
                      fontWeight: 600,
                      letterSpacing: '0.02em',
                    }}
                  >
                    {message.length}/{MAX_MESSAGE_LENGTH}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* end scrollable area */}

        {/* Send Button (sticky bottom) */}
        {hasFriends && (
          <div
            style={{
              flexShrink: 0,
              padding: isMobile ? '14px 20px 6px' : '18px 30px 8px',
              borderTop: `1px solid ${currentTheme.border.default}40`,
              background: `linear-gradient(180deg, ${currentTheme.background.surface}cc 0%, ${currentTheme.background.default} 60%)`,
              backdropFilter: 'blur(16px) saturate(1.4)',
              WebkitBackdropFilter: 'blur(16px) saturate(1.4)',
            }}
          >
            <motion.button
              whileTap={selected.size > 0 && !sending ? { scale: 0.97 } : undefined}
              whileHover={selected.size > 0 && !sending && !isMobile ? { scale: 1.01 } : undefined}
              onClick={handleSend}
              disabled={selected.size === 0 || sending}
              style={{
                position: 'relative',
                width: '100%',
                padding: isMobile ? '17px' : '19px',
                borderRadius: 18,
                border: 'none',
                cursor: selected.size === 0 || sending ? 'not-allowed' : 'pointer',
                background:
                  selected.size === 0
                    ? `${currentTheme.background.surface}aa`
                    : `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.accent} 100%)`,
                color: selected.size === 0 ? currentTheme.text.muted : currentTheme.text.secondary,
                fontSize: isMobile ? 15 : 16,
                fontWeight: 900,
                fontFamily: 'var(--font-display)',
                letterSpacing: '-0.01em',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                boxShadow:
                  selected.size === 0
                    ? 'none'
                    : `0 16px 36px -12px ${currentTheme.primary}cc, 0 6px 14px -4px ${currentTheme.accent}66, inset 0 1px 0 rgba(255,255,255,0.18)`,
                transition: 'background 0.2s ease, box-shadow 0.2s ease, color 0.2s ease',
                overflow: 'hidden',
              }}
            >
              {/* Shimmer sweep on hover (desktop) */}
              {selected.size > 0 && !sending && !isMobile && (
                <div
                  aria-hidden
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)',
                    transform: 'translateX(-100%)',
                    animation: 'recommend-shimmer 2.4s linear infinite',
                    pointerEvents: 'none',
                  }}
                />
              )}
              <motion.span
                animate={
                  sending
                    ? { x: [0, 120], y: [0, -50], rotate: [0, 30], opacity: [1, 0] }
                    : { x: 0, y: 0, rotate: 0, opacity: 1 }
                }
                transition={
                  sending ? { duration: 0.6, ease: [0.4, 0, 0.2, 1] } : { duration: 0.18 }
                }
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 24,
                  height: 24,
                }}
              >
                <Send style={{ fontSize: isMobile ? 18 : 20 }} />
              </motion.span>
              <span style={{ position: 'relative' }}>
                {sending
                  ? 'Wird gesendet…'
                  : selected.size === 0
                    ? 'Freunde auswählen'
                    : selected.size === 1
                      ? 'Empfehlung senden'
                      : `An ${selected.size} Freunde senden`}
              </span>
            </motion.button>
            <style>
              {`@keyframes recommend-shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }`}
            </style>
          </div>
        )}
      </div>
    </BottomSheet>
  );
};
