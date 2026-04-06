# PowerShell Script zum Patchen der HomeKit-ESP32 Bibliothek
# Behebt den Fehler: soc/dport_reg.h: No such file or directory

$libraryPath = "$env:USERPROFILE\Documents\Arduino\libraries\HomeKit-ESP32\src\wolfssl\wolfcrypt\port\Espressif\esp32-crypt.h"

Write-Host "Suche nach HomeKit-ESP32 Bibliothek..." -ForegroundColor Yellow

if (-not (Test-Path $libraryPath)) {
    Write-Host "FEHLER: Datei nicht gefunden!" -ForegroundColor Red
    Write-Host "Erwarteter Pfad: $libraryPath" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Bitte stellen Sie sicher, dass:" -ForegroundColor Yellow
    Write-Host "1. Die HomeKit-ESP32 Bibliothek installiert ist" -ForegroundColor Yellow
    Write-Host "2. Der Pfad korrekt ist (kann je nach Installation variieren)" -ForegroundColor Yellow
    exit 1
}

Write-Host "Datei gefunden: $libraryPath" -ForegroundColor Green

# Backup erstellen
$backupPath = $libraryPath + ".backup"
if (-not (Test-Path $backupPath)) {
    Copy-Item $libraryPath $backupPath
    Write-Host "Backup erstellt: $backupPath" -ForegroundColor Green
} else {
    Write-Host "Backup existiert bereits: $backupPath" -ForegroundColor Yellow
}

# Datei lesen
$content = Get-Content $libraryPath -Raw

# Prüfen ob bereits gepatcht
if ($content -match "#if ESP_IDF_VERSION_MAJOR") {
    Write-Host "Datei wurde bereits gepatcht!" -ForegroundColor Yellow
    exit 0
}

# Patch anwenden
$oldInclude = '#include "soc/dport_reg.h"'
$newInclude = @'
#if ESP_IDF_VERSION_MAJOR >= 4
  #include "soc/dport_access.h"
#else
  #include "soc/dport_reg.h"
#endif
'@

if ($content -match [regex]::Escape($oldInclude)) {
    $content = $content -replace [regex]::Escape($oldInclude), $newInclude
    Set-Content -Path $libraryPath -Value $content -NoNewline
    Write-Host "Patch erfolgreich angewendet!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Sie können jetzt versuchen, den Code zu kompilieren." -ForegroundColor Green
} else {
    Write-Host "WARNUNG: Die zu patchende Zeile wurde nicht gefunden." -ForegroundColor Yellow
    Write-Host "Möglicherweise wurde die Datei bereits geändert oder die Bibliothek hat eine andere Struktur." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Bitte patchen Sie die Datei manuell:" -ForegroundColor Yellow
    Write-Host "1. Öffnen Sie: $libraryPath" -ForegroundColor Yellow
    Write-Host "2. Finden Sie die Zeile: #include `"soc/dport_reg.h`"" -ForegroundColor Yellow
    Write-Host "3. Ersetzen Sie sie durch die Version mit ESP_IDF_VERSION_MAJOR Check" -ForegroundColor Yellow
}
