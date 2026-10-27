import { useEffect, useState } from 'react';
import { describeMangaFromCatalog } from '../../../services/catalog/mangaCatalog';
import { appLocale } from '../../../services/i18n';

export interface MangaDescription {
  text: string;
  translated: boolean;
}

/**
 * Beschreibung in der App-Sprache: AniList liefert Englisch, der Katalog übersetzt je Sprache einmal für alle.
 * Bis die Antwort da ist (oder wenn der Manga nicht im Katalog liegt) bleibt es beim Original.
 */
export function useMangaDescription(
  id: number | string | undefined,
  original: string
): MangaDescription {
  const [state, setState] = useState<MangaDescription>({ text: original, translated: false });

  useEffect(() => {
    setState({ text: original, translated: false });
    if (!id || !original || appLocale === 'en') return;
    let alive = true;
    void describeMangaFromCatalog(String(id), appLocale, original).then((own) => {
      if (alive && own.text) setState({ text: own.text, translated: own.translated });
    });
    return () => {
      alive = false;
    };
  }, [id, original]);

  return state;
}
