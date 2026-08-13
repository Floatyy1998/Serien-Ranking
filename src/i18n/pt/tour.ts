/** Seitenhilfe („Das kannst du hier") — Deutsch → Portugiesisch. */

const tour: Record<string, string> = {
  Rückmeldung: 'A resposta',
  'Das kannst du hier': 'O que dá para fazer aqui',
  'Seitenhilfen zurücksetzen': 'Redefinir as dicas de página',
  'Die Kurzhilfe erscheint beim nächsten Besuch jeder Seite erneut':
    'As dicas curtas vão aparecer de novo na próxima vez que você abrir cada página',
  'Seitenhilfen werden wieder angezeigt': 'As dicas de página voltam a aparecer',

  Startseite: 'Início',
  'Dein Einstieg in alles, was gerade läuft.': 'Seu ponto de partida para tudo o que está rolando.',
  'Die oberste Reihe bringt dich mit einem Fingertipp zur nächsten offenen Folge.':
    'A primeira fileira leva você ao próximo episódio pendente com um toque.',
  'Streak halten': 'Manter a sequência',
  'Deine Streak wächst an jedem Tag, an dem du mindestens eine Folge abhakst.':
    'Sua sequência cresce em todo dia em que você marca pelo menos um episódio.',
  'Die Glocke sammelt neue Folgen, Anbieterwechsel und Anfragen von Freunden.':
    'O sino reúne episódios novos, mudanças de plataforma e pedidos de amizade.',
  'Startseite umbauen': 'Reorganizar o início',
  'Unter Einstellungen und Homepage Layout sortierst du die Abschnitte um oder blendest sie aus.':
    'Em Configurações e Layout da tela inicial você reordena ou esconde as seções.',

  'Alle Serien mit einer offenen Folge, in der Reihenfolge, die du willst.':
    'Todas as séries com um episódio pendente, na ordem que você quiser.',
  'Folge abhaken': 'Marcar um episódio',
  'Tippe eine Karte an, um die nächste Folge als gesehen zu markieren.':
    'Toque em um cartão para marcar o próximo episódio como visto.',
  Wischen: 'Deslizar',
  'Wisch eine Karte zur Seite, um sie ohne Umweg abzuhaken.':
    'Deslize um cartão para o lado para marcá-lo na hora.',
  'Nach Anbieter filtern': 'Filtrar por plataforma',
  'Über Filter schränkst du auf einzelne Streaming-Dienste ein oder blendest alles außerhalb deiner Abos aus.':
    'Com Filtros você limita a plataformas específicas ou esconde tudo que está fora das suas assinaturas.',
  Reihenfolge: 'Ordem',
  'Sortiere nach Datum, Name oder Fortschritt, oder stell dir eine eigene Reihenfolge zusammen.':
    'Ordene por data, nome ou progresso, ou monte uma ordem própria.',

  'Wann welche Folge läuft, Woche für Woche.': 'Qual episódio estreia quando, semana a semana.',
  'Woche wechseln': 'Trocar de semana',
  'Blättere zwischen den Wochen und tippe einen Tag an, um seine Folgen zu sehen.':
    'Navegue entre as semanas e toque em um dia para ver os episódios dele.',
  'Direkt abhaken': 'Marcar por aqui mesmo',
  'Folgen lassen sich aus dem Kalender heraus als gesehen markieren.':
    'Dá para marcar episódios como vistos direto no calendário.',
  'Nur Watchlist': 'Só a watchlist',
  'Der Filter reduziert den Kalender auf die Serien, die du dir gemerkt hast.':
    'O filtro reduz o calendário às séries que você guardou.',
  'Weitere Kalender': 'Mais calendários',
  'Über die Kopfzeile kommst du zum Serien-, Film- und Anime-Season-Kalender.':
    'Pelo cabeçalho você chega aos calendários de séries, filmes e temporada de anime.',

  'Alles, was du bewertet hast, und alles, was noch fehlt.':
    'Tudo o que você avaliou e tudo o que ainda falta.',
  'Tippe einen Titel an, um deine Wertung zu setzen oder zu ändern.':
    'Toque em um título para dar ou mudar sua nota.',
  'Ansicht wechseln': 'Trocar de visualização',
  'Zwischen der cinematischen Ansicht und der kompakten Liste umschalten.':
    'Alterne entre a visão cinematográfica e a lista compacta.',
  Filtern: 'Filtrar',
  'Serien, Filme, Watchlist oder alles noch Unbewertete getrennt anzeigen.':
    'Mostre separadamente séries, filmes, a watchlist ou tudo que segue sem nota.',
  'Eigene Liste durchsuchen': 'Buscar na sua lista',
  'Das Suchfeld findet einen Titel in deinem eigenen Bestand.':
    'O campo de busca encontra um título dentro do seu próprio acervo.',

  'Der Weg zu allem, was noch nicht in deiner Liste steht.':
    'O caminho para tudo o que ainda não está na sua lista.',
  'Serien und Filme im gesamten Katalog finden.': 'Encontre séries e filmes em todo o catálogo.',
  'Der Knopf auf dem Poster legt einen Titel direkt in deine Liste.':
    'O botão no pôster coloca um título direto na sua lista.',
  'Blendet aus, was du auf deinen aktiven Streaming-Diensten nicht sehen kannst.':
    'Esconde o que você não consegue assistir nas suas plataformas ativas.',
  'Frühere Suchbegriffe stehen unter dem Feld bereit.':
    'Suas buscas anteriores ficam logo abaixo do campo.',

  'Vorschläge, die zu dem passen, was du schon geschaut hast.':
    'Sugestões que combinam com o que você já assistiu.',
  'Empfehlungen auf Basis der Titel, die schon in deiner Liste liegen.':
    'Recomendações com base nos títulos que já estão na sua lista.',
  'Nach Genre filtern': 'Filtrar por gênero',
  'Die Genre-Leiste grenzt die Vorschläge ein.': 'A barra de gêneros afunila as sugestões.',
  'Zeigt ausschließlich Titel auf deinen aktiven Abos.':
    'Mostra apenas títulos nas suas assinaturas ativas.',
  'Direkt übernehmen': 'Adicionar na hora',
  'Aus jeder Karte heraus landet ein Titel in deiner Liste.':
    'A partir de qualquer cartão um título vai para a sua lista.',

  'Dein Viewing-Universum in Zahlen.': 'Seu universo de séries e filmes em números.',
  'Deine Zahlen': 'Seus números',
  'Watchtime, gesehene Episoden und abgeschlossene Serien auf einen Blick.':
    'Tempo assistido, episódios vistos e séries concluídas de relance.',
  'Top-Genres und Anbieter': 'Gêneros e plataformas em destaque',
  'Zeigt, worauf deine Watchtime wirklich entfällt.':
    'Mostra para onde vai de fato o seu tempo assistido.',
  'Die Statistiken lassen sich als fertige Grafik weitergeben.':
    'As estatísticas podem ser compartilhadas como uma imagem pronta.',
  'Actor Universe': 'Actor Universe',
  'Verfolge, über welche Schauspieler deine Serien zusammenhängen.':
    'Acompanhe quais atores conectam as suas séries entre si.',

  Seriendetails: 'Detalhes da série',
  'Staffeln, Fortschritt und alles, was du zur Serie tun kannst.':
    'Temporadas, progresso e tudo o que dá para fazer com a série.',
  'Auf die Watchlist': 'Para a watchlist',
  'Nur Serien auf der Watchlist erscheinen unter Weiterschauen. Beim ersten Abhaken landet eine Serie automatisch dort.':
    'Só as séries da sua watchlist aparecem em Continuar assistindo. Ao marcar o primeiro episódio, a série vai para lá automaticamente.',
  'Folgen abhaken': 'Marcar episódios',
  'Einzelne Folgen antippen oder über Alle verwalten eine ganze Staffel setzen.':
    'Toque em episódios avulsos ou marque uma temporada inteira em Gerenciar tudo.',
  'Die Serie und jede einzelne Folge lassen sich bewerten.':
    'Dá para avaliar a série e cada episódio separadamente.',
  'Starte einen Durchlauf von vorn, ohne deine bisherige Historie zu verlieren.':
    'Comece uma nova rodada do zero sem perder o seu histórico.',
  'Freunde vergleichen': 'Comparar com amigos',
  'Der Freunde-Bereich zeigt, wie weit die anderen in dieser Serie sind.':
    'A seção de amigos mostra em que ponto os outros estão nesta série.',

  Filmdetails: 'Detalhes do filme',
  'Alles zum Film und was du damit machen kannst.':
    'Tudo sobre o filme e o que dá para fazer com ele.',
  'Einmal antippen, und der Film wandert in deine Historie.':
    'Um toque basta e o filme vai para o seu histórico.',
  'Deine Wertung fließt in Statistiken und Empfehlungen ein.':
    'Sua nota alimenta as estatísticas e as recomendações.',
  'Von der Besetzung aus springst du zu anderen Titeln derselben Person.':
    'A partir do elenco você pula para outros títulos da mesma pessoa.',
  Reihen: 'Franquias',
  'Gehört der Film zu einer Reihe, siehst du hier die fehlenden Teile.':
    'Se o filme faz parte de uma franquia, você vê aqui as partes que faltam.',

  'Dein Konto, deine Zahlen und der Weg in alle Nebenbereiche.':
    'Sua conta, seus números e o caminho para todas as outras áreas.',
  'Deine Eckdaten': 'Seus números principais',
  'Watchtime, Episoden, Filme und Manga in der Übersicht.':
    'Tempo assistido, episódios, filmes e mangás em um resumo.',
  'Alles Weitere': 'Todo o resto',
  'Die Kacheln führen zu Badges, Pets, Rangliste, Verlauf und allem Weiteren.':
    'Os blocos levam a conquistas, pets, ranking, histórico e todo o resto.',
  'Von hier geht es zu Konto, Design, Sprache und Benachrichtigungen.':
    'Daqui você chega à conta, ao tema, ao idioma e às notificações.',

  'Was deine Freunde gerade schauen, und wer noch dazukommen will.':
    'O que seus amigos estão assistindo e quem ainda quer entrar.',
  'Feed und Freunde': 'Feed e amigos',
  'Zwei Reiter: der Aktivitäts-Feed und deine Freundesliste.':
    'Duas abas: o feed de atividades e sua lista de amigos.',
  'Offene Freundschaftsanfragen annehmen oder ablehnen.':
    'Aceite ou recuse os pedidos de amizade pendentes.',
  'Diskussionen und Chats': 'Discussões e conversas',
  'Von hier kommst du in den Diskussions-Feed und zu deinen Chats.':
    'Daqui você chega ao feed de discussões e às suas conversas.',

  'Alles, was du dir schon verdient hast, und was noch fehlt.':
    'Tudo o que você já conquistou e o que ainda falta.',
  'Fortschritt lesen': 'Ler o progresso',
  'Jedes Badge zeigt, wie viele Schritte bis zur Freischaltung fehlen.':
    'Cada conquista mostra quantos passos faltam para desbloqueá-la.',
  'Nach Seltenheit filtern': 'Filtrar por raridade',
  'Von Gewöhnlich bis Legendär getrennt durchsehen.': 'Percorra separadamente de comum a lendária.',
  'Der Prüfen-Knopf rechnet deine Badges sofort neu durch.':
    'O botão de verificar recalcula suas conquistas na hora.',

  'Deine Begleiter wachsen mit jeder Folge, die du schaust.':
    'Seus companheiros crescem a cada episódio que você assiste.',
  'Füttern und pflegen': 'Alimentar e cuidar',
  'Ein gesundes Pet bringt dir mehr XP pro Episode.': 'Um pet saudável rende mais XP por episódio.',
  'Aussehen ändern': 'Mudar a aparência',
  'Farben, Hintergründe und Accessoires lassen sich frei kombinieren.':
    'Cores, fundos e acessórios podem ser combinados livremente.',
  'Mehrere Pets': 'Vários pets',
  'Du kannst weitere Pets erschaffen und zwischen ihnen wechseln.':
    'Você pode criar mais pets e alternar entre eles.',

  'Wie du im Vergleich zu anderen dastehst.': 'Como você está em relação aos outros.',
  'Zeitraum wählen': 'Escolher o período',
  'Diesen Monat oder aller Zeiten, je nachdem was dich interessiert.':
    'Este mês ou de todos os tempos, conforme o que te interessa.',
  'Freunde oder alle': 'Amigos ou todos',
  'Wechsle zwischen deinem Freundeskreis und allen Nutzern.':
    'Alterne entre o seu círculo de amigos e todos os usuários.',
  'Wertung verstehen': 'Como se conta',
  'Gezählt werden Episoden, Filme und die Watchtime, die dabei zusammenkommt.':
    'Contam os episódios, os filmes e o tempo assistido que eles somam.',

  'Die Serien, bei denen du am weitesten hinterherhinkst.':
    'As séries em que você está mais atrasado.',
  'Rückstand sehen': 'Ver o atraso',
  'Je Serie stehen offene Episoden und der Fortschritt nebeneinander.':
    'Por série você vê os episódios pendentes e o progresso lado a lado.',
  Sortieren: 'Ordenar',
  'Nach Episoden, Fortschritt, verbleibender Zeit oder zuletzt geschaut.':
    'Por episódios, progresso, tempo restante ou último visto.',
  'Aus jeder Karte heraus geht es direkt in die Serie zum Abhaken.':
    'Cada cartão leva direto para a série, para ir marcando.',

  'Was von deinen Serien als Nächstes zurückkommt.': 'Qual das suas séries volta a seguir.',
  'Kommende Staffeln': 'Próximas temporadas',
  'Jede angekündigte Rückkehr mit Countdown bis zum Starttag.':
    'Cada retorno anunciado com contagem regressiva até o primeiro dia.',
  'Eine Karte antippen führt direkt zur Serie.': 'Tocar em um cartão leva direto à série.',
  'Woher das kommt': 'De onde isso vem',
  'Gelistet werden angekündigte Staffeln der Serien in deiner Liste.':
    'São listadas as temporadas anunciadas das séries que estão na sua lista.',

  'Womit du streamst, bestimmt viele Filter in der App.':
    'As plataformas que você usa definem muitos filtros do app.',
  'Abos markieren': 'Marcar suas assinaturas',
  'Tippe die Dienste an, die du tatsächlich abonniert hast.':
    'Toque nos serviços que você realmente assina.',
  'Was das bewirkt': 'O que isso muda',
  'Erst damit funktionieren die Filter „Nur meine Abos" in Suche, Entdecken und Weiterschauen.':
    'Só assim os filtros de Só minhas plataformas funcionam na busca, no descobrir e em Continuar assistindo.',
  Anbieterwechsel: 'Mudanças de plataforma',
  'Verlässt eine deiner Serien einen Dienst, bekommst du eine Meldung.':
    'Se uma das suas séries sai de um serviço, você recebe um aviso.',

  'Was du zuletzt gesehen hast, chronologisch.': 'O que você viu por último, em ordem.',
  'Die letzten Tage oder Wochen getrennt durchsehen.':
    'Percorra separadamente os últimos dias ou semanas.',
  'Das Suchfeld grenzt den Verlauf auf eine einzelne Serie ein.':
    'O campo de busca reduz o histórico a uma única série.',
  'Eine Folge lässt sich von hier aus direkt noch einmal abhaken.':
    'Daqui dá para marcar um episódio de novo na hora.',

  'Ausgeblendete Serien': 'Séries ocultas',
  'Alles, was du aus deinen Listen genommen hast.': 'Tudo o que você tirou das suas listas.',
  'Was hier landet': 'O que vem parar aqui',
  'Ausgeblendete Serien verschwinden aus Weiterschauen, Kalender und Statistiken.':
    'Séries ocultas somem de Continuar assistindo, do calendário e das estatísticas.',
  Zurückholen: 'Trazer de volta',
  'Ein Tippen auf Weiter macht eine Serie wieder überall sichtbar.':
    'Um toque em Continuar deixa a série visível em todo lugar de novo.',
  'Nichts geht verloren': 'Nada se perde',
  'Dein Fortschritt bleibt beim Ausblenden vollständig erhalten.':
    'Ocultar uma série mantém o seu progresso intacto.',

  'Deine Sehgewohnheiten über die Jahre.': 'Seus hábitos de consumo ao longo dos anos.',
  'Zeigt, wann du besonders viel und wann du kaum geschaut hast.':
    'Mostra quando você assistiu muito e quando quase não assistiu.',
  'Wie oft du Sessions am Stück durchgezogen hast, samt Rekorden.':
    'Quantas vezes você emendou uma sessão inteira, recordes incluídos.',
  'Nach Genre eingrenzen': 'Restringir por gênero',
  'Die Auswertung lässt sich auf einzelne Genres beschränken.':
    'A análise pode ser limitada a gêneros específicos.',

  Jahresrückblick: 'Retrospectiva do ano',
  'Dein Serienjahr als Abfolge von Karten.': 'Seu ano de séries como uma sequência de cartões.',
  'Nach links und rechts wischen blättert durch die Karten.':
    'Deslizar para a esquerda e para a direita passa os cartões.',
  'Was drinsteht': 'O que tem dentro',
  'Watchtime, Top-Serien, Lieblingsgenres und deine Rekorde des Jahres.':
    'Tempo assistido, séries do topo, gêneros favoritos e seus recordes do ano.',
  Weitergeben: 'Compartilhar',
  'Einzelne Karten lassen sich als Bild teilen.':
    'Cartões individuais podem ser compartilhados como imagem.',

  'Die Schauspieler, die deine Serien miteinander verbinden.':
    'Os atores que ligam as suas séries entre si.',
  'Verbindungen lesen': 'Ler as conexões',
  'Linien zeigen, welche Schauspieler in mehreren deiner Serien mitspielen.':
    'As linhas mostram quais atores aparecem em mais de uma das suas séries.',
  'Bewegen und zoomen': 'Mover e ampliar',
  'Ziehen verschiebt die Karte, Ansicht zurücksetzen bringt sie zurück.':
    'Arrastar move o mapa, e Redefinir visualização o traz de volta.',
  'Personen öffnen': 'Abrir uma pessoa',
  'Ein Tippen auf einen Namen öffnet dessen Serien und Filme.':
    'Tocar em um nome abre as séries e os filmes dessa pessoa.',

  Geschmacksprofil: 'Perfil de gosto',
  'Empfehlungen aus deinen Bewertungen und Sehmustern.':
    'Recomendações tiradas das suas notas e dos seus hábitos.',
  'Empfehlungen erzeugen': 'Gerar recomendações',
  'Der Knopf lässt frische Vorschläge für dich berechnen.':
    'O botão manda calcular sugestões novas para você.',
  Übernehmen: 'Adicionar',
  'Was passt, wandert direkt in deine Liste.': 'O que combinar vai direto para a sua lista.',
  'Wird mit der Zeit besser': 'Melhora com o tempo',
  'Je mehr du bewertest, desto genauer werden die Vorschläge.':
    'Quanto mais você avalia, mais certeiras ficam as sugestões.',

  'Geschmacks-Match': 'Match de gosto',
  'Wie weit dein Geschmack und der deines Freundes auseinanderliegen.':
    'O quanto o seu gosto e o do seu amigo se afastam.',
  Übereinstimmung: 'Compatibilidade',
  'Ein Wert fasst zusammen, wie ähnlich ihr bewertet.':
    'Um número resume o quanto vocês avaliam de forma parecida.',
  Gemeinsamkeiten: 'Pontos em comum',
  'Gemeinsame Serien, Filme und Genres stehen einzeln aufgelistet.':
    'Séries, filmes e gêneros em comum aparecem um a um.',
  'Perfekte Treffer': 'Combinações perfeitas',
  'Titel, die ihr beide gleich stark mögt, werden hervorgehoben.':
    'Títulos que vocês dois gostam igualmente ficam em destaque.',

  Freundesprofil: 'Perfil de amigo',
  'Was dein Freund schaut und wie weit ihr auseinander seid.':
    'O que o seu amigo assiste e a distância entre vocês.',
  'Vorsprung sehen': 'Ver a dianteira',
  'Bei gemeinsamen Serien steht, wer wie viele Folgen voraus ist.':
    'Nas séries em comum você vê quem está na frente e por quantos episódios.',
  'Von hier kommst du direkt ins Geschmacks-Match.': 'Daqui você vai direto para o match de gosto.',
  'Pet und Badges': 'Pet e conquistas',
  'Auch Pet, Streak und freigeschaltete Badges sind sichtbar.':
    'Pet, sequência e conquistas desbloqueadas também ficam visíveis.',

  'Die Ansicht, die andere über deinen Link sehen.':
    'A visão que as outras pessoas têm pelo seu link.',
  'Gezeigt werden die bewerteten Serien und Filme, nicht dein ganzer Bestand.':
    'Mostra as séries e os filmes que você avaliou, não todo o seu acervo.',
  'Serien und Filme lassen sich getrennt durchsehen.':
    'Séries e filmes podem ser vistos separadamente.',
  Sichtbarkeit: 'Visibilidade',
  'Ob es diese Seite überhaupt gibt, entscheidest du in den Einstellungen.':
    'Se essa página existe ou não, quem decide é você nas configurações.',

  'Direkte Unterhaltungen mit deinen Freunden.': 'Conversas diretas com os seus amigos.',
  'Unterhaltung öffnen': 'Abrir uma conversa',
  'Chats gibt es nur mit Leuten, mit denen du befreundet bist.':
    'Só existem conversas com pessoas de quem você é amigo.',
  Aussehen: 'Aparência',
  'Chat-Design und Hintergrund lassen sich je Unterhaltung ändern.':
    'O tema e o fundo da conversa podem ser mudados em cada conversa.',
  'Blockieren und löschen': 'Bloquear e apagar',
  'Eine Unterhaltung lässt sich stummschalten, blockieren oder ganz entfernen.':
    'Uma conversa pode ser silenciada, bloqueada ou removida por completo.',

  'Schreiben, ohne die nächste Folge zu verraten.': 'Escrever sem entregar o próximo episódio.',
  'Verdeckt die Nachricht, bis dein Gegenüber sie bewusst aufdeckt.':
    'Cobre a mensagem até a outra pessoa decidir revelá-la.',
  'Bilder bis 8 MB lassen sich mit Bildunterschrift schicken.':
    'Dá para enviar imagens de até 8 MB com legenda.',
  'Über das Chat-Design änderst du Farbe und Hintergrund der Unterhaltung.':
    'Pelo tema da conversa você muda a cor e o fundo dela.',

  'Alle Gespräche zu Serien, Filmen und Folgen an einem Ort.':
    'Todas as conversas sobre séries, filmes e episódios em um só lugar.',
  'Bereich wählen': 'Escolher a área',
  'Getrennt nach Serien, Filmen und einzelnen Episoden.':
    'Separado em séries, filmes e episódios avulsos.',
  Mitreden: 'Participar',
  'Ein Beitrag führt dich zur Diskussion, wo du antworten kannst.':
    'Uma publicação leva você à discussão, onde dá para responder.',
  Spoilerschutz: 'Proteção contra spoilers',
  'Beiträge zu Folgen, die du noch nicht gesehen hast, bleiben verdeckt.':
    'Publicações sobre episódios que você não viu continuam cobertas.',

  'Der schnelle Weg, viele Folgen auf einmal zu setzen.':
    'O jeito rápido de marcar muitos episódios de uma vez.',
  Sammelaktionen: 'Ações em lote',
  'Ganze Staffeln als gesehen oder wieder als ungesehen markieren.':
    'Marque temporadas inteiras como vistas, ou de novo como não vistas.',
  'Zähler ändern': 'Mudar o contador',
  'Plus und Minus setzen, wie oft du eine Folge gesehen hast.':
    'Mais e menos definem quantas vezes você viu um episódio.',
  'Zu jeder Folge kommst du von hier in ihre Diskussion.':
    'Daqui você chega à discussão de cada episódio.',

  'Folgen-Diskussion': 'Discussão do episódio',
  'Das Gespräch zu genau dieser Folge.': 'A conversa sobre exatamente este episódio.',
  'Schreiben und antworten': 'Escrever e responder',
  'Beiträge verfassen und auf die Beiträge anderer antworten.':
    'Escreva publicações e responda ao que os outros escreveram.',
  'Wer die Folge noch nicht gesehen hat, sieht den Inhalt erst nach dem Aufdecken.':
    'Quem ainda não viu o episódio só vê o conteúdo depois de revelar.',
  'Die Bewertung dieser Folge lässt sich hier direkt setzen.':
    'A nota deste episódio pode ser dada aqui mesmo.',

  'Bewertung bearbeiten': 'Editar a avaliação',
  'Deine Wertung, aufgeschlüsselt nach Genres.': 'Sua nota, detalhada por gênero.',
  'Je Genre bewerten': 'Avaliar por gênero',
  'Jedes Genre bekommt einen eigenen Wert, daraus entsteht die Gesamtnote.':
    'Cada gênero recebe o próprio valor, e disso sai a nota geral.',
  'Erst mit Speichern landet die Änderung in deiner Liste.':
    'A alteração só chega à sua lista quando você salva.',
  'Eine Bewertung lässt sich vollständig zurücknehmen.':
    'Uma avaliação pode ser retirada por completo.',

  'Neue Serien und Staffelstarts, unabhängig von deiner Liste.':
    'Séries novas e estreias de temporada, independentemente da sua lista.',
  'Premieren sehen': 'Ver as estreias',
  'Kommende Starts mit Countdown bis zum ersten Tag.':
    'Próximas estreias com contagem regressiva até o primeiro dia.',
  'Die Genre-Suche grenzt die Premieren ein.': 'A busca por gênero afunila as estreias.',
  'Was dich interessiert, landet mit einem Fingertipp in deiner Liste.':
    'O que te interessar vai para a sua lista com um toque.',

  'Kinostarts und Streaming-Releases in deiner Region.':
    'Estreias no cinema e lançamentos em streaming na sua região.',
  'Kino oder Streaming': 'Cinema ou streaming',
  'Zwischen Kinostarts und digitalen Releases umschalten.':
    'Alterne entre estreias no cinema e lançamentos digitais.',
  'Nach Datum': 'Por data',
  'Die Liste läuft chronologisch, der heutige Tag ist markiert.':
    'A lista segue a ordem cronológica, com o dia de hoje marcado.',
  Vormerken: 'Guardar para depois',
  'Ein Film lässt sich von hier direkt in deine Liste legen.':
    'Daqui dá para colocar um filme direto na sua lista.',

  'Die laufende und die kommende Anime-Saison im Überblick.':
    'A temporada de anime atual e a próxima em um panorama.',
  'Nach Studio filtern': 'Filtrar por estúdio',
  'Die Saison lässt sich auf einzelne Studios eingrenzen.':
    'A temporada pode ser afunilada para estúdios específicos.',
  'Status sehen': 'Ver o status',
  'Fortlaufend, beendet oder noch nicht gestartet, jeweils mit Countdown.':
    'Em andamento, encerrado ou ainda não iniciado, cada um com contagem regressiva.',
  'Ein Titel wandert mit einem Fingertipp in deine Serienliste.':
    'Um toque leva um título para a sua lista de séries.',

  'Konto, Aussehen, Benachrichtigungen und deine Daten.':
    'Conta, aparência, notificações e os seus dados.',
  'Push ein- und ausschalten und einstellen, worüber du informiert wirst.':
    'Ligue ou desligue as push e escolha sobre o que quer ser avisado.',
  'Aussehen und Sprache': 'Aparência e idioma',
  'Design, Anzeigegröße, Startseiten-Layout und Sprache liegen hier.':
    'Tema, tamanho de exibição, layout do início e idioma ficam aqui.',
  'Import und Export': 'Importar e exportar',
  'Deine Watch-History als JSON sichern oder als CSV weitergeben.':
    'Salve o seu histórico em JSON ou repasse em CSV.',

  'Die ganze App nimmt deine Farben an.': 'O app inteiro assume as suas cores.',
  'Farben setzen': 'Definir as cores',
  'Haupt-, Akzent- und Hintergrundfarbe lassen sich einzeln wählen.':
    'A cor principal, a de destaque e a de fundo são escolhidas separadamente.',
  Vorlagen: 'Modelos',
  'Fertige Kombinationen als Startpunkt, danach frei anpassbar.':
    'Combinações prontas como ponto de partida, ajustáveis depois.',
  'Alle Farben auf Standard bringt dich jederzeit zurück.':
    'Redefinir todas as cores traz você de volta quando quiser.',

  'Startseiten-Layout': 'Layout do início',
  'Die Vorschau ist der Editor.': 'A prévia é o editor.',
  'Reihenfolge ändern': 'Mudar a ordem',
  'Halten und ziehen verschiebt einen Abschnitt.': 'Segurar e arrastar move uma seção.',
  'Das Auge blendet einen Abschnitt aus, ohne ihn zu verlieren.':
    'O olho esconde uma seção sem perdê-la.',
  'Navigation belegen': 'Definir a navegação',
  'Auch die vier freien Plätze der unteren Leiste stellst du hier ein.':
    'Os quatro espaços livres da barra de baixo também se definem aqui.',

  'Feedback und Bugs': 'Feedback e erros',
  'Der direkte Draht, wenn etwas klemmt oder fehlt.': 'A linha direta quando algo trava ou falta.',
  'Ticket erstellen': 'Criar um chamado',
  'Fehler melden oder ein Feature vorschlagen.': 'Relate um erro ou sugira um recurso.',
  'Deine Tickets': 'Seus chamados',
  'Offene und archivierte Meldungen stehen getrennt.':
    'Os chamados abertos e os arquivados ficam separados.',
  'Sobald jemand reagiert, siehst du es an deinem Ticket.':
    'Assim que alguém responder, você vê no seu chamado.',

  'Manga-Sammlung': 'Coleção de mangás',
  'Der Einstieg in alles rund um Manga, Manhwa und Manhua.':
    'A porta de entrada para tudo sobre mangá, manhwa e manhua.',
  'Suchen und hinzufügen': 'Buscar e adicionar',
  'Neue Titel findest du über die Manga-Suche.':
    'Títulos novos você encontra pela busca de mangás.',
  'Sammlung filtern': 'Filtrar a coleção',
  'Am Lesen, Geplant, Abgeschlossen oder Abgebrochen getrennt anzeigen.':
    'Mostre separadamente Lendo, Planejado, Concluído ou Abandonado.',
  Bereiche: 'Áreas',
  'Leseliste, Bewertungen, Entdecken, Statistiken und Journey erreichst du von hier.':
    'Daqui você chega à lista de leitura, às avaliações, ao descobrir, às estatísticas e à jornada.',

  'Was gerade offen ist, in deiner Reihenfolge.':
    'O que está pendente agora, na ordem que você quiser.',
  'Kapitel setzen': 'Definir o capítulo',
  'Ein Kapitel weiter oder zurück, direkt auf der Karte.':
    'Um capítulo para frente ou para trás, no próprio cartão.',
  'Nach Fortschritt, Bewertung oder Titel ordnen.': 'Ordene por progresso, avaliação ou título.',
  'Nur Titel mit Status Lese ich oder Geplant erscheinen in der Leseliste.':
    'Só títulos com status Lendo ou Planejado aparecem na lista de leitura.',

  'Manga-Suche': 'Busca de mangás',
  'Der Weg zu allem, was noch nicht in deiner Sammlung ist.':
    'O caminho para tudo o que ainda não está na sua coleção.',
  'Manga, Manhwa und Manhua über den gesamten Bestand finden.':
    'Encontre mangá, manhwa e manhua em todo o acervo.',
  'Ein Titel landet mit einem Fingertipp in deiner Sammlung.':
    'Um toque coloca um título na sua coleção.',
  'Status setzen': 'Definir o status',
  'Beim Hinzufügen legst du fest, ob du liest, planst oder schon durch bist.':
    'Ao adicionar, você define se está lendo, planejando ou já terminou.',

  'Alles, was du bewertet hast, und was noch offen ist.':
    'Tudo o que você avaliou e o que ainda está pendente.',
  'Nach Bewertung auf- oder absteigend ordnen.': 'Ordene por avaliação, crescente ou decrescente.',
  'Unbewertetes finden': 'Achar o que falta avaliar',
  'Der Filter zeigt, wo noch eine Wertung fehlt.': 'O filtro mostra onde ainda falta uma nota.',

  'Vorschläge und beliebte Titel, die zu dir passen.':
    'Sugestões e títulos populares que combinam com você.',
  'Empfehlungen auf Basis deiner Sammlung und Bewertungen.':
    'Recomendações com base na sua coleção e nas suas notas.',
  'Beliebt und Formate': 'Populares e formatos',
  'Zwischen Empfehlungen, Beliebtem und einzelnen Formaten wechseln.':
    'Alterne entre recomendações, populares e formatos específicos.',
  'Aus jeder Karte heraus landet ein Titel in deiner Sammlung.':
    'A partir de qualquer cartão um título vai para a sua coleção.',

  'Dein Lese-Universum in Zahlen.': 'Seu universo de leitura em números.',
  'Gelesene Kapitel, Titel und Durchschnittsbewertung auf einen Blick.':
    'Capítulos lidos, títulos e nota média de relance.',
  'Genres und Formate': 'Gêneros e formatos',
  'Zeigt, worauf deine Lesezeit wirklich entfällt.':
    'Mostra para onde vai de fato o seu tempo de leitura.',
  'Die Auswertung lässt sich als Bild teilen.': 'A análise pode ser compartilhada como imagem.',

  'Manga aufholen': 'Colocar os mangás em dia',
  'Wo du beim Lesen am weitesten zurückliegst.': 'Onde você está mais atrasado na leitura.',
  'Je Titel stehen offene Kapitel und Fortschritt nebeneinander.':
    'Por título você vê os capítulos pendentes e o progresso lado a lado.',
  'Bis zu einem bestimmten Kapitel auf einmal als gelesen markieren.':
    'Marque de uma vez como lido tudo até um capítulo específico.',
  Erscheinungsrhythmus: 'Ritmo de lançamento',
  'Zu vielen Titeln steht, in welchem Abstand neue Kapitel kommen.':
    'Em muitos títulos você vê com que frequência saem capítulos novos.',

  'Lese-Journey': 'Jornada de leitura',
  'Deine Lese-Trends über die Zeit.': 'Suas tendências de leitura ao longo do tempo.',
  'Zeigt, wann du viel und wann du kaum gelesen hast.':
    'Mostra quando você leu muito e quando quase não leu.',
  'Wie viele Tage am Stück du gelesen hast.': 'Quantos dias seguidos você leu.',
  'Welche Genres und Formate deine Sammlung prägen.':
    'Quais gêneros e formatos marcam a sua coleção.',

  'Deine letzten Kapitel, chronologisch.': 'Seus últimos capítulos, em ordem.',
  'Die letzten Tage, Wochen oder Monate getrennt durchsehen.':
    'Percorra separadamente os últimos dias, semanas ou meses.',
  'Ein Eintrag führt zurück zum Titel und seinem Stand.':
    'Um item leva de volta ao título e ao ponto em que você parou.',
  'Zeigt, wie gleichmäßig du zuletzt gelesen hast.':
    'Mostra com que regularidade você tem lido ultimamente.',

  'Ausgeblendete Manga': 'Mangás ocultos',
  'Titel, die du aus deiner Sammlung genommen hast.': 'Títulos que você tirou da sua coleção.',
  'Ausgeblendete Titel verschwinden aus Leseliste, Aufholen und Statistiken.':
    'Títulos ocultos somem da lista de leitura, do Colocar em dia e das estatísticas.',
  'Einblenden macht einen Titel wieder überall sichtbar.':
    'Mostrar deixa um título visível em todo lugar de novo.',
  'Dein Kapitel-Fortschritt bleibt beim Ausblenden erhalten.':
    'Ocultar um título mantém o seu progresso de capítulos.',

  'Manga-Details': 'Detalhes do mangá',
  'Alles zum Titel und was du damit machen kannst.':
    'Tudo sobre o título e o que dá para fazer com ele.',
  'Fortschritt setzen': 'Definir o progresso',
  'Aktuelles Kapitel ändern oder bis zu einem Kapitel alles als gelesen markieren.':
    'Mude o capítulo atual ou marque como lido tudo até um capítulo.',
  'Lese ich, Geplant, Abgeschlossen, Pausiert oder Abgebrochen.':
    'Lendo, Planejado, Concluído, Em pausa ou Abandonado.',
  'Bewerten und notieren': 'Avaliar e anotar',
  'Wertung setzen und eigene Notizen zum Titel hinterlegen.':
    'Dê uma nota e guarde suas próprias anotações sobre o título.',
};

export default tour;
