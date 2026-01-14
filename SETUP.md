# Setup-Anleitung

## Schritt 1: Supabase einrichten

1. Gehen Sie zu [supabase.com](https://supabase.com) und erstellen Sie ein kostenloses Konto
2. Erstellen Sie ein neues Projekt
3. Gehen Sie zu "SQL Editor" und führen Sie den Inhalt von `supabase-schema.sql` aus
4. Gehen Sie zu "Settings" > "API" und kopieren Sie:
   - **Project URL** (z.B. `https://xxxxx.supabase.co`)
   - **anon public** Key
   - **service_role** Key (für ESP32 Updates)

## Schritt 2: Web-App konfigurieren

1. Öffnen Sie `config.js`
2. Ersetzen Sie die Platzhalter mit Ihren Supabase-Credentials:
   ```javascript
   export const config = {
       supabase: {
           url: 'Ihre_Supabase_URL',  // z.B. 'https://xxxxx.supabase.co'
           anonKey: 'Ihr_Supabase_Anon_Key'
       }
   };
   ```

**Hinweis:** Die `.env`-Datei dient als Referenz. Da Browser `.env`-Dateien nicht direkt lesen können, müssen die Werte in `config.js` eingetragen werden.

## Schritt 3: Icons erstellen

Erstellen Sie ein `icons` Verzeichnis im Projektordner.

Sie können Icons generieren mit:
- [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)

Benötigte Größen:
- 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512

Oder verwenden Sie ein einfaches Icon und skalieren Sie es auf alle Größen.

## Schritt 4: Lokalen Server starten

### Option 1: Python
```bash
python -m http.server 8000
```

### Option 2: Node.js (http-server)
```bash
npx http-server -p 8000
```

### Option 3: PHP
```bash
php -S localhost:8000
```

Öffnen Sie dann `http://localhost:8000` im Browser.

## Schritt 5: ESP32 konfigurieren

1. Öffnen Sie `esp32-example.ino` in der Arduino IDE
2. Installieren Sie benötigte Bibliotheken:
   - ArduinoJson (über Library Manager)
   - Servo (über Library Manager)
3. Konfigurieren Sie:
   - WiFi SSID und Passwort
   - Supabase URL und Keys
   - Pin-Zuweisungen (falls abweichend)
4. Laden Sie den Code auf den ESP32-C3 hoch

## Schritt 6: Hardware anschließen

### HC-SR04 Ultraschallsensor
- VCC → 5V (oder 3.3V je nach Modell)
- GND → GND
- Trig → GPIO4
- Echo → GPIO5

### SG90 Servo
- Rot (VCC) → 5V
- Braun/Schwarz (GND) → GND
- Orange/Gelb (Signal) → GPIO6

### Beeper/Buzzer
- Positiv → GPIO7
- Negativ → GND

**Hinweis**: Überprüfen Sie die Spannungsanforderungen Ihrer Komponenten. Der ESP32-C3 liefert 3.3V, Servos benötigen oft 5V.

## Schritt 7: Testen

1. Öffnen Sie die Web-App im Browser
2. Erstellen Sie einen Test-Zeitplan
3. Testen Sie die manuelle Steuerung
4. Überprüfen Sie die Verbindung zum ESP32

## Fehlerbehebung

### Service Worker funktioniert nicht
- Stellen Sie sicher, dass Sie einen lokalen Server verwenden (nicht file://)
- Überprüfen Sie die Browser-Konsole auf Fehler

### Supabase-Verbindung schlägt fehl
- Überprüfen Sie URL und Keys
- Stellen Sie sicher, dass RLS-Policies korrekt gesetzt sind
- Überprüfen Sie die Browser-Konsole

### ESP32 verbindet sich nicht
- Überprüfen Sie WiFi-Credentials
- Überprüfen Sie Supabase-URL und Keys
- Überprüfen Sie die serielle Ausgabe des ESP32

### Box öffnet sich nicht
- Überprüfen Sie die Servo-Verbindungen
- Testen Sie den Servo direkt
- Überprüfen Sie die Pin-Zuweisungen im Code

