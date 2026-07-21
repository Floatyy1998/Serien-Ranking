import { useCallback, useEffect, useState } from 'react';
import { shouldOfferTranslation } from '../lib/translation/languageGuess';
import { appLocale } from '../services/i18n';
import {
  isAutoTranslateEnabled,
  translateComment,
} from '../services/translation/commentTranslation';
import { detectLanguageViaBrowser } from '../services/translation/languageDetection';
import type { CommentTranslations } from '../types/Discussion';

interface UseCommentTranslationOptions {
  /** Voller RTDB-Pfad des Kommentar-Knotens. */
  nodePath: string;
  /** Anzeigetext (ohne Bild-URLs). */
  content: string;
  title?: string;
  lang?: string;
  translations?: CommentTranslations;
  /** false z. B. während des Editierens oder solange ein Spoiler verdeckt ist. */
  enabled?: boolean;
}

export interface CommentTranslationState {
  /** Übersetzen-Button anzeigen? */
  offerTranslation: boolean;
  /** Gerade die Übersetzung (statt des Originals) anzeigen? */
  showTranslation: boolean;
  translated: { text: string; title?: string } | null;
  translating: boolean;
  failed: boolean;
  toggleTranslation: () => void;
}

/**
 * Übersetzung eines Kommentars in die App-Sprache des Lesers. Sprachlogik:
 * `lang`-Feld am Kommentar > Browser-Erkennung > Stopwort-Heuristik. Der
 * geteilte Cache (`translations/<lang>`) kommt über den Realtime-Listener
 * bereits mit den Kommentardaten an — erst bei Cache-Miss ruft toggle die KI.
 */
export const useCommentTranslation = ({
  nodePath,
  content,
  title,
  lang,
  translations,
  enabled = true,
}: UseCommentTranslationOptions): CommentTranslationState => {
  const target = appLocale;
  const cached = translations?.[target] ?? null;

  const [detected, setDetected] = useState<string | null>(null);
  const [fetched, setFetched] = useState<{ text: string; title?: string } | null>(null);
  const [translating, setTranslating] = useState(false);
  const [failed, setFailed] = useState(false);
  const [showTranslation, setShowTranslation] = useState(
    () => isAutoTranslateEnabled() && !!cached
  );

  const knownLang = lang ?? detected;
  const translated = cached ?? fetched;

  const offerTranslation =
    enabled &&
    !!content.trim() &&
    (translated
      ? true
      : knownLang
        ? knownLang !== target
        : shouldOfferTranslation(content, target));

  // Browser-Erkennung verfeinert die Heuristik (nur solange nichts Sicheres vorliegt)
  useEffect(() => {
    if (!enabled || lang || translated) return;
    let cancelled = false;
    detectLanguageViaBrowser(content).then((code) => {
      if (!cancelled && code) setDetected(code);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, lang, translated, content]);

  const translate = useCallback(async () => {
    if (translating) return;
    setTranslating(true);
    setFailed(false);
    const result = await translateComment({
      nodePath,
      content,
      title,
      targetLang: target,
      hasLangField: !!lang,
    });
    setTranslating(false);
    if (!result) {
      setFailed(true);
      return;
    }
    if (result.sourceLang === target) {
      // War schon in der Zielsprache — Button verschwindet
      setDetected(target);
      return;
    }
    if (result.sourceLang) setDetected(result.sourceLang);
    setFetched({ text: result.text, ...(result.title && { title: result.title }) });
    setShowTranslation(true);
  }, [translating, nodePath, content, title, target, lang]);

  const toggleTranslation = useCallback(() => {
    if (showTranslation) {
      setShowTranslation(false);
      return;
    }
    if (translated) {
      setShowTranslation(true);
      return;
    }
    void translate();
  }, [showTranslation, translated, translate]);

  // Auto-Übersetzung: fremdsprachige Kommentare direkt in Leser-Sprache holen
  useEffect(() => {
    if (!enabled || !isAutoTranslateEnabled()) return;
    if (!offerTranslation || showTranslation || translating || failed) return;
    if (translated) {
      setShowTranslation(true);
      return;
    }
    void translate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, offerTranslation, translated, showTranslation, translating, failed]);

  return {
    offerTranslation,
    showTranslation: showTranslation && !!translated,
    translated,
    translating,
    failed,
    toggleTranslation,
  };
};
