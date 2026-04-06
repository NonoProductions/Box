# Setup-Anleitung

## Schritt 1: Supabase einrichten

1. Gehen Sie zu [supabase.com](https://supabase.com) und erstellen Sie ein Projekt
2. Fuehren Sie [supabase-schema.sql](c:/Users/noela/Documents/Box-Sandy/supabase-schema.sql) im SQL Editor aus
3. Kopieren Sie:

- Project URL
- `anon public` Key
- optional den `service_role` Key fuer ESP32-seitige Prozesse

## Schritt 2: Web-App konfigurieren

1. Legen Sie eine `.env` im Projektordner an
2. Tragen Sie Ihre Werte ein:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Hinweis: Die aktuelle Vite-App liest diese Werte direkt aus `.env`.

## Schritt 3: App starten

```bash
npm install
npm run dev
```

## Schritt 4: PWA pruefen

- Manifest laden
- Service Worker pruefen
- Install-Dialog testen
- Offline-Verhalten testen

## Schritt 5: ESP32 konfigurieren

1. Oeffnen Sie [esp32-example.ino](c:/Users/noela/Documents/Box-Sandy/esp32-example.ino) in der Arduino IDE
2. Installieren Sie die benoetigten Bibliotheken
3. Konfigurieren Sie WLAN, Supabase und Pins
4. Laden Sie den Sketch auf den ESP32-C3 hoch

## Fehlerbehebung

### Service Worker funktioniert nicht

- App ueber HTTP/HTTPS oeffnen
- Browser-Konsole und Application-Tab pruefen

### Supabase-Verbindung schlaegt fehl

- `VITE_SUPABASE_URL` und `VITE_SUPABASE_ANON_KEY` pruefen
- RLS-Policies und Tabellen pruefen

### ESP32 verbindet sich nicht

- WLAN-Daten pruefen
- serielle Ausgabe pruefen
- Supabase-Daten in der Firmware pruefen
