# Matter/HomeKit Integration für ESP32 Smart Box

## Übersicht

Die Smart Box ist jetzt mit Apple HomeKit kompatibel und kann direkt in der Apple Home App als Schalter gesteuert werden.

**Funktionalität:**
- ✅ Switch in Apple Home App erscheint als "Smart Box"
- ✅ Switch AN → Box piepst dauerhaft (1000 Hz)
- ✅ Switch AUS → Box ist still
- ✅ Alle anderen Beeper-Funktionen werden automatisch unterdrückt, wenn HomeKit aktiv ist

## Voraussetzungen

### Hardware
- ESP32-C3 (oder ESP32-S3, ESP32-C6) mit Bluetooth LE
- Apple Home Hub erforderlich (HomePod, HomePod Mini oder Apple TV 4K)

### Software
1. **Arduino IDE** (Version 2.0 oder höher)
2. **ESP32 Board Support Package** (Version 3.0.0 oder höher)
3. **HomeKit-Bibliothek** installieren:

#### HomeKit-Bibliothek installieren

**⚠️ WICHTIG:** Du brauchst die **ESP32-Version**, NICHT die ESP8266-Version!

**Option 1: Über Arduino Library Manager (empfohlen)**
1. Öffne Arduino IDE
2. Gehe zu `Sketch` → `Bibliothek einbinden` → `Bibliotheken verwalten...`
3. Suche nach: **"ESP32 HomeKit"** oder **"arduino-homekit-esp32"**
4. Installiere die Bibliothek von **Mixiaoxiao** für ESP32

**Option 2: Manuelle Installation**
1. Öffne: **https://github.com/Mixiaoxiao/Arduino-HomeKit-ESP32** ⚠️ **ESP32-Version!**
2. Klicke auf "Code" → "Download ZIP"
3. In Arduino IDE: `Sketch` → `Bibliothek einbinden` → `.ZIP-Bibliothek hinzufügen...`
4. Wähle die heruntergeladene ZIP-Datei

**Wichtig:** 
- Die ESP8266-Version (https://github.com/Mixiaoxiao/Arduino-HomeKit-ESP8266) funktioniert **NICHT** mit ESP32!
- Die ESP32-Version ist 10x schneller als die ESP8266-Version laut Entwickler
- Die Bibliothek benötigt auch die **mbedTLS** Bibliothek. Diese sollte automatisch mit dem ESP32 Board Package installiert sein.

## Installation & Flashen

1. **Öffne** `esp32-example.ino` in Arduino IDE
2. **Wähle Board:** `Tools` → `Board` → `ESP32 Arduino` → `ESP32C3 Dev Module` (oder dein ESP32-Modell)
3. **Wähle Port:** `Tools` → `Port` → Wähle deinen USB-Port
4. **Flashe** den Sketch auf den ESP32

## Erste Verbindung mit Apple Home App

### Schritt 1: ESP32 starten
Nach dem Flashen startet der ESP32 automatisch und verbindet sich mit dem WiFi.

**Im Serial Monitor siehst du:**
```
[HOMEKIT] Initialisiert! Gerät: Smart Box
[HOMEKIT] Setup Code: 123-45-678
[HOMEKIT] Scanne den QR-Code in der Apple Home App!
```

### Schritt 2: In Apple Home App hinzufügen

1. **Öffne** die **Apple Home App** auf deinem iPhone/iPad
2. **Tippe** auf das **+** Symbol (oben rechts)
3. **Wähle** "Gerät hinzufügen"
4. **Wähle** "Ich habe keinen Code oder kann ihn nicht scannen"
5. **Suche** nach "Smart Box" in der Liste der verfügbaren Geräte
6. **Gib den Setup-Code ein:** `123-45-678`
   - Oder scanne den QR-Code, der im Serial Monitor angezeigt wird (falls verfügbar)

### Schritt 3: Fertig!
Das Gerät erscheint jetzt als **"Smart Box"** in deiner Apple Home App.

## Verwendung

### In der Apple Home App:
- **Switch AN** → Box piepst dauerhaft (1000 Hz Ton)
- **Switch AUS** → Box ist still

### Setup Code ändern
Falls du den Setup-Code ändern möchtest, findest du ihn in der Datei `esp32-example.ino`:

```cpp
homekit_server_config_t config = {
    .accessories = accessories,
    .password = "123-45-678"  // ← Hier ändern (8 Ziffern mit Bindestrichen)
};
```

**Wichtig:** Der Code muss das Format `XXX-XX-XXX` haben (8 Ziffern mit Bindestrichen).

## Fehlerbehebung

### Problem: Gerät erscheint nicht in Apple Home App
**Lösung:**
- Stelle sicher, dass du einen Apple Home Hub hast (HomePod, HomePod Mini oder Apple TV 4K)
- Prüfe, ob der ESP32 mit dem WiFi verbunden ist (Serial Monitor)
- Versuche, den Flash-Speicher zu löschen: `Tools` → `Erase All Flash Before Sketch Upload`

### Problem: "Pairing fehlgeschlagen"
**Lösung:**
- Prüfe den Setup-Code (muss genau `123-45-678` sein)
- Stelle sicher, dass ESP32 und iPhone im gleichen WiFi-Netzwerk sind
- Lösche den Flash-Speicher und flashe erneut

### Problem: Bibliothek nicht gefunden
**Lösung:**
- Installiere die ESP32 Board Support Package Version 3.0.0 oder höher
- Installiere die HomeKit-Bibliothek manuell (siehe oben)

### Problem: Kompilierungsfehler
**Lösung:**
- Stelle sicher, dass du die richtige ESP32-Board-Version ausgewählt hast
- Prüfe, ob alle Bibliotheken installiert sind:
  - `WiFi`
  - `HTTPClient`
  - `ArduinoJson`
  - `ESP32Servo`
  - `arduino_homekit_server`

## Technische Details

### HomeKit Characteristic
Das Gerät verwendet den **Switch Service** von HomeKit:
- **Service:** `SWITCH`
- **Characteristic:** `ON` (Boolean)
- **Callback:** `homekit_switch_callback()` → ruft `setMatterState()` auf

### Beeper-Steuerung
- Wenn `matterEnabled == true`: Dauerhafter Ton (1000 Hz)
- Wenn `matterEnabled == false`: Kein Ton
- Andere Beeper-Modi (Timer/Schedule) werden automatisch unterdrückt

## Support

Bei Problemen:
1. Prüfe den Serial Monitor für Fehlermeldungen
2. Stelle sicher, dass alle Bibliotheken installiert sind
3. Prüfe die WiFi-Verbindung
4. Lösche den Flash-Speicher und flashe erneut

## Weitere Informationen

- [ESP32 HomeKit Library GitHub](https://github.com/Mixiaoxiao/Arduino-HomeKit-ESP32) ⚠️ **WICHTIG: ESP32-Version verwenden!**
- [ESP8266 HomeKit Library (nicht für ESP32!)](https://github.com/Mixiaoxiao/Arduino-HomeKit-ESP8266)
- [Apple HomeKit Developer Documentation](https://developer.apple.com/homekit/)
- [Matter Protocol](https://csa-iot.org/all-solutions/matter/)

**Hinweis:** Die ESP32-Version ist 10x schneller als die ESP8266-Version laut Entwickler!

