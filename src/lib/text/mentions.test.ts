import { describe, expect, it } from 'vitest';
import { mentionTokens, splitMentions } from './mentions';

const targets = [
  { uid: 'u1', name: 'Floatyy' },
  { uid: 'u2', name: 'Brandon Serlez' },
  { uid: 'u3', name: 'Brandon' },
];

describe('splitMentions', () => {
  it('erkennt eine Erwähnung am Anfang', () => {
    expect(splitMentions('@Floatyy ist praktisch', targets)).toEqual([
      { kind: 'mention', text: '@Floatyy', uid: 'u1' },
      { kind: 'text', text: ' ist praktisch' },
    ]);
  });

  it('nimmt den längsten Namen und ignoriert Groß-/Kleinschreibung', () => {
    expect(splitMentions('hi @brandon serlez!', targets)).toEqual([
      { kind: 'text', text: 'hi ' },
      { kind: 'mention', text: '@brandon serlez', uid: 'u2' },
      { kind: 'text', text: '!' },
    ]);
  });

  it('lässt E-Mails und längere Wörter in Ruhe', () => {
    expect(splitMentions('mail@Floatyy und @Floatyyy', targets)).toEqual([
      { kind: 'text', text: 'mail@Floatyy und @Floatyyy' },
    ]);
  });

  it('gibt Text ohne bekannte Namen unverändert zurück', () => {
    expect(splitMentions('@Niemand hallo', [])).toEqual([{ kind: 'text', text: '@Niemand hallo' }]);
  });
});

describe('mentionTokens', () => {
  it('sammelt eindeutige Wörter hinter @ ohne Satzzeichen am Ende', () => {
    expect(mentionTokens('@Flo. schau mal, @Bärbel und @Flo, a@b.de')).toEqual(['Flo', 'Bärbel']);
  });
});
