# Massenbewertung - Schnelle Bewertung für Filme und Serien

## Übersicht

Die Massenbewertungs-Features ermöglichen es dir, deine unbewerteten Filme und Serien schnell und effizient zu bewerten. Diese Tools sind speziell dafür entwickelt, große Mengen an Inhalten systematisch durchzugehen.

## Features

### 🎬 Filme Massenbewertung

- **Zugriff**: Film-Seite → Filter-Bereich → "Massenbewertung" Button (RateReview Icon)
- **Funktion**: Geht durch alle unbewerteten Filme (Overall Rating = 0.00)
- **Smart Genre-Eingabe**: Zeigt nur die Genres an, die der aktuelle Film auch wirklich hat
- **Navigation**: Vorwärts/Rückwärts durch die Liste möglich

### 📺 Serien Massenbewertung

- **Zugriff**: Serien-Hauptseite → Filter-Bereich → "Massenbewertung" Button (RateReview Icon)
- **Funktion**: Geht durch alle unbewerteten Serien (Overall Rating = 0.00)
- **Smart Genre-Eingabe**: Zeigt nur die Genres an, die die aktuelle Serie auch wirklich hat
- **Navigation**: Vorwärts/Rückwärts durch die Liste möglich

## Bedienung

### Interface

1. **Fortschrittsbalken**: Zeigt den aktuellen Fortschritt an
2. **Content-Card**: Zeigt Poster, Titel, Erscheinungsdatum und Beschreibung
3. **Genre-Chips**: Klickbare Chips für schnelle Eingabe-Fokussierung
4. **Rating-Felder**: Ein Textfeld pro Genre (1-10, Dezimalstellen möglich)

### Steuerung

- **Zurück**: Geht zum vorherigen Element
- **Überspringen**: Springt zum nächsten Element ohne zu speichern
- **Speichern & Weiter**: Speichert die Bewertung und geht zum nächsten Element
- **Weiter**: Geht zum nächsten Element (speichert automatisch falls Bewertungen eingegeben wurden)

### Shortcuts

- **Genre-Chips klicken**: Fokussiert das entsprechende Eingabefeld
- **Automatisches Speichern**: Bewertungen werden automatisch gespeichert wenn man weitergeht und Werte eingegeben hat
- **Firebase Sync**: Alle Bewertungen werden direkt in Firebase gespeichert
- **Activity Tracking**: Bewertungsaktivitäten werden für Freunde geloggt

## Tipps für effiziente Nutzung

### Bewertungsstrategie

1. **Bekannte Inhalte zuerst**: Beginne mit Filmen/Serien, die du kennst
2. **Grobe Einschätzung**: Gib erstmal nur 1-2 Haupt-Genres eine Bewertung
3. **Standard-Werte**: Unbekannte Inhalte mit 5-6 bewerten (neutral)
4. **Später verfeinern**: Detaillierte Bewertungen können später nachgetragen werden

### Workflow-Empfehlung

- **15-20 Inhalte pro Session** (ca. 15-20 Minuten)
- **Regelmäßige Pausen** um Bewertungsmüdigkeit zu vermeiden
- **Batch-Verarbeitung** nach Kategorien/Genres

## Technische Details

### Filterlogik

- Nur Filme/Serien mit `calculateOverallRating() === 0.00` werden angezeigt
- Bereits bewertete Inhalte werden automatisch übersprungen

### Datenspeicherung

- Bewertungen werden direkt in Firebase Realtime Database gespeichert
- Pfad: `userId/filme/{movieId}/rating` bzw. `userId/serien/{seriesId}/rating`
- Online-Check: Funktioniert nur bei Internetverbindung

### Performance

- Real-time Updates durch Firebase Listener
- Automatische Aktualisierung der Gesamtstatistiken
- Optimierte UI für schnelle Navigation

## Fehlerbehebung

### Häufige Probleme

- **Keine unbewerteten Inhalte**: Dialog zeigt "Alle bereits bewertet" Meldung
- **Offline-Modus**: Bewertungen können nicht gespeichert werden
- **Leere Genre-Liste**: Film/Serie hat keine Genres definiert

### Support

Bei Problemen überprüfe:

1. Internetverbindung
2. Firebase-Authentifizierung
3. Browser-Konsole auf Fehlermeldungen

## Entwicklung

### Dateien

- `BulkMovieRatingDialog.tsx` - Filme Massenbewertung
- `BulkSeriesRatingDialog.tsx` - Serien Massenbewertung
- Integration in `MovieSearchFilters.tsx` und `SearchFilters.tsx`

### Abhängigkeiten

- Firebase Realtime Database
- Material-UI Komponenten
- React Hooks (useState, useCallback, useEffect)
- Context APIs (MovieListProvider, SeriesListProvider, etc.)
