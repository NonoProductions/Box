# Schnellstart-Anleitung

## ⚡ In 3 Schritten zur laufenden App

### Schritt 1: Supabase konfigurieren

1. Öffnen Sie `config.js`
2. Tragen Sie Ihre Supabase-Credentials ein:
   ```javascript
   export const config = {
       supabase: {
           url: 'https://xxxxx.supabase.co',  // Ihre URL
           anonKey: 'Ihr_Anon_Key_hier'       // Ihr Key
       }
   };
   ```

### Schritt 2: Server starten

**Windows:** Doppelklicken Sie auf `server.bat`

**Linux/Mac:** Führen Sie aus:
```bash
chmod +x server.sh && ./server.sh
```

**Oder manuell mit Python:**
```bash
python server.py
```

Der Browser öffnet sich automatisch auf `http://localhost:8000`

### Schritt 3: Fertig! 🎉

Die App sollte jetzt laufen. Sie sehen:
- ✅ Grüne Erfolgsmeldung wenn Supabase verbunden ist
- 📅 Zeitplan-Sektion zum Erstellen von Zeitplänen
- 🎮 Manuelle Steuerung für Box und Beeper

## ❌ Häufige Probleme

### "Cross-Origin Request Blocked" oder "CORS request not http"

**Problem:** Sie öffnen die Datei direkt im Browser (`file://`)

**Lösung:** Verwenden Sie den lokalen Server (siehe Schritt 2)

### "Supabase nicht konfiguriert"

**Problem:** `config.js` enthält noch Platzhalter

**Lösung:** Tragen Sie Ihre Supabase-Credentials in `config.js` ein

### Port bereits belegt

**Problem:** Port 8000 wird bereits verwendet

**Lösung:** 
- Beenden Sie den anderen Server, oder
- Ändern Sie den Port in `server.py` (Zeile 11: `PORT = 8000`)

## 📚 Weitere Hilfe

Siehe `README.md` für detaillierte Informationen und `SETUP.md` für die vollständige Setup-Anleitung.

