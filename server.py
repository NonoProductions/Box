#!/usr/bin/env python3
"""
Einfacher HTTP-Server für die Smart Box PWA
Startet einen lokalen Server auf Port 8000
"""

import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # CORS Headers für lokale Entwicklung
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        # Cache-Control für Entwicklung - keine Caching
        if self.path.endswith(('.css', '.js', '.html')):
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
        # MIME Types für ES6 Module
        if self.path.endswith('.js'):
            self.send_header('Content-Type', 'application/javascript')
        super().end_headers()

    def log_message(self, format, *args):
        # Reduzierte Log-Ausgabe
        pass

def main():
    # Wechsle ins Verzeichnis des Scripts
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    Handler = MyHTTPRequestHandler
    
    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            url = f"http://localhost:{PORT}"
            print("=" * 60)
            print("Smart Box PWA - Lokaler Server")
            print("=" * 60)
            print(f"Server läuft auf: {url}")
            print(f"Öffnen Sie diese URL in Ihrem Browser")
            print("=" * 60)
            print("Drücken Sie Ctrl+C zum Beenden")
            print("=" * 60)
            
            # Automatisch Browser öffnen
            try:
                webbrowser.open(url)
            except:
                pass
            
            httpd.serve_forever()
    except OSError as e:
        if e.errno == 98 or e.errno == 48:  # Port bereits belegt
            print(f"Fehler: Port {PORT} ist bereits belegt!")
            print(f"Bitte beenden Sie den anderen Server oder ändern Sie den Port.")
        else:
            print(f"Fehler beim Starten des Servers: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n\nServer wird beendet...")
        sys.exit(0)

if __name__ == "__main__":
    main()

