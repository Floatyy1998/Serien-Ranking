/**
 * Was kann man auf welcher Seite tun? Reine Datentabelle — beim ersten Besuch
 * einer Seite zeigt `PageTourHost` den passenden Eintrag einmalig an.
 *
 * Eine neue Seite braucht nur einen weiteren Eintrag hier. Ändern sich die
 * Aktionen einer Seite, `version` hochzählen: dann sehen auch Bestandsnutzer
 * die Hilfe noch einmal.
 */

import type { PageTour } from '../../../lib/pageTour';

export const PAGE_TOURS: readonly PageTour[] = [
  {
    path: '/',
    version: 1,
    title: 'Startseite',
    intro: 'Dein Einstieg in alles, was gerade läuft.',
    actions: [
      {
        icon: 'play',
        title: 'Weiterschauen',
        text: 'Die oberste Reihe bringt dich mit einem Fingertipp zur nächsten offenen Folge.',
      },
      {
        icon: 'streak',
        title: 'Streak halten',
        text: 'Deine Streak wächst an jedem Tag, an dem du mindestens eine Folge abhakst.',
      },
      {
        icon: 'bell',
        title: 'Benachrichtigungen',
        text: 'Die Glocke sammelt neue Folgen, Anbieterwechsel und Anfragen von Freunden.',
      },
      {
        icon: 'tune',
        title: 'Startseite umbauen',
        text: 'Unter Einstellungen und Homepage Layout sortierst du die Abschnitte um oder blendest sie aus.',
      },
    ],
  },
  {
    path: '/watchlist',
    version: 1,
    title: 'Weiterschauen',
    intro: 'Alle Serien mit einer offenen Folge, in der Reihenfolge, die du willst.',
    actions: [
      {
        icon: 'check',
        title: 'Folge abhaken',
        text: 'Tippe eine Karte an, um die nächste Folge als gesehen zu markieren.',
      },
      {
        icon: 'swipe',
        title: 'Wischen',
        text: 'Wisch eine Karte zur Seite, um sie ohne Umweg abzuhaken.',
      },
      {
        icon: 'filter',
        title: 'Nach Anbieter filtern',
        text: 'Über Filter schränkst du auf einzelne Streaming-Dienste ein oder blendest alles außerhalb deiner Abos aus.',
      },
      {
        icon: 'sort',
        title: 'Reihenfolge',
        text: 'Sortiere nach Datum, Name oder Fortschritt, oder stell dir eine eigene Reihenfolge zusammen.',
      },
    ],
  },
  {
    path: '/calendar',
    version: 1,
    title: 'Kalender',
    intro: 'Wann welche Folge läuft, Woche für Woche.',
    actions: [
      {
        icon: 'calendar',
        title: 'Woche wechseln',
        text: 'Blättere zwischen den Wochen und tippe einen Tag an, um seine Folgen zu sehen.',
      },
      {
        icon: 'check',
        title: 'Direkt abhaken',
        text: 'Folgen lassen sich aus dem Kalender heraus als gesehen markieren.',
      },
      {
        icon: 'filter',
        title: 'Nur Watchlist',
        text: 'Der Filter reduziert den Kalender auf die Serien, die du dir gemerkt hast.',
      },
      {
        icon: 'explore',
        title: 'Weitere Kalender',
        text: 'Über die Kopfzeile kommst du zum Serien-, Film- und Anime-Season-Kalender.',
      },
    ],
  },
  {
    path: '/ratings',
    version: 1,
    title: 'Meine Bewertungen',
    intro: 'Alles, was du bewertet hast, und alles, was noch fehlt.',
    actions: [
      {
        icon: 'star',
        title: 'Bewerten',
        text: 'Tippe einen Titel an, um deine Wertung zu setzen oder zu ändern.',
      },
      {
        icon: 'view',
        title: 'Ansicht wechseln',
        text: 'Zwischen der cinematischen Ansicht und der kompakten Liste umschalten.',
      },
      {
        icon: 'filter',
        title: 'Filtern',
        text: 'Serien, Filme, Watchlist oder alles noch Unbewertete getrennt anzeigen.',
      },
      {
        icon: 'search',
        title: 'Eigene Liste durchsuchen',
        text: 'Das Suchfeld findet einen Titel in deinem eigenen Bestand.',
      },
    ],
  },
  {
    path: '/search',
    version: 1,
    title: 'Suche',
    intro: 'Der Weg zu allem, was noch nicht in deiner Liste steht.',
    actions: [
      {
        icon: 'search',
        title: 'Suchen',
        text: 'Serien und Filme im gesamten Katalog finden.',
      },
      {
        icon: 'add',
        title: 'Zur Liste hinzufügen',
        text: 'Der Knopf auf dem Poster legt einen Titel direkt in deine Liste.',
      },
      {
        icon: 'filter',
        title: 'Nur meine Abos',
        text: 'Blendet aus, was du auf deinen aktiven Streaming-Diensten nicht sehen kannst.',
      },
      {
        icon: 'history',
        title: 'Zuletzt gesucht',
        text: 'Frühere Suchbegriffe stehen unter dem Feld bereit.',
      },
    ],
  },
  {
    path: '/discover',
    version: 1,
    title: 'Entdecken',
    intro: 'Vorschläge, die zu dem passen, was du schon geschaut hast.',
    actions: [
      {
        icon: 'explore',
        title: 'Für dich',
        text: 'Empfehlungen auf Basis der Titel, die schon in deiner Liste liegen.',
      },
      {
        icon: 'filter',
        title: 'Nach Genre filtern',
        text: 'Die Genre-Leiste grenzt die Vorschläge ein.',
      },
      {
        icon: 'play',
        title: 'Nur was ich streamen kann',
        text: 'Zeigt ausschließlich Titel auf deinen aktiven Abos.',
      },
      {
        icon: 'add',
        title: 'Direkt übernehmen',
        text: 'Aus jeder Karte heraus landet ein Titel in deiner Liste.',
      },
    ],
  },
  {
    path: '/stats',
    version: 1,
    title: 'Statistiken',
    intro: 'Dein Viewing-Universum in Zahlen.',
    actions: [
      {
        icon: 'stats',
        title: 'Deine Zahlen',
        text: 'Watchtime, gesehene Episoden und abgeschlossene Serien auf einen Blick.',
      },
      {
        icon: 'explore',
        title: 'Top-Genres und Anbieter',
        text: 'Zeigt, worauf deine Watchtime wirklich entfällt.',
      },
      {
        icon: 'share',
        title: 'Als Bild teilen',
        text: 'Die Statistiken lassen sich als fertige Grafik weitergeben.',
      },
      {
        icon: 'people',
        title: 'Actor Universe',
        text: 'Verfolge, über welche Schauspieler deine Serien zusammenhängen.',
      },
    ],
  },
  {
    path: '/series/:id',
    version: 1,
    title: 'Seriendetails',
    intro: 'Staffeln, Fortschritt und alles, was du zur Serie tun kannst.',
    actions: [
      {
        icon: 'bookmark',
        title: 'Auf die Watchlist',
        text: 'Nur Serien auf der Watchlist erscheinen unter Weiterschauen. Beim ersten Abhaken landet eine Serie automatisch dort.',
      },
      {
        icon: 'check',
        title: 'Folgen abhaken',
        text: 'Einzelne Folgen antippen oder über Alle verwalten eine ganze Staffel setzen.',
      },
      {
        icon: 'star',
        title: 'Bewerten',
        text: 'Die Serie und jede einzelne Folge lassen sich bewerten.',
      },
      {
        icon: 'replay',
        title: 'Rewatch',
        text: 'Starte einen Durchlauf von vorn, ohne deine bisherige Historie zu verlieren.',
      },
      {
        icon: 'people',
        title: 'Freunde vergleichen',
        text: 'Der Freunde-Bereich zeigt, wie weit die anderen in dieser Serie sind.',
      },
    ],
  },
  {
    path: '/movie/:id',
    version: 1,
    title: 'Filmdetails',
    intro: 'Alles zum Film und was du damit machen kannst.',
    actions: [
      {
        icon: 'check',
        title: 'Als gesehen markieren',
        text: 'Einmal antippen, und der Film wandert in deine Historie.',
      },
      {
        icon: 'star',
        title: 'Bewerten',
        text: 'Deine Wertung fließt in Statistiken und Empfehlungen ein.',
      },
      {
        icon: 'people',
        title: 'Besetzung',
        text: 'Von der Besetzung aus springst du zu anderen Titeln derselben Person.',
      },
      {
        icon: 'add',
        title: 'Reihen',
        text: 'Gehört der Film zu einer Reihe, siehst du hier die fehlenden Teile.',
      },
    ],
  },

  {
    path: '/profile',
    version: 1,
    title: 'Profil',
    intro: 'Dein Konto, deine Zahlen und der Weg in alle Nebenbereiche.',
    actions: [
      {
        icon: 'stats',
        title: 'Deine Eckdaten',
        text: 'Watchtime, Episoden, Filme und Manga in der Übersicht.',
      },
      {
        icon: 'explore',
        title: 'Alles Weitere',
        text: 'Die Kacheln führen zu Badges, Pets, Rangliste, Verlauf und allem Weiteren.',
      },
      {
        icon: 'tune',
        title: 'Einstellungen',
        text: 'Von hier geht es zu Konto, Design, Sprache und Benachrichtigungen.',
      },
    ],
  },
  {
    path: '/activity',
    version: 1,
    title: 'Aktivität',
    intro: 'Was deine Freunde gerade schauen, und wer noch dazukommen will.',
    actions: [
      {
        icon: 'people',
        title: 'Feed und Freunde',
        text: 'Zwei Reiter: der Aktivitäts-Feed und deine Freundesliste.',
      },
      {
        icon: 'add',
        title: 'Anfragen',
        text: 'Offene Freundschaftsanfragen annehmen oder ablehnen.',
      },
      {
        icon: 'explore',
        title: 'Diskussionen und Chats',
        text: 'Von hier kommst du in den Diskussions-Feed und zu deinen Chats.',
      },
    ],
  },
  {
    path: '/badges',
    version: 1,
    title: 'Badges',
    intro: 'Alles, was du dir schon verdient hast, und was noch fehlt.',
    actions: [
      {
        icon: 'star',
        title: 'Fortschritt lesen',
        text: 'Jedes Badge zeigt, wie viele Schritte bis zur Freischaltung fehlen.',
      },
      {
        icon: 'filter',
        title: 'Nach Seltenheit filtern',
        text: 'Von Gewöhnlich bis Legendär getrennt durchsehen.',
      },
      {
        icon: 'check',
        title: 'Prüfen',
        text: 'Der Prüfen-Knopf rechnet deine Badges sofort neu durch.',
      },
    ],
  },
  {
    path: '/pets',
    version: 1,
    title: 'Pets',
    intro: 'Deine Begleiter wachsen mit jeder Folge, die du schaust.',
    actions: [
      {
        icon: 'play',
        title: 'Füttern und pflegen',
        text: 'Ein gesundes Pet bringt dir mehr XP pro Episode.',
      },
      {
        icon: 'star',
        title: 'Aussehen ändern',
        text: 'Farben, Hintergründe und Accessoires lassen sich frei kombinieren.',
      },
      {
        icon: 'add',
        title: 'Mehrere Pets',
        text: 'Du kannst weitere Pets erschaffen und zwischen ihnen wechseln.',
      },
    ],
  },
  {
    path: '/leaderboard',
    version: 1,
    title: 'Rangliste',
    intro: 'Wie du im Vergleich zu anderen dastehst.',
    actions: [
      {
        icon: 'filter',
        title: 'Zeitraum wählen',
        text: 'Diesen Monat oder aller Zeiten, je nachdem was dich interessiert.',
      },
      {
        icon: 'people',
        title: 'Freunde oder alle',
        text: 'Wechsle zwischen deinem Freundeskreis und allen Nutzern.',
      },
      {
        icon: 'stats',
        title: 'Wertung verstehen',
        text: 'Gezählt werden Episoden, Filme und die Watchtime, die dabei zusammenkommt.',
      },
    ],
  },
  {
    path: '/catch-up',
    version: 1,
    title: 'Backlog',
    intro: 'Die Serien, bei denen du am weitesten hinterherhinkst.',
    actions: [
      {
        icon: 'stats',
        title: 'Rückstand sehen',
        text: 'Je Serie stehen offene Episoden und der Fortschritt nebeneinander.',
      },
      {
        icon: 'sort',
        title: 'Sortieren',
        text: 'Nach Episoden, Fortschritt, verbleibender Zeit oder zuletzt geschaut.',
      },
      {
        icon: 'check',
        title: 'Aufholen',
        text: 'Aus jeder Karte heraus geht es direkt in die Serie zum Abhaken.',
      },
    ],
  },
  {
    path: '/countdowns',
    version: 1,
    title: 'Countdowns',
    intro: 'Was von deinen Serien als Nächstes zurückkommt.',
    actions: [
      {
        icon: 'calendar',
        title: 'Kommende Staffeln',
        text: 'Jede angekündigte Rückkehr mit Countdown bis zum Starttag.',
      },
      {
        icon: 'explore',
        title: 'Details öffnen',
        text: 'Eine Karte antippen führt direkt zur Serie.',
      },
      {
        icon: 'bookmark',
        title: 'Woher das kommt',
        text: 'Gelistet werden angekündigte Staffeln der Serien in deiner Liste.',
      },
    ],
  },
  {
    path: '/subscriptions',
    version: 1,
    title: 'Streaming-Abos',
    intro: 'Womit du streamst, bestimmt viele Filter in der App.',
    actions: [
      {
        icon: 'check',
        title: 'Abos markieren',
        text: 'Tippe die Dienste an, die du tatsächlich abonniert hast.',
      },
      {
        icon: 'filter',
        title: 'Was das bewirkt',
        text: 'Erst damit funktionieren die Filter „Nur meine Abos" in Suche, Entdecken und Weiterschauen.',
      },
      {
        icon: 'bell',
        title: 'Anbieterwechsel',
        text: 'Verlässt eine deiner Serien einen Dienst, bekommst du eine Meldung.',
      },
    ],
  },
  {
    path: '/recently-watched',
    version: 1,
    title: 'Verlauf',
    intro: 'Was du zuletzt gesehen hast, chronologisch.',
    actions: [
      {
        icon: 'history',
        title: 'Zeitraum wählen',
        text: 'Die letzten Tage oder Wochen getrennt durchsehen.',
      },
      {
        icon: 'search',
        title: 'Serie suchen',
        text: 'Das Suchfeld grenzt den Verlauf auf eine einzelne Serie ein.',
      },
      {
        icon: 'replay',
        title: 'Erneut ansehen',
        text: 'Eine Folge lässt sich von hier aus direkt noch einmal abhaken.',
      },
    ],
  },
  {
    path: '/hidden-series',
    version: 1,
    title: 'Ausgeblendete Serien',
    intro: 'Alles, was du aus deinen Listen genommen hast.',
    actions: [
      {
        icon: 'bookmark',
        title: 'Was hier landet',
        text: 'Ausgeblendete Serien verschwinden aus Weiterschauen, Kalender und Statistiken.',
      },
      {
        icon: 'replay',
        title: 'Zurückholen',
        text: 'Ein Tippen auf Weiter macht eine Serie wieder überall sichtbar.',
      },
      {
        icon: 'stats',
        title: 'Nichts geht verloren',
        text: 'Dein Fortschritt bleibt beim Ausblenden vollständig erhalten.',
      },
    ],
  },
  {
    path: '/watch-journey',
    version: 1,
    title: 'Watch Journey',
    intro: 'Deine Sehgewohnheiten über die Jahre.',
    actions: [
      {
        icon: 'stats',
        title: 'Aktivität pro Jahr',
        text: 'Zeigt, wann du besonders viel und wann du kaum geschaut hast.',
      },
      {
        icon: 'explore',
        title: 'Binge-Statistiken',
        text: 'Wie oft du Sessions am Stück durchgezogen hast, samt Rekorden.',
      },
      {
        icon: 'filter',
        title: 'Nach Genre eingrenzen',
        text: 'Die Auswertung lässt sich auf einzelne Genres beschränken.',
      },
    ],
  },
  {
    path: '/wrapped',
    version: 1,
    title: 'Jahresrückblick',
    intro: 'Dein Serienjahr als Abfolge von Karten.',
    actions: [
      {
        icon: 'swipe',
        title: 'Wischen',
        text: 'Nach links und rechts wischen blättert durch die Karten.',
      },
      {
        icon: 'stats',
        title: 'Was drinsteht',
        text: 'Watchtime, Top-Serien, Lieblingsgenres und deine Rekorde des Jahres.',
      },
      {
        icon: 'share',
        title: 'Weitergeben',
        text: 'Einzelne Karten lassen sich als Bild teilen.',
      },
    ],
  },
  {
    path: '/wrapped/:year',
    version: 1,
    title: 'Jahresrückblick',
    intro: 'Dein Serienjahr als Abfolge von Karten.',
    actions: [
      {
        icon: 'swipe',
        title: 'Wischen',
        text: 'Nach links und rechts wischen blättert durch die Karten.',
      },
      {
        icon: 'stats',
        title: 'Was drinsteht',
        text: 'Watchtime, Top-Serien, Lieblingsgenres und deine Rekorde des Jahres.',
      },
      {
        icon: 'share',
        title: 'Weitergeben',
        text: 'Einzelne Karten lassen sich als Bild teilen.',
      },
    ],
  },
  {
    path: '/actor-universe',
    version: 1,
    title: 'Actor Universe',
    intro: 'Die Schauspieler, die deine Serien miteinander verbinden.',
    actions: [
      {
        icon: 'people',
        title: 'Verbindungen lesen',
        text: 'Linien zeigen, welche Schauspieler in mehreren deiner Serien mitspielen.',
      },
      {
        icon: 'swipe',
        title: 'Bewegen und zoomen',
        text: 'Ziehen verschiebt die Karte, Ansicht zurücksetzen bringt sie zurück.',
      },
      {
        icon: 'explore',
        title: 'Personen öffnen',
        text: 'Ein Tippen auf einen Namen öffnet dessen Serien und Filme.',
      },
    ],
  },
  {
    path: '/taste-profile',
    version: 1,
    title: 'Geschmacksprofil',
    intro: 'Empfehlungen aus deinen Bewertungen und Sehmustern.',
    actions: [
      {
        icon: 'star',
        title: 'Empfehlungen erzeugen',
        text: 'Der Knopf lässt frische Vorschläge für dich berechnen.',
      },
      {
        icon: 'add',
        title: 'Übernehmen',
        text: 'Was passt, wandert direkt in deine Liste.',
      },
      {
        icon: 'stats',
        title: 'Wird mit der Zeit besser',
        text: 'Je mehr du bewertest, desto genauer werden die Vorschläge.',
      },
    ],
  },
  {
    path: '/taste-match/:friendId',
    version: 1,
    title: 'Geschmacks-Match',
    intro: 'Wie weit dein Geschmack und der deines Freundes auseinanderliegen.',
    actions: [
      {
        icon: 'people',
        title: 'Übereinstimmung',
        text: 'Ein Wert fasst zusammen, wie ähnlich ihr bewertet.',
      },
      {
        icon: 'explore',
        title: 'Gemeinsamkeiten',
        text: 'Gemeinsame Serien, Filme und Genres stehen einzeln aufgelistet.',
      },
      {
        icon: 'star',
        title: 'Perfekte Treffer',
        text: 'Titel, die ihr beide gleich stark mögt, werden hervorgehoben.',
      },
    ],
  },
  {
    path: '/friend/:id',
    version: 1,
    title: 'Freundesprofil',
    intro: 'Was dein Freund schaut und wie weit ihr auseinander seid.',
    actions: [
      {
        icon: 'stats',
        title: 'Vorsprung sehen',
        text: 'Bei gemeinsamen Serien steht, wer wie viele Folgen voraus ist.',
      },
      {
        icon: 'people',
        title: 'Geschmack vergleichen',
        text: 'Von hier kommst du direkt ins Geschmacks-Match.',
      },
      {
        icon: 'explore',
        title: 'Pet und Badges',
        text: 'Auch Pet, Streak und freigeschaltete Badges sind sichtbar.',
      },
    ],
  },
  {
    path: '/profile/:id',
    version: 1,
    title: 'Öffentliches Profil',
    intro: 'Die Ansicht, die andere über deinen Link sehen.',
    actions: [
      {
        icon: 'star',
        title: 'Bewertungen',
        text: 'Gezeigt werden die bewerteten Serien und Filme, nicht dein ganzer Bestand.',
      },
      {
        icon: 'filter',
        title: 'Filtern',
        text: 'Serien und Filme lassen sich getrennt durchsehen.',
      },
      {
        icon: 'bookmark',
        title: 'Sichtbarkeit',
        text: 'Ob es diese Seite überhaupt gibt, entscheidest du in den Einstellungen.',
      },
    ],
  },
  {
    path: '/chats',
    version: 1,
    title: 'Chats',
    intro: 'Direkte Unterhaltungen mit deinen Freunden.',
    actions: [
      {
        icon: 'people',
        title: 'Unterhaltung öffnen',
        text: 'Chats gibt es nur mit Leuten, mit denen du befreundet bist.',
      },
      {
        icon: 'star',
        title: 'Aussehen',
        text: 'Chat-Design und Hintergrund lassen sich je Unterhaltung ändern.',
      },
      {
        icon: 'filter',
        title: 'Blockieren und löschen',
        text: 'Eine Unterhaltung lässt sich stummschalten, blockieren oder ganz entfernen.',
      },
    ],
  },
  {
    path: '/chat/:friendId',
    version: 1,
    title: 'Chat',
    intro: 'Schreiben, ohne die nächste Folge zu verraten.',
    actions: [
      {
        icon: 'bookmark',
        title: 'Als Spoiler senden',
        text: 'Verdeckt die Nachricht, bis dein Gegenüber sie bewusst aufdeckt.',
      },
      {
        icon: 'add',
        title: 'Bilder',
        text: 'Bilder bis 8 MB lassen sich mit Bildunterschrift schicken.',
      },
      {
        icon: 'star',
        title: 'Hintergrund',
        text: 'Über das Chat-Design änderst du Farbe und Hintergrund der Unterhaltung.',
      },
    ],
  },
  {
    path: '/discussions',
    version: 1,
    title: 'Diskussions-Feed',
    intro: 'Alle Gespräche zu Serien, Filmen und Folgen an einem Ort.',
    actions: [
      {
        icon: 'filter',
        title: 'Bereich wählen',
        text: 'Getrennt nach Serien, Filmen und einzelnen Episoden.',
      },
      {
        icon: 'people',
        title: 'Mitreden',
        text: 'Ein Beitrag führt dich zur Diskussion, wo du antworten kannst.',
      },
      {
        icon: 'bookmark',
        title: 'Spoilerschutz',
        text: 'Beiträge zu Folgen, die du noch nicht gesehen hast, bleiben verdeckt.',
      },
    ],
  },
  {
    path: '/episodes/:id',
    version: 1,
    title: 'Episoden verwalten',
    intro: 'Der schnelle Weg, viele Folgen auf einmal zu setzen.',
    actions: [
      {
        icon: 'check',
        title: 'Sammelaktionen',
        text: 'Ganze Staffeln als gesehen oder wieder als ungesehen markieren.',
      },
      {
        icon: 'replay',
        title: 'Zähler ändern',
        text: 'Plus und Minus setzen, wie oft du eine Folge gesehen hast.',
      },
      {
        icon: 'people',
        title: 'Diskussionen',
        text: 'Zu jeder Folge kommst du von hier in ihre Diskussion.',
      },
    ],
  },
  {
    path: '/episode/:seriesId/s/:seasonNumber/e/:episodeNumber',
    version: 1,
    title: 'Folgen-Diskussion',
    intro: 'Das Gespräch zu genau dieser Folge.',
    actions: [
      {
        icon: 'people',
        title: 'Schreiben und antworten',
        text: 'Beiträge verfassen und auf die Beiträge anderer antworten.',
      },
      {
        icon: 'bookmark',
        title: 'Spoilerschutz',
        text: 'Wer die Folge noch nicht gesehen hat, sieht den Inhalt erst nach dem Aufdecken.',
      },
      {
        icon: 'star',
        title: 'Folge bewerten',
        text: 'Die Bewertung dieser Folge lässt sich hier direkt setzen.',
      },
    ],
  },
  {
    path: '/rating/:type/:id',
    version: 1,
    title: 'Bewertung bearbeiten',
    intro: 'Deine Wertung, aufgeschlüsselt nach Genres.',
    actions: [
      {
        icon: 'star',
        title: 'Je Genre bewerten',
        text: 'Jedes Genre bekommt einen eigenen Wert, daraus entsteht die Gesamtnote.',
      },
      {
        icon: 'check',
        title: 'Speichern',
        text: 'Erst mit Speichern landet die Änderung in deiner Liste.',
      },
      {
        icon: 'filter',
        title: 'Löschen',
        text: 'Eine Bewertung lässt sich vollständig zurücknehmen.',
      },
    ],
  },
  {
    path: '/serien-kalender',
    version: 1,
    title: 'Serien-Kalender',
    intro: 'Neue Serien und Staffelstarts, unabhängig von deiner Liste.',
    actions: [
      {
        icon: 'calendar',
        title: 'Premieren sehen',
        text: 'Kommende Starts mit Countdown bis zum ersten Tag.',
      },
      {
        icon: 'filter',
        title: 'Nach Genre filtern',
        text: 'Die Genre-Suche grenzt die Premieren ein.',
      },
      {
        icon: 'add',
        title: 'Direkt übernehmen',
        text: 'Was dich interessiert, landet mit einem Fingertipp in deiner Liste.',
      },
    ],
  },
  {
    path: '/film-kalender',
    version: 1,
    title: 'Film-Kalender',
    intro: 'Kinostarts und Streaming-Releases in deiner Region.',
    actions: [
      {
        icon: 'filter',
        title: 'Kino oder Streaming',
        text: 'Zwischen Kinostarts und digitalen Releases umschalten.',
      },
      {
        icon: 'calendar',
        title: 'Nach Datum',
        text: 'Die Liste läuft chronologisch, der heutige Tag ist markiert.',
      },
      {
        icon: 'add',
        title: 'Vormerken',
        text: 'Ein Film lässt sich von hier direkt in deine Liste legen.',
      },
    ],
  },
  {
    path: '/anime-season',
    version: 1,
    title: 'Anime-Season',
    intro: 'Die laufende und die kommende Anime-Saison im Überblick.',
    actions: [
      {
        icon: 'filter',
        title: 'Nach Studio filtern',
        text: 'Die Saison lässt sich auf einzelne Studios eingrenzen.',
      },
      {
        icon: 'calendar',
        title: 'Status sehen',
        text: 'Fortlaufend, beendet oder noch nicht gestartet, jeweils mit Countdown.',
      },
      {
        icon: 'add',
        title: 'Übernehmen',
        text: 'Ein Titel wandert mit einem Fingertipp in deine Serienliste.',
      },
    ],
  },
  {
    path: '/settings',
    version: 1,
    title: 'Einstellungen',
    intro: 'Konto, Aussehen, Benachrichtigungen und deine Daten.',
    actions: [
      {
        icon: 'bell',
        title: 'Benachrichtigungen',
        text: 'Push ein- und ausschalten und einstellen, worüber du informiert wirst.',
      },
      {
        icon: 'star',
        title: 'Aussehen und Sprache',
        text: 'Design, Anzeigegröße, Startseiten-Layout und Sprache liegen hier.',
      },
      {
        icon: 'share',
        title: 'Import und Export',
        text: 'Deine Watch-History als JSON sichern oder als CSV weitergeben.',
      },
    ],
  },
  {
    path: '/theme',
    version: 1,
    title: 'Design',
    intro: 'Die ganze App nimmt deine Farben an.',
    actions: [
      {
        icon: 'star',
        title: 'Farben setzen',
        text: 'Haupt-, Akzent- und Hintergrundfarbe lassen sich einzeln wählen.',
      },
      {
        icon: 'explore',
        title: 'Vorlagen',
        text: 'Fertige Kombinationen als Startpunkt, danach frei anpassbar.',
      },
      {
        icon: 'replay',
        title: 'Zurücksetzen',
        text: 'Alle Farben auf Standard bringt dich jederzeit zurück.',
      },
    ],
  },
  {
    path: '/home-layout',
    version: 1,
    title: 'Startseiten-Layout',
    intro: 'Die Vorschau ist der Editor.',
    actions: [
      {
        icon: 'swipe',
        title: 'Reihenfolge ändern',
        text: 'Halten und ziehen verschiebt einen Abschnitt.',
      },
      {
        icon: 'filter',
        title: 'Ausblenden',
        text: 'Das Auge blendet einen Abschnitt aus, ohne ihn zu verlieren.',
      },
      {
        icon: 'tune',
        title: 'Navigation belegen',
        text: 'Auch die vier freien Plätze der unteren Leiste stellst du hier ein.',
      },
    ],
  },
  {
    path: '/bug-report',
    version: 1,
    title: 'Feedback und Bugs',
    intro: 'Der direkte Draht, wenn etwas klemmt oder fehlt.',
    actions: [
      {
        icon: 'add',
        title: 'Ticket erstellen',
        text: 'Fehler melden oder ein Feature vorschlagen.',
      },
      {
        icon: 'history',
        title: 'Deine Tickets',
        text: 'Offene und archivierte Meldungen stehen getrennt.',
      },
      {
        icon: 'bell',
        title: 'Rückmeldung',
        text: 'Sobald jemand reagiert, siehst du es an deinem Ticket.',
      },
    ],
  },

  {
    path: '/manga',
    version: 1,
    title: 'Manga-Sammlung',
    intro: 'Der Einstieg in alles rund um Manga, Manhwa und Manhua.',
    actions: [
      {
        icon: 'search',
        title: 'Suchen und hinzufügen',
        text: 'Neue Titel findest du über die Manga-Suche.',
      },
      {
        icon: 'filter',
        title: 'Sammlung filtern',
        text: 'Am Lesen, Geplant, Abgeschlossen oder Abgebrochen getrennt anzeigen.',
      },
      {
        icon: 'explore',
        title: 'Bereiche',
        text: 'Leseliste, Bewertungen, Entdecken, Statistiken und Journey erreichst du von hier.',
      },
    ],
  },
  {
    path: '/manga/reading-list',
    version: 1,
    title: 'Leseliste',
    intro: 'Was gerade offen ist, in deiner Reihenfolge.',
    actions: [
      {
        icon: 'check',
        title: 'Kapitel setzen',
        text: 'Ein Kapitel weiter oder zurück, direkt auf der Karte.',
      },
      {
        icon: 'sort',
        title: 'Sortieren',
        text: 'Nach Fortschritt, Bewertung oder Titel ordnen.',
      },
      {
        icon: 'bookmark',
        title: 'Was hier landet',
        text: 'Nur Titel mit Status Lese ich oder Geplant erscheinen in der Leseliste.',
      },
    ],
  },
  {
    path: '/manga/search',
    version: 1,
    title: 'Manga-Suche',
    intro: 'Der Weg zu allem, was noch nicht in deiner Sammlung ist.',
    actions: [
      {
        icon: 'search',
        title: 'Suchen',
        text: 'Manga, Manhwa und Manhua über den gesamten Bestand finden.',
      },
      {
        icon: 'add',
        title: 'Übernehmen',
        text: 'Ein Titel landet mit einem Fingertipp in deiner Sammlung.',
      },
      {
        icon: 'bookmark',
        title: 'Status setzen',
        text: 'Beim Hinzufügen legst du fest, ob du liest, planst oder schon durch bist.',
      },
    ],
  },
  {
    path: '/manga/ratings',
    version: 1,
    title: 'Manga-Bewertungen',
    intro: 'Alles, was du bewertet hast, und was noch offen ist.',
    actions: [
      {
        icon: 'star',
        title: 'Bewerten',
        text: 'Tippe einen Titel an, um deine Wertung zu setzen oder zu ändern.',
      },
      {
        icon: 'sort',
        title: 'Sortieren',
        text: 'Nach Bewertung auf- oder absteigend ordnen.',
      },
      {
        icon: 'filter',
        title: 'Unbewertetes finden',
        text: 'Der Filter zeigt, wo noch eine Wertung fehlt.',
      },
    ],
  },
  {
    path: '/manga/discover',
    version: 1,
    title: 'Manga entdecken',
    intro: 'Vorschläge und beliebte Titel, die zu dir passen.',
    actions: [
      {
        icon: 'explore',
        title: 'Für dich',
        text: 'Empfehlungen auf Basis deiner Sammlung und Bewertungen.',
      },
      {
        icon: 'filter',
        title: 'Beliebt und Formate',
        text: 'Zwischen Empfehlungen, Beliebtem und einzelnen Formaten wechseln.',
      },
      {
        icon: 'add',
        title: 'Direkt übernehmen',
        text: 'Aus jeder Karte heraus landet ein Titel in deiner Sammlung.',
      },
    ],
  },
  {
    path: '/manga/stats',
    version: 1,
    title: 'Manga-Statistiken',
    intro: 'Dein Lese-Universum in Zahlen.',
    actions: [
      {
        icon: 'stats',
        title: 'Deine Zahlen',
        text: 'Gelesene Kapitel, Titel und Durchschnittsbewertung auf einen Blick.',
      },
      {
        icon: 'explore',
        title: 'Genres und Formate',
        text: 'Zeigt, worauf deine Lesezeit wirklich entfällt.',
      },
      {
        icon: 'share',
        title: 'Weitergeben',
        text: 'Die Auswertung lässt sich als Bild teilen.',
      },
    ],
  },
  {
    path: '/manga/catch-up',
    version: 1,
    title: 'Manga aufholen',
    intro: 'Wo du beim Lesen am weitesten zurückliegst.',
    actions: [
      {
        icon: 'stats',
        title: 'Rückstand sehen',
        text: 'Je Titel stehen offene Kapitel und Fortschritt nebeneinander.',
      },
      {
        icon: 'check',
        title: 'Aufholen',
        text: 'Bis zu einem bestimmten Kapitel auf einmal als gelesen markieren.',
      },
      {
        icon: 'calendar',
        title: 'Erscheinungsrhythmus',
        text: 'Zu vielen Titeln steht, in welchem Abstand neue Kapitel kommen.',
      },
    ],
  },
  {
    path: '/manga/journey',
    version: 1,
    title: 'Lese-Journey',
    intro: 'Deine Lese-Trends über die Zeit.',
    actions: [
      {
        icon: 'stats',
        title: 'Kapitel pro Monat',
        text: 'Zeigt, wann du viel und wann du kaum gelesen hast.',
      },
      {
        icon: 'streak',
        title: 'Lese-Streak',
        text: 'Wie viele Tage am Stück du gelesen hast.',
      },
      {
        icon: 'explore',
        title: 'Genre-Verteilung',
        text: 'Welche Genres und Formate deine Sammlung prägen.',
      },
    ],
  },
  {
    path: '/manga/recently-read',
    version: 1,
    title: 'Zuletzt gelesen',
    intro: 'Deine letzten Kapitel, chronologisch.',
    actions: [
      {
        icon: 'history',
        title: 'Zeitraum wählen',
        text: 'Die letzten Tage, Wochen oder Monate getrennt durchsehen.',
      },
      {
        icon: 'explore',
        title: 'Weiterlesen',
        text: 'Ein Eintrag führt zurück zum Titel und seinem Stand.',
      },
      {
        icon: 'stats',
        title: 'Aktivität',
        text: 'Zeigt, wie gleichmäßig du zuletzt gelesen hast.',
      },
    ],
  },
  {
    path: '/manga/hidden',
    version: 1,
    title: 'Ausgeblendete Manga',
    intro: 'Titel, die du aus deiner Sammlung genommen hast.',
    actions: [
      {
        icon: 'bookmark',
        title: 'Was hier landet',
        text: 'Ausgeblendete Titel verschwinden aus Leseliste, Aufholen und Statistiken.',
      },
      {
        icon: 'replay',
        title: 'Zurückholen',
        text: 'Einblenden macht einen Titel wieder überall sichtbar.',
      },
      {
        icon: 'stats',
        title: 'Nichts geht verloren',
        text: 'Dein Kapitel-Fortschritt bleibt beim Ausblenden erhalten.',
      },
    ],
  },
  {
    path: '/manga/:id',
    version: 1,
    title: 'Manga-Details',
    intro: 'Alles zum Titel und was du damit machen kannst.',
    actions: [
      {
        icon: 'check',
        title: 'Fortschritt setzen',
        text: 'Aktuelles Kapitel ändern oder bis zu einem Kapitel alles als gelesen markieren.',
      },
      {
        icon: 'bookmark',
        title: 'Status',
        text: 'Lese ich, Geplant, Abgeschlossen, Pausiert oder Abgebrochen.',
      },
      {
        icon: 'star',
        title: 'Bewerten und notieren',
        text: 'Wertung setzen und eigene Notizen zum Titel hinterlegen.',
      },
    ],
  },
];
