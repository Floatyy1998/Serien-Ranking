# Serien App

Dies ist eine Serienverwaltungs-App, die mit React, TypeScript und Firebase entwickelt wurde.

## Funktionen

- Serien anzeigen und durchsuchen
- Serien nach Genre und Anbieter filtern
- Serienbewertungen anzeigen und bearbeiten
- Offline-Unterstützung für Bewertungen und Daten
- Statistiken über Serien und Bewertungen anzeigen

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
   http://localhost:3000
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
