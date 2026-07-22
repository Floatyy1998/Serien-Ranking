/**
 * Text in die Zwischenablage kopieren — feature-detektiert.
 * `navigator.clipboard` fehlt in unsicheren Kontexten und manchen WebViews;
 * dann greift der execCommand-Fallback. Liefert false statt zu werfen.
 */
export const copyTextToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // weiter zum Fallback
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
};
