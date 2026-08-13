/** Seitenhilfe („Das kannst du hier") — Deutsch → Französisch. */

const tour: Record<string, string> = {
  Rückmeldung: 'La réponse',
  'Das kannst du hier': 'Ce que tu peux faire ici',
  'Seitenhilfen zurücksetzen': "Réinitialiser les aides d'écran",
  'Die Kurzhilfe erscheint beim nächsten Besuch jeder Seite erneut':
    'Le mémo réapparaîtra la prochaine fois que tu ouvriras chaque page',
  'Seitenhilfen werden wieder angezeigt': "Les aides d'écran sont réactivées",

  Startseite: 'Accueil',
  'Dein Einstieg in alles, was gerade läuft.': 'Ton point de départ pour tout ce qui est en cours.',
  'Die oberste Reihe bringt dich mit einem Fingertipp zur nächsten offenen Folge.':
    'La première rangée te mène à ton prochain épisode non vu en un geste.',
  'Streak halten': 'Garder ta série',
  'Deine Streak wächst an jedem Tag, an dem du mindestens eine Folge abhakst.':
    'Ta série grandit chaque jour où tu coches au moins un épisode.',
  'Die Glocke sammelt neue Folgen, Anbieterwechsel und Anfragen von Freunden.':
    "La cloche rassemble les nouveaux épisodes, les changements de plateforme et les demandes d'amis.",
  'Startseite umbauen': "Réorganiser l'accueil",
  'Unter Einstellungen und Homepage Layout sortierst du die Abschnitte um oder blendest sie aus.':
    "Dans Réglages puis Disposition de l'accueil, tu peux réordonner ou masquer les sections.",

  'Alle Serien mit einer offenen Folge, in der Reihenfolge, die du willst.':
    'Toutes les séries avec un épisode en attente, dans l’ordre que tu veux.',
  'Folge abhaken': 'Cocher un épisode',
  'Tippe eine Karte an, um die nächste Folge als gesehen zu markieren.':
    'Appuie sur une carte pour marquer le prochain épisode comme vu.',
  Wischen: 'Balayer',
  'Wisch eine Karte zur Seite, um sie ohne Umweg abzuhaken.':
    'Balaie une carte sur le côté pour la cocher immédiatement.',
  'Nach Anbieter filtern': 'Filtrer par plateforme',
  'Über Filter schränkst du auf einzelne Streaming-Dienste ein oder blendest alles außerhalb deiner Abos aus.':
    'Filtres restreint à certaines plateformes ou masque tout ce qui sort de tes abonnements.',
  Reihenfolge: 'Ordre',
  'Sortiere nach Datum, Name oder Fortschritt, oder stell dir eine eigene Reihenfolge zusammen.':
    'Trie par date, nom ou progression, ou compose ton propre ordre.',

  'Wann welche Folge läuft, Woche für Woche.': 'Quel épisode sort quand, semaine après semaine.',
  'Woche wechseln': 'Changer de semaine',
  'Blättere zwischen den Wochen und tippe einen Tag an, um seine Folgen zu sehen.':
    'Parcours les semaines et appuie sur un jour pour voir ses épisodes.',
  'Direkt abhaken': 'Cocher directement',
  'Folgen lassen sich aus dem Kalender heraus als gesehen markieren.':
    'Les épisodes peuvent être marqués comme vus depuis le calendrier.',
  'Nur Watchlist': 'Watchlist uniquement',
  'Der Filter reduziert den Kalender auf die Serien, die du dir gemerkt hast.':
    'Le filtre réduit le calendrier aux séries que tu as mises de côté.',
  'Weitere Kalender': 'Autres calendriers',
  'Über die Kopfzeile kommst du zum Serien-, Film- und Anime-Season-Kalender.':
    "L'en-tête mène aux calendriers des séries, des films et de la saison d'anime.",

  'Alles, was du bewertet hast, und alles, was noch fehlt.':
    'Tout ce que tu as noté, et tout ce qui manque encore.',
  'Tippe einen Titel an, um deine Wertung zu setzen oder zu ändern.':
    'Appuie sur un titre pour mettre ou modifier ta note.',
  'Ansicht wechseln': "Changer d'affichage",
  'Zwischen der cinematischen Ansicht und der kompakten Liste umschalten.':
    'Bascule entre la vue cinématique et la liste compacte.',
  Filtern: 'Filtrer',
  'Serien, Filme, Watchlist oder alles noch Unbewertete getrennt anzeigen.':
    'Affiche séparément les séries, les films, la watchlist ou tout ce qui reste sans note.',
  'Eigene Liste durchsuchen': 'Chercher dans ta liste',
  'Das Suchfeld findet einen Titel in deinem eigenen Bestand.':
    'Le champ de recherche trouve un titre dans ta propre collection.',

  'Der Weg zu allem, was noch nicht in deiner Liste steht.':
    "L'accès à tout ce qui n'est pas encore dans ta liste.",
  'Serien und Filme im gesamten Katalog finden.':
    'Trouve des séries et des films dans tout le catalogue.',
  'Der Knopf auf dem Poster legt einen Titel direkt in deine Liste.':
    "Le bouton sur l'affiche ajoute un titre directement à ta liste.",
  'Blendet aus, was du auf deinen aktiven Streaming-Diensten nicht sehen kannst.':
    'Masque ce que tu ne peux pas regarder sur tes plateformes actives.',
  'Frühere Suchbegriffe stehen unter dem Feld bereit.':
    'Tes recherches précédentes attendent sous le champ.',

  'Vorschläge, die zu dem passen, was du schon geschaut hast.':
    'Des suggestions qui collent à ce que tu as déjà regardé.',
  'Empfehlungen auf Basis der Titel, die schon in deiner Liste liegen.':
    'Des recommandations basées sur les titres déjà présents dans ta liste.',
  'Nach Genre filtern': 'Filtrer par genre',
  'Die Genre-Leiste grenzt die Vorschläge ein.': 'La barre des genres affine les suggestions.',
  'Zeigt ausschließlich Titel auf deinen aktiven Abos.':
    'Affiche uniquement les titres présents sur tes abonnements actifs.',
  'Direkt übernehmen': 'Ajouter sur-le-champ',
  'Aus jeder Karte heraus landet ein Titel in deiner Liste.':
    "Depuis n'importe quelle carte, un titre atterrit dans ta liste.",

  'Dein Viewing-Universum in Zahlen.': 'Ton univers de visionnage en chiffres.',
  'Deine Zahlen': 'Tes chiffres',
  'Watchtime, gesehene Episoden und abgeschlossene Serien auf einen Blick.':
    "Temps de visionnage, épisodes vus et séries terminées d'un coup d'œil.",
  'Top-Genres und Anbieter': 'Genres et plateformes en tête',
  'Zeigt, worauf deine Watchtime wirklich entfällt.':
    'Montre où part réellement ton temps de visionnage.',
  'Die Statistiken lassen sich als fertige Grafik weitergeben.':
    'Les statistiques se partagent sous forme de visuel prêt à envoyer.',
  'Actor Universe': 'Actor Universe',
  'Verfolge, über welche Schauspieler deine Serien zusammenhängen.':
    'Suis quels acteurs relient tes séries entre elles.',

  Seriendetails: 'Détails de la série',
  'Staffeln, Fortschritt und alles, was du zur Serie tun kannst.':
    'Saisons, progression et tout ce que tu peux faire avec la série.',
  'Auf die Watchlist': 'Dans la watchlist',
  'Nur Serien auf der Watchlist erscheinen unter Weiterschauen. Beim ersten Abhaken landet eine Serie automatisch dort.':
    'Seules les séries de ta watchlist apparaissent dans Continuer à regarder. Dès que tu coches un premier épisode, la série y atterrit automatiquement.',
  'Folgen abhaken': 'Cocher des épisodes',
  'Einzelne Folgen antippen oder über Alle verwalten eine ganze Staffel setzen.':
    'Appuie sur des épisodes isolés, ou coche une saison entière via Tout gérer.',
  'Die Serie und jede einzelne Folge lassen sich bewerten.':
    'Tu peux noter la série et chaque épisode séparément.',
  'Starte einen Durchlauf von vorn, ohne deine bisherige Historie zu verlieren.':
    'Relance un visionnage depuis le début sans perdre ton historique.',
  'Freunde vergleichen': 'Comparer avec tes amis',
  'Der Freunde-Bereich zeigt, wie weit die anderen in dieser Serie sind.':
    'La section Amis montre où les autres en sont dans cette série.',

  Filmdetails: 'Détails du film',
  'Alles zum Film und was du damit machen kannst.': 'Tout sur le film et ce que tu peux en faire.',
  'Einmal antippen, und der Film wandert in deine Historie.':
    'Un geste suffit, le film passe dans ton historique.',
  'Deine Wertung fließt in Statistiken und Empfehlungen ein.':
    'Ta note alimente tes statistiques et tes recommandations.',
  'Von der Besetzung aus springst du zu anderen Titeln derselben Person.':
    'Depuis la distribution, tu sautes vers d’autres titres de la même personne.',
  Reihen: 'Sagas',
  'Gehört der Film zu einer Reihe, siehst du hier die fehlenden Teile.':
    'Si le film fait partie d’une saga, tu vois ici les volets qui te manquent.',

  'Dein Konto, deine Zahlen und der Weg in alle Nebenbereiche.':
    'Ton compte, tes chiffres et le chemin vers toutes les autres sections.',
  'Deine Eckdaten': 'Tes chiffres clés',
  'Watchtime, Episoden, Filme und Manga in der Übersicht.':
    'Temps de visionnage, épisodes, films et mangas en un seul aperçu.',
  'Alles Weitere': 'Tout le reste',
  'Die Kacheln führen zu Badges, Pets, Rangliste, Verlauf und allem Weiteren.':
    'Les tuiles mènent aux badges, aux compagnons, au classement, à l’historique et au reste.',
  'Von hier geht es zu Konto, Design, Sprache und Benachrichtigungen.':
    'D’ici tu accèdes à ton compte, au thème, à la langue et aux notifications.',

  'Was deine Freunde gerade schauen, und wer noch dazukommen will.':
    'Ce que tes amis regardent en ce moment, et qui souhaite encore te rejoindre.',
  'Feed und Freunde': 'Fil et amis',
  'Zwei Reiter: der Aktivitäts-Feed und deine Freundesliste.':
    'Deux onglets : le fil d’activité et ta liste d’amis.',
  'Offene Freundschaftsanfragen annehmen oder ablehnen.':
    'Accepte ou refuse les demandes d’amis en attente.',
  'Diskussionen und Chats': 'Discussions et messages',
  'Von hier kommst du in den Diskussions-Feed und zu deinen Chats.':
    'D’ici tu rejoins le fil des discussions et tes conversations.',

  'Alles, was du dir schon verdient hast, und was noch fehlt.':
    'Tout ce que tu as déjà gagné, et ce qui manque encore.',
  'Fortschritt lesen': 'Lire ta progression',
  'Jedes Badge zeigt, wie viele Schritte bis zur Freischaltung fehlen.':
    'Chaque badge indique combien d’étapes il reste avant de le débloquer.',
  'Nach Seltenheit filtern': 'Filtrer par rareté',
  'Von Gewöhnlich bis Legendär getrennt durchsehen.': 'Parcours séparément de commun à légendaire.',
  'Der Prüfen-Knopf rechnet deine Badges sofort neu durch.':
    'Le bouton Vérifier recalcule tes badges immédiatement.',

  'Deine Begleiter wachsen mit jeder Folge, die du schaust.':
    'Tes compagnons grandissent à chaque épisode que tu regardes.',
  'Füttern und pflegen': 'Nourrir et soigner',
  'Ein gesundes Pet bringt dir mehr XP pro Episode.':
    'Un compagnon en bonne santé te rapporte plus d’XP par épisode.',
  'Aussehen ändern': 'Changer son apparence',
  'Farben, Hintergründe und Accessoires lassen sich frei kombinieren.':
    'Couleurs, arrière-plans et accessoires se combinent librement.',
  'Mehrere Pets': 'Plusieurs compagnons',
  'Du kannst weitere Pets erschaffen und zwischen ihnen wechseln.':
    'Tu peux créer d’autres compagnons et passer de l’un à l’autre.',

  'Wie du im Vergleich zu anderen dastehst.': 'Où tu te situes par rapport aux autres.',
  'Zeitraum wählen': 'Choisir la période',
  'Diesen Monat oder aller Zeiten, je nachdem was dich interessiert.':
    'Ce mois-ci ou depuis toujours, selon ce qui t’intéresse.',
  'Freunde oder alle': 'Amis ou tout le monde',
  'Wechsle zwischen deinem Freundeskreis und allen Nutzern.':
    'Bascule entre ton cercle d’amis et l’ensemble des utilisateurs.',
  'Wertung verstehen': 'Comment on compte',
  'Gezählt werden Episoden, Filme und die Watchtime, die dabei zusammenkommt.':
    'Ce sont les épisodes, les films et le temps de visionnage cumulé qui comptent.',

  'Die Serien, bei denen du am weitesten hinterherhinkst.':
    'Les séries sur lesquelles tu as le plus de retard.',
  'Rückstand sehen': 'Voir le retard',
  'Je Serie stehen offene Episoden und der Fortschritt nebeneinander.':
    'Par série, les épisodes en attente et la progression sont côte à côte.',
  Sortieren: 'Trier',
  'Nach Episoden, Fortschritt, verbleibender Zeit oder zuletzt geschaut.':
    'Par épisodes, progression, temps restant ou dernier visionnage.',
  'Aus jeder Karte heraus geht es direkt in die Serie zum Abhaken.':
    'Chaque carte te conduit directement dans la série pour cocher.',

  'Was von deinen Serien als Nächstes zurückkommt.': 'Laquelle de tes séries revient en premier.',
  'Kommende Staffeln': 'Saisons à venir',
  'Jede angekündigte Rückkehr mit Countdown bis zum Starttag.':
    'Chaque retour annoncé avec un compte à rebours jusqu’au premier jour.',
  'Eine Karte antippen führt direkt zur Serie.':
    'Appuyer sur une carte mène directement à la série.',
  'Woher das kommt': 'D’où ça vient',
  'Gelistet werden angekündigte Staffeln der Serien in deiner Liste.':
    'Sont listées les saisons annoncées des séries présentes dans ta liste.',

  'Womit du streamst, bestimmt viele Filter in der App.':
    'Les plateformes que tu utilises pilotent de nombreux filtres de l’app.',
  'Abos markieren': 'Marquer tes abonnements',
  'Tippe die Dienste an, die du tatsächlich abonniert hast.':
    'Appuie sur les services auxquels tu es réellement abonné.',
  'Was das bewirkt': 'Ce que ça change',
  'Erst damit funktionieren die Filter „Nur meine Abos" in Suche, Entdecken und Weiterschauen.':
    'C’est seulement ainsi que le filtre Mes abonnements agit dans la recherche, la découverte et Continuer à regarder.',
  Anbieterwechsel: 'Changements de plateforme',
  'Verlässt eine deiner Serien einen Dienst, bekommst du eine Meldung.':
    'Si une de tes séries quitte une plateforme, tu reçois une alerte.',

  'Was du zuletzt gesehen hast, chronologisch.': 'Ce que tu as regardé en dernier, dans l’ordre.',
  'Die letzten Tage oder Wochen getrennt durchsehen.':
    'Parcours séparément les derniers jours ou les dernières semaines.',
  'Das Suchfeld grenzt den Verlauf auf eine einzelne Serie ein.':
    'Le champ de recherche réduit l’historique à une seule série.',
  'Eine Folge lässt sich von hier aus direkt noch einmal abhaken.':
    'Un épisode peut être recoché directement depuis ici.',

  'Ausgeblendete Serien': 'Séries masquées',
  'Alles, was du aus deinen Listen genommen hast.': 'Tout ce que tu as retiré de tes listes.',
  'Was hier landet': 'Ce qui atterrit ici',
  'Ausgeblendete Serien verschwinden aus Weiterschauen, Kalender und Statistiken.':
    'Les séries masquées disparaissent de Continuer à regarder, du calendrier et des statistiques.',
  Zurückholen: 'Récupérer',
  'Ein Tippen auf Weiter macht eine Serie wieder überall sichtbar.':
    'Une pression sur Continuer rend une série à nouveau visible partout.',
  'Nichts geht verloren': 'Rien n’est perdu',
  'Dein Fortschritt bleibt beim Ausblenden vollständig erhalten.':
    'Masquer une série conserve intégralement ta progression.',

  'Deine Sehgewohnheiten über die Jahre.': 'Tes habitudes de visionnage au fil des ans.',
  'Zeigt, wann du besonders viel und wann du kaum geschaut hast.':
    'Montre quand tu as beaucoup regardé et quand tu n’as presque rien regardé.',
  'Wie oft du Sessions am Stück durchgezogen hast, samt Rekorden.':
    'Combien de fois tu as enchaîné une session d’une traite, records inclus.',
  'Nach Genre eingrenzen': 'Restreindre par genre',
  'Die Auswertung lässt sich auf einzelne Genres beschränken.':
    'L’analyse peut être limitée à certains genres.',

  Jahresrückblick: 'Rétrospective de l’année',
  'Dein Serienjahr als Abfolge von Karten.':
    'Ton année de séries sous forme de cartes qui défilent.',
  'Nach links und rechts wischen blättert durch die Karten.':
    'Balayer à gauche et à droite fait défiler les cartes.',
  'Was drinsteht': 'Ce qu’on y trouve',
  'Watchtime, Top-Serien, Lieblingsgenres und deine Rekorde des Jahres.':
    'Temps de visionnage, séries phares, genres préférés et tes records de l’année.',
  Weitergeben: 'Partager',
  'Einzelne Karten lassen sich als Bild teilen.':
    'Les cartes peuvent être partagées individuellement en image.',

  'Die Schauspieler, die deine Serien miteinander verbinden.':
    'Les acteurs qui relient tes séries entre elles.',
  'Verbindungen lesen': 'Lire les liens',
  'Linien zeigen, welche Schauspieler in mehreren deiner Serien mitspielen.':
    'Les lignes montrent quels acteurs jouent dans plusieurs de tes séries.',
  'Bewegen und zoomen': 'Déplacer et zoomer',
  'Ziehen verschiebt die Karte, Ansicht zurücksetzen bringt sie zurück.':
    'Faire glisser déplace la carte, Réinitialiser la vue la remet en place.',
  'Personen öffnen': 'Ouvrir une personne',
  'Ein Tippen auf einen Namen öffnet dessen Serien und Filme.':
    'Appuyer sur un nom ouvre ses séries et ses films.',

  Geschmacksprofil: 'Profil de goûts',
  'Empfehlungen aus deinen Bewertungen und Sehmustern.':
    'Des recommandations tirées de tes notes et de tes habitudes.',
  'Empfehlungen erzeugen': 'Générer des recommandations',
  'Der Knopf lässt frische Vorschläge für dich berechnen.':
    'Le bouton fait calculer de nouvelles suggestions pour toi.',
  Übernehmen: 'Ajouter',
  'Was passt, wandert direkt in deine Liste.': 'Ce qui te convient part directement dans ta liste.',
  'Wird mit der Zeit besser': 'Ça s’améliore avec le temps',
  'Je mehr du bewertest, desto genauer werden die Vorschläge.':
    'Plus tu notes, plus les suggestions deviennent précises.',

  'Geschmacks-Match': 'Affinité de goûts',
  'Wie weit dein Geschmack und der deines Freundes auseinanderliegen.':
    'À quel point tes goûts et ceux de ton ami divergent.',
  Übereinstimmung: 'Taux d’affinité',
  'Ein Wert fasst zusammen, wie ähnlich ihr bewertet.':
    'Un chiffre résume à quel point vous notez de la même façon.',
  Gemeinsamkeiten: 'Points communs',
  'Gemeinsame Serien, Filme und Genres stehen einzeln aufgelistet.':
    'Les séries, films et genres communs sont listés un par un.',
  'Perfekte Treffer': 'Correspondances parfaites',
  'Titel, die ihr beide gleich stark mögt, werden hervorgehoben.':
    'Les titres que vous aimez autant l’un que l’autre sont mis en avant.',

  Freundesprofil: 'Profil d’un ami',
  'Was dein Freund schaut und wie weit ihr auseinander seid.':
    'Ce que ton ami regarde et l’écart entre vous.',
  'Vorsprung sehen': 'Voir l’avance',
  'Bei gemeinsamen Serien steht, wer wie viele Folgen voraus ist.':
    'Sur les séries communes, tu vois qui a de l’avance et de combien d’épisodes.',
  'Von hier kommst du direkt ins Geschmacks-Match.':
    'D’ici tu passes directement à l’affinité de goûts.',
  'Pet und Badges': 'Compagnon et badges',
  'Auch Pet, Streak und freigeschaltete Badges sind sichtbar.':
    'Le compagnon, la série en cours et les badges débloqués sont visibles aussi.',

  'Die Ansicht, die andere über deinen Link sehen.':
    'La vue que les autres obtiennent via ton lien.',
  'Gezeigt werden die bewerteten Serien und Filme, nicht dein ganzer Bestand.':
    'On y voit les séries et films que tu as notés, pas toute ta collection.',
  'Serien und Filme lassen sich getrennt durchsehen.':
    'Les séries et les films se consultent séparément.',
  Sichtbarkeit: 'Visibilité',
  'Ob es diese Seite überhaupt gibt, entscheidest du in den Einstellungen.':
    'C’est toi qui décides dans les réglages si cette page existe.',

  'Direkte Unterhaltungen mit deinen Freunden.': 'Des conversations directes avec tes amis.',
  'Unterhaltung öffnen': 'Ouvrir une conversation',
  'Chats gibt es nur mit Leuten, mit denen du befreundet bist.':
    'Les conversations n’existent qu’avec des personnes dont tu es l’ami.',
  Aussehen: 'Apparence',
  'Chat-Design und Hintergrund lassen sich je Unterhaltung ändern.':
    'Le thème et l’arrière-plan se changent conversation par conversation.',
  'Blockieren und löschen': 'Bloquer et supprimer',
  'Eine Unterhaltung lässt sich stummschalten, blockieren oder ganz entfernen.':
    'Une conversation peut être mise en sourdine, bloquée ou entièrement supprimée.',

  'Schreiben, ohne die nächste Folge zu verraten.': 'Écrire sans dévoiler le prochain épisode.',
  'Verdeckt die Nachricht, bis dein Gegenüber sie bewusst aufdeckt.':
    'Masque le message jusqu’à ce que ton interlocuteur choisisse de le révéler.',
  'Bilder bis 8 MB lassen sich mit Bildunterschrift schicken.':
    'Les images jusqu’à 8 Mo peuvent être envoyées avec une légende.',
  'Über das Chat-Design änderst du Farbe und Hintergrund der Unterhaltung.':
    'Le thème de la conversation en change la couleur et l’arrière-plan.',

  'Alle Gespräche zu Serien, Filmen und Folgen an einem Ort.':
    'Toutes les conversations sur les séries, les films et les épisodes au même endroit.',
  'Bereich wählen': 'Choisir la rubrique',
  'Getrennt nach Serien, Filmen und einzelnen Episoden.':
    'Réparti en séries, films et épisodes isolés.',
  Mitreden: 'Participer',
  'Ein Beitrag führt dich zur Diskussion, wo du antworten kannst.':
    'Un message te mène à la discussion, où tu peux répondre.',
  Spoilerschutz: 'Anti-spoiler',
  'Beiträge zu Folgen, die du noch nicht gesehen hast, bleiben verdeckt.':
    'Les messages sur des épisodes que tu n’as pas vus restent masqués.',

  'Der schnelle Weg, viele Folgen auf einmal zu setzen.':
    'Le moyen rapide de cocher beaucoup d’épisodes d’un coup.',
  Sammelaktionen: 'Actions groupées',
  'Ganze Staffeln als gesehen oder wieder als ungesehen markieren.':
    'Marque des saisons entières comme vues, ou de nouveau comme non vues.',
  'Zähler ändern': 'Modifier le compteur',
  'Plus und Minus setzen, wie oft du eine Folge gesehen hast.':
    'Plus et moins définissent combien de fois tu as vu un épisode.',
  'Zu jeder Folge kommst du von hier in ihre Diskussion.':
    'Pour chaque épisode, tu rejoins sa discussion depuis ici.',

  'Folgen-Diskussion': 'Discussion de l’épisode',
  'Das Gespräch zu genau dieser Folge.': 'La conversation sur cet épisode précis.',
  'Schreiben und antworten': 'Écrire et répondre',
  'Beiträge verfassen und auf die Beiträge anderer antworten.':
    'Rédige des messages et réponds à ceux des autres.',
  'Wer die Folge noch nicht gesehen hat, sieht den Inhalt erst nach dem Aufdecken.':
    'Qui n’a pas vu l’épisode ne voit le contenu qu’après l’avoir révélé.',
  'Die Bewertung dieser Folge lässt sich hier direkt setzen.':
    'La note de cet épisode peut être mise directement ici.',

  'Bewertung bearbeiten': 'Modifier la note',
  'Deine Wertung, aufgeschlüsselt nach Genres.': 'Ta note, détaillée par genre.',
  'Je Genre bewerten': 'Noter par genre',
  'Jedes Genre bekommt einen eigenen Wert, daraus entsteht die Gesamtnote.':
    'Chaque genre reçoit sa propre valeur, et l’ensemble donne la note globale.',
  'Erst mit Speichern landet die Änderung in deiner Liste.':
    'La modification n’arrive dans ta liste qu’une fois enregistrée.',
  'Eine Bewertung lässt sich vollständig zurücknehmen.': 'Une note peut être retirée entièrement.',

  'Neue Serien und Staffelstarts, unabhängig von deiner Liste.':
    'Nouvelles séries et débuts de saison, indépendamment de ta liste.',
  'Premieren sehen': 'Voir les sorties',
  'Kommende Starts mit Countdown bis zum ersten Tag.':
    'Les prochains démarrages avec un compte à rebours jusqu’au premier jour.',
  'Die Genre-Suche grenzt die Premieren ein.': 'La recherche par genre restreint les sorties.',
  'Was dich interessiert, landet mit einem Fingertipp in deiner Liste.':
    'Ce qui t’intéresse arrive dans ta liste en une pression.',

  'Kinostarts und Streaming-Releases in deiner Region.':
    'Sorties en salle et sorties en streaming dans ta région.',
  'Kino oder Streaming': 'Salle ou streaming',
  'Zwischen Kinostarts und digitalen Releases umschalten.':
    'Bascule entre les sorties en salle et les sorties numériques.',
  'Nach Datum': 'Par date',
  'Die Liste läuft chronologisch, der heutige Tag ist markiert.':
    'La liste suit l’ordre chronologique, la date du jour est marquée.',
  Vormerken: 'Mettre de côté',
  'Ein Film lässt sich von hier direkt in deine Liste legen.':
    'Un film peut être ajouté à ta liste directement depuis ici.',

  'Die laufende und die kommende Anime-Saison im Überblick.':
    'La saison d’anime en cours et la suivante en un coup d’œil.',
  'Nach Studio filtern': 'Filtrer par studio',
  'Die Saison lässt sich auf einzelne Studios eingrenzen.':
    'La saison peut être restreinte à certains studios.',
  'Status sehen': 'Voir le statut',
  'Fortlaufend, beendet oder noch nicht gestartet, jeweils mit Countdown.':
    'En cours, terminé ou pas encore commencé, chacun avec son compte à rebours.',
  'Ein Titel wandert mit einem Fingertipp in deine Serienliste.':
    'Une pression fait passer un titre dans ta liste de séries.',

  'Konto, Aussehen, Benachrichtigungen und deine Daten.':
    'Compte, apparence, notifications et tes données.',
  'Push ein- und ausschalten und einstellen, worüber du informiert wirst.':
    'Active ou désactive les push et choisis ce dont tu veux être informé.',
  'Aussehen und Sprache': 'Apparence et langue',
  'Design, Anzeigegröße, Startseiten-Layout und Sprache liegen hier.':
    'Thème, taille d’affichage, disposition de l’accueil et langue se trouvent ici.',
  'Import und Export': 'Import et export',
  'Deine Watch-History als JSON sichern oder als CSV weitergeben.':
    'Sauvegarde ton historique en JSON, ou transmets-le en CSV.',

  'Die ganze App nimmt deine Farben an.': 'Toute l’app adopte tes couleurs.',
  'Farben setzen': 'Définir les couleurs',
  'Haupt-, Akzent- und Hintergrundfarbe lassen sich einzeln wählen.':
    'La couleur principale, celle d’accent et celle du fond se choisissent séparément.',
  Vorlagen: 'Modèles',
  'Fertige Kombinationen als Startpunkt, danach frei anpassbar.':
    'Des combinaisons toutes faites comme point de départ, modifiables ensuite.',
  'Alle Farben auf Standard bringt dich jederzeit zurück.':
    'Rétablir toutes les couleurs te ramène en arrière à tout moment.',

  'Startseiten-Layout': 'Disposition de l’accueil',
  'Die Vorschau ist der Editor.': 'L’aperçu est l’éditeur.',
  'Reihenfolge ändern': 'Changer l’ordre',
  'Halten und ziehen verschiebt einen Abschnitt.':
    'Maintenir et faire glisser déplace une section.',
  'Das Auge blendet einen Abschnitt aus, ohne ihn zu verlieren.':
    'L’œil masque une section sans la perdre.',
  'Navigation belegen': 'Attribuer la navigation',
  'Auch die vier freien Plätze der unteren Leiste stellst du hier ein.':
    'Les quatre emplacements libres de la barre du bas se règlent aussi ici.',

  'Feedback und Bugs': 'Retours et bugs',
  'Der direkte Draht, wenn etwas klemmt oder fehlt.':
    'La ligne directe quand quelque chose coince ou manque.',
  'Ticket erstellen': 'Créer un ticket',
  'Fehler melden oder ein Feature vorschlagen.': 'Signale un bug ou propose une fonctionnalité.',
  'Deine Tickets': 'Tes tickets',
  'Offene und archivierte Meldungen stehen getrennt.':
    'Les signalements ouverts et archivés sont séparés.',
  'Sobald jemand reagiert, siehst du es an deinem Ticket.':
    'Dès que quelqu’un répond, tu le vois sur ton ticket.',

  'Manga-Sammlung': 'Collection de mangas',
  'Der Einstieg in alles rund um Manga, Manhwa und Manhua.':
    'L’entrée vers tout ce qui touche aux mangas, manhwas et manhuas.',
  'Suchen und hinzufügen': 'Chercher et ajouter',
  'Neue Titel findest du über die Manga-Suche.':
    'Les nouveaux titres passent par la recherche de mangas.',
  'Sammlung filtern': 'Filtrer la collection',
  'Am Lesen, Geplant, Abgeschlossen oder Abgebrochen getrennt anzeigen.':
    'Affiche séparément En cours de lecture, Prévu, Terminé ou Abandonné.',
  Bereiche: 'Rubriques',
  'Leseliste, Bewertungen, Entdecken, Statistiken und Journey erreichst du von hier.':
    'D’ici tu rejoins la liste de lecture, les notes, la découverte, les statistiques et le parcours.',

  'Was gerade offen ist, in deiner Reihenfolge.': 'Ce qui est en cours, dans l’ordre que tu veux.',
  'Kapitel setzen': 'Définir le chapitre',
  'Ein Kapitel weiter oder zurück, direkt auf der Karte.':
    'Un chapitre en avant ou en arrière, directement sur la carte.',
  'Nach Fortschritt, Bewertung oder Titel ordnen.': 'Trie par progression, note ou titre.',
  'Nur Titel mit Status Lese ich oder Geplant erscheinen in der Leseliste.':
    'Seuls les titres au statut En cours de lecture ou Prévu apparaissent dans la liste de lecture.',

  'Manga-Suche': 'Recherche de mangas',
  'Der Weg zu allem, was noch nicht in deiner Sammlung ist.':
    'L’accès à tout ce qui n’est pas encore dans ta collection.',
  'Manga, Manhwa und Manhua über den gesamten Bestand finden.':
    'Trouve mangas, manhwas et manhuas dans tout le catalogue.',
  'Ein Titel landet mit einem Fingertipp in deiner Sammlung.':
    'Une pression fait entrer un titre dans ta collection.',
  'Status setzen': 'Définir le statut',
  'Beim Hinzufügen legst du fest, ob du liest, planst oder schon durch bist.':
    'Au moment de l’ajout, tu décides si tu lis, si tu prévois ou si tu as déjà fini.',

  'Alles, was du bewertet hast, und was noch offen ist.':
    'Tout ce que tu as noté, et ce qui reste en attente.',
  'Nach Bewertung auf- oder absteigend ordnen.': 'Trie par note, croissante ou décroissante.',
  'Unbewertetes finden': 'Trouver les titres sans note',
  'Der Filter zeigt, wo noch eine Wertung fehlt.': 'Le filtre montre là où une note manque encore.',

  'Vorschläge und beliebte Titel, die zu dir passen.':
    'Des suggestions et des titres populaires qui te correspondent.',
  'Empfehlungen auf Basis deiner Sammlung und Bewertungen.':
    'Des recommandations basées sur ta collection et tes notes.',
  'Beliebt und Formate': 'Populaires et formats',
  'Zwischen Empfehlungen, Beliebtem und einzelnen Formaten wechseln.':
    'Bascule entre recommandations, titres populaires et formats précis.',
  'Aus jeder Karte heraus landet ein Titel in deiner Sammlung.':
    'Depuis n’importe quelle carte, un titre rejoint ta collection.',

  'Dein Lese-Universum in Zahlen.': 'Ton univers de lecture en chiffres.',
  'Gelesene Kapitel, Titel und Durchschnittsbewertung auf einen Blick.':
    'Chapitres lus, titres et note moyenne en un coup d’œil.',
  'Genres und Formate': 'Genres et formats',
  'Zeigt, worauf deine Lesezeit wirklich entfällt.':
    'Montre où part réellement ton temps de lecture.',
  'Die Auswertung lässt sich als Bild teilen.': 'L’analyse peut être partagée en image.',

  'Manga aufholen': 'Rattraper les mangas',
  'Wo du beim Lesen am weitesten zurückliegst.': 'Là où tu as le plus de retard en lecture.',
  'Je Titel stehen offene Kapitel und Fortschritt nebeneinander.':
    'Par titre, les chapitres en attente et la progression sont côte à côte.',
  'Bis zu einem bestimmten Kapitel auf einmal als gelesen markieren.':
    'Marque d’un coup comme lu tout ce qui précède un chapitre donné.',
  Erscheinungsrhythmus: 'Rythme de parution',
  'Zu vielen Titeln steht, in welchem Abstand neue Kapitel kommen.':
    'Pour beaucoup de titres, tu vois à quelle fréquence sortent les nouveaux chapitres.',

  'Lese-Journey': 'Parcours de lecture',
  'Deine Lese-Trends über die Zeit.': 'Tes tendances de lecture au fil du temps.',
  'Zeigt, wann du viel und wann du kaum gelesen hast.':
    'Montre quand tu as beaucoup lu et quand tu n’as presque rien lu.',
  'Wie viele Tage am Stück du gelesen hast.': 'Combien de jours d’affilée tu as lu.',
  'Welche Genres und Formate deine Sammlung prägen.':
    'Quels genres et formats marquent ta collection.',

  'Deine letzten Kapitel, chronologisch.': 'Tes derniers chapitres, dans l’ordre.',
  'Die letzten Tage, Wochen oder Monate getrennt durchsehen.':
    'Parcours séparément les derniers jours, semaines ou mois.',
  'Ein Eintrag führt zurück zum Titel und seinem Stand.':
    'Une entrée te ramène au titre et à l’endroit où tu t’es arrêté.',
  'Zeigt, wie gleichmäßig du zuletzt gelesen hast.':
    'Montre à quel point ta lecture a été régulière dernièrement.',

  'Ausgeblendete Manga': 'Mangas masqués',
  'Titel, die du aus deiner Sammlung genommen hast.':
    'Les titres que tu as retirés de ta collection.',
  'Ausgeblendete Titel verschwinden aus Leseliste, Aufholen und Statistiken.':
    'Les titres masqués disparaissent de la liste de lecture, du rattrapage et des statistiques.',
  'Einblenden macht einen Titel wieder überall sichtbar.':
    'Afficher rend un titre à nouveau visible partout.',
  'Dein Kapitel-Fortschritt bleibt beim Ausblenden erhalten.':
    'Masquer un titre conserve ta progression en chapitres.',

  'Manga-Details': 'Détails du manga',
  'Alles zum Titel und was du damit machen kannst.':
    'Tout sur le titre et ce que tu peux en faire.',
  'Fortschritt setzen': 'Définir la progression',
  'Aktuelles Kapitel ändern oder bis zu einem Kapitel alles als gelesen markieren.':
    'Change le chapitre en cours, ou marque comme lu tout ce qui précède un chapitre.',
  'Lese ich, Geplant, Abgeschlossen, Pausiert oder Abgebrochen.':
    'En cours de lecture, Prévu, Terminé, En pause ou Abandonné.',
  'Bewerten und notieren': 'Noter et annoter',
  'Wertung setzen und eigene Notizen zum Titel hinterlegen.':
    'Mets une note et conserve tes propres notes sur le titre.',
};

export default tour;
