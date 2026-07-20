/** Englische Übersetzungen: Diskussionen (Fehler + Notifications). */
const dict: Record<string, string> = {
  'Fehler beim Laden der Antworten': 'Failed to load replies',
  '{name} hat auf deine Diskussion "{title}" geantwortet':
    '{name} replied to your discussion "{title}"',
  'Fehler beim Erstellen der Antwort': 'Failed to create reply',
  'Du kannst nur eigene Antworten bearbeiten': 'You can only edit your own replies',
  'Nur der Autor kann die Spoiler-Markierung entfernen':
    'Only the author can remove the spoiler flag',
  'Fehler beim Bearbeiten der Antwort': 'Failed to edit reply',
  'Du kannst nur eigene Antworten löschen': 'You can only delete your own replies',
  'Fehler beim Löschen der Antwort': 'Failed to delete reply',
  '{name} gefällt deine Antwort: "{snippet}"': '{name} likes your reply: "{snippet}"',
  'Fehler beim Laden der Diskussionen': 'Failed to load discussions',
  'Fehler beim Erstellen der Diskussion': 'Failed to create discussion',
  'Du kannst nur eigene Diskussionen bearbeiten': 'You can only edit your own discussions',
  '{name} hat deine Diskussion "{title}" als Spoiler markiert':
    '{name} flagged your discussion "{title}" as a spoiler',
  'Fehler beim Bearbeiten der Diskussion': 'Failed to edit discussion',
  'Du kannst nur eigene Diskussionen löschen': 'You can only delete your own discussions',
  'Fehler beim Löschen der Diskussion': 'Failed to delete discussion',
  '{name} gefällt deine Diskussion "{title}"': '{name} likes your discussion "{title}"',
  'Du musst eingeloggt sein um zu diskutieren': 'You must be logged in to participate',
  'Neue Antwort': 'New reply',
  '{name} hat auch auf "{title}" geantwortet': '{name} also replied to "{title}"',
  'Spoiler-Markierung': 'Spoiler flag',
  '{name} hat deinen Kommentar als Spoiler markiert: "{snippet}"':
    '{name} flagged your comment as a spoiler: "{snippet}"',
  'Neue Reaktion': 'New reaction',
};
export default dict;
