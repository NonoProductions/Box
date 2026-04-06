# Fix für HomeKit-ESP32 Kompilierungsfehler

## Problem
Der Fehler `soc/dport_reg.h: No such file or directory` tritt auf, weil die HomeKit-ESP32-Bibliothek eine veraltete ESP-IDF-API verwendet.

## Lösung: Bibliotheksdatei patchen

### Schritt 1: Datei finden
Die problematische Datei befindet sich hier:
```
C:\Users\noela\Documents\Arduino\libraries\HomeKit-ESP32\src\wolfssl\wolfcrypt\port\Espressif\esp32-crypt.h
```

### Schritt 2: Datei öffnen
Öffnen Sie die Datei `esp32-crypt.h` in einem Texteditor (z.B. Notepad++ oder VS Code).

### Schritt 3: Zwei Includes patchen

**Patch 1: Zeile 41 - `soc/dport_reg.h`**
Finden Sie diese Zeile (ca. Zeile 41):
```c
#include "soc/dport_reg.h"
```

Ersetzen Sie sie durch:
```c
#if ESP_IDF_VERSION_MAJOR >= 4
  #include "soc/dport_access.h"
#else
  #include "soc/dport_reg.h"
#endif
```

**Patch 2: Zeile 47 - `soc/cpu.h`**
Finden Sie diese Zeile (ca. Zeile 47):
```c
#include "soc/cpu.h"
```

Ersetzen Sie sie durch:
```c
#if ESP_IDF_VERSION_MAJOR >= 4
  #include "esp_cpu.h"
#else
  #include "soc/cpu.h"
#endif
```

**WICHTIG:** Stellen Sie auch sicher, dass `esp_idf_version.h` eingebunden ist (Zeile 25 sollte NICHT auskommentiert sein):
```c
#include "esp_idf_version.h"
```

### Schritt 4: Weitere mögliche Fehler beheben
Falls nach dem Patch weitere Fehler auftreten, die mit `DPORT_`-Konstanten oder CPU-Funktionen zu tun haben, müssen Sie möglicherweise auch die Verwendung dieser Funktionen in der Datei anpassen.

## Alternative Lösung: ESP32 Core Version downgraden

Falls das Patchen nicht funktioniert, können Sie eine ältere ESP32 Arduino Core Version verwenden:

1. Öffnen Sie Arduino IDE
2. Gehen Sie zu **Tools > Board > Boards Manager**
3. Suchen Sie nach "ESP32"
4. Wählen Sie eine ältere Version (z.B. 2.0.x) und installieren Sie sie
5. Wählen Sie diese Version in **Tools > Board > ESP32 Arduino**

## Alternative Lösung: Offizielle ESP32 HomeKit Bibliothek verwenden

Die offizielle ESP32 HomeKit-Bibliothek von Espressif ist besser gepflegt:
- Bibliothek: `esp-apple-homekit-adp`
- Installation über Arduino Library Manager

**Hinweis:** Dies erfordert möglicherweise Code-Anpassungen in `esp32-example.ino`.
