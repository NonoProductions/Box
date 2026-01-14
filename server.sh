#!/bin/bash
# Einfacher Server-Start für Linux/Mac

echo "Starting Smart Box PWA Server..."
echo ""

# Prüfe ob Python installiert ist
if ! command -v python3 &> /dev/null; then
    echo "Python3 ist nicht installiert!"
    echo "Bitte installieren Sie Python3 oder verwenden Sie einen anderen Server"
    exit 1
fi

# Starte Server
python3 server.py

