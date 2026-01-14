# Smart Box PWA - Steuerungs-App

Eine Progressive Web App zur Steuerung einer Smart Box mit ESP32-C3 Super Mini, Ultraschallsensor, Servo und Beeper.

## Features

- 📅 **Zeitplan-Erstellung**: Erstellen Sie Zeitpläne für automatische Box-Öffnung
- 🔔 **Beeper-Steuerung**: Konfigurierbare Beeper-Dauer bei Zeitplan-Auslösung
- 🎮 **Manuelle Steuerung**: Box öffnen/schließen und Beeper testen
- 📊 **Echtzeit-Updates**: Live-Status der Box über Supabase
- 📱 **PWA**: Installierbar auf mobilen Geräten und Desktop
- 🔄 **Offline-Funktionalität**: Service Worker für Offline-Nutzung

## Hardware-Komponenten

- **ESP32-C3 Super Mini**: Zentrale Steuereinheit (USB-C)
- **Ultraschallsensor (HC-SR04)**: Erkennt Annäherung für automatische Öffnung
- **Servo (SG90)**: Mechanische Box-Öffnung/Schließung
- **Beeper/Buzzer**: Akustisches Feedback

## Setup

### 1. Supabase einrichten

1. Erstellen Sie ein Supabase-Projekt unter [supabase.com](https://supabase.com)
2. Führen Sie das SQL-Schema aus (`supabase-schema.sql`) in der SQL-Konsole aus
3. Kopieren Sie die Supabase URL und den anonymen Key

### 2. App konfigurieren

Öffnen Sie `config.js` und ersetzen Sie die Platzhalter:

```javascript
export const config = {
    supabase: {
        url: 'Ihre_Supabase_URL',  // z.B. 'https://xxxxx.supabase.co'
        anonKey: 'Ihr_Supabase_Anon_Key'
    }
};
```

**Alternative:** Sie können auch die `.env`-Datei als Referenz verwenden und die Werte dann in `config.js` eintragen.

### 3. Icons erstellen

Erstellen Sie ein `icons` Verzeichnis und fügen Sie folgende Icon-Größen hinzu:
- 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512

Oder verwenden Sie einen Icon-Generator wie [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator).

### 4. Service Worker registrieren

Fügen Sie am Ende von `index.html` vor dem schließenden `</body>` Tag hinzu:

```html
<script>
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
</script>
```

### 5. Lokalen Server starten

**WICHTIG:** Die App muss über einen HTTP-Server laufen, nicht direkt als Datei geöffnet werden!

#### Option 1: Python Server (Empfohlen)

**Windows:** Doppelklicken Sie auf `server.bat`

**Linux/Mac:** 
```bash
chmod +x server.sh
./server.sh
```

**Oder manuell:**
```bash
python server.py
# oder
python3 server.py
```

Der Server startet automatisch auf `http://localhost:8000` und öffnet den Browser.

#### Option 2: Python HTTP Server (einfach)
```bash
python -m http.server 8000
# oder
python3 -m http.server 8000
```

#### Option 3: Node.js (http-server)
```bash
npx http-server -p 8000
```

#### Option 4: PHP
```bash
php -S localhost:8000
```

Öffnen Sie dann `http://localhost:8000` im Browser.

**Hinweis:** Öffnen Sie die App NICHT direkt als Datei (`file://`), da Browser ES6-Module und Service Worker nur über HTTP/HTTPS erlauben.

## ESP32 Integration

Die ESP32 sollte regelmäßig die `commands` Tabelle abfragen und ausführen:

1. **Commands abfragen**: `SELECT * FROM commands WHERE executed = false ORDER BY timestamp ASC`
2. **Command ausführen**: Box öffnen/schließen, Beeper aktivieren
3. **Status aktualisieren**: `UPDATE commands SET executed = true, executed_at = NOW() WHERE id = ?`
4. **Box-State aktualisieren**: `UPDATE box_state SET is_open = ?, last_updated = NOW()`

### Beispiel ESP32 Code-Struktur

```cpp
// Pseudocode
void checkCommands() {
  // Abfrage nicht ausgeführter Commands
  // Ausführung je nach Command-Typ
  // Status-Update in Supabase
}

void checkSchedules() {
  // Zeitpläne abfragen
  // Bei passender Zeit: Beeper aktivieren, Box öffnen
}
```

## Datenbank-Schema

### schedules
- `id`: UUID (Primary Key)
- `name`: Text
- `time`: Time (HH:MM)
- `days`: JSON Array (0-6, Mo-So)
- `beeper_duration`: Integer (Sekunden)
- `active`: Boolean

### commands
- `id`: UUID (Primary Key)
- `command`: Text ('open', 'close', 'beeper', 'schedule_trigger')
- `data`: JSON
- `timestamp`: Timestamp
- `executed`: Boolean

### box_state
- `id`: UUID (Primary Key)
- `is_open`: Boolean
- `last_updated`: Timestamp
- `sensor_distance`: Integer (optional)

## Verwendung

1. **Zeitplan erstellen**:
   - Klicken Sie auf "Neuer Zeitplan"
   - Geben Sie Name, Zeit und Wochentage ein
   - Setzen Sie die Beeper-Dauer
   - Speichern Sie

2. **Manuelle Steuerung**:
   - "Box öffnen" / "Box schließen" für direkte Steuerung
   - "Beeper testen" für akustisches Feedback

3. **Status überwachen**:
   - Verbindungsstatus oben rechts
   - Box-Status (Geöffnet/Geschlossen)
   - Aktivitätsprotokoll unten

## Browser-Unterstützung

- Chrome/Edge (empfohlen)
- Firefox
- Safari (iOS 11.3+)
- Opera

## Lizenz

MIT

