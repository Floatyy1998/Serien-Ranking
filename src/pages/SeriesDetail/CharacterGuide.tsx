import { AutoAwesome, Send } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContextDef';
import type { CharacterDescription } from '../../hooks/useCharacterDescriptions';

interface CharacterGuideProps {
  characters: CharacterDescription[];
  loading: boolean;
  error: string | null;
  onGenerate: () => void;
  userProgress: { season: number; episode: number } | null;
  isMobile: boolean;
  onAskQuestion: (question: string) => Promise<void>;
  questionAnswer: string | null;
  questionLoading: boolean;
}

interface QuestionInputProps {
  question: string;
  setQuestion: (q: string) => void;
  onAsk: () => void;
  questionLoading: boolean;
  questionAnswer: string | null;
  lastAsked: string;
  accent: string;
  currentTheme: ReturnType<typeof useTheme>['currentTheme'];
  isMobile: boolean;
  userProgress: { season: number; episode: number } | null;
}

const QuestionInput: React.FC<QuestionInputProps> = ({
  question,
  setQuestion,
  onAsk,
  questionLoading,
  questionAnswer,
  lastAsked,
  accent,
  currentTheme,
  isMobile,
  userProgress,
}) => (
  <div style={{ marginTop: '20px', padding: `0 ${isMobile ? '0' : '0'}` }}>
    <div
      style={{
        fontSize: '11px',
        fontWeight: 600,
        color: currentTheme.text.muted,
        marginBottom: '8px',
      }}
    >
      Frage zur Serie
      {userProgress ? ` (spoilerfrei bis S${userProgress.season}E${userProgress.episode})` : ''}
    </div>
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <input
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onAsk()}
        placeholder="Was ist nochmal mit ... passiert?"
        disabled={questionLoading}
        style={{
          flex: 1,
          padding: '12px 14px',
          background: currentTheme.background.surface,
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px',
          color: currentTheme.text.secondary,
          fontSize: isMobile ? '14px' : '15px',
          outline: 'none',
        }}
      />
      <button
        onClick={onAsk}
        disabled={!question.trim() || questionLoading}
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '12px',
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
        <Send style={{ fontSize: '18px' }} />
      </button>
    </div>

    {(questionLoading || questionAnswer) && lastAsked && (
      <div
        style={{
          marginTop: '10px',
          padding: '10px 14px',
          borderRadius: '10px 10px 0 0',
          background: currentTheme.background.surface,
          fontSize: isMobile ? '13px' : '14px',
          color: currentTheme.text.secondary,
          fontStyle: 'italic',
        }}
      >
        {lastAsked}
      </div>
    )}

    {questionLoading && (
      <div
        style={{
          padding: '14px',
          borderRadius: lastAsked ? '0 0 10px 10px' : '12px',
          background: `${accent}08`,
          border: `1px solid ${accent}15`,
          borderTop: lastAsked ? 'none' : undefined,
        }}
      >
        <div
          style={{
            height: '14px',
            width: '70%',
            borderRadius: '7px',
            background: `${accent}15`,
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
        <style>{`@keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.7; } }`}</style>
      </div>
    )}

    {questionAnswer && !questionLoading && (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          padding: '14px',
          borderRadius: lastAsked ? '0 0 10px 10px' : '12px',
          background: `${accent}08`,
          border: `1px solid ${accent}15`,
          borderTop: lastAsked ? 'none' : undefined,
        }}
      >
        <p
          style={{
            fontSize: isMobile ? '13px' : '14px',
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
);

export const CharacterGuide: React.FC<CharacterGuideProps> = ({
  characters,
  loading,
  error,
  onGenerate,
  userProgress,
  isMobile,
  onAskQuestion,
  questionAnswer,
  questionLoading,
}) => {
  const { currentTheme } = useTheme();
  const accent = currentTheme.accent || currentTheme.primary;
  const pad = isMobile ? '12px' : '20px';
  const [question, setQuestion] = useState('');
  const [lastAsked, setLastAsked] = useState('');

  const handleAsk = () => {
    if (!question.trim() || questionLoading) return;
    setLastAsked(question.trim());
    onAskQuestion(question.trim());
    setQuestion('');
  };

  // Noch nicht generiert
  if (characters.length === 0 && !loading && !error) {
    return (
      <div style={{ padding: `20px ${pad}`, textAlign: 'center' }}>
        <AutoAwesome
          style={{ fontSize: '40px', color: accent, marginBottom: '12px', opacity: 0.6 }}
        />
        <h3
          style={{
            fontSize: isMobile ? '17px' : '19px',
            fontWeight: 700,
            color: currentTheme.text.secondary,
            margin: '0 0 6px',
          }}
        >
          Wer war das nochmal?
        </h3>
        <p
          style={{
            fontSize: isMobile ? '14px' : '15px',
            color: currentTheme.text.muted,
            margin: '0 0 20px',
            lineHeight: 1.5,
          }}
        >
          KI-Charakter-Guide spoilerfrei bis
          {userProgress
            ? ` S${userProgress.season}E${userProgress.episode}`
            : ' zu deinem Fortschritt'}
        </p>
        <button
          onClick={onGenerate}
          style={{
            padding: '14px 28px',
            background: `${accent}15`,
            border: `1px solid ${accent}30`,
            borderRadius: '14px',
            color: accent,
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AutoAwesome style={{ fontSize: '18px' }} />
          Guide generieren
        </button>

        <QuestionInput
          question={question}
          setQuestion={setQuestion}
          onAsk={handleAsk}
          questionLoading={questionLoading}
          questionAnswer={questionAnswer}
          lastAsked={lastAsked}
          accent={accent}
          currentTheme={currentTheme}
          isMobile={isMobile}
          userProgress={userProgress}
        />
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div
        style={{ padding: `16px ${pad}`, display: 'flex', flexDirection: 'column', gap: '12px' }}
      >
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: '12px',
              padding: '12px',
              borderRadius: '14px',
              background: currentTheme.background.surface,
              animation: 'pulse 1.5s ease-in-out infinite',
              opacity: 1 - i * 0.15,
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: currentTheme.background.default,
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div
                style={{
                  height: '14px',
                  width: '40%',
                  borderRadius: '7px',
                  background: currentTheme.background.default,
                }}
              />
              <div
                style={{
                  height: '12px',
                  width: '80%',
                  borderRadius: '6px',
                  background: currentTheme.background.default,
                }}
              />
            </div>
          </div>
        ))}
        <style>{`@keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.7; } }`}</style>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div style={{ padding: `20px ${pad}`, textAlign: 'center' }}>
        <p style={{ color: currentTheme.text.muted, fontSize: '14px' }}>{error}</p>
        <button
          onClick={onGenerate}
          style={{
            marginTop: '12px',
            padding: '10px 20px',
            background: `${accent}15`,
            border: `1px solid ${accent}30`,
            borderRadius: '10px',
            color: accent,
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Nochmal versuchen
        </button>
        <QuestionInput
          question={question}
          setQuestion={setQuestion}
          onAsk={handleAsk}
          questionLoading={questionLoading}
          questionAnswer={questionAnswer}
          lastAsked={lastAsked}
          accent={accent}
          currentTheme={currentTheme}
          isMobile={isMobile}
          userProgress={userProgress}
        />
      </div>
    );
  }

  // Character list + question input
  return (
    <div style={{ padding: `8px ${pad} 16px` }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
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
            KI-Guide
          </span>
        </div>
        {userProgress && (
          <span
            style={{
              fontSize: '12px',
              color: currentTheme.text.muted,
              background: `${accent}10`,
              padding: '3px 10px',
              borderRadius: '8px',
            }}
          >
            Bis S{userProgress.season}E{userProgress.episode}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {characters.map((char, i) => (
          <motion.div
            key={char.character}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            style={{
              display: 'flex',
              gap: '12px',
              padding: '12px',
              borderRadius: '14px',
              background: currentTheme.background.surface,
              border: `1px solid rgba(255,255,255,0.04)`,
            }}
          >
            {/* Profile photo */}
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                overflow: 'hidden',
                flexShrink: 0,
                background: currentTheme.background.default,
              }}
            >
              {char.imageUrl ? (
                <img
                  src={char.imageUrl}
                  alt={char.character}
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : char.profilePath ? (
                <img
                  src={`https://image.tmdb.org/t/p/w185${char.profilePath}`}
                  alt={char.name}
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: 700,
                    color: currentTheme.text.muted,
                  }}
                >
                  {char.character.charAt(0)}
                </div>
              )}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: isMobile ? '15px' : '16px',
                  fontWeight: 700,
                  color: currentTheme.text.secondary,
                  marginBottom: '1px',
                }}
              >
                {char.character}
              </div>
              {char.name && (
                <div
                  style={{
                    fontSize: '12px',
                    color: currentTheme.text.muted,
                    marginBottom: '6px',
                  }}
                >
                  {char.name}
                </div>
              )}
              <p
                style={{
                  fontSize: isMobile ? '13px' : '14px',
                  lineHeight: 1.6,
                  color: currentTheme.text.secondary,
                  margin: 0,
                  opacity: 0.85,
                }}
              >
                {char.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <QuestionInput
        question={question}
        setQuestion={setQuestion}
        onAsk={handleAsk}
        questionLoading={questionLoading}
        questionAnswer={questionAnswer}
        lastAsked={lastAsked}
        accent={accent}
        currentTheme={currentTheme}
        isMobile={isMobile}
        userProgress={userProgress}
      />
    </div>
  );
};
