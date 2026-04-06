# Smart Box PWA - Steuerungs-App

Eine Progressive Web App zur Steuerung einer Smart Box mit ESP32-C3 Super Mini, Ultraschallsensor, Servo und Beeper.

## Features

- Zeitplan-Erstellung fuer automatische Box-Oeffnung
- Beeper-Steuerung mit konfigurierbarer Dauer
- Manuelle Steuerung fuer Box und Beeper
- Echtzeit-Updates ueber Supabase
- Installierbare PWA fuer Mobilgeraete und Desktop
- Offline-Unterstuetzung ueber Service Worker

## Setup

### 1. Supabase einrichten

1. Erstellen Sie ein Supabase-Projekt unter [supabase.com](https://supabase.com)
2. Fuehren Sie das SQL-Schema aus [supabase-schema.sql](c:/Users/noela/Documents/Box-Sandy/supabase-schema.sql) in der SQL-Konsole aus
3. Kopieren Sie die Project URL und den `anon public` Key

### 2. App konfigurieren

Legen Sie eine `.env` im Projektordner an, am besten auf Basis von `.env.example`:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Die Vite/React-App liest diese Werte direkt ueber `import.meta.env`.

### 3. App starten

```bash
npm install
npm run dev
```

Alternativ fuer einen Produktionscheck:

```bash
npm run build
npm run preview
```

### 4. PWA testen

- App im Browser oeffnen
- DevTools > Application > Manifest pruefen
- Service Worker pruefen
- Optional: App installieren

## ESP32 Integration

Die ESP32-Firmware sollte regelmaessig die `commands`-Tabelle abfragen, Befehle ausfuehren und den Status in `box_state` zurueckschreiben.

## Datenbank-Schema

### `schedules`

- `id`: UUID
- `name`: Text
- `time`: Time (`HH:MM`)
- `days`: JSON-Array (`0-6`, Mo-So)
- `beeper_duration`: Integer
- `active`: Boolean

### `commands`

- `id`: UUID
- `command`: Text (`open`, `close`, `beeper`, `schedule_trigger`)
- `data`: JSON
- `timestamp`: Timestamp
- `executed`: Boolean

### `box_state`

- `id`: UUID
- `is_open`: Boolean
- `last_updated`: Timestamp
- `sensor_distance`: Integer

## Browser-Unterstuetzung

- Chrome/Edge
- Firefox
- Safari (iOS 11.3+)
- Opera

## Lizenz

MIT
