/** Gesamtwertung der Rangliste + Freundes-Vergleich — Deutsch → Französisch. */

const dict: Record<string, string> = {
  'Alles, was du je gesehen hast — ohne Wertung':
    'Tout ce que tu as déjà regardé — sans classement',
  'Zählt am 1. wieder bei null · Nachgetragene Folgen zählen nicht':
    'Remise à zéro le 1er · Les épisodes rattrapés ne comptent pas',
  'Ein Freund hat noch keine Gesamtdaten — die Zahlen erscheinen nach dem nächsten Öffnen der App.':
    'Un ami n’a pas encore de données globales — les chiffres apparaîtront à sa prochaine ouverture de l’app.',
  '{n} Freunde haben noch keine Gesamtdaten — die Zahlen erscheinen, sobald sie die App wieder öffnen.':
    '{n} amis n’ont pas encore de données globales — les chiffres apparaîtront dès qu’ils rouvriront l’app.',
  'Wie die Rangliste zählt': 'Comment le classement compte',
  'Der Wettbewerb läuft monatlich: Am Monatsersten starten alle wieder bei null, der Vormonat wandert in die Trophäen.':
    'La compétition est mensuelle : le 1er du mois, tout le monde repart de zéro et le mois précédent rejoint les trophées.',
  'Damit niemand die Wertung verfälscht, zählen nachgetragene Folgen nicht mit: Wer in kurzer Zeit viele Folgen auf einmal abhakt, trägt seine Bibliothek nach, statt zu schauen.':
    'Pour que personne ne fausse le classement, les épisodes rattrapés ne comptent pas : cocher beaucoup d’épisodes d’un coup, c’est compléter sa bibliothèque, pas regarder.',
  'Die Gesamtwertung zeigt alles, was du je gesehen hast — inklusive nachgetragener Folgen und Rewatches. Deshalb passt sie zu deiner Statistik-Seite, vergibt aber bewusst keine Trophäen.':
    'Le classement global montre tout ce que tu as déjà regardé — y compris les épisodes rattrapés et les revisionnages. Il correspond donc à ta page de statistiques, mais n’attribue volontairement aucun trophée.',
  'Gesamt ansehen': 'Voir le total',
  'Die Gesamtwertung gibt es nur unter Freunden': 'Le classement global n’existe qu’entre amis',
  Gesamt: 'Total',
  T: 'j',
  J: 'a',
  'davon {n} komplett': 'dont {n} terminées',
  'Vergleich wird geladen …': 'Chargement de la comparaison …',
  'Von {name} gibt es noch keine Gesamtzahlen.':
    'Il n’y a pas encore de chiffres globaux pour {name}.',
  'Ihr im Vergleich': 'Vous deux en comparaison',
  'Zur Gesamt-Rangliste': 'Vers le classement global',
  'Platz {rank} von {of} unter deinen Freunden': 'Place {rank} sur {of} parmi tes amis',
  '{gap} Vorsprung': '{gap} d’avance',
  'Du führst': 'Tu es en tête',
  '{gap} hinter {name}': '{gap} derrière {name}',
  'Dein Stand': 'Ta position',
  'von {n}': 'sur {n}',
  Spitzenreiter: 'En tête',
  'Platz {n}': 'Place {n}',
  Vorsprung: 'Avance',
};

export default dict;
