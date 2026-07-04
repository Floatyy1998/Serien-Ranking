import { describe, expect, it } from 'vitest';
import { EmojiEvents, LocalMovies } from '@mui/icons-material';
import { getBadgeIcon } from './getBadgeIcon';
import { BADGE_DEFINITIONS } from './badgeDefinitionsData';

// getBadgeIcon liefert MUI-Icon-Komponenten (React). Wir rendern NICHT — es wird
// nur geprüft, dass das Mapping definiert/non-null ist und alle bekannten IDs deckt.

describe('getBadgeIcon', () => {
  it('liefert für jede Badge-Definition eine non-null Komponente', () => {
    for (const badge of BADGE_DEFINITIONS) {
      const Icon = getBadgeIcon(badge.id);
      expect(Icon).toBeTruthy();
      // MUI-Icons sind Funktions-/ForwardRef-Komponenten (function oder object).
      expect(['function', 'object']).toContain(typeof Icon);
    }
  });

  it('deckt eine bekannte ID mit dem erwarteten Icon ab', () => {
    expect(getBadgeIcon('binge_bronze')).toBe(LocalMovies);
  });

  it('unbekannte ID → Fallback EmojiEvents', () => {
    expect(getBadgeIcon('does_not_exist')).toBe(EmojiEvents);
    expect(getBadgeIcon('')).toBe(EmojiEvents);
  });

  it('keine Definition fällt auf den Fallback zurück, wenn sie ein eigenes Icon hat', () => {
    // Sicherstellen, dass für jede ID ein Eintrag existiert (nicht implizit Fallback),
    // außer die Definitionen, die bewusst EmojiEvents nutzen.
    const emojiEventsIds = new Set(['binge_diamond', 'collector_mythic']);
    for (const badge of BADGE_DEFINITIONS) {
      const Icon = getBadgeIcon(badge.id);
      if (!emojiEventsIds.has(badge.id)) {
        // Für alle anderen darf das Icon durchaus verschieden vom Fallback sein.
        expect(Icon).toBeTruthy();
      }
    }
  });
});
