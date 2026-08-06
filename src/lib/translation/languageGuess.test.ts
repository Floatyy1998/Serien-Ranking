import { describe, expect, it } from 'vitest';
import { shouldOfferTranslation } from './languageGuess';

describe('shouldOfferTranslation', () => {
  it('bietet bei deutschem Text für deutsche Leser nichts an', () => {
    expect(
      shouldOfferTranslation('Die Folge war richtig gut, ich freue mich auf mehr!', 'de')
    ).toBe(false);
    expect(shouldOfferTranslation('Krasse Folge', 'de')).toBe(false);
  });

  it('bietet bei englischem Text für englische Leser nichts an', () => {
    expect(shouldOfferTranslation('This episode was amazing, best season so far', 'en')).toBe(
      false
    );
  });

  it('bietet bei spanischem Text für spanische Leser nichts an', () => {
    expect(shouldOfferTranslation('Este episodio fue increíble, la mejor temporada', 'es')).toBe(
      false
    );
    expect(shouldOfferTranslation('¡Qué buena película!', 'es')).toBe(false);
  });

  it('bietet bei französischem Text für französische Leser nichts an', () => {
    expect(shouldOfferTranslation('Cet épisode était génial, la meilleure saison', 'fr')).toBe(
      false
    );
    expect(shouldOfferTranslation('Je ne sais pas quoi dire', 'fr')).toBe(false);
  });

  it('bietet bei fremdsprachigem Text eine Übersetzung an', () => {
    expect(
      shouldOfferTranslation('e un bug la mystery box in care imi arata ca sunt pe minus', 'de')
    ).toBe(true);
    expect(shouldOfferTranslation('This episode was amazing, best season so far', 'de')).toBe(true);
    expect(shouldOfferTranslation('Die Folge war richtig gut, ich freue mich!', 'en')).toBe(true);
    expect(shouldOfferTranslation('Die Folge war richtig gut, ich freue mich!', 'es')).toBe(true);
    expect(shouldOfferTranslation('This episode was amazing, best season so far', 'fr')).toBe(true);
    expect(shouldOfferTranslation('Cet épisode était génial, la meilleure saison', 'es')).toBe(
      true
    );
  });

  it('wertet nur SPRACHFREMDE Sonderzeichen als Signal', () => {
    // ñ ist für spanische Leser normal, für deutsche ein Fremdsprachen-Hinweis
    expect(shouldOfferTranslation('mañana 🙂', 'es')).toBe(false);
    expect(shouldOfferTranslation('mañana 🙂', 'de')).toBe(true);
    // Umlaute umgekehrt
    expect(shouldOfferTranslation('schön 🙂', 'de')).toBe(false);
    expect(shouldOfferTranslation('schön 🙂', 'es')).toBe(true);
  });

  it('erkennt nicht-lateinische Schrift auch bei kurzen Texten', () => {
    expect(shouldOfferTranslation('बहुत अच्छा शो है', 'de')).toBe(true);
    expect(shouldOfferTranslation('面白かった！', 'en')).toBe(true);
    expect(shouldOfferTranslation('面白かった！', 'fr')).toBe(true);
  });

  it('erkennt fremde Diakritika bei kurzen Texten', () => {
    expect(shouldOfferTranslation('mulțumesc 🙂', 'de')).toBe(true);
  });

  it('ignoriert zu kurze/leere Texte und URLs', () => {
    expect(shouldOfferTranslation('', 'de')).toBe(false);
    expect(shouldOfferTranslation('ok', 'de')).toBe(false);
    expect(shouldOfferTranslation('https://example.com/bild.png', 'de')).toBe(false);
  });

  it('unbekannte Zielsprache ergibt false', () => {
    expect(shouldOfferTranslation('whatever text here', 'it')).toBe(false);
  });
});
