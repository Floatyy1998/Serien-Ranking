import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../AuthContext';

type TtsState = 'idle' | 'loading' | 'speaking';

const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL;

// Session-wide audio cache: text hash → blob URL
const audioCache = new Map<string, string>();

function hashText(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
  }
  return hash.toString(36);
}

export function useTextToSpeech() {
  const { user } = useAuth() || {};
  const [state, setState] = useState<TtsState>('idle');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const speak = useCallback(
    async (text: string) => {
      // Toggle off if already active
      if (state === 'speaking' || state === 'loading') {
        abortRef.current?.abort();
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
        setState('idle');
        return;
      }

      const clean = text
        .replace(/^[•\-*]\s*/gm, '')
        .replace(/\*\*/g, '')
        .replace(/\n+/g, '. ')
        .replace(/\s+/g, ' ')
        .trim();

      if (!clean) return;

      const key = hashText(clean);
      const cached = audioCache.get(key);

      // Play from cache if available
      if (cached) {
        const audio = new Audio(cached);
        audioRef.current = audio;
        audio.onplay = () => setState('speaking');
        audio.onended = () => {
          audioRef.current = null;
          setState('idle');
        };
        audio.onerror = () => {
          audioRef.current = null;
          setState('idle');
        };
        await audio.play();
        return;
      }

      setState('loading');
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(`${BACKEND_URL}/ai/tts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: clean, uid: user?.uid }),
          signal: controller.signal,
        });

        if (!res.ok) {
          setState('idle');
          return;
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        audioCache.set(key, url);

        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onplay = () => setState('speaking');
        audio.onended = () => {
          audioRef.current = null;
          setState('idle');
        };
        audio.onerror = () => {
          audioRef.current = null;
          setState('idle');
        };

        await audio.play();
      } catch {
        setState('idle');
      }
    },
    [state, user]
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setState('idle');
  }, []);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return { state, speak, stop };
}
