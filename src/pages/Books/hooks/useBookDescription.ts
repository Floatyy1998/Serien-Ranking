import { useEffect, useState } from 'react';
import { guessLanguage, htmlToPlainText } from '../../../lib/books/bookText';
import { fetchWikipediaSummary } from '../../../services/api/bookDiscovery';
import { translateBookDescription } from '../../../services/books/bookTranslation';
import { appLocale } from '../../../services/i18n';
import type { BookLinks } from '../../../types/Book';

export interface BookDescription {
  text: string;
  /** Originaltext, wenn `text` eine Übersetzung ist. */
  original?: string;
  source: 'publisher' | 'wikipedia' | 'translated' | 'foreign';
  loading: boolean;
}

/** So lange wartet der Block auf Details und Wikidata, bevor er ohne Text aufgibt (Wikipedia kann später noch nachkommen). */
export const DESCRIPTION_PATIENCE_MS = 6000;

const isAppLanguage = (text: string) => {
  const lang = guessLanguage(text);
  return lang === null ? (text.match(/\p{L}+/gu) ?? []).length < 12 : lang === appLocale;
};

/** Klappentext zuerst (übersetzt, wenn nötig) — Wikipedia nur ohne Klappentext, dort steht selten die Handlung. */
export function useBookDescription(
  bookKey: string | undefined,
  rawDescription: string | undefined,
  detailsLoading: boolean,
  links: BookLinks | null,
  linksLoading: boolean
): BookDescription {
  const [state, setState] = useState<BookDescription>({
    text: '',
    source: 'publisher',
    loading: true,
  });
  const raw = htmlToPlainText(rawDescription ?? '');
  const wikiLang = links?.wikipedia?.lang;
  const wikiTitle = links?.wikipedia?.title;
  const [impatient, setImpatient] = useState(false);
  const waiting = detailsLoading || linksLoading;

  useEffect(() => {
    setImpatient(false);
    if (!waiting) return;
    const timer = setTimeout(() => setImpatient(true), DESCRIPTION_PATIENCE_MS);
    return () => clearTimeout(timer);
  }, [bookKey, waiting]);

  useEffect(() => {
    let alive = true;
    const finish = (next: BookDescription) => {
      if (alive) setState(next);
    };
    const translate = async (foreign: string) => {
      setState({ text: '', source: 'translated', loading: true });
      const translated = bookKey
        ? await translateBookDescription(bookKey, foreign, appLocale)
        : null;
      return translated;
    };

    if (raw && isAppLanguage(raw)) {
      finish({ text: raw, source: 'publisher', loading: false });
      return;
    }

    void (async () => {
      if (raw) {
        const translated = await translate(raw);
        if (translated)
          return finish({ text: translated, original: raw, source: 'translated', loading: false });
        return finish({ text: raw, source: 'foreign', loading: false });
      }
      if (waiting && !impatient) {
        finish({ text: '', source: 'publisher', loading: true });
        return;
      }
      if (wikiLang && wikiTitle) {
        const summary = await fetchWikipediaSummary(wikiLang, wikiTitle);
        if (summary && wikiLang === appLocale) {
          return finish({ text: summary, source: 'wikipedia', loading: false });
        }
        if (summary) {
          const translated = await translate(summary);
          return finish(
            translated
              ? { text: translated, original: summary, source: 'translated', loading: false }
              : { text: summary, source: 'foreign', loading: false }
          );
        }
      }
      finish({ text: '', source: 'publisher', loading: false });
    })();

    return () => {
      alive = false;
    };
  }, [bookKey, raw, waiting, impatient, wikiLang, wikiTitle]);

  return state;
}
