# TV-RANK

TV-RANK ist eine umfassende Medien-Tracking-App, die es Benutzern ermöglicht, ihre Lieblingsserien, Filme und Manga zu entdecken, zu bewerten und zu verwalten. Die App bietet eine Vielzahl von Funktionen, darunter die Möglichkeit, Inhalte nach Genre und Anbieter zu filtern, Bewertungen anzuzeigen und zu bearbeiten sowie detaillierte Statistiken zu erhalten.

## Funktionen

### Serien & Filme

- **Serien und Filme anzeigen und durchsuchen**: Durchsuchen Sie eine umfangreiche Datenbank von Serien und Filmen.
  ![Serien anzeigen](./Bilder/Serien.jpg)
  ![Filme anzeigen](./Bilder/Filme.jpg)

---

- **Filteroptionen**: Filtern Sie Serien und Filme nach Genre und Anbieter.
  ![Filteroptionen](./Bilder/Filter.jpg)

---

- **Bewertungen anzeigen und bearbeiten**: Sehen Sie sich Bewertungen an und passen Sie diese nach Ihren Vorlieben an.
  ![Bewertungen anzeigen und bearbeiten](./Bilder/Rating.jpg)

---

- **Watchlist verwalten**: Fügen Sie Serien und Filme zu Ihrer Watchlist hinzu und behalten Sie den Überblick über Ihre Favoriten.
  ![Watchlist verwalten](./Bilder/Weiterschauen.jpg)

---

- **Keine Episode mehr verpassen**: Sie sehen immer wann die nächste Episode Ihrer Lieblingsserien erscheint.
  ![Statistiken anzeigen](./Bilder/NeueEpisoden.jpg)

---

- **Nie vergessen wo Sie stehen**: Sie Wissen immer genau wo sie eine Serie Pausiert haben.
  ![Statistiken anzeigen](./Bilder/Watched.jpg)

---

- **Statistiken anzeigen**: Erhalten Sie detaillierte Statistiken über Ihre angesehenen Serien und Filme.
  ![Statistiken anzeigen](./Bilder/Statistik.jpg)

---

- **Empfehlungen anzeigen**: Erhalten Sie Empfehlungen für neue Serien und Filme anhand Ihrer Liste.
  ![Statistiken anzeigen](./Bilder/Empfehlungen.jpg)

---

- **Unveröffentlichte Serien und Filme finden**: Entdecken sie unveröffentlichte Serien und Filme und sehen Sie, wann diese erscheinen.
  ![Statistiken anzeigen](./Bilder/Empfehlungen.jpg)

---

### Manga, Manhwa & Manhua

TV-RANK bietet einen vollständigen, eigenständigen Bereich zum Tracking von Manga, Manhwa (koreanisch) und Manhua (chinesisch).

- **Manga Homepage**: Eigene Homepage mit Weiterlesen, Trending, Beliebt, Top bewertet, Statistiken und mehr
- **Manga entdecken**: Trending, beliebte und Top-bewertete Manga/Manhwa/Manhua von AniList mit Infinite Scroll
- **Suche**: Durchsuchen Sie die AniList-Datenbank nach Manga, Manhwa und Manhua
- **Kapitel-Tracking**: Verfolgen Sie Ihren Lesefortschritt mit Swipe-to-mark (nächstes Kapitel gelesen)
- **Leseliste**: Alle Manga zum Weiterlesen mit Filter- und Sortieroptionen
- **Aktuelle Kapitelzahlen**: Automatische Aktualisierung der verfügbaren Kapitelzahl via MangaUpdates (auch für Webtoon-exklusive Titel wie Tower of God)
- **Kapitel-Releases**: Letzte erschienene Kapitel mit Datum und geschätztem nächsten Release
- **Bewertungen**: Eigene Bewertungsseite mit Filter nach Format (Manga/Manhwa/Manhua) und Status
- **Statistiken**: Lese-Statistiken mit Fortschrittsring, Genre-Verteilung, Format-Aufschlüsselung
- **Read Journey**: Lese-Trends mit monatlichem Aktivitätsdiagramm, meistgelesene Manga, Genre-Analyse
- **Catch-Up**: Überblick welche Manga noch aufgeholt werden müssen
- **Lese-Verlauf**: Chronologische Übersicht der zuletzt gelesenen Manga
- **Versteckte Manga**: Pausierte Manga verwalten
- **Detail-Seite**: Kapitelfortschritt, Status, Bewertung, Lese-Plattform, Notizen, verwandte Titel, Empfehlungen, Autor/Zeichner, externe Links

## Technologien

- **React**: Für die Benutzeroberfläche.
- **TypeScript**: Für die Typensicherheit und bessere Wartbarkeit des Codes.
- **Firebase**: Für Authentifizierung und Realtime Database.
- **Material-UI**: Für die Gestaltung der Benutzeroberfläche.
- **Framer Motion**: Für Animationen.
- **Vite**: Als Build-Tool.

### APIs

- **TMDB**: Serien- und Film-Datenbank (Metadata, Poster, Episoden)
- **AniList**: Manga/Manhwa/Manhua-Datenbank (Metadata, Poster, Suche, Trending, Empfehlungen)
- **MangaUpdates**: Aktuelle Kapitelzahlen und Release-Daten für Manga (inkl. Webtoon-exklusive Titel)

## Live-Demo

Die Anwendung ist live unter [tv-rank.de](https://tv-rank.de) verfügbar.

## Installation

1. Repository klonen:

   ```bash
   git clone <repository-url>
   cd <repository-verzeichnis>
   ```

2. Abhängigkeiten installieren:

   ```bash
   npm install
   ```

3. Firebase-Konfiguration einrichten:
   Erstellen Sie eine `.env`-Datei im Stammverzeichnis und fügen Sie Ihre Firebase-Konfigurationsvariablen hinzu:
   ```env
   VITE_APIKEY=<Ihre-API-KEY>
   VITE_AUTHDOMAIN=<Ihre-AUTH-DOMAIN>
   VITE_DATABASEURL=<Ihre-DATABASE-URL>
   VITE_PROJECTID=<Ihre-PROJECT-ID>
   VITE_STORAGEBUCKET=<Ihre-STORAGE-BUCKET>
   VITE_MESSAGINGSENDERID=<Ihre-MESSAGING-SENDER-ID>
   VITE_APPID=<Ihre-APP-ID>
   VITE_MEASUREMENTID=<Ihre-MEASUREMENT-ID>
   VITE_API_TMDB=<Ihre-TMDB-API-KEY>
   VITE_USER=<Ihr-Benutzername>
   ```

## Entwicklung

1. Entwicklungsserver starten:

   ```bash
   npm run dev
   ```

2. Anwendung im Browser öffnen:
   ```bash
   http://localhost:5173
   ```

## Build und Deployment

1. Anwendung bauen:

   ```bash
   npm run build
   ```

2. Anwendung auf Firebase deployen:
   ```bash
   firebase deploy
   ```

## Linting

1. Code linten:
   ```bash
   npm run lint
   ```

## Vorschau

1. Produktions-Build-Vorschau:
   ```bash
   npm run preview
   ```

## Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert.

## Hinweise

- Dies ist nur das Frontend der Anwendung. Das Backend zum Hinzufügen der Serien und Filme muss separat erstellt werden.
- Die Anwendung verwendet Firebase Authentication und Firebase Realtime Database.
