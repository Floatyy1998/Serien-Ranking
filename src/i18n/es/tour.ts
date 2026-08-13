/** Seitenhilfe („Das kannst du hier") — Deutsch → Spanisch. */

const tour: Record<string, string> = {
  Rückmeldung: 'La respuesta',
  'Das kannst du hier': 'Esto puedes hacer aquí',
  'Seitenhilfen zurücksetzen': 'Restablecer las ayudas de página',
  'Die Kurzhilfe erscheint beim nächsten Besuch jeder Seite erneut':
    'La ayuda breve volverá a aparecer la próxima vez que abras cada página',
  'Seitenhilfen werden wieder angezeigt': 'Las ayudas de página vuelven a mostrarse',

  Startseite: 'Inicio',
  'Dein Einstieg in alles, was gerade läuft.':
    'Tu punto de partida para todo lo que está en marcha.',
  'Die oberste Reihe bringt dich mit einem Fingertipp zur nächsten offenen Folge.':
    'La primera fila te lleva al siguiente episodio pendiente con un toque.',
  'Streak halten': 'Mantén tu racha',
  'Deine Streak wächst an jedem Tag, an dem du mindestens eine Folge abhakst.':
    'Tu racha crece cada día en el que marcas al menos un episodio.',
  'Die Glocke sammelt neue Folgen, Anbieterwechsel und Anfragen von Freunden.':
    'La campana reúne episodios nuevos, cambios de plataforma y solicitudes de amistad.',
  'Startseite umbauen': 'Reorganizar el inicio',
  'Unter Einstellungen und Homepage Layout sortierst du die Abschnitte um oder blendest sie aus.':
    'En Ajustes y Diseño de la página de inicio puedes reordenar u ocultar las secciones.',

  'Alle Serien mit einer offenen Folge, in der Reihenfolge, die du willst.':
    'Todas las series con un episodio pendiente, en el orden que quieras.',
  'Folge abhaken': 'Marcar un episodio',
  'Tippe eine Karte an, um die nächste Folge als gesehen zu markieren.':
    'Toca una tarjeta para marcar el siguiente episodio como visto.',
  Wischen: 'Deslizar',
  'Wisch eine Karte zur Seite, um sie ohne Umweg abzuhaken.':
    'Desliza una tarjeta a un lado para marcarla al instante.',
  'Nach Anbieter filtern': 'Filtrar por plataforma',
  'Über Filter schränkst du auf einzelne Streaming-Dienste ein oder blendest alles außerhalb deiner Abos aus.':
    'Con Filtros puedes limitarlo a plataformas concretas u ocultar todo lo que quede fuera de tus suscripciones.',
  Reihenfolge: 'Orden',
  'Sortiere nach Datum, Name oder Fortschritt, oder stell dir eine eigene Reihenfolge zusammen.':
    'Ordena por fecha, nombre o progreso, o crea tu propio orden.',

  'Wann welche Folge läuft, Woche für Woche.': 'Qué episodio se estrena cuándo, semana a semana.',
  'Woche wechseln': 'Cambiar de semana',
  'Blättere zwischen den Wochen und tippe einen Tag an, um seine Folgen zu sehen.':
    'Pasa de una semana a otra y toca un día para ver sus episodios.',
  'Direkt abhaken': 'Marcar aquí mismo',
  'Folgen lassen sich aus dem Kalender heraus als gesehen markieren.':
    'Los episodios se pueden marcar como vistos desde el propio calendario.',
  'Nur Watchlist': 'Solo la watchlist',
  'Der Filter reduziert den Kalender auf die Serien, die du dir gemerkt hast.':
    'El filtro reduce el calendario a las series que has guardado.',
  'Weitere Kalender': 'Más calendarios',
  'Über die Kopfzeile kommst du zum Serien-, Film- und Anime-Season-Kalender.':
    'Desde la cabecera llegas a los calendarios de series, películas y temporada de anime.',

  'Alles, was du bewertet hast, und alles, was noch fehlt.':
    'Todo lo que has valorado y todo lo que aún falta.',
  'Tippe einen Titel an, um deine Wertung zu setzen oder zu ändern.':
    'Toca un título para poner o cambiar tu valoración.',
  'Ansicht wechseln': 'Cambiar de vista',
  'Zwischen der cinematischen Ansicht und der kompakten Liste umschalten.':
    'Alterna entre la vista cinematográfica y la lista compacta.',
  Filtern: 'Filtrar',
  'Serien, Filme, Watchlist oder alles noch Unbewertete getrennt anzeigen.':
    'Muestra por separado series, películas, la watchlist o todo lo que sigue sin valorar.',
  'Eigene Liste durchsuchen': 'Buscar en tu lista',
  'Das Suchfeld findet einen Titel in deinem eigenen Bestand.':
    'El campo de búsqueda encuentra un título dentro de tu propia colección.',

  'Der Weg zu allem, was noch nicht in deiner Liste steht.':
    'El camino a todo lo que todavía no está en tu lista.',
  'Serien und Filme im gesamten Katalog finden.':
    'Encuentra series y películas en todo el catálogo.',
  'Der Knopf auf dem Poster legt einen Titel direkt in deine Liste.':
    'El botón del póster añade un título directamente a tu lista.',
  'Blendet aus, was du auf deinen aktiven Streaming-Diensten nicht sehen kannst.':
    'Oculta lo que no puedes ver en tus plataformas activas.',
  'Frühere Suchbegriffe stehen unter dem Feld bereit.':
    'Tus búsquedas anteriores te esperan debajo del campo.',

  'Vorschläge, die zu dem passen, was du schon geschaut hast.':
    'Sugerencias que encajan con lo que ya has visto.',
  'Empfehlungen auf Basis der Titel, die schon in deiner Liste liegen.':
    'Recomendaciones basadas en los títulos que ya tienes en la lista.',
  'Nach Genre filtern': 'Filtrar por género',
  'Die Genre-Leiste grenzt die Vorschläge ein.': 'La barra de géneros acota las sugerencias.',
  'Zeigt ausschließlich Titel auf deinen aktiven Abos.':
    'Muestra únicamente títulos de tus suscripciones activas.',
  'Direkt übernehmen': 'Añadir al momento',
  'Aus jeder Karte heraus landet ein Titel in deiner Liste.':
    'Desde cualquier tarjeta un título llega a tu lista.',

  'Dein Viewing-Universum in Zahlen.': 'Tu universo de visionado en cifras.',
  'Deine Zahlen': 'Tus cifras',
  'Watchtime, gesehene Episoden und abgeschlossene Serien auf einen Blick.':
    'Tiempo de visionado, episodios vistos y series terminadas de un vistazo.',
  'Top-Genres und Anbieter': 'Géneros y plataformas top',
  'Zeigt, worauf deine Watchtime wirklich entfällt.':
    'Muestra a qué se va realmente tu tiempo de visionado.',
  'Die Statistiken lassen sich als fertige Grafik weitergeben.':
    'Las estadísticas se pueden compartir como una imagen ya lista.',
  'Actor Universe': 'Actor Universe',
  'Verfolge, über welche Schauspieler deine Serien zusammenhängen.':
    'Sigue qué actores conectan tus series entre sí.',

  Seriendetails: 'Detalles de la serie',
  'Staffeln, Fortschritt und alles, was du zur Serie tun kannst.':
    'Temporadas, progreso y todo lo que puedes hacer con la serie.',
  'Auf die Watchlist': 'A la watchlist',
  'Nur Serien auf der Watchlist erscheinen unter Weiterschauen. Beim ersten Abhaken landet eine Serie automatisch dort.':
    'Solo las series de tu watchlist aparecen en Continuar viendo. Al marcar el primer episodio, la serie entra ahí automáticamente.',
  'Folgen abhaken': 'Marcar episodios',
  'Einzelne Folgen antippen oder über Alle verwalten eine ganze Staffel setzen.':
    'Toca episodios sueltos o marca una temporada entera desde Gestionar todo.',
  'Die Serie und jede einzelne Folge lassen sich bewerten.':
    'Puedes valorar la serie y cada episodio por separado.',
  'Starte einen Durchlauf von vorn, ohne deine bisherige Historie zu verlieren.':
    'Empieza una vuelta desde cero sin perder tu historial anterior.',
  'Freunde vergleichen': 'Comparar con amigos',
  'Der Freunde-Bereich zeigt, wie weit die anderen in dieser Serie sind.':
    'La sección de amigos muestra por dónde van los demás en esta serie.',

  Filmdetails: 'Detalles de la película',
  'Alles zum Film und was du damit machen kannst.':
    'Todo sobre la película y lo que puedes hacer con ella.',
  'Einmal antippen, und der Film wandert in deine Historie.':
    'Con un toque basta, la película pasa a tu historial.',
  'Deine Wertung fließt in Statistiken und Empfehlungen ein.':
    'Tu valoración alimenta las estadísticas y las recomendaciones.',
  'Von der Besetzung aus springst du zu anderen Titeln derselben Person.':
    'Desde el reparto saltas a otros títulos de la misma persona.',
  Reihen: 'Sagas',
  'Gehört der Film zu einer Reihe, siehst du hier die fehlenden Teile.':
    'Si la película forma parte de una saga, aquí ves las entregas que te faltan.',

  'Dein Konto, deine Zahlen und der Weg in alle Nebenbereiche.':
    'Tu cuenta, tus cifras y el acceso a todas las secciones.',
  'Deine Eckdaten': 'Tus datos clave',
  'Watchtime, Episoden, Filme und Manga in der Übersicht.':
    'Tiempo de visionado, episodios, películas y manga en un resumen.',
  'Alles Weitere': 'Todo lo demás',
  'Die Kacheln führen zu Badges, Pets, Rangliste, Verlauf und allem Weiteren.':
    'Las tarjetas llevan a insignias, mascotas, clasificación, historial y todo lo demás.',
  'Von hier geht es zu Konto, Design, Sprache und Benachrichtigungen.':
    'Desde aquí llegas a tu cuenta, el diseño, el idioma y las notificaciones.',

  'Was deine Freunde gerade schauen, und wer noch dazukommen will.':
    'Qué están viendo tus amigos y quién quiere unirse.',
  'Feed und Freunde': 'Feed y amigos',
  'Zwei Reiter: der Aktivitäts-Feed und deine Freundesliste.':
    'Dos pestañas: el feed de actividad y tu lista de amigos.',
  'Offene Freundschaftsanfragen annehmen oder ablehnen.':
    'Acepta o rechaza las solicitudes de amistad pendientes.',
  'Diskussionen und Chats': 'Debates y chats',
  'Von hier kommst du in den Diskussions-Feed und zu deinen Chats.':
    'Desde aquí llegas al feed de debates y a tus chats.',

  'Alles, was du dir schon verdient hast, und was noch fehlt.':
    'Todo lo que ya te has ganado y lo que aún falta.',
  'Fortschritt lesen': 'Leer el progreso',
  'Jedes Badge zeigt, wie viele Schritte bis zur Freischaltung fehlen.':
    'Cada insignia muestra cuántos pasos faltan para desbloquearla.',
  'Nach Seltenheit filtern': 'Filtrar por rareza',
  'Von Gewöhnlich bis Legendär getrennt durchsehen.': 'Repasa por separado de común a legendaria.',
  'Der Prüfen-Knopf rechnet deine Badges sofort neu durch.':
    'El botón de comprobar recalcula tus insignias al instante.',

  'Deine Begleiter wachsen mit jeder Folge, die du schaust.':
    'Tus compañeros crecen con cada episodio que ves.',
  'Füttern und pflegen': 'Alimentar y cuidar',
  'Ein gesundes Pet bringt dir mehr XP pro Episode.': 'Una mascota sana te da más XP por episodio.',
  'Aussehen ändern': 'Cambiar el aspecto',
  'Farben, Hintergründe und Accessoires lassen sich frei kombinieren.':
    'Colores, fondos y accesorios se combinan libremente.',
  'Mehrere Pets': 'Varias mascotas',
  'Du kannst weitere Pets erschaffen und zwischen ihnen wechseln.':
    'Puedes crear más mascotas y alternar entre ellas.',

  'Wie du im Vergleich zu anderen dastehst.': 'Cómo estás frente a los demás.',
  'Zeitraum wählen': 'Elegir el periodo',
  'Diesen Monat oder aller Zeiten, je nachdem was dich interessiert.':
    'Este mes o de todos los tiempos, según lo que te interese.',
  'Freunde oder alle': 'Amigos o todos',
  'Wechsle zwischen deinem Freundeskreis und allen Nutzern.':
    'Alterna entre tu círculo de amigos y todos los usuarios.',
  'Wertung verstehen': 'Cómo se cuenta',
  'Gezählt werden Episoden, Filme und die Watchtime, die dabei zusammenkommt.':
    'Cuentan los episodios, las películas y el tiempo de visionado que suman.',

  'Die Serien, bei denen du am weitesten hinterherhinkst.':
    'Las series en las que más atrasado vas.',
  'Rückstand sehen': 'Ver el retraso',
  'Je Serie stehen offene Episoden und der Fortschritt nebeneinander.':
    'Por serie ves los episodios pendientes y el progreso uno al lado del otro.',
  Sortieren: 'Ordenar',
  'Nach Episoden, Fortschritt, verbleibender Zeit oder zuletzt geschaut.':
    'Por episodios, progreso, tiempo restante o visto por última vez.',
  'Aus jeder Karte heraus geht es direkt in die Serie zum Abhaken.':
    'Cada tarjeta te lleva directo a la serie para ir marcando.',

  'Was von deinen Serien als Nächstes zurückkommt.': 'Cuál de tus series vuelve a continuación.',
  'Kommende Staffeln': 'Próximas temporadas',
  'Jede angekündigte Rückkehr mit Countdown bis zum Starttag.':
    'Cada regreso anunciado con cuenta atrás hasta su primer día.',
  'Eine Karte antippen führt direkt zur Serie.':
    'Tocar una tarjeta te lleva directamente a la serie.',
  'Woher das kommt': 'De dónde sale esto',
  'Gelistet werden angekündigte Staffeln der Serien in deiner Liste.':
    'Se listan las temporadas anunciadas de las series que tienes en la lista.',

  'Womit du streamst, bestimmt viele Filter in der App.':
    'Con qué plataformas ves determina muchos filtros de la app.',
  'Abos markieren': 'Marcar tus suscripciones',
  'Tippe die Dienste an, die du tatsächlich abonniert hast.':
    'Toca las plataformas que realmente tienes contratadas.',
  'Was das bewirkt': 'Qué cambia',
  'Erst damit funktionieren die Filter „Nur meine Abos" in Suche, Entdecken und Weiterschauen.':
    'Solo así funcionan los filtros de Solo mis plataformas en la búsqueda, en descubrir y en Continuar viendo.',
  Anbieterwechsel: 'Cambios de plataforma',
  'Verlässt eine deiner Serien einen Dienst, bekommst du eine Meldung.':
    'Si una de tus series abandona una plataforma, recibes un aviso.',

  'Was du zuletzt gesehen hast, chronologisch.': 'Lo último que has visto, en orden.',
  'Die letzten Tage oder Wochen getrennt durchsehen.':
    'Repasa por separado los últimos días o semanas.',
  'Das Suchfeld grenzt den Verlauf auf eine einzelne Serie ein.':
    'El campo de búsqueda reduce el historial a una sola serie.',
  'Eine Folge lässt sich von hier aus direkt noch einmal abhaken.':
    'Desde aquí puedes volver a marcar un episodio al momento.',

  'Ausgeblendete Serien': 'Series ocultas',
  'Alles, was du aus deinen Listen genommen hast.': 'Todo lo que has quitado de tus listas.',
  'Was hier landet': 'Qué acaba aquí',
  'Ausgeblendete Serien verschwinden aus Weiterschauen, Kalender und Statistiken.':
    'Las series ocultas desaparecen de Seguir viendo, del calendario y de las estadísticas.',
  Zurückholen: 'Recuperar',
  'Ein Tippen auf Weiter macht eine Serie wieder überall sichtbar.':
    'Un toque en Continuar vuelve a hacer visible una serie en todas partes.',
  'Nichts geht verloren': 'No se pierde nada',
  'Dein Fortschritt bleibt beim Ausblenden vollständig erhalten.':
    'Ocultar una serie mantiene tu progreso intacto.',

  'Deine Sehgewohnheiten über die Jahre.': 'Tus hábitos de visionado a lo largo de los años.',
  'Zeigt, wann du besonders viel und wann du kaum geschaut hast.':
    'Muestra cuándo viste mucho y cuándo casi nada.',
  'Wie oft du Sessions am Stück durchgezogen hast, samt Rekorden.':
    'Cuántas veces te has hecho una sesión del tirón, récords incluidos.',
  'Nach Genre eingrenzen': 'Acotar por género',
  'Die Auswertung lässt sich auf einzelne Genres beschränken.':
    'El análisis se puede limitar a géneros concretos.',

  Jahresrückblick: 'Resumen del año',
  'Dein Serienjahr als Abfolge von Karten.': 'Tu año de series como una serie de tarjetas.',
  'Nach links und rechts wischen blättert durch die Karten.':
    'Deslizar a izquierda y derecha pasa las tarjetas.',
  'Was drinsteht': 'Qué contiene',
  'Watchtime, Top-Serien, Lieblingsgenres und deine Rekorde des Jahres.':
    'Tiempo de visionado, series top, géneros favoritos y tus récords del año.',
  Weitergeben: 'Compartir',
  'Einzelne Karten lassen sich als Bild teilen.':
    'Las tarjetas sueltas se pueden compartir como imagen.',

  'Die Schauspieler, die deine Serien miteinander verbinden.':
    'Los actores que enlazan tus series entre sí.',
  'Verbindungen lesen': 'Leer las conexiones',
  'Linien zeigen, welche Schauspieler in mehreren deiner Serien mitspielen.':
    'Las líneas muestran qué actores aparecen en varias de tus series.',
  'Bewegen und zoomen': 'Mover y ampliar',
  'Ziehen verschiebt die Karte, Ansicht zurücksetzen bringt sie zurück.':
    'Arrastrar mueve el mapa, y Restablecer vista lo devuelve a su sitio.',
  'Personen öffnen': 'Abrir una persona',
  'Ein Tippen auf einen Namen öffnet dessen Serien und Filme.':
    'Tocar un nombre abre sus series y películas.',

  Geschmacksprofil: 'Perfil de gustos',
  'Empfehlungen aus deinen Bewertungen und Sehmustern.':
    'Recomendaciones a partir de tus valoraciones y hábitos.',
  'Empfehlungen erzeugen': 'Generar recomendaciones',
  'Der Knopf lässt frische Vorschläge für dich berechnen.':
    'El botón hace que se calculen sugerencias nuevas para ti.',
  Übernehmen: 'Añadir',
  'Was passt, wandert direkt in deine Liste.': 'Lo que encaje pasa directo a tu lista.',
  'Wird mit der Zeit besser': 'Mejora con el tiempo',
  'Je mehr du bewertest, desto genauer werden die Vorschläge.':
    'Cuanto más valoras, más afinadas son las sugerencias.',

  'Geschmacks-Match': 'Match de gustos',
  'Wie weit dein Geschmack und der deines Freundes auseinanderliegen.':
    'Cuánto se separan tu gusto y el de tu amigo.',
  Übereinstimmung: 'Coincidencia',
  'Ein Wert fasst zusammen, wie ähnlich ihr bewertet.':
    'Una cifra resume lo parecido que valoráis.',
  Gemeinsamkeiten: 'Puntos en común',
  'Gemeinsame Serien, Filme und Genres stehen einzeln aufgelistet.':
    'Las series, películas y géneros compartidos aparecen uno a uno.',
  'Perfekte Treffer': 'Coincidencias perfectas',
  'Titel, die ihr beide gleich stark mögt, werden hervorgehoben.':
    'Se destacan los títulos que os gustan por igual.',

  Freundesprofil: 'Perfil de un amigo',
  'Was dein Freund schaut und wie weit ihr auseinander seid.':
    'Qué ve tu amigo y cuánta distancia hay entre vosotros.',
  'Vorsprung sehen': 'Ver la ventaja',
  'Bei gemeinsamen Serien steht, wer wie viele Folgen voraus ist.':
    'En las series comunes ves quién va por delante y por cuántos episodios.',
  'Von hier kommst du direkt ins Geschmacks-Match.':
    'Desde aquí pasas directamente al match de gustos.',
  'Pet und Badges': 'Mascota e insignias',
  'Auch Pet, Streak und freigeschaltete Badges sind sichtbar.':
    'También se ven la mascota, la racha y las insignias desbloqueadas.',

  'Die Ansicht, die andere über deinen Link sehen.':
    'La vista que otras personas obtienen con tu enlace.',
  'Gezeigt werden die bewerteten Serien und Filme, nicht dein ganzer Bestand.':
    'Muestra las series y películas que has valorado, no toda tu colección.',
  'Serien und Filme lassen sich getrennt durchsehen.':
    'Las series y las películas se pueden ver por separado.',
  Sichtbarkeit: 'Visibilidad',
  'Ob es diese Seite überhaupt gibt, entscheidest du in den Einstellungen.':
    'Que esta página exista siquiera lo decides tú en los ajustes.',

  'Direkte Unterhaltungen mit deinen Freunden.': 'Conversaciones directas con tus amigos.',
  'Unterhaltung öffnen': 'Abrir una conversación',
  'Chats gibt es nur mit Leuten, mit denen du befreundet bist.':
    'Solo hay chats con personas con las que tienes amistad.',
  Aussehen: 'Aspecto',
  'Chat-Design und Hintergrund lassen sich je Unterhaltung ändern.':
    'El diseño y el fondo del chat se cambian por conversación.',
  'Blockieren und löschen': 'Bloquear y borrar',
  'Eine Unterhaltung lässt sich stummschalten, blockieren oder ganz entfernen.':
    'Una conversación se puede silenciar, bloquear o eliminar del todo.',

  'Schreiben, ohne die nächste Folge zu verraten.': 'Escribir sin destripar el siguiente episodio.',
  'Verdeckt die Nachricht, bis dein Gegenüber sie bewusst aufdeckt.':
    'Tapa el mensaje hasta que la otra persona decida descubrirlo.',
  'Bilder bis 8 MB lassen sich mit Bildunterschrift schicken.':
    'Se pueden enviar imágenes de hasta 8 MB con pie de foto.',
  'Über das Chat-Design änderst du Farbe und Hintergrund der Unterhaltung.':
    'Con el diseño del chat cambias el color y el fondo de la conversación.',

  'Alle Gespräche zu Serien, Filmen und Folgen an einem Ort.':
    'Todas las conversaciones sobre series, películas y episodios en un sitio.',
  'Bereich wählen': 'Elegir el ámbito',
  'Getrennt nach Serien, Filmen und einzelnen Episoden.':
    'Separado en series, películas y episodios sueltos.',
  Mitreden: 'Participar',
  'Ein Beitrag führt dich zur Diskussion, wo du antworten kannst.':
    'Una publicación te lleva al debate, donde puedes responder.',
  Spoilerschutz: 'Protección de spoilers',
  'Beiträge zu Folgen, die du noch nicht gesehen hast, bleiben verdeckt.':
    'Las publicaciones sobre episodios que no has visto siguen tapadas.',

  'Der schnelle Weg, viele Folgen auf einmal zu setzen.':
    'La vía rápida para marcar muchos episodios de una vez.',
  Sammelaktionen: 'Acciones en bloque',
  'Ganze Staffeln als gesehen oder wieder als ungesehen markieren.':
    'Marca temporadas enteras como vistas, o de nuevo como no vistas.',
  'Zähler ändern': 'Cambiar el contador',
  'Plus und Minus setzen, wie oft du eine Folge gesehen hast.':
    'Más y menos definen cuántas veces has visto un episodio.',
  'Zu jeder Folge kommst du von hier in ihre Diskussion.':
    'Desde aquí llegas al debate de cada episodio.',

  'Folgen-Diskussion': 'Debate del episodio',
  'Das Gespräch zu genau dieser Folge.': 'La conversación sobre este episodio exacto.',
  'Schreiben und antworten': 'Escribir y responder',
  'Beiträge verfassen und auf die Beiträge anderer antworten.':
    'Publica y responde a lo que han escrito los demás.',
  'Wer die Folge noch nicht gesehen hat, sieht den Inhalt erst nach dem Aufdecken.':
    'Quien no haya visto el episodio solo ve el contenido tras descubrirlo.',
  'Die Bewertung dieser Folge lässt sich hier direkt setzen.':
    'La valoración de este episodio se puede poner aquí mismo.',

  'Bewertung bearbeiten': 'Editar la valoración',
  'Deine Wertung, aufgeschlüsselt nach Genres.': 'Tu valoración, desglosada por géneros.',
  'Je Genre bewerten': 'Valorar por género',
  'Jedes Genre bekommt einen eigenen Wert, daraus entsteht die Gesamtnote.':
    'Cada género recibe su propio valor y de ahí sale la nota global.',
  'Erst mit Speichern landet die Änderung in deiner Liste.':
    'El cambio no llega a tu lista hasta que guardas.',
  'Eine Bewertung lässt sich vollständig zurücknehmen.':
    'Una valoración se puede retirar por completo.',

  'Neue Serien und Staffelstarts, unabhängig von deiner Liste.':
    'Series nuevas y estrenos de temporada, al margen de tu lista.',
  'Premieren sehen': 'Ver los estrenos',
  'Kommende Starts mit Countdown bis zum ersten Tag.':
    'Próximos estrenos con cuenta atrás hasta su primer día.',
  'Die Genre-Suche grenzt die Premieren ein.': 'La búsqueda por género acota los estrenos.',
  'Was dich interessiert, landet mit einem Fingertipp in deiner Liste.':
    'Lo que te interese llega a tu lista con un solo toque.',

  'Kinostarts und Streaming-Releases in deiner Region.':
    'Estrenos de cine y lanzamientos en streaming de tu región.',
  'Kino oder Streaming': 'Cine o streaming',
  'Zwischen Kinostarts und digitalen Releases umschalten.':
    'Alterna entre estrenos de cine y lanzamientos digitales.',
  'Nach Datum': 'Por fecha',
  'Die Liste läuft chronologisch, der heutige Tag ist markiert.':
    'La lista va en orden cronológico y el día de hoy está marcado.',
  Vormerken: 'Guardar para luego',
  'Ein Film lässt sich von hier direkt in deine Liste legen.':
    'Desde aquí puedes poner una película en tu lista.',

  'Die laufende und die kommende Anime-Saison im Überblick.':
    'La temporada de anime en curso y la siguiente de un vistazo.',
  'Nach Studio filtern': 'Filtrar por estudio',
  'Die Saison lässt sich auf einzelne Studios eingrenzen.':
    'La temporada se puede acotar a estudios concretos.',
  'Status sehen': 'Ver el estado',
  'Fortlaufend, beendet oder noch nicht gestartet, jeweils mit Countdown.':
    'En emisión, terminado o aún sin empezar, cada uno con su cuenta atrás.',
  'Ein Titel wandert mit einem Fingertipp in deine Serienliste.':
    'Un toque lleva un título a tu lista de series.',

  'Konto, Aussehen, Benachrichtigungen und deine Daten.':
    'Cuenta, aspecto, notificaciones y tus datos.',
  'Push ein- und ausschalten und einstellen, worüber du informiert wirst.':
    'Activa o desactiva las push y elige de qué quieres enterarte.',
  'Aussehen und Sprache': 'Aspecto e idioma',
  'Design, Anzeigegröße, Startseiten-Layout und Sprache liegen hier.':
    'Diseño, tamaño de visualización, layout del inicio e idioma están aquí.',
  'Import und Export': 'Importar y exportar',
  'Deine Watch-History als JSON sichern oder als CSV weitergeben.':
    'Guarda tu historial en JSON o compártelo en CSV.',

  'Die ganze App nimmt deine Farben an.': 'Toda la app adopta tus colores.',
  'Farben setzen': 'Definir los colores',
  'Haupt-, Akzent- und Hintergrundfarbe lassen sich einzeln wählen.':
    'El color principal, el de acento y el de fondo se eligen por separado.',
  Vorlagen: 'Plantillas',
  'Fertige Kombinationen als Startpunkt, danach frei anpassbar.':
    'Combinaciones ya hechas como punto de partida, ajustables después.',
  'Alle Farben auf Standard bringt dich jederzeit zurück.':
    'Restablecer todos los colores te devuelve al inicio cuando quieras.',

  'Startseiten-Layout': 'Layout del inicio',
  'Die Vorschau ist der Editor.': 'La vista previa es el editor.',
  'Reihenfolge ändern': 'Cambiar el orden',
  'Halten und ziehen verschiebt einen Abschnitt.': 'Mantener y arrastrar mueve una sección.',
  'Das Auge blendet einen Abschnitt aus, ohne ihn zu verlieren.':
    'El ojo oculta una sección sin llegar a perderla.',
  'Navigation belegen': 'Asignar la navegación',
  'Auch die vier freien Plätze der unteren Leiste stellst du hier ein.':
    'Los cuatro huecos libres de la barra inferior también se definen aquí.',

  'Feedback und Bugs': 'Comentarios y errores',
  'Der direkte Draht, wenn etwas klemmt oder fehlt.': 'La vía directa cuando algo falla o falta.',
  'Ticket erstellen': 'Crear un ticket',
  'Fehler melden oder ein Feature vorschlagen.': 'Informa de un error o propón una función.',
  'Deine Tickets': 'Tus tickets',
  'Offene und archivierte Meldungen stehen getrennt.':
    'Los avisos abiertos y los archivados van por separado.',
  'Sobald jemand reagiert, siehst du es an deinem Ticket.':
    'En cuanto alguien responde, lo ves en tu ticket.',

  'Manga-Sammlung': 'Colección de manga',
  'Der Einstieg in alles rund um Manga, Manhwa und Manhua.':
    'La entrada a todo lo relacionado con manga, manhwa y manhua.',
  'Suchen und hinzufügen': 'Buscar y añadir',
  'Neue Titel findest du über die Manga-Suche.':
    'Los títulos nuevos llegan desde la búsqueda de manga.',
  'Sammlung filtern': 'Filtrar la colección',
  'Am Lesen, Geplant, Abgeschlossen oder Abgebrochen getrennt anzeigen.':
    'Muestra por separado Leyendo, Pendiente, Completado o Abandonado.',
  Bereiche: 'Secciones',
  'Leseliste, Bewertungen, Entdecken, Statistiken und Journey erreichst du von hier.':
    'Desde aquí llegas a la lista de lectura, las valoraciones, descubrir, las estadísticas y el trayecto.',

  'Was gerade offen ist, in deiner Reihenfolge.': 'Lo que tienes pendiente, en tu orden.',
  'Kapitel setzen': 'Fijar el capítulo',
  'Ein Kapitel weiter oder zurück, direkt auf der Karte.':
    'Un capítulo adelante o atrás, en la propia tarjeta.',
  'Nach Fortschritt, Bewertung oder Titel ordnen.': 'Ordena por progreso, valoración o título.',
  'Nur Titel mit Status Lese ich oder Geplant erscheinen in der Leseliste.':
    'Solo los títulos con estado Leyendo o Pendiente aparecen en la lista de lectura.',

  'Manga-Suche': 'Búsqueda de manga',
  'Der Weg zu allem, was noch nicht in deiner Sammlung ist.':
    'El camino a todo lo que aún no está en tu colección.',
  'Manga, Manhwa und Manhua über den gesamten Bestand finden.':
    'Encuentra manga, manhwa y manhua en todo el catálogo.',
  'Ein Titel landet mit einem Fingertipp in deiner Sammlung.':
    'Un toque mete un título en tu colección.',
  'Status setzen': 'Definir el estado',
  'Beim Hinzufügen legst du fest, ob du liest, planst oder schon durch bist.':
    'Al añadirlo decides si lo estás leyendo, lo tienes planeado o ya lo terminaste.',

  'Alles, was du bewertet hast, und was noch offen ist.':
    'Todo lo que has valorado y lo que sigue pendiente.',
  'Nach Bewertung auf- oder absteigend ordnen.':
    'Ordena por valoración, de menor a mayor o al revés.',
  'Unbewertetes finden': 'Encontrar lo no valorado',
  'Der Filter zeigt, wo noch eine Wertung fehlt.':
    'El filtro muestra dónde falta todavía una valoración.',

  'Vorschläge und beliebte Titel, die zu dir passen.':
    'Sugerencias y títulos populares que encajan contigo.',
  'Empfehlungen auf Basis deiner Sammlung und Bewertungen.':
    'Recomendaciones basadas en tu colección y tus valoraciones.',
  'Beliebt und Formate': 'Populares y formatos',
  'Zwischen Empfehlungen, Beliebtem und einzelnen Formaten wechseln.':
    'Alterna entre recomendaciones, populares y formatos concretos.',
  'Aus jeder Karte heraus landet ein Titel in deiner Sammlung.':
    'Desde cualquier tarjeta un título llega a tu colección.',

  'Dein Lese-Universum in Zahlen.': 'Tu universo de lectura en cifras.',
  'Gelesene Kapitel, Titel und Durchschnittsbewertung auf einen Blick.':
    'Capítulos leídos, títulos y valoración media de un vistazo.',
  'Genres und Formate': 'Géneros y formatos',
  'Zeigt, worauf deine Lesezeit wirklich entfällt.':
    'Muestra a qué se va realmente tu tiempo de lectura.',
  'Die Auswertung lässt sich als Bild teilen.': 'El análisis se puede compartir como imagen.',

  'Manga aufholen': 'Ponerse al día con el manga',
  'Wo du beim Lesen am weitesten zurückliegst.': 'Dónde vas más atrasado leyendo.',
  'Je Titel stehen offene Kapitel und Fortschritt nebeneinander.':
    'Por título ves los capítulos pendientes y el progreso uno al lado del otro.',
  'Bis zu einem bestimmten Kapitel auf einmal als gelesen markieren.':
    'Marca de una vez todo hasta un capítulo concreto como leído.',
  Erscheinungsrhythmus: 'Ritmo de publicación',
  'Zu vielen Titeln steht, in welchem Abstand neue Kapitel kommen.':
    'En muchos títulos ves con qué frecuencia salen capítulos nuevos.',

  'Lese-Journey': 'Trayecto de lectura',
  'Deine Lese-Trends über die Zeit.': 'Tus tendencias de lectura con el tiempo.',
  'Zeigt, wann du viel und wann du kaum gelesen hast.':
    'Muestra cuándo leíste mucho y cuándo casi nada.',
  'Wie viele Tage am Stück du gelesen hast.': 'Cuántos días seguidos llevas leyendo.',
  'Welche Genres und Formate deine Sammlung prägen.': 'Qué géneros y formatos marcan tu colección.',

  'Deine letzten Kapitel, chronologisch.': 'Tus últimos capítulos, en orden.',
  'Die letzten Tage, Wochen oder Monate getrennt durchsehen.':
    'Repasa por separado los últimos días, semanas o meses.',
  'Ein Eintrag führt zurück zum Titel und seinem Stand.':
    'Una entrada te devuelve al título y al punto donde lo dejaste.',
  'Zeigt, wie gleichmäßig du zuletzt gelesen hast.':
    'Muestra con qué regularidad has leído últimamente.',

  'Ausgeblendete Manga': 'Manga ocultos',
  'Titel, die du aus deiner Sammlung genommen hast.': 'Títulos que has quitado de tu colección.',
  'Ausgeblendete Titel verschwinden aus Leseliste, Aufholen und Statistiken.':
    'Los títulos ocultos desaparecen de la lista de lectura, de Ponerse al día y de las estadísticas.',
  'Einblenden macht einen Titel wieder überall sichtbar.':
    'Mostrar vuelve a hacer visible un título en todas partes.',
  'Dein Kapitel-Fortschritt bleibt beim Ausblenden erhalten.':
    'Ocultar un título mantiene tu progreso de capítulos.',

  'Manga-Details': 'Detalles del manga',
  'Alles zum Titel und was du damit machen kannst.':
    'Todo sobre el título y lo que puedes hacer con él.',
  'Fortschritt setzen': 'Fijar el progreso',
  'Aktuelles Kapitel ändern oder bis zu einem Kapitel alles als gelesen markieren.':
    'Cambia el capítulo actual o marca como leído todo hasta un capítulo.',
  'Lese ich, Geplant, Abgeschlossen, Pausiert oder Abgebrochen.':
    'Leyendo, Pendiente, Completado, En pausa o Abandonado.',
  'Bewerten und notieren': 'Valorar y anotar',
  'Wertung setzen und eigene Notizen zum Titel hinterlegen.':
    'Pon una valoración y guarda tus propias notas sobre el título.',
};

export default tour;
