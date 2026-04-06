# Schnellstart-Anleitung

## In 3 Schritten zur laufenden App

### Schritt 1: Supabase konfigurieren

1. Legen Sie eine `.env` an
2. Tragen Sie Ihre Supabase-Credentials ein:

```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=Ihr_Anon_Key_hier
```

### Schritt 2: App starten

```bash
npm install
npm run dev
```

Die App laeuft dann typischerweise unter `http://localhost:5173`.

### Schritt 3: Fertig

Sie sollten jetzt sehen:

- eine erfolgreiche Supabase-Verbindung
- die Wecker-Sektion
- die manuelle Steuerung fuer Box und Beeper

## Haeufige Probleme

### "Supabase nicht konfiguriert"

Problem: `.env` fehlt oder enthaelt noch Platzhalter

Loesung: Tragen Sie Ihre Supabase-Credentials in `.env` ein

### Port bereits belegt

Problem: Der Dev-Server kann nicht starten

Loesung:

- anderen Prozess beenden
- oder den Port in der Vite-Konfiguration anpassen

## Weitere Hilfe

Siehe [README.md](c:/Users/noela/Documents/Box-Sandy/README.md) fuer den Gesamtueberblick und [SETUP.md](c:/Users/noela/Documents/Box-Sandy/SETUP.md) fuer das vollstaendige Setup.
