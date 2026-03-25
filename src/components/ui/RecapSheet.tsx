import { AutoAwesome, Send } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContextDef';
import type { RecapEpisode } from '../../hooks/useRecapData';
import { BottomSheet } from './BottomSheet';

interface RecapSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onDismissPermanent: () => void;
  seriesTitle: string;
  daysSinceLastWatch: number;
  recapEpisodes: RecapEpisode[];
  aiRecap: string | null;
  aiLoading: boolean;
  aiError: string | null;
  onGenerateAiRecap: () => void;
  loading: boolean;
  onAskQuestion: (question: string) => Promise<void>;
  questionAnswer: string | null;
  questionLoading: boolean;
}

export const RecapSheet: React.FC<RecapSheetProps> = ({
  isOpen,
  onClose,
  onDismissPermanent,
  seriesTitle,
  daysSinceLastWatch,
  recapEpisodes,
  aiRecap,
  aiLoading,
  aiError,
  onGenerateAiRecap,
  loading,
  onAskQuestion,
  questionAnswer,
  questionLoading,
}) => {
  const { currentTheme } = useTheme();
  const accent = currentTheme.accent || currentTheme.primary;
  const [question, setQuestion] = useState('');

  const handleAsk = () => {
    if (!question.trim() || questionLoading) return;
    onAskQuestion(question.trim());
    setQuestion('');
  };
  const surface = currentTheme.background.surface;

  const parseBulletPoints = (text: string) => {
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => line.replace(/^[•\-\*]\s*/, '').replace(/\*\*/g, ''));
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      maxHeight="85vh"
      maxWidth="none"
      ariaLabel="Serien-Recap"
    >
      <div
        style={{
          overflowY: 'auto',
          maxHeight: '80vh',
          WebkitOverflowScrolling: 'touch',
          padding: 'clamp(16px, 3vw, 40px)',
        }}
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: '20px' }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '2.5px',
              color: accent,
              marginBottom: '6px',
            }}
          >
            Previously on
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <h2
              style={{
                fontSize: 'clamp(22px, 3vw, 30px)',
                fontWeight: 800,
                color: currentTheme.text.secondary,
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              {seriesTitle}
            </h2>
            <span
              style={{
                fontSize: '13px',
                color: currentTheme.text.muted,
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {daysSinceLastWatch} Tage pausiert
            </span>
          </div>
        </motion.div>

        {/* AI Recap */}
        <AnimatePresence mode="wait">
          {aiRecap ? (
            <motion.div
              key="recap"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginBottom: '20px',
                padding: '16px',
                borderRadius: '12px',
                background: `${accent}08`,
                border: `1px solid ${accent}15`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '12px',
                }}
              >
                <AutoAwesome style={{ fontSize: '14px', color: accent }} />
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '1.5px',
                    color: accent,
                  }}
                >
                  KI-Recap
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {parseBulletPoints(aiRecap).map((point, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}
                  >
                    <div
                      style={{
                        width: '2px',
                        minHeight: '18px',
                        height: '100%',
                        borderRadius: '1px',
                        background: accent,
                        opacity: 0.4 + i * 0.1,
                        flexShrink: 0,
                        marginTop: '3px',
                      }}
                    />
                    <p
                      style={{
                        fontSize: 'clamp(14px, 1.3vw, 17px)',
                        lineHeight: 1.65,
                        color: currentTheme.text.secondary,
                        margin: 0,
                      }}
                    >
                      {point}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : aiError ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginBottom: '20px',
                padding: '14px',
                borderRadius: '10px',
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                textAlign: 'center',
              }}
            >
              <p
                style={{
                  fontSize: 'clamp(13px, 1.2vw, 15px)',
                  color: currentTheme.text.muted,
                  margin: 0,
                }}
              >
                {aiError}
              </p>
            </motion.div>
          ) : (
            !loading &&
            recapEpisodes.length > 0 && (
              <motion.div
                key="generate"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ marginBottom: '20px' }}
              >
                <button
                  onClick={onGenerateAiRecap}
                  disabled={aiLoading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: `${accent}10`,
                    border: `1px solid ${accent}18`,
                    borderRadius: '10px',
                    color: accent,
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: aiLoading ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <AutoAwesome
                    style={{
                      fontSize: '16px',
                      animation: aiLoading ? 'recapSpin 1s linear infinite' : 'none',
                    }}
                  />
                  {aiLoading ? 'Wird generiert...' : 'KI-Zusammenfassung generieren'}
                </button>
              </motion.div>
            )
          )}
        </AnimatePresence>

        {/* Episodes – compact list with thumbnail left, text right */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  height: '72px',
                  borderRadius: '10px',
                  background: surface,
                  animation: 'recapPulse 1.5s ease-in-out infinite',
                  opacity: 1 - i * 0.2,
                }}
              />
            ))}
          </div>
        ) : (
          recapEpisodes.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  color: currentTheme.text.muted,
                  marginBottom: '10px',
                }}
              >
                Zuletzt geschaut
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {recapEpisodes.map((ep, i) => {
                  const isLast = i === recapEpisodes.length - 1;
                  return (
                    <motion.div
                      key={`${ep.seasonNumber}-${ep.episodeNumber}`}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.03 * i }}
                      style={{
                        display: 'flex',
                        gap: '12px',
                        padding: '8px',
                        borderRadius: '10px',
                        background: isLast ? `${accent}06` : surface,
                        border: isLast
                          ? `1px solid ${accent}20`
                          : `1px solid rgba(255,255,255,0.03)`,
                      }}
                    >
                      {/* Thumbnail */}
                      {ep.stillPath ? (
                        <div
                          style={{
                            width: 'clamp(140px, 20vw, 260px)',
                            flexShrink: 0,
                            borderRadius: '8px',
                            overflow: 'hidden',
                            position: 'relative',
                          }}
                        >
                          <img
                            src={`https://image.tmdb.org/t/p/w300${ep.stillPath}`}
                            alt={ep.name}
                            loading="lazy"
                            style={{
                              width: '100%',
                              aspectRatio: '16 / 9',
                              objectFit: 'cover',
                              display: 'block',
                            }}
                          />
                          <span
                            style={{
                              position: 'absolute',
                              bottom: '6px',
                              left: '6px',
                              fontSize: 'clamp(11px, 1vw, 14px)',
                              fontWeight: 700,
                              color: '#fff',
                              background: 'rgba(0,0,0,0.6)',
                              backdropFilter: 'blur(4px)',
                              padding: '3px 8px',
                              borderRadius: '5px',
                            }}
                          >
                            S{ep.seasonNumber}E{ep.episodeNumber}
                          </span>
                        </div>
                      ) : (
                        <div
                          style={{
                            width: 'clamp(140px, 20vw, 260px)',
                            aspectRatio: '16 / 9',
                            flexShrink: 0,
                            borderRadius: '8px',
                            background: currentTheme.background.default,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 700,
                            color: currentTheme.text.muted,
                          }}
                        >
                          S{ep.seasonNumber}E{ep.episodeNumber}
                        </div>
                      )}

                      {/* Text */}
                      <div
                        style={{
                          flex: 1,
                          minWidth: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          gap: '2px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              fontSize: 'clamp(14px, 1.5vw, 18px)',
                              fontWeight: 700,
                              color: currentTheme.text.secondary,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {ep.name}
                          </span>
                          {isLast && (
                            <span
                              style={{
                                fontSize: 'clamp(10px, 0.9vw, 13px)',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                color: accent,
                                background: `${accent}15`,
                                padding: '3px 7px',
                                borderRadius: '4px',
                                flexShrink: 0,
                              }}
                            >
                              Zuletzt
                            </span>
                          )}
                        </div>
                        <p
                          style={{
                            fontSize: 'clamp(12px, 1.2vw, 15px)',
                            lineHeight: 1.5,
                            color: currentTheme.text.muted,
                            margin: 0,
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {ep.overview}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )
        )}

        {/* Question input */}
        {(aiRecap || recapEpisodes.length > 0) && !loading && (
          <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                placeholder="Was ist nochmal passiert mit...?"
                disabled={questionLoading}
                style={{
                  flex: 1,
                  padding: '11px 14px',
                  background: currentTheme.background.surface,
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px',
                  color: currentTheme.text.secondary,
                  fontSize: 'clamp(13px, 1.2vw, 15px)',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleAsk}
                disabled={!question.trim() || questionLoading}
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  border: 'none',
                  background: question.trim() ? accent : `${accent}20`,
                  color: question.trim() ? currentTheme.background.default : `${accent}60`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: question.trim() && !questionLoading ? 'pointer' : 'default',
                  flexShrink: 0,
                }}
              >
                <Send style={{ fontSize: '16px' }} />
              </button>
            </div>

            {questionLoading && (
              <div
                style={{
                  marginTop: '10px',
                  padding: '12px',
                  borderRadius: '10px',
                  background: `${accent}08`,
                  border: `1px solid ${accent}15`,
                }}
              >
                <div
                  style={{
                    height: '12px',
                    width: '60%',
                    borderRadius: '6px',
                    background: `${accent}15`,
                    animation: 'recapPulse 1.5s ease-in-out infinite',
                  }}
                />
              </div>
            )}

            {questionAnswer && !questionLoading && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  marginTop: '10px',
                  padding: '12px',
                  borderRadius: '10px',
                  background: `${accent}08`,
                  border: `1px solid ${accent}15`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '6px',
                  }}
                >
                  <AutoAwesome style={{ fontSize: '12px', color: accent }} />
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      color: accent,
                    }}
                  >
                    Antwort
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 'clamp(13px, 1.2vw, 15px)',
                    lineHeight: 1.6,
                    color: currentTheme.text.secondary,
                    margin: 0,
                  }}
                >
                  {questionAnswer}
                </p>
              </motion.div>
            )}
          </div>
        )}

        {/* Dismiss */}
        <button
          onClick={onDismissPermanent}
          style={{
            width: '100%',
            padding: '10px',
            marginTop: '20px',
            background: 'transparent',
            border: 'none',
            borderRadius: '8px',
            color: currentTheme.text.muted,
            fontSize: '12px',
            cursor: 'pointer',
            opacity: 0.6,
          }}
        >
          Nicht mehr anzeigen
        </button>
      </div>

      <style>{`
        @keyframes recapPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
        @keyframes recapSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </BottomSheet>
  );
};
